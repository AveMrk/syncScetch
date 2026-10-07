import { describe, expect, it } from "vitest";

import { buildWebSocketUrl } from "./whiteboardSocket";

describe("buildWebSocketUrl", () => {
  it("собирает адрес комнаты", () => {
    expect(buildWebSocketUrl("abc123", "ws://localhost:8000")).toBe("ws://localhost:8000/ws/abc123");
  });

  it("убирает завершающий слэш в базовом адресе", () => {
    expect(buildWebSocketUrl("abc123", "ws://localhost:8000/")).toBe("ws://localhost:8000/ws/abc123");
  });
});