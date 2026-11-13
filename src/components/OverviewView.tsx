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
    color: '#0284c7',
    borderColor: 'border-sky-500',
    bgLight: 'bg-sky-50 text-slate-900',
    badgeBg: 'bg-sky-600 text-white',
    description: 'บ่อกักเก็บน้ำทิ้งผ่านการบำบัดแล้วชุดที่ 1 ตรวจวัดค่า COD ก่อนระบายออก',
    details: ['COD (mg/L)'],
    metrics: [],
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
    color: '#0284c7',
    borderColor: 'border-sky-500',
    bgLight: 'bg-sky-50 text-slate-900',
    badgeBg: 'bg-sky-600 text-white',
    description: 'บ่อกักเก็บและปรับสภาพน้ำทิ้งบำบัดแล้วชุดที่ 2 ตรวจวัดค่า COD',
    details: ['COD (mg/L)'],
    metrics: [],
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
    color: '#6366f1',
    borderColor: 'border-indigo-500',
    bgLight: 'bg-indigo-50 text-slate-900',
    badgeBg: 'bg-indigo-600 text-white',
    description: 'บ่อคลุมผ้ายาง HDPE สำหรับหมักก๊าซชีวภาพชุดที่ 2 (SV60, ปริมาณแก๊ส %)',
    details: ['SV60 (mg/L)', 'ปริมาณแก๊ส (%)'],
    metrics: [],
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
    color: '#6366f1',
    borderColor: 'border-indigo-500',
    bgLight: 'bg-indigo-50 text-slate-900',
    badgeBg: 'bg-indigo-600 text-white',
    description: 'บ่อหมักก๊าซชีวภาพหลักชุดที่ 1 ตรวจวัดค่าตะกอน SV60',
    details: ['SV60 (mg/L)'],
    metrics: [],
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
    color: '#0d9488',
    borderColor: 'border-teal-500',
    bgLight: 'bg-teal-50 text-slate-900',
    badgeBg: 'bg-teal-600 text-white',
    description: 'บ่อพักน้ำเสียดิบและปรับสภาพเติมอากาศ (ปริมาณน้ำ, COD)',
    details: ['ปริมาณน้ำ (m³)', 'COD (mg/L)'],
    metrics: [],
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
    color: '#2563eb',
    borderColor: 'border-blue-500',
    bgLight: 'bg-blue-50 text-slate-900',
    badgeBg: 'bg-blue-600 text-white',
    description: 'บ่อเติมอากาศระบบ Activated Sludge (สีน้ำ, ปริมาณน้ำ, COD)',
    details: ['สีน้ำ', 'ปริมาณน้ำ (m³)', 'COD (mg/L)'],
    metrics: [],
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
    name: 'Clarify (รางแยก & บ่อตกตะกอน)',
    category: 'Clarify',
    color: '#06b6d4',
    borderColor: 'border-cyan-500',
    bgLight: 'bg-cyan-50 text-slate-900',
    badgeBg: 'bg-cyan-600 text-white',
    description: 'ช่องรางแยกและบ่อตกตะกอน Clarifier (ปริมาณน้ำ, COD)',
    details: ['ปริมาณน้ำ (m³)', 'COD (mg/L)'],
    metrics: [],
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
    color: '#c026d3',
    borderColor: 'border-fuchsia-500',
    bgLight: 'bg-fuchsia-50 text-slate-900',
    badgeBg: 'bg-fuchsia-600 text-white',
    description: 'บ่อแยกตกตะกอนสารแขวนลอยและตะกอนสลัดจ์ (SV30)',
    details: ['SV30'],
    metrics: [],
    polygonPoints: [
      [59.5, 62.0],
      [76.8, 64.5],
      [75.0, 76.5],
      [61.5, 75.0],
    ],
    labelCenter: [68, 69],
  },
  {
    id: 'mix1',
    name: 'Mix 1 (บ่อผสมและปรับสภาพ 1)',
    category: 'Mix 1',
    color: '#059669',
    borderColor: 'border-emerald-500',
    bgLight: 'bg-emerald-50 text-slate-900',
    badgeBg: 'bg-emerald-600 text-white',
    description: 'บ่อกวนผสมและปรับสภาวะกรด-ด่างก่อนป้อนเข้าบ่อ Biogas 1 (Flow m³/h, pH 3-4)',
    details: ['Flow (m³/h)', 'pH (ช่วง 3.0 - 4.0)'],
    metrics: [],
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
    name: 'Scrubber (หอกำจัดก๊าซ H2S)',
    category: 'Scrubber',
    color: '#d97706',
    borderColor: 'border-amber-500',
    bgLight: 'bg-amber-50 text-slate-900',
    badgeBg: 'bg-amber-600 text-white',
    description: 'อาคารหอดักและกำจัดก๊าซ H2S Scrubber (%H2S, %CH4)',
    details: ['%H2S', '%CH4'],
    metrics: [],
    polygonPoints: [
      [86.5, 26.0],
      [89.5, 26.5],
      [89.0, 30.0],
      [86.0, 29.5],
    ],
    labelCenter: [87.5, 28],
  },
  {
    id: 'mix2',
    name: 'Mix 2 (บ่อผสมและปรับสภาพ 2)',
    category: 'Mix 2',
    color: '#059669',
    borderColor: 'border-emerald-500',
    bgLight: 'bg-emerald-50 text-slate-900',
    badgeBg: 'bg-emerald-600 text-white',
    description: 'บ่อกวนผสมและปรับสภาพน้ำเข้าระบบ 2 (Flow m³/h, pH 6-7)',
    details: ['Flow (m³/h)', 'pH (ช่วง 6.0 - 7.0)'],
    metrics: [],
    polygonPoints: [
      [86.5, 30.2],
      [89.5, 30.7],
      [89.0, 34.0],
      [86.0, 33.5],
    ],
    labelCenter: [87.5, 32],
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

  // Helper to find submission for a specific zone matching selected filterDate (Only APPROVED submissions display on Overview map)
  const getSubmissionForZone = (zoneId: string): PondSubmission | undefined => {
    const approvedSubmissions = submissions.filter((s) => s.status === 'approved' || !s.status);
    return approvedSubmissions.find(
      (s) => (s.pond_id === zoneId || s.pond_id.replace('-', '') === zoneId.replace('-', '')) && s.report_date === filterDate
    ) || approvedSubmissions.find(
      (s) => s.pond_id === zoneId || s.pond_id.replace('-', '') === zoneId.replace('-', '')
    );
  };

  // Helper to evaluate metric status & color thresholds (matches Pond Entry rules)
  const getMetricStatus = (pondId: string, key: string, val: string | number | undefined) => {
    const cleanId = pondId.replace('-', '').toLowerCase();
    const valNum = typeof val === 'number' ? val : parseFloat(String(val || ''));
    const k = key.toLowerCase();

    if (isNaN(valNum)) {
      return {
        cardBg: 'bg-slate-50 border-slate-200',
        textClass: 'text-slate-900',
        badge: null,
      };
    }

    // Mix 1: pH (3.0 - 4.0 is green, outside is red)
    if (cleanId === 'mix1' && k.includes('ph')) {
      if (valNum >= 3.0 && valNum <= 4.0) {
        return {
          cardBg: 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400/20',
          textClass: 'text-emerald-950',
          badge: { label: '✓ ในเกณฑ์ (3.0-4.0)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        };
      } else {
        return {
          cardBg: 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30',
          textClass: 'text-rose-950 font-black',
          badge: { label: '⚠ นอกเกณฑ์ (3.0-4.0)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
        };
      }
    }

    // Mix 2: pH (6.0 - 7.0 is green, outside is red)
    if (cleanId === 'mix2' && k.includes('ph')) {
      if (valNum >= 6.0 && valNum <= 7.0) {
        return {
          cardBg: 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400/20',
          textClass: 'text-emerald-950',
          badge: { label: '✓ ในเกณฑ์ (6.0-7.0)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        };
      } else {
        return {
          cardBg: 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30',
          textClass: 'text-rose-950 font-black',
          badge: { label: '⚠ นอกเกณฑ์ (6.0-7.0)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
        };
      }
    }

    // Biogas 2: SV60 (<= 10 green, >10 orange, >50 red)
    if (cleanId === 'biogas2' && k.includes('sv60')) {
      if (valNum > 50) {
        return {
          cardBg: 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30',
          textClass: 'text-rose-950 font-black',
          badge: { label: '🔴 สูงผิดปกติ (>50)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
        };
      } else if (valNum > 10) {
        return {
          cardBg: 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30',
          textClass: 'text-amber-950 font-black',
          badge: { label: '🟠 เฝ้าระวัง (>10)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
        };
      } else {
        return {
          cardBg: 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400/20',
          textClass: 'text-emerald-950',
          badge: { label: '🟢 ปกติ (≤10)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        };
      }
    }

    return {
      cardBg: 'bg-slate-50 border-slate-200',
      textClass: 'text-slate-900',
      badge: null,
    };
  };

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] font-sans text-slate-800 pb-24">
      {/* Header Banner & Date Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Map className="w-6 h-6 text-sky-600" />
            <span>ระบบบำบัดน้ำเสีย (Wastewater Treatment Plant)</span>
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
        <div className={`lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4 bg-slate-950/95 overflow-y-auto' : ''
          }`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-xs tracking-wide uppercase text-slate-200">
                ผังระบบบ่อบำบัดน้ำเสีย (Wastewater Treatment Plant Overview)
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

          {/* Map Viewport with High-Res Aerial Image & Interactive Overlay */}
          <div className="relative overflow-hidden bg-slate-950 flex items-center justify-center p-1 sm:p-2 min-h-[450px] select-none">
            <div className="relative w-full inline-block rounded-xl overflow-hidden shadow-2xl border border-slate-800">
              {/* Base Aerial Photograph */}
              <img
                src="/overview_ponds.jpg"
                alt="Wastewater Treatment Plant Overview"
                className="w-full h-auto object-cover block rounded-xl"
              />

              {/* Interactive Pond Name Text Badges */}
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
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-black shadow-xl border backdrop-blur-md ${isSelected
                      ? 'bg-slate-900 text-amber-300 border-amber-400 ring-4 ring-amber-400/40 scale-110 text-xs sm:text-sm'
                      : isHovered
                        ? 'bg-slate-900/95 text-sky-200 border-sky-400 scale-105 text-[11px] sm:text-xs'
                        : 'bg-slate-900/85 text-slate-100 border-slate-700/80 hover:bg-slate-900 text-[10px] sm:text-xs'
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

          {/* Bottom Information Bar */}
          <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-slate-300 text-xs font-semibold flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>คลิกที่ป้ายชื่อตัวหนังสือในภาพ (เช่น Polishing 1, Biogas 1, AS) เพื่อเปิดการ์ดแสดงข้อมูล</span>
            </span>
            <span className="text-[11px] text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-md font-bold shrink-0">
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

              {/* Real Supabase Metrics from Database */}
              {(() => {
                const sub = getSubmissionForZone(selectedZone.id);
                const isMatchDate = sub?.report_date === filterDate;
                const photos = sub?.image_urls && sub.image_urls.length > 0 ? sub.image_urls : sub?.image_url ? [sub.image_url] : [];

                return (
                  <div className="space-y-3 pt-1">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        พารามิเตอร์ตรวจวัดล่าสุด:
                      </span>
                      {sub && (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${isMatchDate ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                          {isMatchDate ? `วันที่ ${filterDate.split('-').reverse().join('/')}` : `ล่าสุด: ${sub.report_date.split('-').reverse().join('/')}`}
                        </span>
                      )}
                    </div>

                    {/* Real Metrics Grid with Real-time Alert Styling */}
                    {sub && Object.keys(sub.metrics).length > 0 ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        {Object.entries(sub.metrics).map(([key, val], idx) => {
                          const status = getMetricStatus(selectedZone.id, key, val);
                          return (
                            <div key={idx} className={`p-3 rounded-2xl border text-center transition-all ${status.cardBg}`}>
                              <span className="text-[11px] font-bold text-slate-500 block uppercase truncate" title={key}>
                                {key.replace(/_/g, ' ')}
                              </span>
                              <div className={`text-base sm:text-lg font-black mt-0.5 tracking-tight ${status.textClass}`}>
                                {val}
                              </div>
                              {status.badge && (
                                <span className={`inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${status.badge.color}`}>
                                  {status.badge.label}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                        <p className="text-xs font-bold text-slate-600">ยังไม่มีข้อมูลการตรวจวัดในวันที่เลือก</p>
                        <p className="text-[11px] text-slate-400 font-medium">ข้อมูลจริงจะแสดงเมื่อมีการบันทึกผ่านระบบ</p>
                      </div>
                    )}

                    {/* Enlarged Real Photos Preview */}
                    {photos.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 text-sky-900">
                            <ImageIcon className="w-4 h-4 text-sky-600" />
                            <span>รูปถ่ายหน้างาน ({photos.length} รูป - คลิกดูรูปใหญ่):</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">บันทึกโดย: {sub?.reporter_name}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {photos.map((photoUrl, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setSelectedFullPhoto(photoUrl)}
                              className="rounded-2xl overflow-hidden border border-slate-200 cursor-pointer hover:border-sky-500 hover:shadow-lg transition-all h-36 bg-slate-900 relative group"
                            >
                              <img
                                src={photoUrl}
                                alt={`Photo ${pIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <span className="text-xs font-black text-white bg-sky-600 px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                                  🔍 ดูรูปขนาดใหญ่
                                </span>
                              </div>
                              <span className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md backdrop-blur-xs">
                                #{pIdx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remarks if any */}
                    {sub?.remarks && (
                      <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200 text-xs text-sky-950 font-medium">
                        <strong>หมายเหตุ:</strong> {sub.remarks}
                      </div>
                    )}

                    {/* Quick Button to Enter Data */}
                    {onNavigateToPondEntry && (
                      <div className="pt-2">
                        <button
                          onClick={() => onNavigateToPondEntry(selectedZone.id)}
                          className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>+ บันทึกข้อมูลบ่อนี้ ({selectedZone.name.split('(')[0]})</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
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
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
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
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 text-sky-900">
                        <ImageIcon className="w-4 h-4 text-sky-600" />
                        <span>รูปถ่ายหน้างาน ({photos.length} รูป - คลิกดูรูปใหญ่):</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">บันทึกโดย: {sub.reporter_name}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1 rounded-2xl">
                      {photos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setSelectedFullPhoto(photoUrl)}
                          className="rounded-2xl overflow-hidden border border-slate-200 relative group cursor-pointer hover:border-sky-500 hover:shadow-xl transition-all h-40 bg-slate-900"
                        >
                          <img
                            src={photoUrl}
                            alt={`Photo ${pIdx + 1} of ${activeModalZone.name}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 block"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-xs font-black text-white bg-sky-600 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                              🔍 คลิกดูขยายเต็มจอ
                            </span>
                          </div>
                          <span className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md backdrop-blur-xs">
                            #{pIdx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Key Metrics Grid (Purely Real Data with Alert Styling) */}
              <div className="pt-2 space-y-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  พารามิเตอร์ตรวจวัดล่าสุด:
                </span>
                {sub && Object.keys(sub.metrics).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(sub.metrics).map(([key, val], idx) => {
                      const status = getMetricStatus(activeModalZone.id, key, val);
                      return (
                        <div key={idx} className={`p-3.5 rounded-2xl border text-center transition-all ${status.cardBg}`}>
                          <span className="text-[11px] font-bold text-slate-500 block uppercase truncate" title={key}>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <div className={`text-lg sm:text-xl font-black mt-0.5 tracking-tight ${status.textClass}`}>
                            {val}
                          </div>
                          {status.badge && (
                            <span className={`inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${status.badge.color}`}>
                              {status.badge.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
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
