import React, { useRef, useState, useEffect } from "react";
import {
  FiEdit2,
  FiCircle,
  FiSquare,
  FiArrowUpRight,
  FiTrash2,
  FiDownload,
  FiRotateCcw,
} from "react-icons/fi";

type ToolType = "pen" | "circle" | "rectangle" | "arrow" | "eraser";

interface WhiteboardCanvasProps {
  height?: string;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  height = "420px",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentTool, setCurrentTool] = useState<ToolType>("pen");
  const [strokeColor, setStrokeColor] = useState<string>("#818cf8"); // Default Indigo
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);

  // Undo history stack
  const [history, setHistory] = useState<ImageData[]>([]);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  // Preset color palette
  const PALETTE = [
    { label: "Indigo", value: "#818cf8" },
    { label: "Emerald", value: "#34d399" },
    { label: "Sky", value: "#38bdf8" },
    { label: "Amber", value: "#fbbf24" },
    { label: "Rose", value: "#fb7185" },
    { label: "White", value: "#ffffff" },
  ];

  // Initialize canvas with dark background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height || 420;

        // Dark Canvas Fill
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid dots pattern for engineering whiteboard
        drawGridPattern(ctx, canvas.width, canvas.height);

        // Save initial blank state
        setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const drawGridPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
    const dotSpacing = 24;
    for (let x = 12; x < width; x += dotSpacing) {
      for (let y = 12; y < height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    setStartX(x);
    setStartY(y);

    // Save current canvas state before previewing shapes
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (currentTool === "pen" || currentTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.lineWidth = currentTool === "eraser" ? 20 : lineWidth;
    ctx.strokeStyle = currentTool === "eraser" ? "#090d16" : strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (currentTool === "pen" || currentTool === "eraser") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (snapshot) {
      // Restore previous state so we can drag & preview shapes without trailing
      ctx.putImageData(snapshot, 0, 0);

      if (currentTool === "rectangle") {
        ctx.strokeRect(startX, startY, x - startX, y - startY);
      } else if (currentTool === "circle") {
        // Node / Circle for Data Structures & Graphs
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (currentTool === "arrow") {
        // Line with arrow head for Linked Lists & Pointers
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(y - startY, x - startX);
        const headLength = 12;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - headLength * Math.cos(angle - Math.PI / 6),
          y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - headLength * Math.cos(angle + Math.PI / 6),
          y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Push new state to history (limit to last 20)
    setHistory((prev) => [...prev.slice(-19), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGridPattern(ctx, canvas.width, canvas.height);
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `InterviewIQ_CS_Architecture_Whiteboard_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      className="whiteboard-canvas-wrapper"
      ref={containerRef}
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #334155",
        background: "#090d16",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Whiteboard Toolbar */}
      <div
        className="whiteboard-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        {/* Tool Selectors */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            title="Pen (Freehand)"
            onClick={() => setCurrentTool("pen")}
            style={{
              background: currentTool === "pen" ? "#6366f1" : "transparent",
              color: currentTool === "pen" ? "#ffffff" : "#94a3b8",
              border: "1px solid " + (currentTool === "pen" ? "#6366f1" : "#334155"),
              borderRadius: "6px",
              padding: "5px 9px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
            }}
          >
            <FiEdit2 /> Pen
          </button>

          <button
            type="button"
            title="Tree / Graph Node (Circle)"
            onClick={() => setCurrentTool("circle")}
            style={{
              background: currentTool === "circle" ? "#6366f1" : "transparent",
              color: currentTool === "circle" ? "#ffffff" : "#94a3b8",
              border: "1px solid " + (currentTool === "circle" ? "#6366f1" : "#334155"),
              borderRadius: "6px",
              padding: "5px 9px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
            }}
          >
            <FiCircle /> Node
          </button>

          <button
            type="button"
            title="Component Block (Rectangle)"
            onClick={() => setCurrentTool("rectangle")}
            style={{
              background: currentTool === "rectangle" ? "#6366f1" : "transparent",
              color: currentTool === "rectangle" ? "#ffffff" : "#94a3b8",
              border: "1px solid " + (currentTool === "rectangle" ? "#6366f1" : "#334155"),
              borderRadius: "6px",
              padding: "5px 9px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
            }}
          >
            <FiSquare /> Block
          </button>

          <button
            type="button"
            title="Pointer / Flow (Arrow)"
            onClick={() => setCurrentTool("arrow")}
            style={{
              background: currentTool === "arrow" ? "#6366f1" : "transparent",
              color: currentTool === "arrow" ? "#ffffff" : "#94a3b8",
              border: "1px solid " + (currentTool === "arrow" ? "#6366f1" : "#334155"),
              borderRadius: "6px",
              padding: "5px 9px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
            }}
          >
            <FiArrowUpRight /> Pointer
          </button>

          <button
            type="button"
            title="Eraser"
            onClick={() => setCurrentTool("eraser")}
            style={{
              background: currentTool === "eraser" ? "#6366f1" : "transparent",
              color: currentTool === "eraser" ? "#ffffff" : "#94a3b8",
              border: "1px solid " + (currentTool === "eraser" ? "#6366f1" : "#334155"),
              borderRadius: "6px",
              padding: "5px 9px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Eraser
          </button>
        </div>

        {/* Color Palette */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {PALETTE.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                setStrokeColor(c.value);
                if (currentTool === "eraser") setCurrentTool("pen");
              }}
              title={c.label}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                backgroundColor: c.value,
                border: strokeColor === c.value && currentTool !== "eraser" ? "2px solid #ffffff" : "1px solid transparent",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}

          {/* Stroke Width Selector */}
          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{
              background: "#0f172a",
              color: "#cbd5e1",
              border: "1px solid #334155",
              borderRadius: "6px",
              padding: "3px 6px",
              fontSize: "11px",
              cursor: "pointer",
              marginLeft: "4px",
            }}
          >
            <option value={2}>Fine (2px)</option>
            <option value={3}>Medium (3px)</option>
            <option value={6}>Thick (6px)</option>
          </select>
        </div>

        {/* Action Buttons: Undo, Clear, Download */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length <= 1}
            title="Undo"
            style={{
              background: "transparent",
              border: "none",
              color: history.length > 1 ? "#cbd5e1" : "#475569",
              cursor: history.length > 1 ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
            }}
          >
            <FiRotateCcw /> Undo
          </button>

          <button
            type="button"
            onClick={handleClear}
            title="Clear board"
            style={{
              background: "transparent",
              border: "none",
              color: "#f87171",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
            }}
          >
            <FiTrash2 /> Clear
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Download Diagram PNG"
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "6px",
              color: "#38bdf8",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
            }}
          >
            <FiDownload /> Export PNG
          </button>
        </div>
      </div>

      {/* Interactive Drawing Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          cursor: currentTool === "eraser" ? "cell" : "crosshair",
          touchAction: "none",
          width: "100%",
          height: height,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default WhiteboardCanvas;
