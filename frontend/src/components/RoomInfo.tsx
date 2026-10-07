import { useState } from "react";
import { Link } from "react-router-dom";

import { buildRoomLink } from "../services/api";
import type { Participant } from "../types";
import "./RoomInfo.css";

const STATUS_LABELS: Record<string, string> = {
  connecting: "Подключение...",
  online: "Онлайн",
  offline: "Нет соединения",
};

interface Props {
  roomId: string;
  status: string;
  participants: Participant[];
  error: string | null;
}

export default function RoomInfo({ roomId, status, participants, error }: Props) {
  const [copied, setCopied] = useState(false);
  const link = buildRoomLink(roomId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className="room-info">
      <div className="room-info__block">
        <span className="room-info__label">Комната</span>
        <code className="room-info__id">{roomId}</code>
        <button type="button" className="room-info__copy" onClick={handleCopy}>
          {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
        </button>
      </div>

      <div className="room-info__block">
        <span className="room-info__label">Соединение</span>
        <span className={`room-info__status room-info__status_${status}`}>{STATUS_LABELS[status] ?? status}</span>
      </div>

      <div className="room-info__block">
        <span className="room-info__label">Участники ({participants.length})</span>
        <ul className="room-info__users">
          {participants.map((participant) => (
            <li key={participant.user_id}>
              <span className="room-info__dot" style={{ background: participant.color }} />
              {participant.name}
            </li>
          ))}
        </ul>
      </div>

      {error ? <p className="room-info__error">{error}</p> : null}

      <Link className="room-info__back" to="/">
        ← Выйти из комнаты
      </Link>
    </aside>
  );
}