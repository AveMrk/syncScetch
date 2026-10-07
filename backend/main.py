"""Точка входа backend: HTTP API и WebSocket для совместного рисования.

Запуск:
    uvicorn main:app --reload --port 8000
"""

import json
import uuid
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from models import CreateRoomRequest, RoomListItem
from room_manager import RoomManager
from websocket_manager import ConnectionManager

app = FastAPI(title="Whiteboard MVP", version="0.1.0")

# Фронтенд запускается отдельно (http://localhost:5173), поэтому CORS открыт полностью.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

room_manager = RoomManager()
manager = ConnectionManager(room_manager)


@app.get("/health")
def health() -> dict:
    """Проверка работоспособности сервера."""
    return {
        "status": "ok",
        "rooms": len(room_manager.rooms),
        "connections": sum(len(room_connections) for room_connections in manager.connections.values()),
    }


@app.post("/api/rooms")
def create_room(payload: Optional[CreateRoomRequest] = None) -> dict:
    """Создать комнату. ID можно задать явно, иначе он генерируется."""
    room = room_manager.create_room(
        name=payload.name if payload else None,
        room_id=payload.room_id if payload else None,
    )
    return {"room_id": room.id, "name": room.name, "url": f"/room/{room.id}"}


@app.get("/api/rooms")
def list_rooms() -> dict:
    """Список активных комнат (только в памяти процесса)."""
    rooms = [
        RoomListItem(
            id=room.id,
            name=room.name,
            elements=len(room.elements),
            users=len(room.participants),
        ).model_dump()
        for room in room_manager.list_rooms()
    ]
    return {"rooms": rooms}


@app.get("/api/rooms/{room_id}")
def get_room(room_id: str) -> dict:
    """Текущее состояние комнаты: элементы рисунка и участники."""
    room = room_manager.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    return room.snapshot()


@app.websocket("/ws/{room_id}")
async def whiteboard_websocket(websocket: WebSocket, room_id: str) -> None:
    """WebSocket комнаты.

    Первое сообщение клиента — join ({type, user_id, name}).
    Дальше клиент присылает draw / clear / leave, сервер рассылает их остальным.
    """
    await websocket.accept()
    room = room_manager.get_or_create_room(room_id)
    user_id: Optional[str] = None

    try:
        join_raw = await websocket.receive_text()
        try:
            join_data = json.loads(join_raw)
        except json.JSONDecodeError:
            join_data = {}
        if not isinstance(join_data, dict):
            join_data = {}

        user_id = str(join_data.get("user_id") or uuid.uuid4().hex[:8])
        name = str(join_data.get("name") or f"Гость-{user_id[:4]}")
        participant = manager.register(room_id, user_id, name, websocket)

        # Новому участнику сразу отдаём текущее состояние доски.
        await websocket.send_text(
            json.dumps({"type": "init", "room": room.snapshot(), "you": participant}, ensure_ascii=False)
        )
        # Остальных уведомляем о новом участнике.
        await manager.broadcast(
            room_id,
            {"type": "join", "user": participant, "users": manager.users(room_id)},
            exclude_user_id=user_id,
        )

        while True:
            raw_message = await websocket.receive_text()
            await manager.handle_message(room_id, user_id, raw_message)

    except WebSocketDisconnect:
        pass
    finally:
        if user_id is not None:
            manager.unregister(room_id, user_id)
            await manager.broadcast(
                room_id,
                {"type": "leave", "user_id": user_id, "users": manager.users(room_id)},
            )