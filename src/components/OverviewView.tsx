import React, { useState, useEffect } from 'react';
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
  Calendar,
  Clock,
  PlusCircle,
  ImageIcon,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { PondSubmission } from '@/lib/types';
import { fetchPondSubmissions } from '@/lib/supabase';

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
  polygonPoints: [number, number][];
  labelCenter: [number, number]; // [x%, y%] location of pond name text badge
}

interface OverviewViewProps {
  onNavigateToPondEntry?: (pondId: string) => void;
}

// 10 zones exactly matched with names written on the image:
// 1. Polishing 1 (Top-Left Purple Pond)
// 2. Polishing 2 (Top-Right Light-Green Pond)
// 3. Biogas 2 (Middle-Top Large Covered Biogas Pond)
// 4. Biogas 1 (Bottom-Center Large Covered Biogas Pond)
// 5. Aeration (Middle-Left Orange Pond)
// 6. AS (Middle-Right Large Red Aeration Pond)
// 7. Clarify (Center Blue Pump/Channel between Aeration & AS)
// 8. SS (Bottom-Right Pink Pond)
// 9. Mix 2 (Bottom-Left Green Mix Pond next to Biogas 1)
// 10. Scrubber / MW 2 (Top-Right Small Pink/Yellow Control Enclosure)

const ZONES: ZoneMarker[] = [
  {
    id: 'polishing1',
    name: 'Polishing 1 (บ่อกักเก็บน้ำทิ้งบำบัดแล้ว 1)',
    category: 'Polishing 1',
    color: '#a855f7',
    borderColor: 'border-purple-500',
    bgLight: 'bg-purple-50 text-purple-900',
    badgeBg: 'bg-purple-600 text-white',
    description: 'บ่อพักและกักเก็บน้ำทิ้งผ่านการบำบัดแล้วชุดที่ 1 เพื่อตรวจสอบคุณภาพน้ำก่อนหมุนเวียน/ระบายออก',
    details: ['COD eff AS (mg/l)', 'SV60 eff Biogas', 'Removal Efficiency (%)'],
    metrics: [
      { label: 'COD ขาออก', value: '45', unit: 'mg/L' },
      { label: 'Removal Eff.', value: '98.5', unit: '%' },
    ],
    polygonPoints: [
      [6.7, 38.0],
      [44.7, 4.8],
      [62.0, 13.8],
      [27.0, 29.5],
    ],
    labelCenter: [23, 24],
  },
  {
    id: 'polishing2',
    name: 'Polishing 2 (บ่อกักเก็บน้ำทิ้งบำบัดแล้ว 2)',
    category: 'Polishing 2',
    color: '#84cc16',
    borderColor: 'border-lime-500',
    bgLight: 'bg-lime-50 text-lime-900',
    badgeBg: 'bg-lime-600 text-slate-950',
    description: 'บ่อสำรองกักเก็บและปรับสภาพน้ำทิ้งบำบัดแล้วชุดที่ 2',
    details: ['Retention Capacity', 'Overflow Control', 'Water Level Check'],
    metrics: [
      { label: 'Free Capacity', value: '65', unit: '%' },
      { label: 'Water Level', value: '1.8', unit: 'm' },
    ],
    polygonPoints: [
      [59.8, 15.5],
      [90.8, 20.2],
      [89.5, 24.0],
      [58.8, 17.5],
    ],
    labelCenter: [72, 20],
  },
  {
    id: 'biogas2',
    name: 'Biogas 2 (บ่อหมักก๊าซชีวภาพ 2)',
    category: 'Biogas 2',
    color: '#e2e8f0',
    borderColor: 'border-slate-300',
    bgLight: 'bg-slate-100 text-slate-900',
    badgeBg: 'bg-slate-800 text-white',
    description: 'บ่อคลุมผ้ายาง HDPE สำหรับหมักก๊าซชีวภาพ Methane ชุดที่ 2',
    details: ['Flow Feed Mix2', 'Biogas Generate (Nm³)', '% CH4 / % H2S Monitoring'],
    metrics: [
      { label: 'Biogas Flow', value: '1,250', unit: 'Nm³/h' },
      { label: 'Methane CH4', value: '62.4', unit: '%' },
    ],
    polygonPoints: [
      [38.7, 26.5],
      [88.2, 21.0],
      [86.6, 38.6],
      [83.4, 39.0],
      [36.8, 28.5],
    ],
    labelCenter: [62, 27],
  },
  {
    id: 'biogas1',
    name: 'Biogas 1 (บ่อหมักก๊าซชีวภาพ 1)',
    category: 'Biogas 1',
    color: '#eab308',
    borderColor: 'border-amber-500',
    bgLight: 'bg-amber-50 text-amber-900',
    badgeBg: 'bg-amber-600 text-white',
    description: 'บ่อหมักก๊าซชีวภาพหลักชุดที่ 1 ผลิตก๊าซเพื่อจ่ายเข้า Boiler และระบบเผาก๊าซ',
    details: ['Biogas Reserve', 'Pressure Control', 'Condensate Drain'],
    metrics: [
      { label: 'Biogas Stock', value: '850', unit: 'm³' },
      { label: 'Pressure', value: '12.5', unit: 'mbar' },
    ],
    polygonPoints: [
      [30.8, 89.8],
      [60.0, 72.8],
      [67.8, 77.2],
      [39.2, 98.8],
    ],
    labelCenter: [48, 86],
  },
  {
    id: 'aeration',
    name: 'Aeration (บ่อปรับสภาพ & เติมอากาศดิบ)',
    category: 'Aeration',
    color: '#f97316',
    borderColor: 'border-orange-500',
    bgLight: 'bg-orange-50 text-orange-900',
    badgeBg: 'bg-orange-600 text-white',
    description: 'บ่อพักน้ำเสียดิบและปรับสภาพน้ำเสียก่อนเข้าสู่ระบบบำบัดขั้นสูง',
    details: ['COD Native', 'CODt Mix1', 'VFA Mix1'],
    metrics: [
      { label: 'COD Native', value: '14,500', unit: 'mg/L' },
      { label: 'VFA Mix1', value: '1,200', unit: 'mg/L' },
    ],
    polygonPoints: [
      [15.2, 42.0],
      [55.9, 34.0],
      [47.4, 52.0],
      [6.5, 39.2],
    ],
    labelCenter: [31, 44],
  },
  {
    id: 'as',
    name: 'AS (บ่อเติมอากาศ Activated Sludge)',
    category: 'AS',
    color: '#ef4444',
    borderColor: 'border-rose-500',
    bgLight: 'bg-rose-50 text-rose-900',
    badgeBg: 'bg-rose-600 text-white',
    description: 'บ่อเติมอากาศระบบ Activated Sludge (AS) ขนาดใหญ่เพื่อย่อยสลายสารอินทรีย์',
    details: ['COD Loading (Kg/day)', 'Air Blower Status', 'Dissolved Oxygen (DO)'],
    metrics: [
      { label: 'COD Loading', value: '8,400', unit: 'kg/d' },
      { label: 'Blower Active', value: '4/4', unit: 'Units' },
    ],
    polygonPoints: [
      [57.5, 35.8],
      [89.0, 43.5],
      [82.0, 63.5],
      [49.8, 53.2],
    ],
    labelCenter: [70, 50],
  },
  {
    id: 'clarify',
    name: 'Clarify (รางแยก & ส่งน้ำวน)',
    category: 'Clarify',
    color: '#38bdf8',
    borderColor: 'border-sky-500',
    bgLight: 'bg-sky-50 text-sky-900',
    badgeBg: 'bg-sky-600 text-white',
    description: 'ช่องรางแยกและกระจายน้ำเสียระหว่างบ่อ Aeration และบ่อ AS',
    details: ['Distribution Channel', 'Flow Control', 'Sludge Recycle Line'],
    metrics: [
      { label: 'Flow Rate', value: '350', unit: 'm³/h' },
      { label: 'Recycle Ratio', value: '1:1.5', unit: '' },
    ],
    polygonPoints: [
      [47.4, 52.2],
      [55.9, 34.0],
      [57.5, 35.8],
      [49.8, 53.2],
    ],
    labelCenter: [52, 44],
  },
  {
    id: 'ss',
    name: 'SS (บ่อตกตะกอนแขวนลอย / Sludge Settling)',
    category: 'SS',
    color: '#ec4899',
    borderColor: 'border-pink-500',
    bgLight: 'bg-pink-50 text-pink-900',
    badgeBg: 'bg-pink-600 text-white',
    description: 'บ่อแยกตกตะกอนสารแขวนลอย (Suspended Solids - SS) และสูบสลัดตะกอน',
    details: ['Sludge Removal (Ton)', 'Sludge Trips (เที่ยว)', 'Sludge Cost (บาท)'],
    metrics: [
      { label: 'ตะกอนขนออก', value: '171.9', unit: 'Ton' },
      { label: 'จำนวนเที่ยว', value: '14', unit: 'Trips' },
    ],
    polygonPoints: [
      [59.5, 62.0],
      [76.8, 64.5],
      [75.0, 76.5],
      [61.5, 75.0],
    ],
    labelCenter: [68, 69],
  },
  {
    id: 'mix2',
    name: 'Mix 2 (บ่อผสมและปรับสภาพ 2)',
    category: 'Mix 2',
    color: '#22c55e',
    borderColor: 'border-emerald-500',
    bgLight: 'bg-emerald-50 text-emerald-900',
    badgeBg: 'bg-emerald-600 text-white',
    description: 'บ่อกวนผสมและปรับสภาวะกรด-ด่างก่อนป้อนเข้าบ่อ Biogas 1',
    details: ['pH Mix2', 'VFA Mix1', 'Flow Feed Mix2'],
    metrics: [
      { label: 'pH Value', value: '6.9', unit: 'pH' },
      { label: 'Feed Rate', value: '120', unit: 'm³/h' },
    ],
    polygonPoints: [
      [31.0, 89.5],
      [36.5, 98.0],
      [32.0, 98.5],
      [27.5, 91.0],
    ],
    labelCenter: [33, 93],
  },
  {
    id: 'scrubber',
    name: 'Scrubber / MW 2 (ระบบดักก๊าซ & ควบคุม)',
    category: 'Scrubber / MW 2',
    color: '#f43f5e',
    borderColor: 'border-rose-600',
    bgLight: 'bg-rose-50 text-rose-950',
    badgeBg: 'bg-rose-700 text-white',
    description: 'อาคารหอกำจัดก๊าซ H2S Scrubber และตู้ควบคุมไฟฟ้ามิเตอร์ MW 2',
    details: ['Scrubber Efficiency', 'H2S Removal', 'MW 2 Meter Power'],
    metrics: [
      { label: 'H2S Removal', value: '99.2', unit: '%' },
      { label: 'Power Rating', value: '380', unit: 'V' },
    ],
    polygonPoints: [
      [86.5, 26.0],
      [89.5, 26.5],
      [89.0, 34.0],
      [86.0, 33.5],
    ],
    labelCenter: [88, 30],
  },
];

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigateToPondEntry }) => {
  const [selectedZone, setSelectedZone] = useState<ZoneMarker | null>(ZONES[0]);
  const [hoveredZone, setHoveredZone] = useState<ZoneMarker | null>(null);
  const [activeModalZone, setActiveModalZone] = useState<ZoneMarker | null>(null);
  const [selectedFullPhoto, setSelectedFullPhoto] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Date & Time Filter States (Default: today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState<string>(todayStr);

  // Submissions Data
  const [submissions, setSubmissions] = useState<PondSubmission[]>([]);
  const [loadingPonds, setLoadingPonds] = useState<boolean>(true);

  const loadPondData = async () => {
    setLoadingPonds(true);
    const data = await fetchPondSubmissions();
    setSubmissions(data);
    setLoadingPonds(false);
  };

  useEffect(() => {
    loadPondData();
  }, []);

  const handleZoneClick = (zone: ZoneMarker) => {
    setSelectedZone(zone);
    setActiveModalZone(zone);
  };

  // Helper to find submission for a specific zone matching selected filterDate
  const getSubmissionForZone = (zoneId: string): PondSubmission | undefined => {
    return submissions.find(
      (s) => (s.pond_id === zoneId || s.pond_id.replace('-', '') === zoneId.replace('-', '')) && s.report_date === filterDate
    ) || submissions.find(
      (s) => s.pond_id === zoneId || s.pond_id.replace('-', '') === zoneId.replace('-', '')
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] font-sans text-slate-800 pb-24">
      {/* Header Banner & Date Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Map className="w-6 h-6 text-sky-600" />
            <span>ภาพรวมผังผิวน้ำ & โซนบ่อบำบัด (Plant Overview Map)</span>
            <span className="text-xs bg-sky-100 text-sky-800 font-extrabold px-3 py-1 rounded-full border border-sky-200">
              ชื่อบ่อตรงตามผังภาพถ่าย
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            เลือกวันที่และคลิกที่ <strong className="text-sky-700">ป้ายชื่อบ่อในภาพ</strong> เพื่อดูข้อมูลและรูปถ่ายหน้างานตรงตามวันที่เลือก
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 shadow-xs relative">
            <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 shrink-0">วันที่เรียกดู:</span>
            <div className="relative flex items-center">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-24 bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
                style={{ color: 'transparent', caretColor: 'transparent' }}
              />
              <span className="absolute left-0 pointer-events-none text-xs font-black text-slate-900">
                {filterDate ? filterDate.split('-').reverse().join('/') : 'dd/mm/yyyy'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
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
      </div>

      {/* TOP 3 SUMMARY KPI CARDS MATCHING EXACT USER SCREENSHOT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: น้ำเข้าระบบบำบัด */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
          <div className="text-xs font-bold text-slate-600">น้ำเข้าระบบบำบัด</div>
          <div className="text-2xl font-black tracking-wider text-slate-400 flex items-baseline gap-2">
            <span>—</span>
            <span className="text-sm font-bold text-slate-500">m³/วัน</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400">
            Inflow วันนี้
          </div>
        </div>

        {/* Card 2: ก๊าซชีวภาพผลิตได้ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
          <div className="text-xs font-bold text-slate-600">ก๊าซชีวภาพผลิตได้</div>
          <div className="text-2xl font-black tracking-wider text-slate-400 flex items-baseline gap-2">
            <span>—</span>
            <span className="text-sm font-bold text-slate-500">m³/วัน</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400">
            Biogas · บ่อคลุมผ้า
          </div>
        </div>

        {/* Card 3: COD น้ำทิ้ง (จุดระบาย) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
          <div className="text-xs font-bold text-slate-600">COD น้ำทิ้ง (จุดระบาย)</div>
          <div className="text-2xl font-black tracking-wider text-slate-400 flex items-baseline gap-2">
            <span>—</span>
            <span className="text-sm font-bold text-slate-500">mg/L</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400">
            มาตรฐาน ≤ 120 mg/L
          </div>
        </div>
      </div>

      {/* Main Container: Interactive Map View & Details Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Res Aerial Map Image with Name Badges */}
        <div className={`lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4 bg-slate-950/95 overflow-y-auto' : ''
        }`}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-xs tracking-wide uppercase">
                ผังผิวน้ำพร้อมป้ายชื่อบ่อ (Interactive Pond Map)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                💡 คลิกที่ตัวหนังสือป้ายชื่อบ่อในภาพเพื่อดูข้อมูล
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

          {/* Map Viewport with Clean Text Label Badges (No Box Outline on Map) */}
          <div className="relative overflow-hidden bg-slate-950 flex items-center justify-center p-1 min-h-[450px]">
            <div className="relative w-full inline-block">
              {/* Base Aerial Image */}
              <img
                src="/overview_map.jpg"
                alt="TDC Utility Plant Aerial Overview Map"
                className="w-full h-auto object-contain block rounded-xl shadow-lg border border-slate-800"
              />

              {/* Invisible Interactive Polygon Click Areas (for clicking image directly) */}
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
                      <polygon
                        points={pointsString}
                        fill={zone.color}
                        fillOpacity={isSelected ? 0.25 : isHovered ? 0.15 : 0}
                        stroke="none"
                        className="transition-all duration-200"
                        onMouseEnter={() => setHoveredZone(zone)}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => handleZoneClick(zone)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Interactive Pond Name Text Badges Matched Exactly with Image Annotations */}
              {ZONES.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                const isHovered = hoveredZone?.id === zone.id;

                return (
                  <button
                    key={`badge-${zone.id}`}
                    onClick={() => handleZoneClick(zone)}
                    onMouseEnter={() => setHoveredZone(zone)}
                    onMouseLeave={() => setHoveredZone(null)}
                    style={{
                      left: `${zone.labelCenter[0]}%`,
                      top: `${zone.labelCenter[1]}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black shadow-xl border backdrop-blur-md ${
                      isSelected
                        ? 'bg-slate-900 text-amber-300 border-amber-400 ring-4 ring-amber-400/40 scale-110 text-xs sm:text-sm'
                        : isHovered
                        ? 'bg-slate-900/95 text-emerald-300 border-emerald-400 scale-105 text-xs'
                        : 'bg-slate-900/85 text-emerald-400 border-slate-700 hover:bg-slate-900 text-[11px] sm:text-xs'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="font-extrabold tracking-wide drop-shadow-md">{zone.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-slate-300 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>คลิกที่ป้ายชื่อตัวหนังสือในภาพ (เช่น Polishing 1, Biogas 1, AS) เพื่อเปิดการ์ดแสดงข้อมูล</span>
            </span>
            <span className="text-[11px] text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-md font-bold">
              ✓ เปิดการ์ด Popup เมื่อคลิก
            </span>
          </div>
        </div>

        {/* Right Col: Detailed Active Zone Information & Metrics Panel */}
        <div className="space-y-4">
          {/* Active Selected Zone Card Box */}
          {selectedZone ? (
            <div className={`p-5 rounded-2xl border bg-white shadow-md space-y-4 transition-all ${selectedZone.borderColor}`}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className={`text-xs font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider ${selectedZone.badgeBg}`}>
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
              <span>คลิกเลือกตัวหนังสือชื่อบ่อบนภาพเพื่อแสดงข้อมูล</span>
            </div>
          )}

          {/* List of All Zones Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>รายชื่อบ่อบำบัดทั้งหมด (Select Pond List)</span>
            </h4>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {ZONES.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => handleZoneClick(zone)}
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
                      <span className="text-xs font-black text-slate-900 truncate">
                        {zone.category} — <span className="font-semibold text-slate-600">{zone.name.split('(')[0]}</span>
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

      {/* POPUP MODAL CARD WHEN CLICKING POND NAME BADGE */}
      {activeModalZone && (() => {
        const sub = getSubmissionForZone(activeModalZone.id);
        const isMatchDate = sub?.report_date === filterDate;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div
              className={`w-full max-w-md bg-white rounded-3xl border shadow-2xl overflow-hidden p-6 space-y-4 relative max-h-[90vh] overflow-y-auto animate-scaleUp ${activeModalZone.borderColor}`}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModalZone(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>

              {/* Header Badge & Date Match Indicator */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider ${activeModalZone.badgeBg}`}>
                  {activeModalZone.category}
                </span>
                {sub ? (
                  isMatchDate ? (
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ข้อมูลวันที่ {filterDate.split('-').reverse().join('/')}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>ข้อมูลล่าสุดเมื่อ {sub.report_date.split('-').reverse().join('/')}</span>
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                    ยังไม่มีการลงข้อมูล
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {activeModalZone.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                  {activeModalZone.description}
                </p>
              </div>

              {/* Photo Gallery Preview if Available (Clickable for full screen) */}
              {((sub?.image_urls && sub.image_urls.length > 0) || sub?.image_url) && (() => {
                const photos = sub.image_urls && sub.image_urls.length > 0 ? sub.image_urls : [sub.image_url!];
                return (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sky-800">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                        <span>รูปถ่ายหน้างาน ({photos.length} รูป - คลิกเพื่อดูรูปใหญ่):</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">บันทึกโดย: {sub.reporter_name}</span>
                    </span>

                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-2xl border border-slate-200 bg-slate-900 shadow-inner">
                      {photos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setSelectedFullPhoto(photoUrl)}
                          className="rounded-xl overflow-hidden border border-slate-800 relative group cursor-pointer hover:border-sky-400 transition-all"
                        >
                          <img
                            src={photoUrl}
                            alt={`Photo ${pIdx + 1} of ${activeModalZone.name}`}
                            className="w-full h-24 object-cover block group-hover:scale-105 transition-all"
                          />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-[10px] font-black text-white bg-sky-600/90 px-2 py-0.5 rounded-md shadow-md">
                              🔍 คลิกดูขยาย
                            </span>
                          </div>
                          <span className="absolute bottom-1 right-1 bg-slate-950/80 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                            #{pIdx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Key Metrics Grid (Purely Real Data according to user request) */}
              <div className="pt-1 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  พารามิเตอร์ตรวจวัดล่าสุด:
                </span>
                {sub && Object.keys(sub.metrics).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(sub.metrics).map(([key, val], idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 text-center">
                        <span className="text-[11px] font-bold text-slate-500 block uppercase">{key.replace('_', ' ')}</span>
                        <div className="text-lg font-black text-slate-900 mt-0.5 tracking-tight">
                          {val}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-1">
                    <p className="text-xs font-bold text-slate-600">ยังไม่มีข้อมูลการตรวจวัดในวันที่เลือก</p>
                    <p className="text-[11px] text-slate-400 font-medium">กดปุ่ม "+ ลงข้อมูลบ่อนี้นี้" ด้านล่างเพื่อเริ่มบันทึกข้อมูล</p>
                  </div>
                )}
              </div>

              {sub?.remarks && (
                <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs text-sky-950 font-medium">
                  <strong>หมายเหตุหน้างาน:</strong> {sub.remarks}
                </div>
              )}

              {/* Action Buttons: Navigate to Pond Entry or Close */}
              <div className="pt-2 flex items-center gap-2">
                {onNavigateToPondEntry && (
                  <button
                    onClick={() => {
                      setActiveModalZone(null);
                      onNavigateToPondEntry(activeModalZone.id);
                    }}
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ ลงข้อมูลบ่อนี้นี้</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveModalZone(null)}
                  className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FULL SCREEN PHOTO ZOOM MODAL */}
      {selectedFullPhoto && (
        <div
          onClick={() => setSelectedFullPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl">
            <img
              src={selectedFullPhoto}
              alt="Full Size Photo"
              className="w-full h-full object-contain max-h-[80vh] block"
            />
            <button
              onClick={() => setSelectedFullPhoto(null)}
              className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white w-9 h-9 rounded-full font-black text-sm flex items-center justify-center border border-slate-700 shadow-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-xs font-bold text-slate-300 mt-3">คลิกที่ใดก็ได้เพื่อปิดรูปภาพภาพใหญ่</p>
        </div>
      )}
    </div>
  );
};
