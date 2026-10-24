import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';

interface DataChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  chartType?: 'bar' | 'line' | 'area' | 'scatter' | 'pie';
  title?: string;
  className?: string;
}

export const DataChart: React.FC<DataChartProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  chartType: initialType = 'bar',
  title,
  className = '',
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'scatter' | 'pie'>(initialType);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: any; y: number; px: number; py: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500 rounded-lg border border-white/5 bg-zinc-950/40">
        No dataset values available to visualize
      </div>
    );
  }

  // Filter numeric points
  const points = data
    .map((d) => ({
      xLabel: String(d[xAxisKey] ?? ''),
      yVal: Number(d[yAxisKey]),
    }))
    .filter((p) => !isNaN(p.yVal));

  if (points.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500 rounded-lg border border-white/5 bg-zinc-950/40">
        Selected Y-axis "{yAxisKey}" does not contain numeric data
      </div>
    );
  }

  const yValues = points.map((p) => p.yVal);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues, 1);
  const yRange = maxY - minY || 1;

  // SVG dimensions
  const width = 640;
  const height = 260;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Coordinate mappers
  const getX = (idx: number) => padding.left + (idx / Math.max(points.length - 1, 1)) * chartW;
  const getBarX = (idx: number) => padding.left + (idx / points.length) * chartW + (chartW / points.length) * 0.15;
  const barWidth = Math.max((chartW / points.length) * 0.7, 8);
  const getY = (val: number) => padding.top + chartH - ((val - minY) / yRange) * chartH;

  // Path generators
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.yVal)}`).join(' ');
  const areaPath = `${linePath} L ${getX(points.length - 1)} ${padding.top + chartH} L ${getX(0)} ${
    padding.top + chartH
  } Z`;

  // Pie chart calculation
  const totalY = yValues.reduce((a, b) => a + Math.max(b, 0), 0) || 1;
  let currentAngle = 0;
  const pieSlices = points.slice(0, 8).map((p, i) => {
    const sliceAngle = (Math.max(p.yVal, 0) / totalY) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const r = 85;
    const cx = width / 2;
    const cy = height / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const colors = ['#ffffff', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a', '#e4e4e7', '#d4d4d8'];
    return { path, color: colors[i % colors.length], label: p.xLabel, val: p.yVal };
  });

  return (
    <div className={`rounded-xl border border-white/10 glass-panel p-4 ${className}`}>
      {/* Header with Title and Chart Type Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-white/5">
        <div>
          <h4 className="text-xs font-semibold text-white tracking-wide">
            {title || `${yAxisKey} by ${xAxisKey}`}
          </h4>
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
            X: <span className="text-zinc-200">{xAxisKey}</span> • Y: <span className="text-zinc-200">{yAxisKey}</span>
          </p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900/90 border border-white/5 p-1 rounded-lg">
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded text-xs transition-colors ${
              chartType === 'bar' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded text-xs transition-colors ${
              chartType === 'line' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
            title="Line Chart"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-1.5 rounded text-xs transition-colors ${
              chartType === 'area' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
            title="Area Chart"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-1.5 rounded text-xs transition-colors ${
              chartType === 'pie' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
            title="Pie Chart"
          >
            <PieIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] select-none font-sans"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {chartType !== 'pie' ? (
            <>
              {/* Y Axis Grid lines & labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const val = minY + ratio * yRange;
                const yPos = padding.top + chartH - ratio * chartH;
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={yPos}
                      x2={width - padding.right}
                      y2={yPos}
                      stroke="rgba(255, 255, 255, 0.07)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left - 8}
                      y={yPos + 3}
                      fill="#71717a"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="end"
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Chart Body */}
              {chartType === 'area' && (
                <>
                  <path d={areaPath} fill="url(#areaGradient)" />
                  <path d={linePath} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </>
              )}

              {chartType === 'line' && (
                <path d={linePath} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              )}

              {chartType === 'bar' &&
                points.map((p, i) => {
                  const bX = getBarX(i);
                  const bY = getY(Math.max(p.yVal, 0));
                  const bH = Math.abs(getY(p.yVal) - getY(0)) || 2;
                  return (
                    <rect
                      key={i}
                      x={bX}
                      y={p.yVal >= 0 ? bY : getY(0)}
                      width={barWidth}
                      height={bH}
                      fill="rgba(255, 255, 255, 0.85)"
                      rx="2"
                      className="hover:fill-white cursor-pointer transition-colors"
                      onMouseEnter={() => setHoveredPoint({ x: p.xLabel, y: p.yVal, px: bX + barWidth / 2, py: bY })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

              {/* Data points for line / area / scatter */}
              {(chartType === 'line' || chartType === 'area' || chartType === 'scatter') &&
                points.map((p, i) => {
                  const px = getX(i);
                  const py = getY(p.yVal);
                  return (
                    <circle
                      key={i}
                      cx={px}
                      cy={py}
                      r={chartType === 'scatter' ? 4 : 3}
                      fill="#ffffff"
                      stroke="#09090b"
                      strokeWidth="1.5"
                      className="hover:r-5 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint({ x: p.xLabel, y: p.yVal, px, py })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

              {/* X Axis Labels */}
              {points.map((p, i) => {
                // Show label every few points if many
                const step = Math.ceil(points.length / 8);
                if (i % step !== 0 && i !== points.length - 1) return null;
                const px = chartType === 'bar' ? getBarX(i) + barWidth / 2 : getX(i);
                return (
                  <text
                    key={i}
                    x={px}
                    y={height - padding.bottom + 18}
                    fill="#a1a1aa"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {p.xLabel.length > 8 ? p.xLabel.slice(0, 8) + '..' : p.xLabel}
                  </text>
                );
              })}
            </>
          ) : (
            // Pie Chart rendering
            <g>
              {pieSlices.map((slice, i) => (
                <path
                  key={i}
                  d={slice.path}
                  fill={slice.color}
                  stroke="#09090b"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      x: slice.label,
                      y: slice.val,
                      px: width / 2,
                      py: height / 2 - 40,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded bg-zinc-900/95 border border-white/20 text-[11px] text-white shadow-xl -translate-x-1/2 -translate-y-full mb-2 font-mono"
            style={{
              left: `${(hoveredPoint.px / width) * 100}%`,
              top: `${(hoveredPoint.py / height) * 100}%`,
            }}
          >
            <div className="text-zinc-400">{hoveredPoint.x}</div>
            <div className="font-semibold">{hoveredPoint.y.toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
};
