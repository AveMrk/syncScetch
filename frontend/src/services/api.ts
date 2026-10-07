import type { RoomListItem } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface CreatedRoom {
  room_id: string;
  name: string;
  url: string;
}

export async function createRoom(name?: string): Promise<CreatedRoom> {
  const response = await fetch(`${API_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name?.trim() || undefined }),
  });

  if (!response.ok) {
    throw new Error(`Сервер вернул ошибку ${response.status}`);
  }

  return response.json();
}

export async function listRooms(): Promise<RoomListItem[]> {
  const response = await fetch(`${API_URL}/api/rooms`);

  if (!response.ok) {
    throw new Error(`Сервер вернул ошибку ${response.status}`);
  }

  const data = await response.json();
  return data.rooms as RoomListItem[];
}

export function buildRoomLink(roomId: string): string {
  return `${window.location.origin}/room/${roomId}`;
}