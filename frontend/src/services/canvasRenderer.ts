import type { DrawElement } from "../types";

/** Полная перерисовка холста: фон + все элементы. */
export function renderAll(canvas: HTMLCanvasElement | null, elements: DrawElement[]): void {
  if (!canvas) {
    return;
  }
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  elements.forEach((element) => drawElement(context, element));
}

/** Отрисовка одного элемента рисунка. */
export function drawElement(context: CanvasRenderingContext2D, element: DrawElement): void {
  context.strokeStyle = element.color || "#111827";
  context.fillStyle = element.color || "#111827";
  context.lineWidth = element.width || 2;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (element.type === "freehand") {
    const points = element.points ?? [];
    if (points.length === 1) {
      context.beginPath();
      context.arc(points[0].x, points[0].y, (element.width || 2) / 2, 0, Math.PI * 2);
      context.fill();
      return;
    }
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.stroke();
    return;
  }

  if (element.type === "line") {
    context.beginPath();
    context.moveTo(element.x1 ?? 0, element.y1 ?? 0);
    context.lineTo(element.x2 ?? 0, element.y2 ?? 0);
    context.stroke();
    return;
  }

  if (element.type === "rectangle") {
    const x1 = element.x1 ?? 0;
    const y1 = element.y1 ?? 0;
    const x2 = element.x2 ?? 0;
    const y2 = element.y2 ?? 0;
    context.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    return;
  }

  if (element.type === "circle") {
    const x1 = element.x1 ?? 0;
    const y1 = element.y1 ?? 0;
    const x2 = element.x2 ?? 0;
    const y2 = element.y2 ?? 0;
    context.beginPath();
    context.ellipse(
      (x1 + x2) / 2,
      (y1 + y2) / 2,
      Math.max(Math.abs(x2 - x1) / 2, 0.5),
      Math.max(Math.abs(y2 - y1) / 2, 0.5),
      0,
      0,
      Math.PI * 2
    );
    context.stroke();
    return;
  }

  if (element.type === "text") {
    context.font = `${(element.width || 2) * 8 + 8}px sans-serif`;
    context.fillText(element.text ?? "", element.x1 ?? 0, element.y1 ?? 0);
  }
}