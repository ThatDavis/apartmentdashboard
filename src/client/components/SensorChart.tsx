import { useState, useMemo } from 'react';

interface HistoryPoint {
  recordedAt: string;
  value: number;
}

interface SensorChartProps {
  data: HistoryPoint[];
  color?: string;
  height?: number;
}

export default function SensorChart({ data, color = '#FF6700', height = 120 }: SensorChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const { path, points, minValue, maxValue } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', points: [], minValue: 0, maxValue: 100 };
    }

    const width = 100;
    const padding = 5;
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const chartPoints = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
      return { x, y, value: d.value, date: new Date(d.recordedAt) };
    });

    // Create smooth line path using bezier curves
    let pathStr = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const current = chartPoints[i];
      const next = chartPoints[i + 1];
      const cpx1 = current.x + (next.x - current.x) / 2;
      const cpx2 = current.x + (next.x - current.x) / 2;
      pathStr += ` C ${cpx1} ${current.y}, ${cpx2} ${next.y}, ${next.x} ${next.y}`;
    }

    return { path: pathStr, points: chartPoints, minValue: min, maxValue: max };
  }, [data, height]);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-[120px] text-text-muted text-xs">
        No history data yet
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }} onMouseLeave={() => setHoveredPoint(null)}>
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          // Find closest point
          let closest = 0;
          let minDist = Infinity;
          points.forEach((p, i) => {
            const dist = Math.abs(p.x - x);
            if (dist < minDist) {
              minDist = dist;
              closest = i;
            }
          });
          setHoveredPoint(closest);
        }}
      >
        {/* Area under the line */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Fill area */}
        <path
          d={`${path} L ${points[points.length - 1]?.x || 0} ${height} L ${points[0]?.x || 0} ${height} Z`}
          fill={`url(#gradient-${color.replace('#', '')})`}
        />

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover indicator */}
        {hoveredPoint !== null && points[hoveredPoint] && (
          <>
            <circle
              cx={points[hoveredPoint].x}
              cy={points[hoveredPoint].y}
              r="1.5"
              fill={color}
              stroke="white"
              strokeWidth="0.3"
            />
            <line
              x1={points[hoveredPoint].x}
              y1={points[hoveredPoint].y}
              x2={points[hoveredPoint].x}
              y2={height}
              stroke={color}
              strokeWidth="0.15"
              strokeDasharray="1,1"
              opacity="0.5"
            />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredPoint !== null && points[hoveredPoint] && (
        <div
          className="absolute pointer-events-none bg-white/95 backdrop-blur-sm border border-border rounded-lg px-2 py-1 shadow-lg text-xs z-20"
          style={{
            left: `${points[hoveredPoint].x}%`,
            top: `${points[hoveredPoint].y - 10}px`,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <div className="font-semibold text-text">{points[hoveredPoint].value.toFixed(1)}</div>
          <div className="text-text-muted">{formatTime(points[hoveredPoint].date)}</div>
        </div>
      )}

      {/* Min/Max labels */}
      <div className="absolute bottom-0 left-0 text-[10px] text-text-muted">
        {minValue.toFixed(1)}
      </div>
      <div className="absolute bottom-0 right-0 text-[10px] text-text-muted">
        {maxValue.toFixed(1)}
      </div>
    </div>
  );
}
