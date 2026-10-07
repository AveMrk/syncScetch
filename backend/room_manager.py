"""Хранилище комнат в памяти процесса.

После перезапуска backend все комнаты и рисунки исчезают — персистентность
в MVP не реализована.
"""

import time
from typing import Dict, List, Optional

from models import Participant, new_id

USER_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2"]


class Room:
    """Одна комната: элементы рисунка и подключённые участники."""

    def __init__(self, room_id: str, name: Optional[str] = None) -> None:
        self.id = room_id
        self.name = name or f"Комната {room_id}"
        self.created_at = time.time()
        self.elements: List[dict] = []
        self.participants: Dict[str, Participant] = {}

    def add_element(self, element: dict) -> dict:
        self.elements.append(element)
        return element

    def clear(self) -> None:
        self.elements = []

    def add_participant(self, user_id: str, name: str) -> Participant:
        participant = Participant(
            user_id=user_id,
            name=name,
            color=USER_COLORS[len(self.participants) % len(USER_COLORS)],
        )
        self.participants[user_id] = participant
        return participant

    def remove_participant(self, user_id: str) -> None:
        self.participants.pop(user_id, None)

    def participants_list(self) -> List[dict]:
        return [participant.model_dump() for participant in self.participants.values()]

    def snapshot(self) -> dict:
        """Полное состояние комнаты — отправляется новому участнику."""
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at,
            "elements": self.elements,
            "users": self.participants_list(),
        }


class RoomManager:
    """Реестр комнат: room_id -> Room."""

    def __init__(self) -> None:
        self.rooms: Dict[str, Room] = {}

    def generate_room_id(self) -> str:
        while True:
            room_id = new_id()
            if room_id not in self.rooms:
                return room_id

    def create_room(self, name: Optional[str] = None, room_id: Optional[str] = None) -> Room:
        """Создаёт комнату. Если такой ID уже есть — возвращает существующую."""
        room_id = room_id or self.generate_room_id()
        if room_id in self.rooms:
            return self.rooms[room_id]
        room = Room(room_id, name)
        self.rooms[room_id] = room
        return room

    def get_room(self, room_id: str) -> Optional[Room]:
        return self.rooms.get(room_id)

    def get_or_create_room(self, room_id: str, name: Optional[str] = None) -> Room:
        """Комната создаётся автоматически при подключении по ссылке."""
        return self.get_room(room_id) or self.create_room(name, room_id)

    def list_rooms(self) -> List[Room]:
        return list(self.rooms.values())

    def delete_room(self, room_id: str) -> bool:
        return self.rooms.pop(room_id, None) is not None