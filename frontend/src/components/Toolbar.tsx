import type { ToolType } from "../types";
import "./Toolbar.css";

const TOOLS: { id: ToolType; label: string }[] = [
  { id: "freehand", label: "Карандаш" },
  { id: "line", label: "Линия" },
  { id: "rectangle", label: "Прямоугольник" },
  { id: "circle", label: "Круг" },
  { id: "text", label: "Текст" },
];

const COLORS = ["#111827", "#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

interface Props {
  tool: ToolType;
  color: string;
  width: number;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onClear: () => void;
}

export default function Toolbar({ tool, color, width, onToolChange, onColorChange, onWidthChange, onClear }: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar__group">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === tool ? "toolbar__tool toolbar__tool_active" : "toolbar__tool"}
            onClick={() => onToolChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="toolbar__group">
        <span className="toolbar__group-label">Цвет</span>
        {COLORS.map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`Цвет ${value}`}
            className={value === color ? "toolbar__color toolbar__color_active" : "toolbar__color"}
            style={{ background: value }}
            onClick={() => onColorChange(value)}
          />
        ))}
        <input
          className="toolbar__color-input"
          type="color"
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
        />
      </div>

      <div className="toolbar__group">
        <span className="toolbar__group-label">Толщина</span>
        <input
          className="toolbar__width"
          type="range"
          min={1}
          max={20}
          value={width}
          onChange={(event) => onWidthChange(Number(event.target.value))}
        />
        <span className="toolbar__width-value">{width}</span>
      </div>

      <button type="button" className="toolbar__clear" onClick={onClear}>
        Очистить холст
      </button>
    </div>
  );
}