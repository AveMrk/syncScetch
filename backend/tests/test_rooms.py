"""Тесты HTTP-части: health и операции с комнатами."""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_room_returns_id_and_name():
    response = client.post("/api/rooms", json={"name": "Доска для теста"})

    assert response.status_code == 200
    body = response.json()
    assert body["room_id"]
    assert body["name"] == "Доска для теста"
    assert body["url"] == f"/room/{body['room_id']}"


def test_get_room_returns_empty_snapshot():
    room_id = client.post("/api/rooms", json={}).json()["room_id"]

    response = client.get(f"/api/rooms/{room_id}")

    assert response.status_code == 200
    assert response.json()["elements"] == []
    assert response.json()["users"] == []


def test_get_unknown_room_returns_404():
    response = client.get("/api/rooms/unknown-room")

    assert response.status_code == 404


def test_list_rooms_returns_created_rooms():
    client.post("/api/rooms", json={"name": "Первая"})
    client.post("/api/rooms", json={"name": "Вторая"})

    response = client.get("/api/rooms")

    assert response.status_code == 200
    rooms = response.json()["rooms"]
    assert len(rooms) == 2
    assert {room["name"] for room in rooms} == {"Первая", "Вторая"}