'use client';

import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Calendar,
  Clock,
  User,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  FileText,
  Trash2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserRole, PondSubmission } from '@/lib/types';
import { savePondSubmission, compressImage, fetchPondSubmissions } from '@/lib/supabase';

interface PondEntryFormProps {
  currentUser?: { email: string; role: UserRole } | null;
  initialPondId?: string;
  onSuccess?: () => void;
}

export interface PondDefinition {
  id: string;
  name: string;
  category: string;
  color: string;
  type: 'biogas' | 'treatment' | 'control';
  fields: { key: string; label: string; unit: string; placeholder: string; defaultValue?: string }[];
}

export const POND_DEFINITIONS: PondDefinition[] = [
  {
    id: 'polishing-1',
    name: 'Polishing 1 (บ่อขัดสภาพ 1)',
    category: 'Polishing 1',
    color: '#a855f7',
    type: 'treatment',
    fields: [
      { key: 'cod_out', label: 'COD ออก', unit: 'mg/L', placeholder: 'e.g. 150' },
      { key: 'ph', label: 'ค่า pH', unit: '', placeholder: 'e.g. 7.2' },
      { key: 'do', label: 'ค่า DO', unit: 'mg/L', placeholder: 'e.g. 2.0' },
      { key: 'temp', label: 'อุณหภูมิน้ำ', unit: '°C', placeholder: 'e.g. 32' },
    ],
  },
  {
    id: 'polishing-2',
    name: 'Polishing 2 (บ่อขัดสภาพ 2 / จุดระบาย)',
    category: 'Polishing 2',
    color: '#22c55e',
    type: 'treatment',
    fields: [
      { key: 'cod_effluent', label: 'COD น้ำทิ้งจุดระบาย', unit: 'mg/L', placeholder: 'มาตรฐาน ≤ 120' },
      { key: 'ph', label: 'ค่า pH', unit: '', placeholder: 'e.g. 7.5' },
      { key: 'do', label: 'ค่า DO', unit: 'mg/L', placeholder: 'e.g. 3.5' },
      { key: 'tss', label: 'ค่า TSS', unit: 'mg/L', placeholder: 'e.g. 30' },
    ],
  },
  {
    id: 'biogas-1',
    name: 'Biogas 1 (บ่อคลุมผ้า 1)',
    category: 'Biogas 1',
    color: '#3b82f6',
    type: 'biogas',
    fields: [
      { key: 'biogas_flow', label: 'Biogas Generation', unit: 'm³/วัน', placeholder: 'e.g. 12000' },
      { key: 'ch4_pct', label: 'เปอร์เซ็นต์ CH4', unit: '%', placeholder: 'e.g. 62' },
      { key: 'h2s_ppm', label: 'ก๊าซ H2S', unit: 'ppm', placeholder: 'e.g. 1500' },
      { key: 'pressure', label: 'แรงดันก๊าซ', unit: 'mbar', placeholder: 'e.g. 15' },
    ],
  },
  {
    id: 'biogas-2',
    name: 'Biogas 2 (บ่อคลุมผ้า 2)',
    category: 'Biogas 2',
    color: '#06b6d4',
    type: 'biogas',
    fields: [
      { key: 'biogas_flow', label: 'Biogas Generation', unit: 'm³/วัน', placeholder: 'e.g. 14500' },
      { key: 'ch4_pct', label: 'เปอร์เซ็นต์ CH4', unit: '%', placeholder: 'e.g. 64' },
      { key: 'h2s_ppm', label: 'ก๊าซ H2S', unit: 'ppm', placeholder: 'e.g. 1200' },
      { key: 'pressure', label: 'แรงดันก๊าซ', unit: 'mbar', placeholder: 'e.g. 18' },
    ],
  },
  {
    id: 'aeration',
    name: 'Aeration (บ่อเติมอากาศหลัก)',
    category: 'Aeration',
    color: '#f97316',
    type: 'treatment',
    fields: [
      { key: 'do', label: 'ค่า DO', unit: 'mg/L', placeholder: 'e.g. 2.5' },
      { key: 'ph', label: 'ค่า pH', unit: '', placeholder: 'e.g. 7.1' },
      { key: 'sv60', label: 'ค่า SV60', unit: '%', placeholder: 'e.g. 45' },
      { key: 'mlss', label: 'ค่า MLSS', unit: 'mg/L', placeholder: 'e.g. 3500' },
    ],
  },
  {
    id: 'as',
    name: 'AS (ถังเติมอากาศ Activated Sludge)',
    category: 'AS',
    color: '#ef4444',
    type: 'treatment',
    fields: [
      { key: 'cod_eff_as', label: 'COD ออกถัง AS', unit: 'mg/L', placeholder: 'e.g. 220' },
      { key: 'do', label: 'ค่า DO', unit: 'mg/L', placeholder: 'e.g. 3.0' },
      { key: 'sv60', label: 'ค่า SV60', unit: '%', placeholder: 'e.g. 50' },
      { key: 'ph', label: 'ค่า pH', unit: '', placeholder: 'e.g. 7.3' },
    ],
  },
  {
    id: 'clarify',
    name: 'Clarify (บ่อตกตะกอน Clarifier)',
    category: 'Clarify',
    color: '#0284c7',
    type: 'treatment',
    fields: [
      { key: 'clarity_depth', label: 'ความใสผิวน้ำ', unit: 'cm', placeholder: 'e.g. 80' },
      { key: 'sludge_blanket', label: 'ชั้นความหนาตะกอน', unit: 'm', placeholder: 'e.g. 1.2' },
      { key: 'ph', label: 'ค่า pH', unit: '', placeholder: 'e.g. 7.4' },
    ],
  },
  {
    id: 'ss',
    name: 'SS (บ่อพักตกตะกอน)',
    category: 'SS',
    color: '#ec4899',
    type: 'treatment',
    fields: [
      { key: 'tss', label: 'ปริมาณตะกอนแขวนลอย (TSS)', unit: 'mg/L', placeholder: 'e.g. 85' },
      { key: 'ph', label: 'ค่า pH', unit: '', placeholder: 'e.g. 7.3' },
    ],
  },
  {
    id: 'mix-2',
    name: 'Mix 2 (บ่อปรับสภาพน้ำเข้าระบบ 2)',
    category: 'Mix 2',
    color: '#10b981',
    type: 'treatment',
    fields: [
      { key: 'inflow_rate', label: 'น้ำเข้าระบบ Inflow', unit: 'm³/วัน', placeholder: 'e.g. 3500' },
      { key: 'cod_in', label: 'COD น้ำเข้า (Native)', unit: 'mg/L', placeholder: 'e.g. 18000' },
      { key: 'vfa', label: 'ค่า VFA', unit: 'mg/L', placeholder: 'e.g. 2500' },
      { key: 'ph', label: 'ค่า pH', unit: '', placeholder: 'e.g. 5.8' },
    ],
  },
  {
    id: 'scrubber-mw2',
    name: 'Scrubber / MW 2 (จุดสครับก๊าซและควบคุม)',
    category: 'Scrubber / MW 2',
    color: '#6366f1',
    type: 'control',
    fields: [
      { key: 'h2s_after_scrub', label: 'H2S หลังสครับ', unit: 'ppm', placeholder: 'e.g. 50' },
      { key: 'temp', label: 'อุณหภูมิก๊าซ', unit: '°C', placeholder: 'e.g. 38' },
      { key: 'motor_current', label: 'กระแสมอเตอร์ปั๊ม', unit: 'A', placeholder: 'e.g. 14.5' },
    ],
  },
];

export const PondEntryForm: React.FC<PondEntryFormProps> = ({
  currentUser,
  initialPondId,
  onSuccess,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeNowStr = new Date().toTimeString().slice(0, 5);

  const [selectedPondId, setSelectedPondId] = useState<string>(initialPondId || POND_DEFINITIONS[0].id);
  const [reportDate, setReportDate] = useState<string>(todayStr);
  const [reportTime, setReportTime] = useState<string>(timeNowStr);
  const [reporterName, setReporterName] = useState<string>(currentUser?.email?.split('@')[0] || 'ผู้ตรวจวัดหน้างาน');
  const [remarks, setRemarks] = useState<string>('');

  // Dynamic Metrics State
  const [metrics, setMetrics] = useState<Record<string, string>>({});

  // Image Upload & Compression States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedBase64, setCompressedBase64] = useState<string | null>(null);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active Pond Definition Object
  const activePond = POND_DEFINITIONS.find((p) => p.id === selectedPondId) || POND_DEFINITIONS[0];

  useEffect(() => {
    if (initialPondId) {
      setSelectedPondId(initialPondId);
    }
  }, [initialPondId]);

  const triggerNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle File Select & Client-side Compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setImageFile(file);

    try {
      // Compress image to max 1200x1200 with 0.75 quality (~150-300 KB)
      const compressed = await compressImage(file, 1200, 1200, 0.75);
      setCompressedBase64(compressed);
      setImagePreview(compressed);

      // Calculate compressed size in KB
      const stringLength = compressed.length - 'data:image/jpeg;base64,'.length;
      const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896;
      setImageSizeKb(Math.round(sizeInBytes / 1024));
    } catch (err) {
      console.error('Compression failed:', err);
      triggerNotify('error', 'เกิดข้อผิดพลาดในการบีบอัดรูปภาพ');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCompressedBase64(null);
    setImageSizeKb(null);
  };

  const handleMetricChange = (key: string, val: string) => {
    setMetrics((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPondId || !reportDate || !reportTime) {
      triggerNotify('error', 'กรุณากรอกข้อมูลวันที่และบ่อบำบัดให้ครบถ้วน');
      return;
    }

    setSubmitting(true);

    // Convert metrics string values to numbers where possible
    const formattedMetrics: Record<string, number | string> = {};
    activePond.fields.forEach((f) => {
      const rawVal = metrics[f.key];
      if (rawVal !== undefined && rawVal !== '') {
        const num = Number(rawVal);
        formattedMetrics[f.key] = isNaN(num) ? rawVal : num;
      }
    });

    const res = await savePondSubmission({
      pond_id: activePond.id,
      pond_name: activePond.name,
      report_date: reportDate,
      report_time: reportTime,
      reporter_name: reporterName,
      image_url: compressedBase64,
      remarks,
      metrics: formattedMetrics,
    });

    setSubmitting(false);

    if (res.success) {
      triggerNotify('success', `บันทึกข้อมูล ${activePond.category} สำเร็จเรียบร้อยแล้ว!`);
      setMetrics({});
      setRemarks('');
      handleRemoveImage();
      if (onSuccess) onSuccess();
    } else {
      triggerNotify('error', res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border shadow-lg flex items-center gap-3 font-bold text-xs animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
              : 'bg-rose-950 text-rose-200 border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Box */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center font-black">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">ลงข้อมูลบ่อบำบัดน้ำเสีย (Wastewater Pond Entry)</h2>
            <p className="text-xs text-sky-300/80 mt-0.5">
              บันทึกค่าพารามิเตอร์รายวัน/รายชั่วโมง อิงจากผังผิวน้ำ Overview พร้อมแนบรูปถ่ายหน้างาน
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-300">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>ระบบบีบอัดรูปภาพอัตโนมัติ</span>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* Section 1: Target Pond & Date Selection */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>1. เลือกบ่อบำบัดและกำหนดวันเวลาที่ตรวจวัด</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Select Pond */}
            <div className="sm:col-span-1 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">เลือกบ่อบำบัด (Select Pond)</label>
              <select
                value={selectedPondId}
                onChange={(e) => {
                  setSelectedPondId(e.target.value);
                  setMetrics({});
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
              >
                {POND_DEFINITIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">วันที่ตรวจวัด (Date)</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">เวลาตรวจวัด (Time)</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={reportTime}
                  onChange={(e) => setReportTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Active Pond Specific Parameters */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>2. กรอกค่าพารามิเตอร์ — {activePond.name}</span>
            </h3>
            <span
              className="text-[11px] font-black px-3 py-1 rounded-full text-white shadow-xs"
              style={{ backgroundColor: activePond.color }}
            >
              {activePond.category}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {activePond.fields.map((f) => (
              <div key={f.key} className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700">
                  {f.label} {f.unit && <span className="text-slate-400 font-semibold">({f.unit})</span>}
                </label>
                <input
                  type="text"
                  value={metrics[f.key] || ''}
                  onChange={(e) => handleMetricChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Photo Upload with Canvas Auto-Compression */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-600" />
              <span>3. แนบรูปถ่ายหน้างาน (Photo Attachment)</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              ⚡ บีบอัดอัตโนมัติ (~150-300 KB)
            </span>
          </div>

          {!imagePreview ? (
            <label className="border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                {isCompressing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <span className="text-xs font-bold text-slate-700">
                {isCompressing ? 'กำลังบีบอัดรูปภาพ...' : 'คลิกเพื่อเลือกรูปถ่าย หรือถ่ายรูปจากมือถือ'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">รองรับไฟล์ JPG, PNG, WEBP</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
            </label>
          ) : (
            <div className="relative inline-block border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 p-2 space-y-2">
              <img src={imagePreview} alt="Pond Field Preview" className="max-h-56 rounded-xl object-cover block mx-auto shadow-md" />
              <div className="flex items-center justify-between px-2 text-[11px] text-slate-300 font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บีบอัดแล้วเรียบร้อย ({imageSizeKb} KB)</span>
                </span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบรูปภาพ</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Inspector & Remarks */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">ผู้ลงบันทึก (Reporter Name)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">หมายเหตุ / สภาพผิวน้ำ (Remarks)</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="เช่น ผิวน้ำปกติ, สีน้ำเขียวขุ่น, ไม่มีกลิ่น"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting || isCompressing}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>บันทึกข้อมูล {activePond.category} เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
