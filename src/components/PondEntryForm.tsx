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
  fields: {
    key: string;
    label: string;
    unit: string;
    placeholder: string;
    defaultValue?: string;
    threshold?: {
      type: 'range' | 'max_warning_alert';
      min?: number;
      max?: number;
      warnMax?: number;
      alertMax?: number;
      hint?: string;
    };
  }[];
}

export const POND_DEFINITIONS: PondDefinition[] = [
  {
    id: 'mix-1',
    name: 'Mix 1 (บ่อผสมและปรับสภาพ 1)',
    category: 'Mix 1',
    color: '#3f6593',
    type: 'treatment',
    fields: [
      { key: 'flow', label: 'Flow', unit: 'm³/h', placeholder: 'e.g. 120' },
      {
        key: 'ph',
        label: 'pH',
        unit: '',
        placeholder: '3.0 - 4.0',
        threshold: {
          type: 'range',
          min: 3.0,
          max: 4.0,
          hint: 'ค่าสีเขียวช่วง 3.0 - 4.0 (นอกช่วงนี้เป็นสีแดง)',
        },
      },
    ],
  },
  {
    id: 'mix-2',
    name: 'Mix 2 (บ่อผสมและปรับสภาพ 2)',
    category: 'Mix 2',
    color: '#3f6593',
    type: 'treatment',
    fields: [
      { key: 'flow', label: 'Flow', unit: 'm³/h', placeholder: 'e.g. 115' },
      {
        key: 'ph',
        label: 'pH',
        unit: '',
        placeholder: '6.0 - 7.0',
        threshold: {
          type: 'range',
          min: 6.0,
          max: 7.0,
          hint: 'ค่าสีเขียวช่วง 6.0 - 7.0 (นอกช่วงนี้เป็นสีแดง)',
        },
      },
    ],
  },
  {
    id: 'scrubber',
    name: 'Scrubber (จุดสครับก๊าซ / ดัก H2S)',
    category: 'Scrubber',
    color: '#3f6593',
    type: 'control',
    fields: [
      { key: 'h2s_pct', label: '%H2S', unit: '%', placeholder: 'e.g. 0.05' },
      { key: 'ch4_pct', label: '%CH4', unit: '%', placeholder: 'e.g. 65' },
    ],
  },
  {
    id: 'biogas-1',
    name: 'Biogas 1 (บ่อหมักก๊าซชีวภาพ 1)',
    category: 'Biogas 1',
    color: '#3f6593',
    type: 'biogas',
    fields: [
      { key: 'sv60', label: 'SV60', unit: 'mg/L', placeholder: 'e.g. 15' },
    ],
  },
  {
    id: 'biogas-2',
    name: 'Biogas 2 (บ่อหมักก๊าซชีวภาพ 2)',
    category: 'Biogas 2',
    color: '#3f6593',
    type: 'biogas',
    fields: [
      {
        key: 'sv60',
        label: 'SV60',
        unit: 'mg/L',
        placeholder: 'e.g. 8',
        threshold: {
          type: 'max_warning_alert',
          warnMax: 10,
          alertMax: 50,
          hint: 'เกิน 10 สีส้ม, เกิน 50 สีแดง',
        },
      },
      { key: 'gas_amount_pct', label: 'ปริมาณแก๊ส', unit: '%', placeholder: 'e.g. 75' },
    ],
  },
  {
    id: 'ss',
    name: 'SS (บ่อตกตะกอนแขวนลอย)',
    category: 'SS',
    color: '#3f6593',
    type: 'treatment',
    fields: [
      { key: 'sv30', label: 'SV30', unit: '', placeholder: 'e.g. 45' },
    ],
  },
  {
    id: 'as',
    name: 'AS (บ่อเติมอากาศ Activated Sludge)',
    category: 'AS',
    color: '#3f6593',
    type: 'treatment',
    fields: [
      { key: 'water_color', label: 'สีน้ำ', unit: '', placeholder: 'e.g. น้ำตาลเข้ม / ดำ' },
      { key: 'water_volume', label: 'ปริมาณน้ำ', unit: 'm³', placeholder: 'e.g. 2400' },
      { key: 'cod', label: 'COD', unit: 'mg/L', placeholder: 'e.g. 180' },
    ],
  },
  {
    id: 'clarify',
    name: 'Clarify (รางแยก & บ่อตกตะกอน)',
    category: 'Clarify',
    color: '#3f6593',
    type: 'treatment',
    fields: [
      { key: 'water_volume', label: 'ปริมาณน้ำ', unit: 'm³', placeholder: 'e.g. 1800' },
      { key: 'cod', label: 'COD', unit: 'mg/L', placeholder: 'e.g. 120' },
    ],
  },
  {
    id: 'aeration',
    name: 'Aeration (บ่อปรับสภาพ & เติมอากาศดิบ)',
    category: 'Aeration',
    color: '#3f6593',
    type: 'treatment',
    fields: [
      { key: 'water_volume', label: 'ปริมาณน้ำ', unit: 'm³', placeholder: 'e.g. 3200' },
      { key: 'cod', label: 'COD', unit: 'mg/L', placeholder: 'e.g. 12000' },
    ],
  },
  {
    id: 'polishing-1',
    name: 'Polishing 1 (บ่อกักเก็บน้ำทิ้งบำบัดแล้ว 1)',
    category: 'Polishing 1',
    color: '#3f6593',
    type: 'treatment',
    fields: [
      { key: 'cod', label: 'COD', unit: 'mg/L', placeholder: 'e.g. 85' },
    ],
  },
  {
    id: 'polishing-2',
    name: 'Polishing 2 (บ่อกักเก็บน้ำทิ้งบำบัดแล้ว 2)',
    category: 'Polishing 2',
    color: '#3f6593',
    type: 'treatment',
    fields: [
      { key: 'cod', label: 'COD', unit: 'mg/L', placeholder: 'e.g. 45' },
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

  // Multiple Image Upload & Compression States
  const [imagesList, setImagesList] = useState<{ id: string; base64: string; sizeKb: number }[]>([]);

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

  // Handle File Select & Client-side Compression for Multiple Images
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);

    try {
      const newCompressedImages: { id: string; base64: string; sizeKb: number }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Compress image to max 1200x1200 with 0.75 quality (~150-300 KB)
        const compressed = await compressImage(file, 1200, 1200, 0.75);

        // Calculate compressed size in KB
        const stringLength = compressed.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896;
        const sizeKb = Math.round(sizeInBytes / 1024);

        newCompressedImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          base64: compressed,
          sizeKb,
        });
      }

      setImagesList((prev) => [...prev, ...newCompressedImages]);
    } catch (err) {
      console.error('Compression failed:', err);
      triggerNotify('error', 'เกิดข้อผิดพลาดในการบีบอัดรูปภาพ');
    } finally {
      setIsCompressing(false);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRemoveSingleImage = (idToRemove: string) => {
    setImagesList((prev) => prev.filter((img) => img.id !== idToRemove));
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

    const imageUrlsArray = imagesList.map((img) => img.base64);

    // If user has no role (Guest / พนักงานทั่วไป), status is 'pending'. If Admin/Approver, status is 'approved'.
    const isGuest = !currentUser || !currentUser.role || (currentUser.role !== 'admin' && currentUser.role !== 'approver');
    const submissionStatus = isGuest ? 'pending' : 'approved';

    const res = await savePondSubmission({
      pond_id: activePond.id,
      pond_name: activePond.name,
      report_date: reportDate,
      report_time: reportTime,
      reporter_name: reporterName,
      status: submissionStatus,
      image_url: imageUrlsArray[0] || null,
      image_urls: imageUrlsArray,
      remarks,
      metrics: formattedMetrics,
    });

    setSubmitting(false);

    if (res.success) {
      const msg = isGuest
        ? `บันทึกข้อมูล ${activePond.name} เรียบร้อยแล้ว (ส่งเข้า Pending เพื่อรอหัวหน้าอนุมัติ)`
        : `บันทึกข้อมูล ${activePond.name} สำเร็จเรียบร้อยแล้ว!`;
      triggerNotify('success', msg);
      setMetrics({});
      setRemarks('');
      setImagesList([]);
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
              <label className="block text-xs font-bold text-slate-700">วันที่ตรวจวัด (Date: dd/mm/yyyy)</label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-sky-600 absolute left-3 pointer-events-none z-10" />
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  style={{ color: 'transparent', caretColor: 'transparent' }}
                />
                <span className="absolute left-9 pointer-events-none text-xs font-black text-slate-900">
                  {reportDate ? reportDate.split('-').reverse().join('/') : 'dd/mm/yyyy'}
                </span>
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
            {activePond.fields.map((f) => {
              const valStr = metrics[f.key] || '';
              const valNum = parseFloat(valStr);
              let statusColor = 'border-slate-300 focus:border-sky-500 text-slate-900';
              let badgeText = '';
              let badgeColor = '';

              if (f.threshold && !isNaN(valNum) && valStr.trim() !== '') {
                if (f.threshold.type === 'range') {
                  const inRange = valNum >= (f.threshold.min ?? 0) && valNum <= (f.threshold.max ?? 14);
                  if (inRange) {
                    statusColor = 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-400/30';
                    badgeText = `✓ ในเกณฑ์ (${f.threshold.min} - ${f.threshold.max})`;
                    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  } else {
                    statusColor = 'border-rose-500 bg-rose-50/60 text-rose-950 ring-2 ring-rose-400/30';
                    badgeText = `⚠ นอกเกณฑ์ (${f.threshold.min} - ${f.threshold.max})`;
                    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
                  }
                } else if (f.threshold.type === 'max_warning_alert') {
                  if (valNum > (f.threshold.alertMax ?? 50)) {
                    statusColor = 'border-rose-500 bg-rose-50/60 text-rose-950 ring-2 ring-rose-400/30';
                    badgeText = `🔴 สูงผิดปกติ (> ${f.threshold.alertMax})`;
                    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
                  } else if (valNum > (f.threshold.warnMax ?? 10)) {
                    statusColor = 'border-amber-500 bg-amber-50/60 text-amber-950 ring-2 ring-amber-400/30';
                    badgeText = `🟠 เฝ้าระวัง (> ${f.threshold.warnMax})`;
                    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                  } else {
                    statusColor = 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-400/30';
                    badgeText = `🟢 ปกติ (≤ ${f.threshold.warnMax})`;
                    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  }
                }
              }

              return (
                <div key={f.key} className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      {f.label} {f.unit && <span className="text-slate-400 font-semibold">({f.unit})</span>}
                    </label>
                    {badgeText && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {badgeText}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={valStr}
                    onChange={(e) => handleMetricChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-black focus:outline-none transition-all ${statusColor}`}
                  />
                  {f.threshold?.hint && (
                    <span className="text-[10px] text-slate-400 font-medium block pt-0.5">
                      💡 {f.threshold.hint}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Multiple Photo Upload with Canvas Auto-Compression */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-600" />
              <span>3. แนบรูปถ่ายหน้างาน (อัปโหลดได้หลายรูป)</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              ⚡ บีบอัดอัตโนมัติ (~150-300 KB/รูป)
            </span>
          </div>

          {/* Upload Drop Zone / Add More Button */}
          <label className="border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
              {isCompressing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            </div>
            <span className="text-xs font-bold text-slate-700">
              {isCompressing
                ? 'กำลังบีบอัดรูปภาพ...'
                : imagesList.length > 0
                ? '+ คลิกเพื่อแนบรูปเพิ่ม (เลือกได้หลายรูป)'
                : 'คลิกเพื่อเลือกรูปถ่าย หรือถ่ายรูปจากมือถือ (เลือกได้มากกว่า 1 รูป)'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">รองรับไฟล์ JPG, PNG, WEBP</span>
            <input type="file" accept="image/*" multiple capture="environment" onChange={handleImageChange} className="hidden" />
          </label>

          {/* Images Thumbnails Grid with Individual X Deletion */}
          {imagesList.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>รูปภาพที่เลือกไว้ ({imagesList.length} รูป):</span>
                <button
                  type="button"
                  onClick={() => setImagesList([])}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบทั้งหมด</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imagesList.map((imgItem, idx) => (
                  <div
                    key={imgItem.id}
                    className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-sm"
                  >
                    <img
                      src={imgItem.base64}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-32 object-cover block"
                    />
                    {/* Individual X Deletion Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSingleImage(imgItem.id)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center shadow-lg transition-all cursor-pointer border border-white/40"
                      title="กด ✕ เพื่อลบรูปนี้"
                    >
                      ✕
                    </button>

                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-xs px-2 py-1 flex items-center justify-between text-[10px] text-slate-300 font-bold">
                      <span>รูปที่ {idx + 1}</span>
                      <span className="text-emerald-400 font-extrabold">{imgItem.sizeKb} KB</span>
                    </div>
                  </div>
                ))}
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
