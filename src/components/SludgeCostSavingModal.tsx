'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  X,
  Copy,
  RotateCcw,
  Check,
  TrendingDown,
  Sparkles,
  Layers,
  FileText,
  Truck,
  Droplets,
  Fuel,
  Package,
} from 'lucide-react';

interface SludgeCostSavingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSludgeTon?: number;
  onApplySavings?: (data: {
    sludgeTon: number;
    totalDisposal: number;
    totalActual: number;
    saving: number;
    savingPerTon: number;
    savingPct: number;
  }) => void;
}

export const SludgeCostSavingModal: React.FC<SludgeCostSavingModalProps> = ({
  isOpen,
  onClose,
  initialSludgeTon = 218,
  onApplySavings,
}) => {
  // Input states initialized to 0 per user requirement
  const [period, setPeriod] = useState<string>('');
  const [sludgeTon, setSludgeTon] = useState<number>(initialSludgeTon || 0);
  const [disposalRate, setDisposalRate] = useState<number>(0);
  const [transportRate, setTransportRate] = useState<number>(0);

  const [bagCost, setBagCost] = useState<number>(0);
  const [bagTonBasis, setBagTonBasis] = useState<number>(0);

  const [polymerRate, setPolymerRate] = useState<number>(0);
  const [polymerUsed, setPolymerUsed] = useState<number>(0);

  const [oilRate, setOilRate] = useState<number>(0);
  const [oilUsed, setOilUsed] = useState<number>(0);

  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialSludgeTon && initialSludgeTon > 0) {
      setSludgeTon(initialSludgeTon);
    }
  }, [initialSludgeTon]);

  if (!isOpen) return null;

  // Calculations
  const totalRatePerTon = disposalRate + transportRate; // (ค่ากำจัด + ค่าขนส่ง)
  const totalDisposal = sludgeTon * totalRatePerTon; // ค่ากำจัดเดิมรวม

  const bagRatePerTon = bagTonBasis !== 0 ? bagCost / bagTonBasis : 0; // ถุงกรองต่อตัน
  const bagApplied = sludgeTon * bagRatePerTon; // ค่าถุงกรองจริง

  const polymerApplied = polymerUsed * sludgeTon; // โพลิเมอร์จริงตามสูตรไฟล์ Excel
  const oilApplied = oilRate * oilUsed; // ค่าน้ำมันจริง

  const totalActual = bagApplied + polymerApplied + oilApplied; // ค่าใช้จ่ายจริงรวม
  const saving = totalDisposal - totalActual; // เงินที่ประหยัดได้
  const savingPerTon = sludgeTon !== 0 ? saving / sludgeTon : 0; // ประหยัดต่อตัน
  const savingPct = totalDisposal !== 0 ? Math.max(0, Math.min(100, (saving / totalDisposal) * 100)) : 0;

  const fmt = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

  const handleReset = () => {
    setSludgeTon(0);
    setDisposalRate(0);
    setTransportRate(0);
    setBagCost(0);
    setBagTonBasis(0);
    setPolymerRate(0);
    setPolymerUsed(0);
    setOilRate(0);
    setOilUsed(0);
    setPeriod('');
  };

  const handleCopy = () => {
    const text = `สรุปผลประหยัดต้นทุนการจัดการตะกอน — ${period}
ปริมาณตะกอน: ${fmt(sludgeTon)} ตัน
ค่ากำจัดรวม (เดิม): ${fmt(totalDisposal)} บาท
รวมค่าใช้จ่ายจริง: ${fmt(totalActual)} บาท
  - ค่าถุงกรองตะกอน: ${fmt(bagApplied)} บาท
  - ค่าโพลิเมอร์: ${fmt(polymerApplied)} บาท
  - ค่าน้ำมันเชื้อเพลิง: ${fmt(oilApplied)} บาท
ประหยัดได้: ${fmt(saving)} บาท (${fmt(savingPerTon)} บาท/ตัน, ${Math.round(savingPct)}%)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-[#EEF2F0] rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl border border-[#CBD6D0] relative flex flex-col font-sans text-[#13262C] animate-scaleUp">
        
        {/* MODAL HEADER */}
        <div className="p-6 pb-4 border-b border-[#CBD6D0]/60 bg-white/70 backdrop-blur-md rounded-t-3xl flex items-start justify-between gap-4 sticky top-0 z-20">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[#123F33] bg-[#1C6E5A]/10 border border-[#1C6E5A]/25 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#DE9F35] shadow-[0_0_0_2px_rgba(222,159,53,0.25)]" />
              <span>Utility · Sludge Management</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#13262C] mt-2 tracking-tight flex items-center gap-2">
              <span>ตัวคำนวณต้นทุนประหยัด: การจัดการตะกอน</span>
            </h2>
            <p className="text-xs text-[#4C6058] font-medium mt-0.5">
              กรอกตัวเลขการดำเนินงานประจำงวด ระบบจะคำนวณค่าใช้จ่ายและส่วนที่ประหยัดได้ให้อัตโนมัติ (อ้างอิงสูตร Cost_saving_Sludge.xlsx)
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white hover:bg-slate-200 text-[#4C6058] flex items-center justify-center cursor-pointer border border-[#CBD6D0] transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PERIOD BAR */}
        <div className="px-6 py-3 bg-white border-b border-[#CBD6D0]/40 flex items-center gap-3">
          <label className="text-xs font-mono font-bold uppercase text-[#4C6058]">ช่วงเวลาที่บันทึก:</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 bg-[#FBFCFB] border border-[#CBD6D0] rounded-lg text-xs font-bold text-[#13262C] focus:outline-none focus:ring-2 focus:ring-[#1C6E5A] w-64"
          />
        </div>

        {/* MAIN BODY GRID */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: 4 PARAMETER CARDS */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* CARD 01: Sludge & Disposal */}
            <div className="bg-white border border-[#CBD6D0] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-dashed border-[#CBD6D0] pb-3 mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-[#13262C]">
                  <Truck className="w-4 h-4 text-[#1C6E5A]" />
                  <span>ปริมาณตะกอน & ค่ากำจัด</span>
                  <span className="font-mono text-[10px] bg-[#1C6E5A]/10 text-[#1C6E5A] px-2 py-0.5 rounded font-black">01</span>
                </h3>
                <span className="font-mono font-black text-sm text-[#123F33] bg-[#1C6E5A]/10 px-2.5 py-1 rounded-lg">
                  {fmt(totalDisposal)} บาท
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#4C6058] font-bold mb-1">
                    ปริมาณตะกอน <span className="font-mono opacity-80">(ตัน)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={sludgeTon || ''}
                    onChange={(e) => setSludgeTon(Number(e.target.value))}
                    className="w-full font-mono text-sm font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#4C6058] font-bold mb-1">
                    ค่ากำจัด <span className="font-mono opacity-80">(บาท/ตัน)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={disposalRate || ''}
                    onChange={(e) => setDisposalRate(Number(e.target.value))}
                    className="w-full font-mono text-sm font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#4C6058] font-bold mb-1">
                    ค่าขนส่ง <span className="font-mono opacity-80">(บาท/ตัน)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={transportRate || ''}
                    onChange={(e) => setTransportRate(Number(e.target.value))}
                    className="w-full font-mono text-sm font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-[#1C6E5A]/5 border border-dashed border-[#1C6E5A]/30 text-[11px] font-mono text-[#123F33] flex items-center gap-1.5 flex-wrap">
                <span className="font-bold bg-[#1C6E5A]/15 text-[#1C6E5A] px-1.5 py-0.5 rounded text-[10px]">FX</span>
                <span>{fmt(sludgeTon)} × ({fmt(disposalRate)} + {fmt(transportRate)}) = {fmt(totalDisposal)} บาท</span>
              </div>
            </div>

            {/* CARD 02: Dewatering Bag */}
            <div className="bg-white border border-[#CBD6D0] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-dashed border-[#CBD6D0] pb-3 mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-[#13262C]">
                  <Package className="w-4 h-4 text-[#1C6E5A]" />
                  <span>ถุงกรองตะกอน (Dewatering Bag)</span>
                  <span className="font-mono text-[10px] bg-[#1C6E5A]/10 text-[#1C6E5A] px-2 py-0.5 rounded font-black">02</span>
                </h3>
                <span className="font-mono font-black text-sm text-[#123F33] bg-[#1C6E5A]/10 px-2.5 py-1 rounded-lg">
                  {fmt(bagApplied)} บาท
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#4C6058] font-bold mb-1">
                    ค่าใช้จ่ายรวม <span className="font-mono opacity-80">(บาท)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={bagCost || ''}
                    onChange={(e) => setBagCost(Number(e.target.value))}
                    className="w-full font-mono text-sm font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#4C6058] font-bold mb-1">
                    ปริมาณตะกอนอ้างอิง <span className="font-mono opacity-80">(ตัน)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={bagTonBasis || ''}
                    onChange={(e) => setBagTonBasis(Number(e.target.value))}
                    className="w-full font-mono text-sm font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-[#1C6E5A]/5 border border-dashed border-[#1C6E5A]/30 text-[11px] font-mono text-[#123F33] flex items-center gap-1.5 flex-wrap">
                <span className="font-bold bg-[#1C6E5A]/15 text-[#1C6E5A] px-1.5 py-0.5 rounded text-[10px]">FX</span>
                <span>{fmt(sludgeTon)} × ({fmt(bagCost)} ÷ {fmt(bagTonBasis)}) = {fmt(bagApplied)} บาท</span>
              </div>
            </div>

            {/* CARD 03: Polymer */}
            <div className="bg-white border border-[#CBD6D0] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-dashed border-[#CBD6D0] pb-3 mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-[#13262C]">
                  <Droplets className="w-4 h-4 text-[#1C6E5A]" />
                  <span>โพลิเมอร์ (Polymer)</span>
                  <span className="font-mono text-[10px] bg-[#1C6E5A]/10 text-[#1C6E5A] px-2 py-0.5 rounded font-black">03</span>
                </h3>
                <span className="font-mono font-black text-sm text-[#123F33] bg-[#1C6E5A]/10 px-2.5 py-1 rounded-lg">
                  {fmt(polymerApplied)} บาท
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#4C6058] font-bold mb-1">
                    ราคาอ้างอิง <span className="font-mono opacity-80">(บาท/กก.)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={polymerRate || ''}
                    onChange={(e) => setPolymerRate(Number(e.target.value))}
                    className="w-full font-mono text-sm font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#4C6058] font-bold mb-1">
                    ปริมาณที่ใช้ <span className="font-mono opacity-80">(กก.)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={polymerUsed || ''}
                    onChange={(e) => setPolymerUsed(Number(e.target.value))}
                    className="w-full font-mono text-sm font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-[#1C6E5A]/5 border border-dashed border-[#1C6E5A]/30 text-[11px] font-mono text-[#123F33] flex items-center gap-1.5 flex-wrap">
                <span className="font-bold bg-[#1C6E5A]/15 text-[#1C6E5A] px-1.5 py-0.5 rounded text-[10px]">FX</span>
                <span>{fmt(polymerUsed)} × {fmt(sludgeTon)} = {fmt(polymerApplied)} บาท</span>
              </div>
            </div>

            {/* CARD 04: Fuel Oil */}
            <div className="bg-white border border-[#CBD6D0] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-dashed border-[#CBD6D0] pb-3 mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-[#13262C]">
                  <Fuel className="w-4 h-4 text-[#1C6E5A]" />
                  <span>น้ำมันเชื้อเพลิง (Oil)</span>
                  <span className="font-mono text-[10px] bg-[#1C6E5A]/10 text-[#1C6E5A] px-2 py-0.5 rounded font-black">04</span>
                </h3>
                <span className="font-mono font-black text-sm text-[#123F33] bg-[#1C6E5A]/10 px-2.5 py-1 rounded-lg">
                  {fmt(oilApplied)} บาท
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#4C6058] font-bold mb-1">
                    ราคา <span className="font-mono opacity-80">(บาท/ลิตร)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={oilRate || ''}
                    onChange={(e) => setOilRate(Number(e.target.value))}
                    className="w-full font-mono text-sm font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#4C6058] font-bold mb-1">
                    ปริมาณที่ใช้ <span className="font-mono opacity-80">(ลิตร)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={oilUsed || ''}
                    onChange={(e) => setOilUsed(Number(e.target.value))}
                    className="w-full font-mono text-sm font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-[#1C6E5A]/5 border border-dashed border-[#1C6E5A]/30 text-[11px] font-mono text-[#123F33] flex items-center gap-1.5 flex-wrap">
                <span className="font-bold bg-[#1C6E5A]/15 text-[#1C6E5A] px-1.5 py-0.5 rounded text-[10px]">FX</span>
                <span>{fmt(oilRate)} × {fmt(oilUsed)} = {fmt(oilApplied)} บาท</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: GAUGE & BREAKDOWN SUMMARY */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* GAUGE HIGHLIGHT CARD */}
            <div className="bg-[#123F33] text-[#EAF2EF] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#B9D6CB] mb-4">
                ผลประหยัด — SAVING SUMMARY
              </h3>

              <div className="flex items-center gap-5">
                {/* RING PROGRESS */}
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: `conic-gradient(#DE9F35 ${savingPct}%, rgba(255,255,255,0.12) 0)`,
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-[#123F33] flex flex-col items-center justify-center shadow-inner">
                    <span className="font-mono text-lg font-black">{Math.round(savingPct)}%</span>
                    <span className="text-[8px] text-[#9FC2B5] text-center leading-tight">ของค่ากำจัด</span>
                  </div>
                </div>

                {/* SAVING NUMBERS */}
                <div className="space-y-1">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {fmt(saving)} <span className="text-xs font-medium text-[#B9D6CB]">บาท</span>
                  </div>
                  <div className="font-mono text-xs text-[#B9D6CB]">
                    ≈ <strong className="text-[#DE9F35] font-black">{fmt(savingPerTon)}</strong> บาท/ตัน
                  </div>
                </div>
              </div>
            </div>

            {/* BREAKDOWN BREAKDOWN CARD */}
            <div className="bg-white border border-[#CBD6D0] rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#4C6058] border-b border-[#CBD6D0]/60 pb-2">
                สรุปแจกแจงค่าใช้จ่าย (Cost Breakdown)
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#CBD6D0]/40">
                  <span className="text-[#4C6058]">ค่ากำจัดรวม (ถ้าไม่มีการปรับปรุง)</span>
                  <span className="font-mono font-bold text-[#13262C]">{fmt(totalDisposal)} บาท</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#CBD6D0]/40">
                  <span className="text-[#4C6058]">ค่าถุงกรองตะกอน</span>
                  <span className="font-mono font-bold text-[#13262C]">{fmt(bagApplied)} บาท</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#CBD6D0]/40">
                  <span className="text-[#4C6058]">ค่าโพลิเมอร์</span>
                  <span className="font-mono font-bold text-[#13262C]">{fmt(polymerApplied)} บาท</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#CBD6D0]/40">
                  <span className="text-[#4C6058]">ค่าน้ำมันเชื้อเพลิง</span>
                  <span className="font-mono font-bold text-[#13262C]">{fmt(oilApplied)} บาท</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-t-2 border-[#13262C] font-bold">
                  <span>รวมค่าใช้จ่ายจริง</span>
                  <span className="font-mono text-sm text-[#13262C]">{fmt(totalActual)} บาท</span>
                </div>

                <div className="flex items-center justify-between py-2 bg-[#1C6E5A]/10 px-3 rounded-xl border border-[#1C6E5A]/20 font-black">
                  <span className="text-[#123F33] flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-[#1C6E5A]" />
                    <span>ประหยัดได้สุทธิ</span>
                  </span>
                  <span className={`font-mono text-base ${saving < 0 ? 'text-rose-600' : 'text-[#1C6E5A]'}`}>
                    {fmt(saving)} บาท
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 py-2.5 px-3 bg-[#1C6E5A] hover:bg-[#123F33] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#DE9F35]" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'คัดลอกสรุปแล้ว ✓' : 'คัดลอกสรุปผล'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-2.5 px-3 bg-white hover:bg-slate-100 text-[#4C6058] font-bold text-xs rounded-xl border border-[#CBD6D0] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="รีเซ็ตค่าเริ่มต้น"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>รีเซ็ต</span>
                  </button>
                </div>

                {onApplySavings && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplySavings({
                        sludgeTon,
                        totalDisposal,
                        totalActual,
                        saving,
                        savingPerTon,
                        savingPct,
                      });
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 bg-[#123F33] hover:bg-[#1C6E5A] text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-[#DE9F35]" />
                    <span>บันทึกผลการคำนวณและปิดหน้าต่าง</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
