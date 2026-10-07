"""Управление WebSocket-соединениями и рассылка событий между клиентами."""

import json
import uuid
from typing import Dict, List, Optional

from fastapi import WebSocket

from room_manager import RoomManager


class ConnectionManager:
    """Хранит активные соединения: room_id -> {user_id: WebSocket}."""

    def __init__(self, room_manager: RoomManager) -> None:
        self.room_manager = room_manager
        self.connections: Dict[str, Dict[str, WebSocket]] = {}

    def register(self, room_id: str, user_id: str, name: str, websocket: WebSocket) -> dict:
        room = self.room_manager.get_or_create_room(room_id)
        self.connections.setdefault(room_id, {})[user_id] = websocket
        participant = room.add_participant(user_id, name)
        return participant.model_dump()

    def unregister(self, room_id: str, user_id: str) -> None:
        room = self.room_manager.get_room(room_id)
        if room is not None:
            room.remove_participant(user_id)
        room_connections = self.connections.get(room_id)
        if room_connections is not None:
            room_connections.pop(user_id, None)
            if not room_connections:
                self.connections.pop(room_id, None)

    def users(self, room_id: str) -> List[dict]:
        room = self.room_manager.get_room(room_id)
        return room.participants_list() if room is not None else []

    async def send(self, room_id: str, user_id: str, message: dict) -> None:
        websocket = self.connections.get(room_id, {}).get(user_id)
        if websocket is not None:
            await websocket.send_text(json.dumps(message, ensure_ascii=False))

    async def broadcast(self, room_id: str, message: dict, exclude_user_id: Optional[str] = None) -> int:
        """Отправляет сообщение всем подключённым в комнате, кроме exclude_user_id."""
        sent = 0
        for user_id, websocket in list(self.connections.get(room_id, {}).items()):
            if user_id == exclude_user_id:
                continue
            try:
                await websocket.send_text(json.dumps(message, ensure_ascii=False))
                sent += 1
            except Exception as error:  # мёртвое соединение не должно ломать рассылку остальным
                print(f"[ws] не удалось отправить сообщение пользователю {user_id}: {error}")
        return sent

    async def handle_message(self, room_id: str, user_id: str, raw_message: str) -> None:
        """Разбирает сообщение клиента и рассылает результат остальным.

        Валидация намеренно минимальная: проверяется только наличие поля type
        и (для draw) наличие объекта element.
        """
        try:
            message = json.loads(raw_message)
        except (json.JSONDecodeError, TypeError):
            await self.send(room_id, user_id, {"type": "error", "message": "Некорректный JSON"})
            return

        if not isinstance(message, dict):
            await self.send(room_id, user_id, {"type": "error", "message": "Ожидался JSON-объект"})
            return

        message_type = message.get("type")
        room = self.room_manager.get_or_create_room(room_id)

        if message_type == "draw":
            element = message.get("element")
            if not isinstance(element, dict):
                await self.send(room_id, user_id, {"type": "error", "message": "В сообщении draw нет поля element"})
                return
            element.setdefault("id", uuid.uuid4().hex[:10])
            element["author_id"] = user_id
            room.add_element(element)
            await self.broadcast(
                room_id,
                {"type": "draw", "element": element, "from": user_id},
                exclude_user_id=user_id,
            )
        elif message_type == "clear":
            room.clear()
            await self.broadcast(room_id, {"type": "clear", "from": user_id}, exclude_user_id=user_id)
        elif message_type == "join":
            participant = room.participants.get(user_id)
            new_name = message.get("name")
            if participant is not None and new_name:
                participant.name = str(new_name)
            await self.broadcast(
                room_id,
                {
                    "type": "join",
                    "user": participant.model_dump() if participant else None,
                    "users": self.users(room_id),
                },
                exclude_user_id=user_id,
            )
        elif message_type == "leave":
            await self.broadcast(
                room_id,
                {"type": "leave", "user_id": user_id, "users": self.users(room_id)},
                exclude_user_id=user_id,
            )
        elif message_type == "ping":
            await self.send(room_id, user_id, {"type": "pong"})
        else:
            await self.send(room_id, user_id, {"type": "error", "message": f"Неизвестный тип сообщения: {message_type}"})