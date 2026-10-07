"""Общие фикстуры тестов."""

import pytest

from main import manager, room_manager


@pytest.fixture
def anyio_backend() -> str:
    """Асинхронные тесты запускаются только на asyncio (trio не нужен)."""
    return "asyncio"


@pytest.fixture(autouse=True)
def clean_state():
    """Каждый тест начинается с пустым списком комнат и соединений."""
    room_manager.rooms.clear()
    manager.connections.clear()
    yield
    room_manager.rooms.clear()
    manager.connections.clear()