'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  Filter,
  Search,
  Droplets,
  Clock,
  User,
  ImageIcon,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { PondSubmission, UserRole } from '@/lib/types';
import { fetchPondSubmissions } from '@/lib/supabase';
import { POND_DEFINITIONS } from './PondEntryForm';

interface PondHistoryViewProps {
  currentUser?: { email: string; role: UserRole } | null;
  onNavigateToPondEntry?: (pondId: string) => void;
}

export const PondHistoryView: React.FC<PondHistoryViewProps> = ({
  currentUser,
  onNavigateToPondEntry,
}) => {
  const [submissions, setSubmissions] = useState<PondSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [selectedPondFilter, setSelectedPondFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Submission for Modal Detail
  const [selectedSubmission, setSelectedSubmission] = useState<PondSubmission | null>(null);
  const [selectedFullPhoto, setSelectedFullPhoto] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    const data = await fetchPondSubmissions();
    setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Filter logic
  const filteredSubmissions = submissions.filter((item) => {
    if (selectedPondFilter !== 'all' && item.pond_id !== selectedPondFilter) {
      return false;
    }
    if (startDateFilter && item.report_date < startDateFilter) {
      return false;
    }
    if (endDateFilter && item.report_date > endDateFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchPond = item.pond_name.toLowerCase().includes(q);
      const matchReporter = item.reporter_name.toLowerCase().includes(q);
      const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
      if (!matchPond && !matchReporter && !matchRemarks) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8 font-sans text-slate-800 pb-24">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 flex items-center justify-center font-black shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>ประวัติการลงข้อมูลบ่อบำบัด (Pond Data History)</span>
              <span className="text-xs bg-sky-100 text-sky-800 font-extrabold px-3 py-1 rounded-full border border-sky-200">
                {filteredSubmissions.length} รายการ
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              สืบค้นและตรวจสอบรายการบันทึกผลการตรวจวัดบ่อบำบัดน้ำเสียย้อนหลัง พร้อมเรียกดูพารามิเตอร์และรูปถ่ายหน้างาน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
          {onNavigateToPondEntry && (
            <button
              onClick={() => onNavigateToPondEntry('polishing-1')}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
            >
              <Droplets className="w-4 h-4" />
              <span>+ ลงข้อมูลใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>ตัวกรองและค้นหาข้อมูล (Filters & Search)</span>
          </span>
          {(selectedPondFilter !== 'all' || startDateFilter || endDateFilter || searchQuery) && (
            <button
              onClick={() => {
                setSelectedPondFilter('all');
                setStartDateFilter('');
                setEndDateFilter('');
                setSearchQuery('');
              }}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
            >
              ✕ ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pond Selector */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">เลือกบ่อบำบัด:</label>
            <select
              value={selectedPondFilter}
              onChange={(e) => setSelectedPondFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
            >
              <option value="all">-- แสดงทุกบ่อบำบัด --</option>
              {POND_DEFINITIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">ตั้งแต่วันที่ (dd/mm/yyyy):</label>
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-sky-600 absolute left-3 pointer-events-none z-10" />
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                style={{ color: 'transparent', caretColor: 'transparent' }}
              />
              <span className="absolute left-9 pointer-events-none text-xs font-black text-slate-900">
                {startDateFilter ? startDateFilter.split('-').reverse().join('/') : 'dd/mm/yyyy'}
              </span>
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">ถึงวันที่ (dd/mm/yyyy):</label>
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-sky-600 absolute left-3 pointer-events-none z-10" />
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                style={{ color: 'transparent', caretColor: 'transparent' }}
              />
              <span className="absolute left-9 pointer-events-none text-xs font-black text-slate-900">
                {endDateFilter ? endDateFilter.split('-').reverse().join('/') : 'dd/mm/yyyy'}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">ค้นหาตามคำ:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ชื่อบ่อ, ผู้บันทึก, หมายเหตุ..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
            <p className="text-xs font-bold">กำลังโหลดประวัติการลงข้อมูล...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-700">ไม่พบประวัติการลงข้อมูลตามเงื่อนไขที่เลือก</p>
            <p className="text-xs text-slate-400">ลองเปลี่ยนช่วงวันที่ หรือเลือกบ่อบำบัดอื่นเพื่อสืบค้นข้อมูล</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-white text-[11px] font-black uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4">วันที่ & เวลา</th>
                  <th className="py-3.5 px-4">บ่อบำบัด (Pond)</th>
                  <th className="py-3.5 px-4">พารามิเตอร์ตรวจวัด (Metrics)</th>
                  <th className="py-3.5 px-4 text-center">รูปถ่าย</th>
                  <th className="py-3.5 px-4">ผู้บันทึก</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredSubmissions.map((item, idx) => {
                  const photosCount = (item.image_urls && item.image_urls.length > 0)
                    ? item.image_urls.length
                    : item.image_url ? 1 : 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-sky-50/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSubmission(item)}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>{item.report_date.split('-').reverse().join('/')}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.report_time || '00:00'} น.</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                        <span className="bg-sky-100 text-sky-900 border border-sky-200 px-2.5 py-1 rounded-lg text-xs">
                          {item.pond_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {Object.entries(item.metrics || {}).map(([k, v], mIdx) => (
                            <span
                              key={mIdx}
                              className="text-[11px] font-extrabold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              <strong className="uppercase font-bold text-slate-500">{k.replace('_', ' ')}:</strong> {v}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {photosCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                            <span>{photosCount} รูป</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.reporter_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(item);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>ดูรายละเอียด</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL FOR SELECTED ITEM */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5 relative max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Close Button */}
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>

            {/* Header */}
            <div>
              <span className="text-xs font-black px-3 py-1 rounded-xl bg-sky-600 text-white uppercase tracking-wider">
                {selectedSubmission.pond_name}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2 tracking-tight">
                รายละเอียดการบันทึกข้อมูลผลตรวจวัด
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                วันที่ตรวจวัด: {selectedSubmission.report_date.split('-').reverse().join('/')} เวลา {selectedSubmission.report_time || '00:00'} น.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                พารามิเตอร์และตัววัดทางเคมี/กายภาพ:
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(selectedSubmission.metrics || {}).map(([k, v], idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 text-center">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase">{k.replace('_', ' ')}</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5 tracking-tight">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Gallery if Available */}
            {((selectedSubmission.image_urls && selectedSubmission.image_urls.length > 0) || selectedSubmission.image_url) && (() => {
              const photos = (selectedSubmission.image_urls && selectedSubmission.image_urls.length > 0)
                ? selectedSubmission.image_urls
                : [selectedSubmission.image_url!];

              return (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>รูปถ่ายหน้างาน ({photos.length} รูป - คลิกดูขยาย):</span>
                    <span className="text-[10px] text-slate-400 font-semibold">ผู้บันทึก: {selectedSubmission.reporter_name}</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto p-2 rounded-2xl bg-slate-900 border border-slate-800">
                    {photos.map((url, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setSelectedFullPhoto(url)}
                        className="relative rounded-xl overflow-hidden border border-slate-700 group cursor-pointer hover:border-sky-400 transition-all"
                      >
                        <img src={url} alt={`Photo ${pIdx + 1}`} className="w-full h-28 object-cover block group-hover:scale-105 transition-all" />
                        <span className="absolute bottom-1 right-1 bg-slate-950/80 text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                          #{pIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Remarks */}
            {selectedSubmission.remarks && (
              <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 text-xs text-sky-950 font-medium">
                <strong>หมายเหตุเพิ่มเติม:</strong> {selectedSubmission.remarks}
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer"
              >
                ปิดหน้าต่างนี้
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
