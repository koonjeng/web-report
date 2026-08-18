'use client';

import React, { useState } from 'react';
import {
  Map,
  Layers,
  Activity,
  Maximize2,
  Minimize2,
  Info,
  Droplets,
  Zap,
  Flame,
  Factory,
  ShieldCheck,
  Eye,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface ZoneMarker {
  id: string;
  name: string;
  category: string;
  color: string;
  borderColor: string;
  bgLight: string;
  badgeBg: string;
  description: string;
  details: string[];
  metrics: { label: string; value: string; unit: string }[];
  // SVG polygon clip-path points in percentage relative to width/height of image container
  // polygon format: array of [x, y] in percentage
  polygonPoints: [number, number][];
  labelCenter: [number, number]; // [x%, y%] for floating badge
}

const ZONES: ZoneMarker[] = [
  {
    id: 'z1',
    name: 'บ่อกักเก็บน้ำทิ้งบำบัดแล้ว (Effluent Storage Pond - Purple)',
    category: 'Effluent Storage',
    color: '#c084fc', // Purple outline
    borderColor: 'border-purple-500',
    bgLight: 'bg-purple-50 text-purple-900',
    badgeBg: 'bg-purple-600 text-white',
    description: 'บ่อพักและกักเก็บน้ำทิ้งที่ผ่านกระบวนการบำบัดแล้วเพื่อการหมุนเวียนและตรวจสอบคุณภาพ',
    details: ['COD eff AS (mg/l)', 'SV60 eff Biogas', 'Removal Efficiency (%)'],
    metrics: [
      { label: 'COD ขาออก', value: '45', unit: 'mg/L' },
      { label: 'Removal Eff.', value: '98.5', unit: '%' },
    ],
    // Purple Polygon: top-left pond
    polygonPoints: [
      [6.4, 38.3],
      [44.8, 5.0],
      [62.1, 13.5],
      [27.3, 29.5],
    ],
    labelCenter: [33, 20],
  },
  {
    id: 'z2',
    name: 'บ่อหมักก๊าซชีวภาพหลัก (Anaerobic Biogas Cover Pond - White/Grey)',
    category: 'Biogas & Energy',
    color: '#e2e8f0', // White/Silver outline
    borderColor: 'border-slate-300',
    bgLight: 'bg-slate-100 text-slate-900',
    badgeBg: 'bg-slate-800 text-white',
    description: 'บ่อปิดด้วยผ้ายาง HDPE สำหรับหมักก๊าซชีวภาพ Methane ผลิตพลังงานทดแทน',
    details: ['Flow Feed Mix2', 'Biogas Generate (Nm³)', '% CH4 / % H2S Monitoring'],
    metrics: [
      { label: 'Biogas Flow', value: '1,250', unit: 'Nm³/h' },
      { label: 'Methane CH4', value: '62.4', unit: '%' },
      { label: 'H2S Gas', value: '120', unit: 'ppm' },
    ],
    // White/Silver Polygon: top biogas cover pond
    polygonPoints: [
      [38.5, 26.5],
      [88.2, 21.0],
      [86.5, 38.8],
      [83.5, 39.0],
      [36.6, 28.5],
    ],
    labelCenter: [62, 30],
  },
  {
    id: 'z3',
    name: 'บ่อตกตะกอน & บ่อพักน้ำดิบ (Sludge Settling & Equalization Pond - Orange)',
    category: 'Wastewater Equalization',
    color: '#fb923c', // Orange outline
    borderColor: 'border-orange-500',
    bgLight: 'bg-orange-50 text-orange-900',
    badgeBg: 'bg-orange-600 text-white',
    description: 'บ่อปรับสภาพน้ำเสียดิบก่อนเข้าสู่ระบบบำบัดและพักแยกสารแขวนลอย',
    details: ['COD Native', 'CODt Mix1', 'VFA Mix1'],
    metrics: [
      { label: 'COD Native', value: '14,500', unit: 'mg/L' },
      { label: 'VFA Mix1', value: '1,200', unit: 'mg/L' },
      { label: 'pH Mix2', value: '6.8', unit: 'pH' },
    ],
    // Orange Polygon: middle-left pond
    polygonPoints: [
      [15.0, 42.0],
      [56.0, 34.0],
      [47.5, 52.0],
      [6.4, 39.0],
    ],
    labelCenter: [32, 45],
  },
  {
    id: 'z4',
    name: 'บ่อเติมอากาศบำบัดน้ำเสีย (Activated Sludge Aeration Tank - Red)',
    category: 'Biological Treatment',
    color: '#f87171', // Red outline
    borderColor: 'border-rose-500',
    bgLight: 'bg-rose-50 text-rose-900',
    badgeBg: 'bg-rose-600 text-white',
    description: 'บ่อเติมอากาศระบบ Activated Sludge (AS) ใช้จุลินทรีย์ย่อยสลายสารอินทรีย์',
    details: ['COD Loading (Kg/day)', 'Air Blower Status', 'Dissolved Oxygen (DO)'],
    metrics: [
      { label: 'COD Loading', value: '8,400', unit: 'kg/d' },
      { label: 'Blower Active', value: '4/4', unit: 'Units' },
      { label: 'DO Level', value: '2.4', unit: 'mg/L' },
    ],
    // Red Polygon: middle-right large aeration pond
    polygonPoints: [
      [57.5, 36.0],
      [89.0, 43.5],
      [82.0, 63.5],
      [50.0, 53.5],
    ],
    labelCenter: [70, 50],
  },
  {
    id: 'z5',
    name: 'บ่อหมักก๊าซชีวภาพรอง (Secondary Covered Biogas Lagoon - Yellow)',
    category: 'Secondary Biogas',
    color: '#facc15', // Yellow outline
    borderColor: 'border-amber-500',
    bgLight: 'bg-amber-50 text-amber-900',
    badgeBg: 'bg-amber-600 text-white',
    description: 'บ่อคลุมก๊าซชีวภาพชุดที่สอง รองรับน้ำเสียจากการย่อยสลายเพื่อกักเก็บก๊าซเสริม',
    details: ['Biogas Reserve', 'Pressure Control', 'Condensate Drain'],
    metrics: [
      { label: 'Biogas Stock', value: '850', unit: 'm³' },
      { label: 'Pressure', value: '12.5', unit: 'mbar' },
    ],
    // Yellow Polygon: bottom-center large covered lagoon
    polygonPoints: [
      [35.0, 90.0],
      [67.0, 77.5],
      [59.5, 69.5],
      [32.5, 87.0],
    ],
    labelCenter: [48, 82],
  },
  {
    id: 'z6',
    name: 'บ่อบำบัดขั้นต้น & ตะกอนใส (Clarifier & Thickener Pond - Pink)',
    category: 'Primary Clarification',
    color: '#f472b6', // Pink outline
    borderColor: 'border-pink-500',
    bgLight: 'bg-pink-50 text-pink-900',
    badgeBg: 'bg-pink-600 text-white',
    description: 'บ่อแยกตกตะกอนขั้นแรกและสลัดตะกอน (Sludge Dewatering / Removal)',
    details: ['Sludge Removal (Ton)', 'Sludge Trips (เที่ยว)', 'Sludge Cost (บาท)'],
    metrics: [
      { label: 'ตะกอนขนออก', value: '171.9', unit: 'Ton' },
      { label: 'จำนวนเที่ยว', value: '14', unit: 'Trips' },
    ],
    // Pink Polygon: bottom-right pink pond
    polygonPoints: [
      [59.5, 62.0],
      [76.8, 64.5],
      [75.0, 76.5],
      [61.5, 75.0],
    ],
    labelCenter: [68, 69],
  },
  {
    id: 'z7',
    name: 'บ่อฉุกเฉิน & บ่อตกตะกอนสำรอง (Emergency & Settling Pond - Light Green)',
    category: 'Emergency Overflow',
    color: '#a3e635', // Light Green outline
    borderColor: 'border-lime-500',
    bgLight: 'bg-lime-50 text-lime-900',
    badgeBg: 'bg-lime-600 text-slate-950',
    description: 'บ่อสำรองน้ำเสียฉุกเฉินและบ่อปรับสภาพน้ำธรรมชาติ',
    details: ['Retention Capacity', 'Overflow Control', 'Water Level Check'],
    metrics: [
      { label: 'Free Capacity', value: '65', unit: '%' },
      { label: 'Water Level', value: '1.8', unit: 'm' },
    ],
    // Light Green Polygon: top-right narrow pond
    polygonPoints: [
      [60.0, 15.5],
      [91.0, 20.0],
      [90.0, 24.5],
      [59.0, 17.5],
    ],
    labelCenter: [75, 18],
  },
  {
    id: 'z8',
    name: 'อาคารควบคุมระบบไฟฟ้า & ปั๊มสูบน้ำ (Main Control Room & Pumps)',
    category: 'Control & Utilities',
    color: '#60a5fa', // Blue outline
    borderColor: 'border-blue-500',
    bgLight: 'bg-blue-50 text-blue-900',
    badgeBg: 'bg-blue-600 text-white',
    description: 'อาคารหลักควบคุมเครื่องสูบน้ำ มิเตอร์ไฟฟ้า PEA / Solar และระบบ Biogas Flare',
    details: ['PEA Main Meter', 'Solar Inverter', 'Gas Flare Igniter'],
    metrics: [
      { label: 'PEA Usage', value: '424.6k', unit: 'kWh' },
      { label: 'Solar Generated', value: '26,973.2', unit: 'kWh' },
    ],
    // Blue Polygon: center small pump station between ponds
    polygonPoints: [
      [47.5, 52.5],
      [57.0, 36.5],
      [58.0, 37.0],
      [48.5, 53.0],
    ],
    labelCenter: [52, 44],
  },
];

export const OverviewView: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<ZoneMarker | null>(ZONES[0]);
  const [hoveredZone, setHoveredZone] = useState<ZoneMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] font-sans text-slate-800 pb-24">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Map className="w-6 h-6 text-sky-600" />
            <span>ภาพรวมผังผิวน้ำ & โซนปฏิบัติการ (Interactive Map Overview)</span>
            <span className="text-xs bg-sky-100 text-sky-800 font-extrabold px-3 py-1 rounded-full border border-sky-200">
              คลิกบนภาพเพื่อดูข้อมูลโซน
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            สามารถ <strong className="text-sky-700">คลิกที่กรอบพื้นที่โซนสีบนรูปภาพถ่ายทางอากาศ</strong> หรือคลิกชื่อโซนทางด้านขวาเพื่อดูข้อมูลการทำงานได้ทันที
          </p>
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0 self-start md:self-auto"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-sky-400" />
              <span>ย่อขนาด</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-sky-400" />
              <span>ขยายเต็มจอ</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container: Interactive SVG Overlay Map View & Details Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Res Aerial Map Image with Interactive SVG Polygons */}
        <div className={`lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4 bg-slate-950/95 overflow-y-auto' : ''
        }`}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-xs tracking-wide uppercase">
                ผังผิวน้ำแบบตอบสนองคลิก (Clickable Interactive Aerial Map)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                💡 คำแนะนำ: นำเมาส์ชี้หรือคลิกที่บ่อในภาพ
              </span>
              {isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Map Viewport with SVG overlay */}
          <div className="relative overflow-hidden bg-slate-950 flex items-center justify-center p-1 min-h-[450px]">
            <div className="relative w-full inline-block">
              {/* Base Aerial Image */}
              <img
                src="/overview_map.jpg"
                alt="TDC Utility Plant Aerial Overview Map"
                className="w-full h-auto object-contain block rounded-xl shadow-lg border border-slate-800"
              />

              {/* Interactive SVG Overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none rounded-xl"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {ZONES.map((zone) => {
                  const pointsString = zone.polygonPoints.map((pt) => `${pt[0]},${pt[1]}`).join(' ');
                  const isSelected = selectedZone?.id === zone.id;
                  const isHovered = hoveredZone?.id === zone.id;

                  return (
                    <g key={zone.id} className="pointer-events-auto cursor-pointer">
                      {/* Clickable Zone Polygon */}
                      <polygon
                        points={pointsString}
                        fill={zone.color}
                        fillOpacity={isSelected ? 0.35 : isHovered ? 0.25 : 0.08}
                        stroke={zone.color}
                        strokeWidth={isSelected ? 0.8 : isHovered ? 0.6 : 0.35}
                        strokeDasharray={isSelected ? 'none' : '0.8, 0.4'}
                        className="transition-all duration-200"
                        onMouseEnter={() => setHoveredZone(zone)}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => setSelectedZone(zone)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Interactive Floating Hotspot Badges over Map */}
              {ZONES.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                const isHovered = hoveredZone?.id === zone.id;

                return (
                  <button
                    key={`badge-${zone.id}`}
                    onClick={() => setSelectedZone(zone)}
                    onMouseEnter={() => setHoveredZone(zone)}
                    onMouseLeave={() => setHoveredZone(null)}
                    style={{
                      left: `${zone.labelCenter[0]}%`,
                      top: `${zone.labelCenter[1]}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black shadow-lg border backdrop-blur-xs ${
                      isSelected
                        ? 'bg-slate-900 text-white border-sky-400 ring-4 ring-sky-400/30 scale-110'
                        : isHovered
                        ? 'bg-slate-900/90 text-white border-white scale-105'
                        : 'bg-slate-900/75 text-slate-200 border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="truncate max-w-[90px] sm:max-w-[130px]">{zone.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-slate-300 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>คลิกพื้นที่บ่อหรือป้ายชื่อบนภาพเพื่อเลือกโซนบำบัด</span>
            </span>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md font-mono">
               Interactive SVG Hotspots Active
            </span>
          </div>
        </div>

        {/* Right Col: Detailed Active Zone Information & Metrics Panel */}
        <div className="space-y-4">
          {/* Active Selected Zone Card Box */}
          {selectedZone ? (
            <div className={`p-5 rounded-2xl border bg-white shadow-md space-y-4 transition-all ${selectedZone.borderColor}`}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wide ${selectedZone.badgeBg}`}>
                  {selectedZone.category}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>กำลังแสดงผลโซนนี้</span>
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                  {selectedZone.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                  {selectedZone.description}
                </p>
              </div>

              {/* Key Real-time Metrics Cards */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {selectedZone.metrics.map((m, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 text-center">
                    <span className="text-[11px] font-bold text-slate-500 block">{m.label}</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5 tracking-tight">
                      {m.value} <span className="text-xs font-extrabold text-slate-500">{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Parameter checklist */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  พารามิเตอร์และตัววัดระบบ:
                </span>
                <div className="space-y-1.5">
                  {selectedZone.details.map((d, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100/80 text-slate-800 border border-slate-200 flex items-center gap-2"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-xs text-slate-400 font-medium">
              <Map className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-bounce" />
              <span>คลิกเลือกโซนบนรูปภาพทางซ้ายเพื่อแสดงข้อมูล</span>
            </div>
          )}

          {/* List of All Zones Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>รายชื่อโซนทั้งหมด (Select Zone List)</span>
            </h4>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {ZONES.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? `${zone.borderColor} ${zone.bgLight} ring-2 ring-sky-400/20 shadow-sm`
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {zone.name}
                      </span>
                    </div>
                    <Eye className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
