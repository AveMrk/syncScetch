import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { createRoom, listRooms } from "../services/api";
import { setUserName } from "../services/session";
import type { RoomListItem } from "../types";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [userName, setUserNameInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRooms()
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  const rememberUserName = () => {
    if (userName.trim()) {
      setUserName(userName.trim());
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      rememberUserName();
      const room = await createRoom(roomName);
      navigate(`/room/${room.room_id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Не удалось создать комнату");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = roomId.trim();
    if (!trimmed) {
      setError("Введите ID комнаты или ссылку");
      return;
    }
    rememberUserName();
    // принимаем и чистый ID, и полную ссылку вида http://localhost:5173/room/abc123
    const id = trimmed.split("/").filter(Boolean).pop() ?? trimmed;
    navigate(`/room/${id}`);
  };

  return (
    <main className="home">
      <h1 className="home__title">Whiteboard MVP</h1>
      <p className="home__subtitle">Общий холст для нескольких участников в реальном времени.</p>

      <div className="home__cards">
        <form className="card" onSubmit={handleCreate}>
          <h2 className="card__title">Создать комнату</h2>
          <label className="field">
            <span className="field__label">Название комнаты (необязательно)</span>
            <input
              className="field__input"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Например, схема урока"
            />
          </label>
          <label className="field">
            <span className="field__label">Ваше имя (необязательно)</span>
            <input
              className="field__input"
              value={userName}
              onChange={(event) => setUserNameInput(event.target.value)}
              placeholder="Гость"
            />
          </label>
          <button className="button" type="submit" disabled={creating}>
            {creating ? "Создаём..." : "Создать комнату"}
          </button>
        </form>

        <form className="card" onSubmit={handleJoin}>
          <h2 className="card__title">Подключиться к комнате</h2>
          <label className="field">
            <span className="field__label">ID комнаты или ссылка</span>
            <input
              className="field__input"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              placeholder="a1b2c3d4"
            />
          </label>
          <label className="field">
            <span className="field__label">Ваше имя (необязательно)</span>
            <input
              className="field__input"
              value={userName}
              onChange={(event) => setUserNameInput(event.target.value)}
              placeholder="Гость"
            />
          </label>
          <button className="button" type="submit">
            Подключиться
          </button>
        </form>
      </div>

      {error ? <p className="home__error">{error}</p> : null}

      <section className="home__rooms">
        <h3 className="home__rooms-title">Активные комнаты</h3>
        {rooms.length === 0 ? (
          <p className="home__hint">Пока ни одной комнаты — создайте первую.</p>
        ) : (
          <ul className="home__rooms-list">
            {rooms.map((room) => (
              <li className="home__room" key={room.id}>
                <span>
                  {room.name} · участников: {room.users} · элементов: {room.elements}
                </span>
                <button className="home__room-button" type="button" onClick={() => navigate(`/room/${room.id}`)}>
                  Открыть
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}