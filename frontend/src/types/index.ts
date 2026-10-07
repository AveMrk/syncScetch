export type ToolType = "freehand" | "line" | "rectangle" | "circle" | "text";

export interface Point {
  x: number;
  y: number;
}

/** Один элемент рисунка. Набор полей зависит от типа элемента. */
export interface DrawElement {
  id: string;
  type: ToolType;
  color: string;
  width: number;
  points?: Point[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  author_id?: string;
}

export interface Participant {
  user_id: string;
  name: string;
  color: string;
  joined_at?: number;
}

export interface RoomSnapshot {
  id: string;
  name: string;
  created_at?: number;
  elements: DrawElement[];
  users: Participant[];
}

export interface RoomListItem {
  id: string;
  name: string;
  elements: number;
  users: number;
}

/** Сообщения, которые сервер отправляет клиенту (и наоборот). */
export type ServerMessage =
  | { type: "init"; room: RoomSnapshot; you: Participant }
  | { type: "draw"; element: DrawElement; from: string }
  | { type: "clear"; from: string }
  | { type: "join"; user: Participant | null; users: Participant[] }
  | { type: "leave"; user_id: string; users: Participant[] }
  | { type: "pong" }
  | { type: "error"; message: string };