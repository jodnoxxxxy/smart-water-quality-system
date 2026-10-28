import React, { useState } from 'react';
import { Droplet, ArrowUpRight, ShieldCheck, AlertCircle, RefreshCw, Sparkles, Plus } from 'lucide-react';
import { RegionType, WaterRecord } from '../types';
import { REGION_METADATA } from '../utils/waterAnalysis';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  records: WaterRecord[];
  selectedRegion: RegionType;
  onSelectRegion: (r: RegionType) => void;
  onOpenTestModal: () => void;
  onNavigateToTab: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  selectedRegion,
  onSelectRegion,
  onOpenTestModal,
  onNavigateToTab,
}) => {
  const [activeChartMetric, setActiveChartMetric] = useState<'footprint' | 'tds' | 'ph'>('footprint');

  // Latest sample
  const latestRecord = records[records.length - 1] || null;

  // Monthly footpath trend data matching the wavy chart in the reference image
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Custom spline data points for the 9 months
  const chartPoints = [
    { month: 'Apr', val: 28, footprint: '42 L/d', quality: 86, tds: 220 },
    { month: 'May', val: 38, footprint: '58 L/d', quality: 89, tds: 210 },
    { month: 'Jun', val: 68, footprint: '112 L/d', quality: 94, tds: 195 },
    { month: 'Jul', val: 62, footprint: '98 L/d', quality: 92, tds: 230 },
    { month: 'Aug', val: 82, footprint: '135 L/d', quality: 96, tds: 180 },
    { month: 'Sep', val: 56, footprint: '84 L/d', quality: 88, tds: 260 },
    { month: 'Oct', val: 48, footprint: '72 L/d', quality: 85, tds: 310 },
    { month: 'Nov', val: 58, footprint: '92 L/d', quality: 90, tds: 240 },
    { month: 'Dec', val: 78, footprint: '124 L/d', quality: 93, tds: 205 },
  ];

  const [hoveredPoint, setHoveredPoint] = useState<typeof chartPoints[0] | null>(null);

  // SVG Coordinates for the smooth spline line
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const availableWidth = svgWidth - paddingX * 2;
  const availableHeight = svgHeight - paddingY * 2;

  const points = chartPoints.map((p, i) => {
    const x = paddingX + (i / (chartPoints.length - 1)) * availableWidth;
    // Map val (0-100) to y (height-paddingY down to paddingY)
    const y = svgHeight - paddingY - (p.val / 100) * availableHeight;
    return { x, y, data: p };
  });

  // Generate cubic bezier path string
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const pathD = generateSmoothPath(points);

  // Donut Gauge SVG Component matching the circular gauges in the mockup
  const DonutGauge = ({
    percentage,
    size = 110,
    stroke = 10,
    label,
  }: {
    percentage: number;
    size?: number;
    stroke?: number;
    label?: string;
  }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center relative select-none">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Filled indicator circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1eaedb"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-slate-800 tracking-tight">
            {percentage}%
          </span>
          {label && <span className="text-[10px] text-slate-400 font-medium">{label}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Alert / Quick Status Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-[#1eaedb]">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">Active Monitoring Station:</span>
              <span className="text-xs font-semibold text-[#1eaedb] bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-100">
                {REGION_METADATA[selectedRegion].label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest reading: {latestRecord ? `${latestRecord.ph} pH · ${latestRecord.tds} ppm TDS · ${latestRecord.result}` : 'Awaiting sensor input'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTestModal}
            className="flex items-center gap-1.5 bg-[#1eaedb] hover:bg-[#1998bf] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Test Water Sample</span>
          </button>
          <button
            onClick={() => onNavigateToTab('analyze')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Lab Simulator</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Top 2 Cards matching the uploaded screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top Left: "Water Footpath" Chart Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Water Footpath</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic water quality index and footprint curve over time
              </p>
            </div>

            {/* Metric Selector Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveChartMetric('footprint')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeChartMetric === 'footprint' ? 'bg-white text-[#1eaedb] shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Footprint
              </button>
              <button
                onClick={() => setActiveChartMetric('tds')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeChartMetric === 'tds' ? 'bg-white text-[#1eaedb] shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Purity
              </button>
              <button
                onClick={() => setActiveChartMetric('ph')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeChartMetric === 'ph' ? 'bg-white text-[#1eaedb] shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                pH Curve
              </button>
            </div>
          </div>

          {/* SVG Smooth Wavy Chart matching image_8c3e8385.png */}
          <div className="relative w-full h-[210px] mt-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Subtle Horizontal grid guidelines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#f1f5f9" strokeWidth="1" />

              {/* Gradient fill under the curve */}
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1eaedb" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#1eaedb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <path
                d={`${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`}
                fill="url(#curveGradient)"
              />

              {/* Main Turquoise Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#1eaedb"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Marker Dots */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.month === pt.data.month ? "6" : "4.5"}
                    fill="#1eaedb"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all duration-150 hover:scale-125"
                    onMouseEnter={() => setHoveredPoint(pt.data)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Subtle month label */}
                  <text
                    x={pt.x}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-medium select-none"
                  >
                    {pt.data.month}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-2 right-4 bg-slate-900/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl shadow-lg pointer-events-none animate-in fade-in">
                <span className="font-bold text-cyan-300">{hoveredPoint.month} Water Report</span>
                <div className="flex gap-4 mt-1 text-[11px] text-slate-300">
                  <span>Footprint: <b>{hoveredPoint.footprint}</b></span>
                  <span>Index: <b>{hoveredPoint.quality}%</b></span>
                  <span>TDS: <b>{hoveredPoint.tds} ppm</b></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Right: Progress Meters Card matching image_8c3e8385.png */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">Compliance & Health Indices</h3>
              <ShieldCheck className="w-4 h-4 text-[#1eaedb]" />
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Live ratio benchmarks evaluated against WHO safe drinking guidelines
            </p>

            {/* Three Progress Bars matching the reference mockup */}
            <div className="space-y-5">
              {/* Bar 1 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">WHO Potability Margin</span>
                  <span className="text-[#1eaedb] font-bold">45%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-[#1eaedb] rounded-full transition-all duration-700"
                    style={{ width: '45%' }}
                  />
                </div>
              </div>

              {/* Bar 2 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Mineral Balance Index</span>
                  <span className="text-[#1eaedb] font-bold">75%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-[#1eaedb] rounded-full transition-all duration-700"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>

              {/* Bar 3 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Filtration Reserve Buffer</span>
                  <span className="text-[#1eaedb] font-bold">60%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-[#1eaedb] rounded-full transition-all duration-700"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Standard: WHO 4th Edition</span>
            <button
              onClick={() => onNavigateToTab('standards')}
              className="text-[#1eaedb] font-semibold hover:underline cursor-pointer"
            >
              View limits
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 3 Square Cards with Donut Gauges matching image_8c3e8385.png */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Water Consumption with 2 Donut Gauges */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-6">
              Water Consumption
            </h3>
            {/* Two Donut Gauges side-by-side as shown in the screenshot */}
            <div className="flex items-center justify-around gap-2 mb-6">
              <DonutGauge percentage={75} size={105} stroke={9} />
              <DonutGauge percentage={25} size={105} stroke={9} />
            </div>
          </div>

          {/* Clean lines below */}
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="h-1.5 w-3/4 bg-slate-100 rounded-full" />
            <div className="h-1.5 w-1/2 bg-slate-100 rounded-full" />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-1">
              <span>Main Allocation (75%)</span>
              <span>Reserve (25%)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Water Usage with 1 Donut Gauge (25%) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-6">
              Water Usage
            </h3>
            {/* Center Donut Gauge matching the screenshot */}
            <div className="flex items-center justify-center mb-6">
              <DonutGauge percentage={25} size={120} stroke={10} />
            </div>
          </div>

          {/* Clean lines below */}
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="h-1.5 w-4/5 bg-slate-100 rounded-full" />
            <div className="h-1.5 w-2/3 bg-slate-100 rounded-full" />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-1">
              <span>Current Draw: 48.5 L/hr</span>
              <span className="text-[#1eaedb] font-semibold">Normal</span>
            </div>
          </div>
        </div>

        {/* Card 3: Future Water Demands with 1 Donut Gauge (75%) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-6">
              Future Water Demands
            </h3>
            {/* Center Donut Gauge matching the screenshot */}
            <div className="flex items-center justify-center mb-6">
              <DonutGauge percentage={75} size={120} stroke={10} />
            </div>
          </div>

          {/* Clean lines below */}
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="h-1.5 w-5/6 bg-slate-100 rounded-full" />
            <div className="h-1.5 w-3/5 bg-slate-100 rounded-full" />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-1">
              <span>Forecast Capacity (75%)</span>
              <span className="text-emerald-600 font-semibold">Sufficient</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
