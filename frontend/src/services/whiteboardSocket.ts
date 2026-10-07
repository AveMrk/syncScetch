import type { DrawElement, ServerMessage } from "../types";

const DEFAULT_WS_URL = "ws://localhost:8000";

/** Собирает адрес WebSocket-комнаты. */
export function buildWebSocketUrl(roomId: string, baseUrl: string = import.meta.env.VITE_WS_URL ?? DEFAULT_WS_URL): string {
  return `${baseUrl.replace(/\/+$/, "")}/ws/${roomId}`;
}

export interface WhiteboardSocketOptions {
  roomId: string;
  userId: string;
  userName: string;
  onMessage: (message: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
}

/**
 * Открывает WebSocket и сразу отправляет сообщение join.
 * Переподключение не реализовано: при обрыве связи страницу нужно перезагрузить.
 */
export function createWhiteboardSocket(options: WhiteboardSocketOptions): WebSocket {
  const socket = new WebSocket(buildWebSocketUrl(options.roomId));

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "join", user_id: options.userId, name: options.userName }));
    options.onOpen?.();
  };

  socket.onmessage = (event: MessageEvent<string>) => {
    try {
      options.onMessage(JSON.parse(String(event.data)) as ServerMessage);
    } catch (parseError) {
      console.error("Не удалось разобрать сообщение сервера", parseError);
    }
  };

  socket.onclose = () => options.onClose?.();
  socket.onerror = (event) => options.onError?.(event);

  return socket;
}

export function sendDraw(socket: WebSocket, element: DrawElement): void {
  socket.send(JSON.stringify({ type: "draw", element }));
}

export function sendClear(socket: WebSocket): void {
  socket.send(JSON.stringify({ type: "clear" }));
}