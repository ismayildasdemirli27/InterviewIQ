import React, { useState } from "react";
import "./radarChart.scss";

export interface RadarDataPoint {
  domainKey: string;
  label: string;
  score: number; // 0 to 100
  color?: string;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 360 }) => {
  const [hoveredPoint, setHoveredPoint] = useState<RadarDataPoint | null>(null);

  const center = size / 2;
  const radius = center - 50; // Padding for labels
  const totalAxes = data.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Concentric levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper to calculate coordinates
  const getCoordinates = (index: number, valueRatio: number) => {
    // Start at top (-PI/2)
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * valueRatio * Math.cos(angle);
    const y = center + radius * valueRatio * Math.sin(angle);
    return { x, y };
  };

  // Generate data polygon path
  const polygonPoints = data
    .map((d, idx) => {
      const ratio = Math.max(0.08, Math.min(1, (d.score || 10) / 100));
      const { x, y } = getCoordinates(idx, ratio);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="radar-chart-card">
      <div className="radar-chart-header">
        <div className="radar-title-group">
          <h3>360° Computer Science Mastery DNA</h3>
          <p>Multi-dimensional analysis across all 8 core engineering pillars</p>
        </div>
        {hoveredPoint && (
          <div className="radar-hover-pill">
            <span className="dot" style={{ backgroundColor: hoveredPoint.color || "#6366f1" }} />
            <strong>{hoveredPoint.label}:</strong>
            <span>{hoveredPoint.score}%</span>
          </div>
        )}
      </div>

      <div className="radar-svg-wrapper">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
            </linearGradient>
            <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Ambient Glow */}
          <circle cx={center} cy={center} r={radius} fill="url(#radarCenterGlow)" />

          {/* Concentric Polygons */}
          {levels.map((level, lIdx) => {
            const levelPoints = data
              .map((_, idx) => {
                const { x, y } = getCoordinates(idx, level);
                return `${x},${y}`;
              })
              .join(" ");

            return (
              <polygon
                key={lIdx}
                points={levelPoints}
                className="grid-ring"
                stroke="#e2e8f0"
                strokeWidth={lIdx === levels.length - 1 ? "1.5" : "1"}
                fill="none"
              />
            );
          })}

          {/* Axis Lines from Center */}
          {data.map((_, idx) => {
            const { x, y } = getCoordinates(idx, 1);
            return (
              <line
                key={idx}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                className="axis-line"
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* User Score Filled Polygon */}
          <polygon
            points={polygonPoints}
            className="data-polygon"
            fill="url(#radarGradient)"
            stroke="#6366f1"
            strokeWidth="2.5"
            filter="url(#glow)"
          />

          {/* Data Points (Vertices) */}
          {data.map((d, idx) => {
            const ratio = Math.max(0.08, Math.min(1, (d.score || 10) / 100));
            const { x, y } = getCoordinates(idx, ratio);

            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={hoveredPoint?.domainKey === d.domainKey ? 6 : 4.5}
                className="data-vertex"
                fill="#ffffff"
                stroke="#4f46e5"
                strokeWidth="2"
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Outer Domain Labels */}
          {data.map((d, idx) => {
            const labelRadius = 1.18;
            const { x, y } = getCoordinates(idx, labelRadius);
            const isHovered = hoveredPoint?.domainKey === d.domainKey;

            return (
              <text
                key={idx}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className={`radar-label ${isHovered ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {d.label} ({d.score}%)
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend & Score Pillars Footnote */}
      <div className="radar-legend-row">
        <div className="legend-item master">
          <span className="dot" /> 80–100%: FAANG Ready
        </div>
        <div className="legend-item intermediate">
          <span className="dot" /> 60–79%: Solid Intermediate
        </div>
        <div className="legend-item beginner">
          <span className="dot" /> &lt;60%: Action Recommended
        </div>
      </div>
    </div>
  );
};

export default RadarChart;
