import { useCallback, useEffect, useRef, useState } from "react";

import { getUserId, getUserName } from "../services/session";
import { createWhiteboardSocket, sendClear, sendDraw } from "../services/whiteboardSocket";
import type { DrawElement, Participant, ServerMessage } from "../types";

export type ConnectionStatus = "connecting" | "online" | "offline";

/**
 * Подключение к комнате и состояние доски.
 * Хук совмещает транспорт, состояние и разбор протокола — для MVP это осознанное упрощение.
 */
export function useWhiteboard(roomId: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    setStatus("connecting");
    setElements([]);
    setParticipants([]);
    setError(null);

    const handleServerMessage = (message: ServerMessage) => {
      switch (message.type) {
        case "init":
          setElements(message.room.elements ?? []);
          setParticipants(message.room.users ?? []);
          break;
        case "draw":
          setElements((previous) =>
            previous.some((element) => element.id === message.element.id) ? previous : [...previous, message.element]
          );
          break;
        case "clear":
          setElements([]);
          break;
        case "join":
        case "leave":
          setParticipants(message.users ?? []);
          break;
        case "error":
          setError(message.message);
          break;
        default:
          break;
      }
    };

    const socket = createWhiteboardSocket({
      roomId,
      userId: getUserId(),
      userName: getUserName(),
      onMessage: handleServerMessage,
      onOpen: () => setStatus("online"),
      onClose: () => setStatus("offline"),
      onError: () => setError("Не удалось подключиться к серверу"),
    });
    socketRef.current = socket;

    return () => {
      const current = socketRef.current;
      socketRef.current = null;
      if (current) {
        current.onopen = null;
        current.onmessage = null;
        current.onclose = null;
        current.onerror = null;
        current.close();
      }
    };
  }, [roomId]);

  const addElement = useCallback((element: DrawElement) => {
    setElements((previous) => [...previous, element]);
    if (socketRef.current) {
      sendDraw(socketRef.current, element);
    }
  }, []);

  const clearBoard = useCallback(() => {
    setElements([]);
    if (socketRef.current) {
      sendClear(socketRef.current);
    }
  }, []);

  return { elements, participants, status, error, addElement, clearBoard };
}