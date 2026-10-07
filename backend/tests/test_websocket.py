"""Тесты WebSocket-логики: рассылка событий, очистка, состояние комнаты."""

import json
import time

import pytest
from fastapi.testclient import TestClient

from main import app
from room_manager import RoomManager
from websocket_manager import ConnectionManager

client = TestClient(app)


class FakeWebSocket:
    """Заглушка WebSocket: складывает отправленные сообщения в список."""

    def __init__(self) -> None:
        self.messages = []

    async def send_text(self, text: str) -> None:
        self.messages.append(json.loads(text))


@pytest.fixture
def manager() -> ConnectionManager:
    """Отдельный менеджер соединений, чтобы тесты не зависели друг от друга."""
    return ConnectionManager(RoomManager())


def wait_for_elements(room_id: str, expected: int, timeout: float = 2.5) -> list:
    """Ждём, пока сервер обработает сообщения и состояние комнаты обновится."""
    deadline = time.time() + timeout
    elements: list = []
    while time.time() < deadline:
        elements = client.get(f"/api/rooms/{room_id}").json()["elements"]
        if len(elements) >= expected:
            return elements
        time.sleep(0.05)
    return elements


@pytest.mark.anyio
async def test_draw_is_broadcast_to_other_clients(manager: ConnectionManager):
    first, second = FakeWebSocket(), FakeWebSocket()
    manager.register("room-1", "u1", "Алиса", first)
    manager.register("room-1", "u2", "Боб", second)

    await manager.handle_message(
        "room-1",
        "u1",
        json.dumps({"type": "draw", "element": {"type": "line", "x1": 1, "y1": 1, "x2": 10, "y2": 10}}),
    )

    # автору событие не возвращается — он уже добавил элемент локально
    assert first.messages == []
    assert second.messages[0]["type"] == "draw"
    assert second.messages[0]["element"]["type"] == "line"

    room = manager.room_manager.get_room("room-1")
    assert room is not None
    assert len(room.elements) == 1
    assert room.elements[0]["author_id"] == "u1"
    assert room.elements[0]["id"]


@pytest.mark.anyio
async def test_clear_resets_room_and_notifies_others(manager: ConnectionManager):
    first, second = FakeWebSocket(), FakeWebSocket()
    manager.register("room-2", "u1", "Алиса", first)
    manager.register("room-2", "u2", "Боб", second)

    await manager.handle_message("room-2", "u1", json.dumps({"type": "draw", "element": {"type": "circle"}}))
    await manager.handle_message("room-2", "u1", json.dumps({"type": "clear"}))

    room = manager.room_manager.get_room("room-2")
    assert room is not None
    assert room.elements == []
    assert second.messages[-1]["type"] == "clear"


@pytest.mark.anyio
async def test_broken_and_unknown_messages_return_error(manager: ConnectionManager):
    websocket = FakeWebSocket()
    manager.register("room-3", "u1", "Алиса", websocket)

    await manager.handle_message("room-3", "u1", "это не json")
    await manager.handle_message("room-3", "u1", json.dumps({"type": "no-such-type"}))

    assert websocket.messages[0]["type"] == "error"
    assert websocket.messages[1]["type"] == "error"


def test_join_returns_current_board_state():
    """Новый участник получает init с уже нарисованными элементами."""
    with client.websocket_connect("/ws/test-room") as websocket:
        websocket.send_json({"type": "join", "user_id": "u1", "name": "Алиса"})

        init = websocket.receive_json()
        assert init["type"] == "init"
        assert init["room"]["elements"] == []
        assert init["you"]["name"] == "Алиса"

        websocket.send_json(
            {"type": "draw", "element": {"type": "rectangle", "x1": 0, "y1": 0, "x2": 20, "y2": 20}}
        )
        assert len(wait_for_elements("test-room", 1)) == 1

    with client.websocket_connect("/ws/test-room") as second:
        second.send_json({"type": "join", "user_id": "u2", "name": "Боб"})

        init = second.receive_json()
        assert init["type"] == "init"
        assert len(init["room"]["elements"]) == 1
        assert [user["name"] for user in init["room"]["users"]] == ["Боб"]