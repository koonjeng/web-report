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
} from 'lucide-react';

interface ZoneMarker {
  id: string;
  name: string;
  category: string;
  color: string;
  borderColor: string;
  bgLight: string;
  description: string;
  details: string[];
}

const ZONES: ZoneMarker[] = [
  {
    id: 'z1',
    name: 'บ่อหมักก๊าซชีวภาพหลัก (Anaerobic Biogas Digester)',
    category: 'Biogas & WWT',
    color: '#38bdf8', // Sky / Cyan (white-purple outlines)
    borderColor: 'border-sky-400',
    bgLight: 'bg-sky-50 text-sky-900',
    description: 'ระบบย่อยสลายน้ำเสียแบบไม่ใช้อากาศ เพื่อผลิตก๊าซชีวภาพ (Methane)',
    details: ['Flow Feed Mix2', 'Biogas Generate', '% CH4 / % H2S Monitoring'],
  },
  {
    id: 'z2',
    name: 'ระบบบำบัดน้ำเสียแบบเติมอากาศ (Aeration Tank - AS System)',
    category: 'Wastewater Treatment',
    color: '#ef4444', // Red border zone
    borderColor: 'border-rose-500',
    bgLight: 'bg-rose-50 text-rose-900',
    description: 'บ่อเติมอากาศบำบัดน้ำเสีย (Air Blower System)',
    details: ['COD Loading (Kg/day)', 'Air Blower Status', 'DO & pH Monitoring'],
  },
  {
    id: 'z3',
    name: 'บ่อพักน้ำเสียดิบ (Raw Wastewater Equalization Pond)',
    category: 'Wastewater',
    color: '#f97316', // Orange border zone
    borderColor: 'border-orange-500',
    bgLight: 'bg-orange-50 text-orange-900',
    description: 'บ่อพักและปรับสภาพน้ำเสียก่อนเข้าสู่ระบบบำบัด',
    details: ['COD Native', 'CODt Mix1', 'VFA Mix1'],
  },
  {
    id: 'z4',
    name: 'บ่อตกตะกอน & ขจัดตะกอน (Sludge Settling & Removal Pond)',
    category: 'Sludge Removal',
    color: '#eab308', // Yellow border zone
    borderColor: 'border-amber-500',
    bgLight: 'bg-amber-50 text-amber-900',
    description: 'โซนแยกตะกอนและขนถ่ายตะกอน (Sludge Removal)',
    details: ['Sludge Removal (Ton)', 'Sludge Trips (เที่ยว)', 'Sludge Cost (บาท)'],
  },
  {
    id: 'z5',
    name: 'บ่อปรับสภาพ & บ่อกักเก็บน้ำบำบัดแล้ว (Polishing & Storage Pond)',
    category: 'Effluent Storage',
    color: '#a855f7', // Purple border zone
    borderColor: 'border-purple-500',
    bgLight: 'bg-purple-50 text-purple-900',
    description: 'บ่อกักเก็บน้ำทิ้งผ่านการบำบัดแล้วเพื่อหมุนเวียน/ตรวจสอบคุณภาพ',
    details: ['COD eff AS (mg/l)', 'SV60 eff Biogas', 'Removal Efficiency (%)'],
  },
  {
    id: 'z6',
    name: 'อาคารควบคุม & เครื่องจักรหลัก (Control House & Machinery)',
    category: 'Operations',
    color: '#10b981', // Green border zone
    borderColor: 'border-emerald-500',
    bgLight: 'bg-emerald-50 text-emerald-900',
    description: 'ศูนย์ควบคุมระบบ Utility, ปั๊มน้ำ, Gas Blower และเครื่องจักร',
    details: ['Gas Blower Status', 'PEA Meter Reading', 'Solar Meter Status'],
  },
];

export const OverviewView: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<ZoneMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] font-sans text-slate-800 pb-24">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Map className="w-6 h-6 text-sky-600" />
            <span>ภาพรวมพื้นที่ระบบผังโรงงาน (Plant System Overview)</span>
            <span className="text-xs bg-sky-100 text-sky-800 font-extrabold px-3 py-1 rounded-full border border-sky-200">
              แผนผังระบบบำบัด & Utility
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            แผนผังภาพถ่ายทางอากาศแสดงโซนบ่อบำบัดน้ำเสีย ระบบก๊าซชีวภาพ และอาคารปฏิบัติการ TDC Utility
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

      {/* Main Container: Map View & Legend Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Res Aerial Map Image with Interactive Overlay */}
        <div className={`lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4 bg-slate-950/95 overflow-y-auto' : ''
        }`}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-xs tracking-wide uppercase">
                ผังผิวน้ำ & โซนปฏิบัติการ (Aerial View Mapping)
              </span>
            </div>
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative overflow-hidden bg-slate-900 flex items-center justify-center p-2 group min-h-[400px]">
            <img
              src="/overview_map.jpg"
              alt="TDC Utility Plant Aerial Overview"
              className="w-full h-auto max-h-[750px] object-contain rounded-xl shadow-lg border border-slate-800 transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>

          <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-400" />
              ภาพถ่ายผังรวมบ่อบำบัดน้ำเสีย ระบบก๊าซชีวภาพ และโซนเติมอากาศ TDC Utility
            </span>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
              อัปเดตล่าสุดภาพถ่ายพื้นที่จริง
            </span>
          </div>
        </div>

        {/* Right Col: Zone Cards & Details Information Panel */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>คำอธิบายโซนและบ่อบำบัด (Zone Details)</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              คลิกเลือกโซนที่ต้องการตรวจสอบรายละเอียดข้อมูลการทำงาน
            </p>

            <div className="space-y-2.5 pt-2">
              {ZONES.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(selectedZone?.id === zone.id ? null : zone)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedZone?.id === zone.id
                      ? `${zone.borderColor} ${zone.bgLight} ring-2 ring-sky-400/20 shadow-md`
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-700 uppercase">
                      {zone.category}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 tracking-tight leading-snug">
                    {zone.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {zone.description}
                  </p>

                  {/* Expand Details if selected */}
                  {selectedZone?.id === zone.id && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1.5 animate-fadeIn">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        พารามิเตอร์และตัววัดหลัก:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {zone.details.map((d, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-800 shadow-2xs"
                          >
                            ✓ {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
