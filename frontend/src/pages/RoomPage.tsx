import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";

import RoomInfo from "../components/RoomInfo";
import Toolbar from "../components/Toolbar";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import { useWhiteboard } from "../hooks/useWhiteboard";
import type { ToolType } from "../types";
import "./RoomPage.css";

export default function RoomPage() {
  const { roomId = "" } = useParams<{ roomId: string }>();
  const [tool, setTool] = useState<ToolType>("freehand");
  const [color, setColor] = useState("#111827");
  const [width, setWidth] = useState(3);

  const { elements, participants, status, error, addElement, clearBoard } = useWhiteboard(roomId);

  const handleClear = useCallback(() => {
    if (window.confirm("Очистить холст для всех участников?")) {
      clearBoard();
    }
  }, [clearBoard]);

  if (!roomId) {
    return (
      <div className="room-page__empty">
        Комната не найдена. <Link to="/">Вернуться на главную</Link>
      </div>
    );
  }

  return (
    <div className="room-page">
      <Toolbar
        tool={tool}
        color={color}
        width={width}
        onToolChange={setTool}
        onColorChange={setColor}
        onWidthChange={setWidth}
        onClear={handleClear}
      />

      <div className="room-page__body">
        <div className="canvas-wrapper">
          <WhiteboardCanvas elements={elements} tool={tool} color={color} width={width} onAddElement={addElement} />
        </div>
        <RoomInfo roomId={roomId} status={status} participants={participants} error={error} />
      </div>
    </div>
  );
}