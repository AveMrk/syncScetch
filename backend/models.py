"""Pydantic-модели: элементы рисунка, участники комнаты, запросы API."""

import time
import uuid
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


def new_id() -> str:
    """Короткий идентификатор для комнаты или элемента рисунка."""
    return uuid.uuid4().hex[:10]


class ToolType(str, Enum):
    freehand = "freehand"
    line = "line"
    rectangle = "rectangle"
    circle = "circle"
    text = "text"


class Point(BaseModel):
    x: float
    y: float


class DrawElement(BaseModel):
    """Один элемент рисунка.

    Поля зависят от типа: freehand использует points,
    line/rectangle/circle — x1, y1, x2, y2, text — x1, y1 и text.
    """

    id: str = Field(default_factory=new_id)
    type: ToolType
    color: str = "#111827"
    width: float = 2.0
    points: List[Point] = Field(default_factory=list)
    x1: Optional[float] = None
    y1: Optional[float] = None
    x2: Optional[float] = None
    y2: Optional[float] = None
    text: Optional[str] = None
    author_id: Optional[str] = None


class Participant(BaseModel):
    """Участник комнаты. Живёт только пока открыт WebSocket."""

    user_id: str
    name: str
    color: str = "#6b7280"
    joined_at: float = Field(default_factory=time.time)


class RoomListItem(BaseModel):
    """Краткая информация о комнате для списка на главной странице."""

    id: str
    name: str
    elements: int
    users: int


class CreateRoomRequest(BaseModel):
    name: Optional[str] = None
    room_id: Optional[str] = None