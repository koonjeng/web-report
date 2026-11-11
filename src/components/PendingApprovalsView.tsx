'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  BadgeCheck,
  XCircle,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Zap,
  Leaf,
  Flame,
  Eye,
  ImageIcon,
} from 'lucide-react';
import { FullMonthlyReportData, UserRole, CategorySubmission, PondSubmission } from '@/lib/types';
import { calculateMetrics, MONTH_NAMES_TH } from '@/lib/calculations';
import {
  getCategorySubmissions,
  updateCategorySubmissionStatus,
  isSupabaseConfigured,
  supabase,
  fetchPondSubmissions,
  updatePondSubmission,
  deletePondSubmission,
} from '@/lib/supabase';
import { MaintenanceHistoryRecord, MaintenanceTask } from './MaintenanceView';
import { DataEntryForm } from './DataEntryForm';

interface PendingApprovalsViewProps {
  selectedYear: number;
  reportsData: FullMonthlyReportData[];
  currentUser: { email: string; role: UserRole } | null;
  onApproveReport: (month: number) => void;
  onRejectReport: (month: number, reason: string) => void;
  onInspectReport: (month: number) => void;
}

export const PendingApprovalsView: React.FC<PendingApprovalsViewProps> = ({
  selectedYear,
  reportsData,
  currentUser,
  onApproveReport,
  onRejectReport,
  onInspectReport,
}) => {
  const [categorySubmissions, setCategorySubmissions] = useState<CategorySubmission[]>([]);
  const [pondSubmissions, setPondSubmissions] = useState<PondSubmission[]>([]);
  const [maintRecords, setMaintRecords] = useState<MaintenanceHistoryRecord[]>([]);

  // Multi-selection states
  const [selectedPondIds, setSelectedPondIds] = useState<string[]>([]);
  const [selectedMaintIds, setSelectedMaintIds] = useState<string[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  const loadAllPondSubs = async () => {
    const data = await fetchPondSubmissions();
    setPondSubmissions(data);
  };

  const loadAllSubs = async () => {
    const gregorianYear = selectedYear > 2500 ? selectedYear - 543 : selectedYear;
    const buddhistYear = selectedYear > 2500 ? selectedYear : selectedYear + 543;
    
    const subsCurrent = await getCategorySubmissions(selectedYear);
    const subsGregorian = await getCategorySubmissions(gregorianYear);
    const subsBuddhist = await getCategorySubmissions(buddhistYear);

    // Merge unique by id
    const map = new Map<string, CategorySubmission>();
    [...subsCurrent, ...subsGregorian, ...subsBuddhist].forEach((s) => map.set(s.id, s));
    setCategorySubmissions(Array.from(map.values()));
  };

  const loadPMHistory = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('maintenance_history').select('*').order('created_at', { ascending: false });
      if (data) {
        setMaintRecords(
          data.map((h: any) => ({
            id: h.id,
            taskId: h.task_id,
            equipment: h.equipment,
            taskName: h.task_name,
            doneDate: h.done_date,
            reporterName: h.reporter_name,
            status: h.status,
            submittedAt: h.submitted_at || h.created_at,
          }))
        );
        return;
      }
    }
    try {
      const saved = localStorage.getItem('tdc_maintenance_history');
      if (saved) setMaintRecords(JSON.parse(saved));
    } catch {}
  };

  const refreshAllData = async () => {
    await Promise.all([loadAllPondSubs(), loadAllSubs(), loadPMHistory()]);
  };

  // Real-time polling every 6 seconds to catch new incoming pond entries
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 6000);
    return () => clearInterval(interval);
  }, [selectedYear]);

  const pendingMaintRecords = useMemo(() => {
    return maintRecords.filter((m) => m.status === 'pending');
  }, [maintRecords]);

  const pendingSubmissions = useMemo(() => {
    return categorySubmissions.filter((s) => s.status === 'pending');
  }, [categorySubmissions]);

  const pendingPondSubmissions = useMemo(() => {
    return pondSubmissions.filter((p) => p.status === 'pending');
  }, [pondSubmissions]);

  const totalPendingCount = pendingSubmissions.length + pendingMaintRecords.length + pendingPondSubmissions.length;
  const totalSelectedCount = selectedPondIds.length + selectedMaintIds.length + selectedCatIds.length;

  // Toggle Selection Helpers
  const toggleSelectAll = () => {
    if (totalSelectedCount === totalPendingCount && totalPendingCount > 0) {
      setSelectedPondIds([]);
      setSelectedMaintIds([]);
      setSelectedCatIds([]);
    } else {
      setSelectedPondIds(pendingPondSubmissions.map((p) => p.id));
      setSelectedMaintIds(pendingMaintRecords.map((m) => m.id));
      setSelectedCatIds(pendingSubmissions.map((s) => s.id));
    }
  };

  const toggleSelectPond = (id: string) => {
    setSelectedPondIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectMaint = (id: string) => {
    setSelectedMaintIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectCat = (id: string) => {
    setSelectedCatIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Batch Approve All Selected
  const handleBatchApprove = async () => {
    if (totalSelectedCount === 0) return;
    setIsBatchProcessing(true);
    let approverName = currentUser?.email || 'Approver';
    if (currentUser?.email) {
      try {
        const savedName = localStorage.getItem(`tdc_user_display_name_${currentUser.email}`);
        if (savedName) approverName = savedName;
      } catch {}
    }

    try {
      // 1. Approve selected Pond Submissions
      for (const pondId of selectedPondIds) {
        await updatePondSubmission(pondId, {
          status: 'approved',
          approver_name: approverName,
        });
      }

      // 2. Approve selected Maintenance records
      for (const maintId of selectedMaintIds) {
        const record = maintRecords.find((m) => m.id === maintId);
        if (record) {
          if (isSupabaseConfigured && supabase) {
            await supabase.from('maintenance_history').update({ status: 'approved' }).eq('id', record.id);
            await supabase.from('maintenance_tasks').update({
              last_done_date: record.doneDate,
              reporter_name: record.reporterName,
              status: 'approved',
            }).eq('id', record.taskId);
          }
        }
      }

      // 3. Approve selected Category Submissions
      for (const catId of selectedCatIds) {
        const sub = categorySubmissions.find((s) => s.id === catId);
        if (sub) {
          await updateCategorySubmissionStatus(selectedYear, catId, 'approved', undefined, approverName);
          onApproveReport(sub.month);
        }
      }

      triggerNotify(`อนุมัติสำเร็จ ${totalSelectedCount} รายการเรียบร้อยแล้ว!`);
      setSelectedPondIds([]);
      setSelectedMaintIds([]);
      setSelectedCatIds([]);
      
      // Auto refresh page
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
      triggerNotify('เกิดข้อผิดพลาดในการอนุมัติชุดข้อมูล');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleApproveMaintRecord = async (record: MaintenanceHistoryRecord) => {
    // 1. Update status in history
    const updatedHistory = maintRecords.map((m) =>
      m.id === record.id ? { ...m, status: 'approved' as const } : m
    );
    setMaintRecords(updatedHistory);
    localStorage.setItem('tdc_maintenance_history', JSON.stringify(updatedHistory));

    if (isSupabaseConfigured && supabase) {
      await supabase.from('maintenance_history').update({ status: 'approved' }).eq('id', record.id);
      await supabase.from('maintenance_tasks').update({
        last_done_date: record.doneDate,
        reporter_name: record.reporterName,
        status: 'approved',
      }).eq('id', record.taskId);
    }

    triggerNotify(`อนุมัติการซ่อมบำรุง "${record.equipment}" เรียบร้อยแล้ว`);
    setTimeout(() => window.location.reload(), 800);
  };

  const handleApprovePondSubmission = async (pItem: PondSubmission) => {
    let approverName = currentUser?.email || 'Approver';
    const success = await updatePondSubmission(pItem.id, {
      status: 'approved',
      approver_name: approverName,
    });
    if (success) {
      triggerNotify(`อนุมัติข้อมูลบ่อบำบัด "${pItem.pond_name}" เรียบร้อยแล้ว!`);
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const handleRejectPondSubmission = async (pItem: PondSubmission) => {
    const success = await updatePondSubmission(pItem.id, {
      status: 'rejected',
    });
    if (success) {
      triggerNotify(`ตีกลับ/ปฏิเสธรายการ "${pItem.pond_name}" เรียบร้อยแล้ว`);
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const handleRejectMaintRecord = async (recordId: string) => {
    const updatedHistory = maintRecords.filter((m) => m.id !== recordId);
    setMaintRecords(updatedHistory);
    localStorage.setItem('tdc_maintenance_history', JSON.stringify(updatedHistory));

    if (isSupabaseConfigured && supabase) {
      await supabase.from('maintenance_history').delete().eq('id', recordId);
    }
    triggerNotify('ลบ/ตีกลับรายการซ่อมบำรุงเรียบร้อยแล้ว');
    setTimeout(() => window.location.reload(), 800);
  };

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetSubmissionId, setTargetSubmissionId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [viewModalSub, setViewModalSub] = useState<CategorySubmission | null>(null);
  const [viewModalPondSub, setViewModalPondSub] = useState<PondSubmission | null>(null);
  const [selectedFullPhoto, setSelectedFullPhoto] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenReject = (id: string) => {
    setTargetSubmissionId(id);
    setRejectReasonInput('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!targetSubmissionId) return;
    if (!rejectReasonInput.trim()) {
      alert('กรุณาระบุเหตุผลการตีกลับ');
      return;
    }
    await updateCategorySubmissionStatus(selectedYear, targetSubmissionId, 'rejected', rejectReasonInput);
    const updated = await getCategorySubmissions(selectedYear);
    setCategorySubmissions(updated);
    setRejectModalOpen(false);
    setTargetSubmissionId(null);
    triggerNotify('ตีกลับหมวดนี้เรียบร้อยแล้ว');
    setTimeout(() => window.location.reload(), 800);
  };

  const handleApproveSubmission = async (id: string, month: number) => {
    let approverName = currentUser?.email || 'Approver';
    if (currentUser?.email) {
      try {
        const savedName = localStorage.getItem(`tdc_user_display_name_${currentUser.email}`);
        if (savedName) approverName = savedName;
      } catch {}
    }

    await updateCategorySubmissionStatus(selectedYear, id, 'approved', undefined, approverName);
    const updated = await getCategorySubmissions(selectedYear);
    setCategorySubmissions(updated);
    onApproveReport(month);
    triggerNotify('อนุมัติหมวดนี้เรียบร้อยแล้ว');
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-sky-950 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-sky-600 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-sky-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* HEADER CARD & BATCH ACTIONS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">รายการรออนุมัติ (Pending Approvals)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-extrabold border border-sky-200">
                {totalPendingCount} คำขอ
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              รายการคำขออนุมัติแยกตามหมวดหมู่ประจำวัน ติ๊กเลือกเพื่ออนุมัติพร้อมกันหลายรายการได้
            </p>
          </div>
        </div>

        {totalPendingCount > 0 && (
          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={totalSelectedCount === totalPendingCount && totalPendingCount > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span>เลือกทั้งหมด ({totalPendingCount})</span>
            </label>

            {totalSelectedCount > 0 && (
              <button
                type="button"
                disabled={isBatchProcessing}
                onClick={handleBatchApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <BadgeCheck className="w-4 h-4 text-emerald-200" />
                <span>
                  {isBatchProcessing ? 'กำลังอนุมัติ...' : `อนุมัติที่เลือก (${totalSelectedCount} รายการ)`}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* PENDING SUBMISSIONS LIST */}
      {totalPendingCount === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <BadgeCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ไม่มีรายการรออนุมัติในขณะนี้</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            คำขออนุมัติทั้งหมด ได้รับการอนุมัติเรียบร้อยแล้ว
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* POND ENTRY PENDING ITEMS */}
          {pendingPondSubmissions.map((pItem) => {
            const displayD = pItem.report_date ? pItem.report_date.split('-').reverse().join('/') : '-';
            const isChecked = selectedPondIds.includes(pItem.id);

            return (
              <div
                key={pItem.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all border-l-4 ${
                  isChecked ? 'border-sky-500 ring-2 ring-sky-400/30' : 'border-slate-200 border-l-sky-500'
                }`}
              >
                <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectPond(pItem.id)}
                      className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer bg-slate-800 border-slate-600"
                    />
                    <div className="w-9 h-9 rounded-xl bg-sky-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                      POND
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                        <span>ลงข้อมูลบ่อบำบัด: {pItem.pond_name}</span>
                      </h3>
                      <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        <span>ผู้บันทึก: {pItem.reporter_name || 'พนักงานทั่วไป (ไม่มียศ)'}</span>
                        <span>•</span>
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>วันที่ตรวจวัด: {displayD} ({pItem.report_time || '00:00'} น.)</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setViewModalPondSub(pItem)}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>ดูข้อมูล & รูปถ่าย</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprovePondSubmission(pItem)}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <BadgeCheck className="w-4 h-4 text-slate-950" />
                      <span>อนุมัติข้อมูล</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectPondSubmission(pItem)}
                      className="px-3 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>ปฏิเสธ</span>
                    </button>
                  </div>
                </div>

                {/* Metrics detail preview */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  {Object.entries(pItem.metrics || {}).map(([k, v], mIdx) => (
                    <span
                      key={mIdx}
                      className="font-bold bg-white text-slate-800 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <strong className="uppercase text-slate-500">{k.replace('_', ' ')}:</strong> {v}
                    </span>
                  ))}
                  {pItem.remarks && (
                    <span className="w-full text-slate-600 font-semibold italic mt-1">
                      หมายเหตุ: {pItem.remarks}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {/* MAINTENANCE PM PENDING ITEMS */}
          {pendingMaintRecords.map((mRecord) => {
            const parts = mRecord.doneDate ? mRecord.doneDate.split('-') : [];
            const displayD = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : mRecord.doneDate;
            const isChecked = selectedMaintIds.includes(mRecord.id);

            return (
              <div
                key={mRecord.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all border-l-4 ${
                  isChecked ? 'border-cyan-500 ring-2 ring-cyan-400/30' : 'border-slate-200 border-l-cyan-500'
                }`}
              >
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectMaint(mRecord.id)}
                      className="w-5 h-5 rounded text-cyan-500 focus:ring-cyan-500 cursor-pointer bg-slate-800 border-slate-600"
                    />
                    <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                      PM
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                        <span>งานซ่อมบำรุง (PM): {mRecord.equipment}</span>
                      </h3>
                      <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>ผู้รายงาน: {mRecord.reporterName || 'ไม่ระบุชื่อ'}</span>
                        <span>•</span>
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>วันที่ปฏิบัติงาน: {displayD}</span>
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>รออนุมัติ (PM)</span>
                  </span>
                </div>

                <div className="p-5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">งานที่ปฏิบัติ:</span>
                    <p className="text-sm font-bold text-slate-800">{mRecord.taskName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRejectMaintRecord(mRecord.id)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>ปฏิเสธ</span>
                    </button>

                    <button
                      onClick={() => handleApproveMaintRecord(mRecord)}
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      <span>อนุมัติ (Approve)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {pendingSubmissions.map((sub) => {
            const dateFormatted = sub.report_date ? sub.report_date.split('-').reverse().join('/') : '-';
            const metrics = calculateMetrics(sub.data);
            const isChecked = selectedCatIds.includes(sub.id);

            return (
              <div
                key={sub.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all border-l-4 ${
                  isChecked ? 'border-sky-500 ring-2 ring-sky-400/30' : 'border-slate-200 border-l-sky-500'
                }`}
              >
                {/* CARD TOP BAR */}
                <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectCat(sub.id)}
                      className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer bg-slate-800 border-slate-600"
                    />
                    <div className="w-9 h-9 rounded-xl bg-sky-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs uppercase">
                      {sub.category_key}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <span>คำขออนุมัติ: {sub.category_name}</span>
                        <span className="text-xs font-normal text-sky-300">
                          (วันที่ {dateFormatted})
                        </span>
                      </h3>
                      <p className="text-xs text-sky-200 flex items-center gap-2 mt-0.5">
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        <span>ผู้ส่งคำขอ: {sub.reporter_name || 'ไม่ระบุชื่อ'}</span>
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-bold border border-sky-500/40 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>รออนุมัติ (Pending)</span>
                  </span>
                </div>

                {/* CATEGORY SPECIFIC METRICS DETAILS */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                  {sub.category_key === 'cat1' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">รายละเอียดขนกำจัด</span>
                        <span className="block text-sm font-bold text-slate-800 mt-0.5">{sub.data.sludge_removal_desc || '-'}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">ปริมาณตะกอน (ตัน)</span>
                        <span className="block text-lg font-black text-slate-900 mt-0.5">{sub.data.sludge_tons || 0} ตัน</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">ราคารวม (บาท)</span>
                        <span className="block text-lg font-black text-sky-700 mt-0.5">฿{metrics.sludgeGrandTotalBaht.toLocaleString('th-TH')}</span>
                      </div>
                    </div>
                  )}

                  {sub.category_key === 'cat2' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">MS1 (ตัน)</span>
                        <span className="block text-base font-bold text-slate-900 mt-0.5">{sub.data.production_ms1 || 0} ตัน</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">MS2 (ตัน)</span>
                        <span className="block text-base font-bold text-slate-900 mt-0.5">{sub.data.production_ms2 || 0} ตัน</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">MS3 (ตัน)</span>
                        <span className="block text-base font-bold text-slate-900 mt-0.5">{sub.data.production_ms3 || 0} ตัน</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">รวมผลผลิต (ตัน)</span>
                        <span className="block text-lg font-black text-sky-700 mt-0.5">{metrics.totalProductionTons.toLocaleString('th-TH')} ตัน</span>
                      </div>
                    </div>
                  )}

                  {sub.category_key === 'cat3' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">น้ำมันเตารวม (ลิตร)</span>
                        <span className="block text-lg font-black text-slate-900 mt-0.5">{metrics.fuelOilTotalLiter.toLocaleString('th-TH')} ลิตร</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">แก๊สชีวภาพรวม (Nm³)</span>
                        <span className="block text-lg font-black text-slate-900 mt-0.5">{metrics.gasTotalM3.toLocaleString('th-TH')} Nm³</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">ค่าน้ำมันเตา (บาท)</span>
                        <span className="block text-base font-bold text-sky-700 mt-0.5">฿{(sub.data.fuel_oil_a_baht || 0).toLocaleString('th-TH')}</span>
                      </div>
                    </div>
                  )}

                  {sub.category_key === 'cat4' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">ไฟฟ้า PEA (kWh)</span>
                        <span className="block text-lg font-black text-slate-900 mt-0.5">{metrics.elecTotalPeaKwh.toLocaleString('th-TH')} kWh</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">ไฟฟ้า Solar (kWh)</span>
                        <span className="block text-lg font-black text-slate-900 mt-0.5">{metrics.elecTotalSolarKwh.toLocaleString('th-TH')} kWh</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">รวมไฟฟ้าทั้งหมด (kWh)</span>
                        <span className="block text-lg font-black text-sky-700 mt-0.5">{metrics.elecGrandTotalKwh.toLocaleString('th-TH')} kWh</span>
                      </div>
                    </div>
                  )}

                  {sub.category_key === 'cat5' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="block text-[11px] font-semibold text-slate-500">WWT Native COD</span>
                          <span className="block text-base font-bold text-slate-900 mt-0.5">{sub.data.wwt_cod_native || 0}</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="block text-[11px] font-semibold text-slate-500">Biogas Flow Feed</span>
                          <span className="block text-lg font-black text-slate-900 mt-0.5">{sub.data.biogas_flow_feed_mix2 || 0}</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="block text-[11px] font-semibold text-slate-500">WWT CODT Mix1</span>
                          <span className="block text-base font-bold text-sky-700 mt-0.5">{sub.data.wwt_codt_mix1 || 0}</span>
                        </div>
                      </div>

                      {(sub.data.biogas_flow || sub.data.biogas_temp || sub.data.biogas_pressure || sub.data.biogas_air_dryer_drain || sub.data.biogas_motor_current) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Flow:</span>
                            <span className="font-bold text-emerald-400">{sub.data.biogas_flow || 0}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Temp:</span>
                            <span className="font-bold text-emerald-400">{sub.data.biogas_temp || 0} °C</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">แรงดัน:</span>
                            <span className="font-bold text-emerald-400">{sub.data.biogas_pressure || 0}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Air Dryer:</span>
                            <span className="font-bold text-emerald-400">{sub.data.biogas_air_dryer_drain || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Flare:</span>
                            <span className="font-bold text-emerald-400">{sub.data.biogas_flare || 0}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">กระแสมอเตอร์:</span>
                            <span className="font-bold text-emerald-400">{sub.data.biogas_motor_current || 0} A</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {sub.category_key === 'cat6' && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">LIME 90%</span>
                        <span className="block text-sm font-bold text-purple-700 mt-0.5">ใช้ {sub.data.chem_lime_usage || 0} ถุง</span>
                        <span className="block text-[10px] text-slate-400">คงเหลือ {sub.data.chem_lime_available || 0} ถุง</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">POLYMER</span>
                        <span className="block text-sm font-bold text-purple-700 mt-0.5">ใช้ {sub.data.chem_polymer_usage || 0} ถุง</span>
                        <span className="block text-[10px] text-slate-400">คงเหลือ {sub.data.chem_polymer_available || 0} ถุง</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">ODOR CONTROL</span>
                        <span className="block text-sm font-bold text-purple-700 mt-0.5">ใช้ {sub.data.chem_odor_usage || 0} แกลลอน</span>
                        <span className="block text-[10px] text-slate-400">คงเหลือ {sub.data.chem_odor_available || 0} แกลลอน</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">FOG CONTROL</span>
                        <span className="block text-sm font-bold text-purple-700 mt-0.5">ใช้ {sub.data.chem_fog_usage || 0} แกลลอน</span>
                        <span className="block text-[10px] text-slate-400">คงเหลือ {sub.data.chem_fog_available || 0} แกลลอน</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-semibold text-slate-500">หลอด COD</span>
                        <span className="block text-sm font-bold text-purple-700 mt-0.5">ใช้ {sub.data.chem_cod_tube_usage || 0} หลอด</span>
                        <span className="block text-[10px] text-slate-400">คงเหลือ {sub.data.chem_cod_tube_available || 0} หลอด</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION BAR */}
                <div className="px-6 py-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => setViewModalSub(sub)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 hover:underline cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>ตรวจสอบฟอร์มฉบับเต็ม (View Details)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => handleOpenReject(sub.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>ตีกลับหมวดนี้ (Reject)</span>
                    </button>

                    <button
                      onClick={() => handleApproveSubmission(sub.id, sub.month)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      <span>อนุมัติหมวดนี้ (Approve)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REJECT REASON MODAL DIALOG */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                ระบุเหตุผลในการตีกลับรายงาน
              </h3>
            </div>

            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="เช่น ข้อมูลค่าไฟฟ้าไม่ตรงกับใบแจ้งหนี้ PEA"
              className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                ยืนยันการตีกลับ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SUBMISSION DETAILS MODAL (FORM STYLE) */}
      {viewModalSub && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-sky-600/20 uppercase">
                  {viewModalSub.category_key}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{viewModalSub.category_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    วันที่ลงข้อมูล: {viewModalSub.report_date ? viewModalSub.report_date.split('-').reverse().join('/') : '-'} | ผู้ส่ง: {viewModalSub.reporter_name || 'ไม่ระบุชื่อ'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewModalSub(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="pointer-events-none opacity-95">
              <DataEntryForm
                selectedYear={viewModalSub.year}
                selectedMonth={viewModalSub.month}
                setSelectedMonth={() => {}}
                reportsData={reportsData}
                currentUser={currentUser}
                onSaveDraft={() => {}}
                onSubmitApproval={() => {}}
                onApproveReport={() => {}}
                onRejectReport={() => {}}
                initialCategory={viewModalSub.category_key}
                initialData={viewModalSub.data}
                isReadOnlyMode={true}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewModalSub(null)}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer shadow-md transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW POND SUBMISSION DETAILS MODAL */}
      {viewModalPondSub && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 border border-slate-200 relative animate-scaleUp">
            {/* Close Button */}
            <button
              onClick={() => setViewModalPondSub(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>

            {/* Header */}
            <div>
              <span className="text-xs font-black px-3 py-1 rounded-xl bg-sky-600 text-white uppercase tracking-wider">
                {viewModalPondSub.pond_name}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2 tracking-tight">
                รายละเอียดการบันทึกข้อมูลผลตรวจวัด (รออนุมัติ)
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                วันที่ตรวจวัด: {viewModalPondSub.report_date.split('-').reverse().join('/')} เวลา {viewModalPondSub.report_time || '00:00'} น.
              </p>
              <p className="text-xs text-slate-700 font-extrabold mt-1">
                ผู้ลงข้อมูล: {viewModalPondSub.reporter_name || 'พนักงานทั่วไป (ไม่มียศ)'}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                พารามิเตอร์และตัววัดทางเคมี/กายภาพ:
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(viewModalPondSub.metrics || {}).map(([k, v], idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 text-center">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase">{k.replace('_', ' ')}</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5 tracking-tight">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Gallery with Zoom Preview */}
            {((viewModalPondSub.image_urls && viewModalPondSub.image_urls.length > 0) || viewModalPondSub.image_url) && (() => {
              const photos = (viewModalPondSub.image_urls && viewModalPondSub.image_urls.length > 0)
                ? viewModalPondSub.image_urls
                : [viewModalPondSub.image_url!];

              return (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>รูปถ่ายหน้างาน ({photos.length} รูป - คลิกเพื่อดูขยาย):</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-2 rounded-2xl bg-slate-900 border border-slate-800">
                    {photos.map((url, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setSelectedFullPhoto(url)}
                        className="relative rounded-xl overflow-hidden border border-slate-700 group cursor-pointer hover:border-sky-400 transition-all"
                      >
                        <img src={url} alt={`Photo ${pIdx + 1}`} className="w-full h-32 object-cover block group-hover:scale-105 transition-all" />
                        <span className="absolute bottom-1 right-1 bg-slate-950/80 text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                          #{pIdx + 1} 🔍
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Remarks */}
            {viewModalPondSub.remarks && (
              <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 text-xs text-sky-950 font-medium">
                <strong>หมายเหตุเพิ่มเติม:</strong> {viewModalPondSub.remarks}
              </div>
            )}

            {/* Action Buttons inside modal */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  handleApprovePondSubmission(viewModalPondSub);
                  setViewModalPondSub(null);
                }}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BadgeCheck className="w-4 h-4 text-slate-950" />
                <span>อนุมัติรายการนี้</span>
              </button>
              <button
                onClick={() => setViewModalPondSub(null)}
                className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN PHOTO ZOOM MODAL */}
      {selectedFullPhoto && (
        <div
          onClick={() => setSelectedFullPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl">
            <img src={selectedFullPhoto} alt="Full Size Photo" className="w-full h-full object-contain max-h-[80vh] block" />
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
