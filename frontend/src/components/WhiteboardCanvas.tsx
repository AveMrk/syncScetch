import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";

import { drawElement, renderAll } from "../services/canvasRenderer";
import type { DrawElement, Point, ToolType } from "../types";
import "./WhiteboardCanvas.css";

interface Props {
  elements: DrawElement[];
  tool: ToolType;
  color: string;
  width: number;
  onAddElement: (element: DrawElement) => void;
}

function newElementId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Холст: отрисовка состояния и обработка мыши.
 * Незавершённый элемент живёт в ref и рисуется поверх холста до отпускания кнопки.
 */
export default function WhiteboardCanvas({ elements, tool, color, width, onAddElement }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const previewElement = useRef<DrawElement | null>(null);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  useEffect(() => {
    renderAll(canvasRef.current, elements);
  }, [elements]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const wrapper = canvas?.parentElement;
      if (!canvas || !wrapper) {
        return;
      }
      canvas.width = wrapper.clientWidth;
      canvas.height = wrapper.clientHeight;
      renderAll(canvas, elementsRef.current);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const getPoint = (event: MouseEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    const point = getPoint(event);

    if (tool === "text") {
      const text = window.prompt("Текст для холста:");
      if (text) {
        onAddElement({ id: newElementId(), type: "text", color, width, x1: point.x, y1: point.y, text });
      }
      return;
    }

    isDrawing.current = true;
    previewElement.current =
      tool === "freehand"
        ? { id: newElementId(), type: "freehand", color, width, points: [point] }
        : { id: newElementId(), type: tool, color, width, x1: point.x, y1: point.y, x2: point.x, y2: point.y };
  };

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const preview = previewElement.current;
    const canvas = canvasRef.current;
    if (!isDrawing.current || !preview || !canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const point = getPoint(event);
    if (preview.type === "freehand") {
      preview.points = [...(preview.points ?? []), point];
    } else {
      preview.x2 = point.x;
      preview.y2 = point.y;
    }

    // во время рисования перерисовываем холст целиком и добавляем «черновик»
    renderAll(canvas, elementsRef.current);
    drawElement(context, preview);
  };

  const handleMouseUp = () => {
    const preview = previewElement.current;
    isDrawing.current = false;
    previewElement.current = null;
    if (preview) {
      onAddElement(preview);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="whiteboard-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}