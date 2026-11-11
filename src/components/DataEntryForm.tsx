'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  BadgeCheck,
  Calendar,
  Factory,
  Zap,
  Flame,
  XCircle,
  Droplets,
  Activity,
  Layers,
  Check,
  Plus,
  Truck,
  FlaskConical,
  Calculator,
  Sparkles,
  Copy,
  RotateCcw,
  Package,
  Fuel,
  TrendingDown,
} from 'lucide-react';
import { FullMonthlyReportData, ReportData, ReportStatus, UserRole } from '@/lib/types';
import { calculateMetrics, MONTH_NAMES_TH, MONTH_SHORT_TH } from '@/lib/calculations';
import { saveCategorySubmission } from '@/lib/supabase';

interface DataEntryFormProps {
  selectedYear: number;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  reportsData: FullMonthlyReportData[];
  currentUser: { email: string; role: UserRole } | null;
  onSaveDraft: (month: number, data: Partial<ReportData>) => void;
  onSubmitApproval: (month: number, data: Partial<ReportData>) => void;
  onApproveReport: (month: number) => void;
  onRejectReport: (month: number, reason: string) => void;
  initialData?: Partial<ReportData>;
  initialCategory?: string;
  isReadOnlyMode?: boolean;
  hideCategoryTabs?: boolean;
  onCloseModal?: () => void;
  onSaveEditItem?: (updatedData: Partial<ReportData>) => void;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({
  selectedYear,
  selectedMonth,
  setSelectedMonth,
  reportsData,
  currentUser,
  onSaveDraft,
  onSubmitApproval,
  onApproveReport,
  onRejectReport,
  initialData,
  initialCategory,
  isReadOnlyMode,
  hideCategoryTabs,
  onCloseModal,
  onSaveEditItem,
}) => {
  const currentReportObj = reportsData.find((r) => r.report.month === selectedMonth);

  const status: ReportStatus = currentReportObj?.report.status || 'empty';
  const rejectReason = currentReportObj?.report.reject_reason || '';

  // Active Category state: 'cat1' | 'cat2' | 'cat3' | 'cat4' | 'cat5'
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || 'cat1');

  // Local state for form fields
  const [formData, setFormData] = useState<ReportData>({
    report_id: `report-${selectedYear}-${selectedMonth}`,
    reporter_name: '',
    reporter_id: '',
    report_date: new Date().toISOString().split('T')[0],

    // Legacy fields
    production_cassava: 0,
    production_modified: 0,
    hours_cassava: 0,
    hours_modified: 0,
    electricity_kwh: 0,
    electricity_baht: 0,
    renewable_biogas_m3: 0,
    renewable_solar_kwh: 0,
    fuel_oil_a_liter: 0,
    fuel_oil_a_baht: 0,

    // หมวดที่ 1: ตะกอน
    sludge_datetime: '',
    sludge_removal_desc: '',
    sludge_tons: 0,
    sludge_trips: 0,
    sludge_disposal_price: 0,
    sludge_trip_price: 0,
    sludge_total_baht: 0,

    sludge_use_vacuum_truck: false,
    sludge_vac_datetime: '',
    sludge_vac_removal_desc: '',
    sludge_vac_tons: 0,
    sludge_vac_trips: 0,
    sludge_vac_disposal_price: 0,
    sludge_vac_trip_price: 0,
    sludge_vac_total_baht: 0,
    sludge_grand_total_baht: 0,

    // หมวดที่ 2: การผลิต
    production_ms1: 0,
    production_ms2: 0,
    production_ms3: 0,
    production_total_ms: 0,

    // หมวดที่ 3: เชื้อเพลิง
    gas_ms1_m3: 0,
    gas_ms2_m3: 0,
    gas_ms3_m3: 0,
    gas_total_m3: 0,

    // หมวดที่ 4: ไฟฟ้า
    elec_ms3_ms1_tf_on_peak: 0,
    elec_ms3_ms1_tf_off_peak: 0,
    elec_meter1_ms1_ms3_tf: 0,
    elec_ms2_mix_on_peak: 0,
    elec_ms2_mix_off_peak: 0,
    elec_meter3_ms2_mix: 0,
    elec_utl_on_peak: 0,
    elec_utl_off_peak: 0,
    elec_meter2_utl: 0,
    solar_meter1_ms2: 0,
    solar_meter2_tf: 0,
    elec_total_pea_kwh: 0,
    elec_total_solar_kwh: 0,
    elec_grand_total_kwh: 0,

    // หมวดที่ 5: WWT & Biogas
    wwt_cod_native: 0,
    wwt_codt_mix1: 0,
    wwt_vfa_mix1: 0,
    wwt_ph_mix2: 0,
    wwt_cod_loading: 0,
    wwt_cod_eff_as: 0,

    biogas_flow_feed_mix2: 0,
    biogas_generate: 0,
    biogas_flare: 0,
    biogas_boiler_consumption: 0,
    biogas_pct_ch4: 0,
    biogas_pct_h2s: 0,
    biogas_removal: 0,
    biogas_sv60_eff: 0,
  });

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectInputReason, setRejectInputReason] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Sludge Cost-Saving Expandable Form States (Initialized to 0)
  const [showSludgeSavingCalc, setShowSludgeSavingCalc] = useState<boolean>(false);
  const [savingPeriod, setSavingPeriod] = useState<string>('');
  const [savingDisposalRate, setSavingDisposalRate] = useState<number>(0);
  const [savingTransportRate, setSavingTransportRate] = useState<number>(0);
  const [savingBagCost, setSavingBagCost] = useState<number>(0);
  const [savingBagTonBasis, setSavingBagTonBasis] = useState<number>(0);
  const [savingPolymerRate, setSavingPolymerRate] = useState<number>(0);
  const [savingPolymerUsed, setSavingPolymerUsed] = useState<number>(0);
  const [savingOilRate, setSavingOilRate] = useState<number>(0);
  const [savingOilUsed, setSavingOilUsed] = useState<number>(0);
  const [savingCopied, setSavingCopied] = useState<boolean>(false);

  // Keep form clean and empty by default for daily data entries
  useEffect(() => {
    let defaultReporterName = '';
    if (currentUser?.email) {
      try {
        const savedName = localStorage.getItem(`tdc_user_display_name_${currentUser.email}`);
        if (savedName) defaultReporterName = savedName;
        else defaultReporterName = currentUser.email.split('@')[0];
      } catch { }
    }

    setFormData({
      report_id: `report-${selectedYear}-${selectedMonth}`,
      reporter_name: defaultReporterName,
      reporter_id: '',
      report_date: new Date().toISOString().split('T')[0],
      production_cassava: 0,
      production_modified: 0,
      hours_cassava: 0,
      hours_modified: 0,
      electricity_kwh: 0,
      electricity_baht: 0,
      renewable_biogas_m3: 0,
      renewable_solar_kwh: 0,
      fuel_oil_a_liter: 0,
      fuel_oil_a_baht: 0,

      sludge_datetime: '',
      sludge_removal_desc: '',
      sludge_tons: 0,
      sludge_trips: 0,
      sludge_disposal_price: 0,
      sludge_trip_price: 0,
      sludge_total_baht: 0,

      sludge_use_vacuum_truck: false,
      sludge_vac_datetime: '',
      sludge_vac_removal_desc: '',
      sludge_vac_tons: 0,
      sludge_vac_trips: 0,
      sludge_vac_disposal_price: 0,
      sludge_vac_trip_price: 0,
      sludge_vac_total_baht: 0,
      sludge_grand_total_baht: 0,

      sludge_use_saving_calc: false,
      sludge_saving_flow_before: 0,
      sludge_saving_flow_after: 0,
      sludge_saving_flow_diff: 0,
      sludge_saving_removal_ton: 0,
      sludge_saving_disposal_rate: 0,
      sludge_saving_transport_rate: 0,
      sludge_saving_bag_cost: 0,
      sludge_saving_bag_basis: 0,
      sludge_saving_polymer_rate: 0,
      sludge_saving_polymer_used: 0,
      sludge_saving_oil_rate: 0,
      sludge_saving_oil_used: 0,
      sludge_saving_total_disposal: 0,
      sludge_saving_total_actual: 0,
      sludge_saving_net_baht: 0,
      sludge_saving_per_ton: 0,
      sludge_saving_pct: 0,

      production_ms1: 0,
      production_ms2: 0,
      production_ms3: 0,
      production_total_ms: 0,

      fuel_oil_a_ms1_liter: 0,
      fuel_oil_a_ms2_liter: 0,
      fuel_oil_a_ms3_liter: 0,
      fuel_oil_a_total_liter: 0,

      gas_ms1_m3: 0,
      gas_ms2_m3: 0,
      gas_ms3_m3: 0,
      gas_total_m3: 0,

      elec_ms3_ms1_tf_on_peak: 0,
      elec_ms3_ms1_tf_off_peak: 0,
      elec_meter1_ms1_ms3_tf: 0,
      elec_ms2_mix_on_peak: 0,
      elec_ms2_mix_off_peak: 0,
      elec_meter3_ms2_mix: 0,
      elec_utl_on_peak: 0,
      elec_utl_off_peak: 0,
      elec_meter2_utl: 0,
      solar_meter1_ms2: 0,
      solar_meter2_tf: 0,
      elec_total_pea_kwh: 0,
      elec_total_solar_kwh: 0,
      elec_grand_total_kwh: 0,

      wwt_cod_native: 0,
      wwt_codt_mix1: 0,
      wwt_vfa_mix1: 0,
      wwt_ph_mix2: 0,
      wwt_cod_loading: 0,
      wwt_cod_eff_as: 0,

      biogas_flow_feed_mix2: 0,
      biogas_generate: 0,
      biogas_flare: 0,
      biogas_boiler_consumption: 0,
      biogas_pct_ch4: 0,
      biogas_pct_h2s: 0,
      biogas_removal: 0,
      biogas_sv60_eff: 0,

      biogas_flow: 0,
      biogas_temp: 0,
      biogas_pressure: 0,
      biogas_air_dryer_drain: '',
      biogas_motor_current: 0,

      chem_lime_received: 0,
      chem_lime_usage: 0,
      chem_lime_available: 0,
      chem_polymer_received: 0,
      chem_polymer_usage: 0,
      chem_polymer_available: 0,
      chem_odor_received: 0,
      chem_odor_usage: 0,
      chem_odor_available: 0,
      chem_fog_received: 0,
      chem_fog_usage: 0,
      chem_fog_available: 0,
      chem_cod_tube_received: 0,
      chem_cod_tube_usage: 0,
      chem_cod_tube_available: 0,
    });
  }, [selectedMonth, selectedYear, currentUser]);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Form is locked if explicitly set in read-only mode
  const isFormLocked = Boolean(isReadOnlyMode);
  const isHideCategoryTabs = Boolean(hideCategoryTabs || isReadOnlyMode || onSaveEditItem);

  // Compute metrics in real-time
  const computed = calculateMetrics(formData);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInputChange = (field: keyof ReportData, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleMultiInputChange = (patch: Partial<ReportData>) => {
    setFormData((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const isElevatedUser = Boolean(
    currentUser && (currentUser.role === 'admin' || currentUser.role === 'approver')
  );

  const getCategoryFields = (catKey: string): (keyof ReportData)[] => {
    if (catKey === 'cat1') {
      return [
        'sludge_removal_desc', 'sludge_tons', 'sludge_trips', 'sludge_disposal_price', 'sludge_trip_price',
        'sludge_total_baht', 'sludge_use_vacuum_truck', 'sludge_vac_removal_desc', 'sludge_vac_tons',
        'sludge_vac_trips', 'sludge_vac_disposal_price', 'sludge_vac_trip_price', 'sludge_vac_total_baht', 'sludge_grand_total_baht',
        'sludge_use_saving_calc', 'sludge_saving_flow_before', 'sludge_saving_flow_after',
        'sludge_saving_flow_diff', 'sludge_saving_removal_ton',
        'sludge_saving_disposal_rate', 'sludge_saving_transport_rate',
        'sludge_saving_bag_cost', 'sludge_saving_bag_basis', 'sludge_saving_polymer_rate', 'sludge_saving_polymer_used',
        'sludge_saving_oil_rate', 'sludge_saving_oil_used', 'sludge_saving_total_disposal',
        'sludge_saving_total_actual', 'sludge_saving_net_baht', 'sludge_saving_per_ton', 'sludge_saving_pct'
      ];
    } else if (catKey === 'cat2') {
      return ['production_ms1', 'production_ms2', 'production_ms3', 'production_total_ms'];
    } else if (catKey === 'cat3') {
      return ['fuel_oil_a_ms1_liter', 'fuel_oil_a_ms2_liter', 'fuel_oil_a_ms3_liter', 'fuel_oil_a_total_liter', 'fuel_oil_a_baht', 'gas_ms1_m3', 'gas_ms2_m3', 'gas_ms3_m3', 'gas_total_m3'];
    } else if (catKey === 'cat4') {
      return [
        'elec_ms3_ms1_tf_on_peak', 'elec_ms3_ms1_tf_off_peak', 'elec_meter1_ms1_ms3_tf',
        'elec_ms2_mix_on_peak', 'elec_ms2_mix_off_peak', 'elec_meter3_ms2_mix',
        'elec_utl_on_peak', 'elec_utl_off_peak', 'elec_meter2_utl',
        'solar_meter1_ms2', 'solar_meter2_tf', 'elec_total_pea_kwh', 'elec_total_solar_kwh', 'elec_grand_total_kwh', 'electricity_baht'
      ];
    } else if (catKey === 'cat5') {
      return ['wwt_cod_native', 'wwt_codt_mix1', 'wwt_vfa_mix1', 'wwt_ph_mix2', 'wwt_cod_loading', 'wwt_cod_eff_as', 'biogas_flow_feed_mix2', 'biogas_generate', 'biogas_flare', 'biogas_boiler_consumption', 'biogas_pct_ch4', 'biogas_pct_h2s', 'biogas_removal', 'biogas_sv60_eff', 'biogas_flow', 'biogas_temp', 'biogas_pressure', 'biogas_air_dryer_drain', 'biogas_motor_current'];
    } else if (catKey === 'cat6') {
      return [
        'chem_lime_received', 'chem_lime_usage', 'chem_lime_available',
        'chem_polymer_received', 'chem_polymer_usage', 'chem_polymer_available',
        'chem_odor_received', 'chem_odor_usage', 'chem_odor_available',
        'chem_fog_received', 'chem_fog_usage', 'chem_fog_available',
        'chem_cod_tube_received', 'chem_cod_tube_usage', 'chem_cod_tube_available',
      ];
    }
    return [];
  };

  const handleSaveCategory = (catKey: string, categoryName: string) => {
    const catFields = getCategoryFields(catKey);

    const catPatch: Partial<ReportData> = {
      reporter_name: formData.reporter_name,
      reporter_id: formData.reporter_id,
      report_date: formData.report_date || new Date().toISOString().split('T')[0],
      submitted_category: categoryName,
    };
    catFields.forEach((field) => {
      (catPatch as any)[field] = formData[field];
    });

    if (!formData.reporter_name) {
      alert('กรุณากรอก ชื่อ-นามสกุล ผู้ลงข้อมูลก่อนส่งหมวดนี้');
      return;
    }

    let targetYear = selectedYear;
    let targetMonth = selectedMonth;
    if (formData.report_date) {
      const parts = formData.report_date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y)) targetYear = y;
        if (!isNaN(m) && m >= 1 && m <= 12) targetMonth = m;
      }
    }

    saveCategorySubmission({
      year: targetYear,
      month: targetMonth,
      report_date: formData.report_date || new Date().toISOString().split('T')[0],
      category_key: catKey as any,
      category_name: categoryName,
      status: isElevatedUser ? 'approved' : 'pending',
      reporter_name: formData.reporter_name,
      reporter_id: formData.reporter_id,
      data: catPatch,
    });

    onSubmitApproval(selectedMonth, catPatch);
    triggerNotify(`ส่งคำขออนุมัติ ${categoryName} เรียบร้อยแล้ว!`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSubmitClick = () => {
    if (!formData.reporter_name) {
      alert('กรุณากรอก ชื่อ-นามสกุล ผู้ลงข้อมูลก่อนบันทึก/ส่งขออนุมัติ');
      return;
    }

    const filledCategories: Array<{ key: 'cat1' | 'cat2' | 'cat3' | 'cat4' | 'cat5' | 'cat6'; name: string }> = [];

    if (formData.sludge_tons || formData.sludge_removal_desc || formData.sludge_trips || formData.sludge_vac_tons) {
      filledCategories.push({ key: 'cat1', name: 'หมวดที่ 1: ตะกอน (Sludge)' });
    }
    if (formData.production_ms1 || formData.production_ms2 || formData.production_ms3) {
      filledCategories.push({ key: 'cat2', name: 'หมวดที่ 2: การผลิต (Production)' });
    }
    if (
      formData.fuel_oil_a_ms1_liter ||
      formData.fuel_oil_a_ms2_liter ||
      formData.fuel_oil_a_ms3_liter ||
      formData.gas_ms1_m3 ||
      formData.gas_ms2_m3 ||
      formData.gas_ms3_m3
    ) {
      filledCategories.push({ key: 'cat3', name: 'หมวดที่ 3: น้ำมันเตา (Fuel Oil)' });
    }
    if (
      formData.elec_meter1_ms1_ms3_tf ||
      formData.elec_meter2_utl ||
      formData.elec_meter3_ms2_mix ||
      formData.solar_meter1_ms2 ||
      formData.solar_meter2_tf
    ) {
      filledCategories.push({ key: 'cat4', name: 'หมวดที่ 4: ไฟฟ้า (Electricity & Solar)' });
    }
    if (formData.wwt_cod_native || formData.wwt_codt_mix1 || formData.biogas_flow_feed_mix2 || formData.biogas_flow) {
      filledCategories.push({ key: 'cat5', name: 'หมวดที่ 5: WWT & Biogas' });
    }
    if (
      formData.chem_lime_received || formData.chem_lime_usage || formData.chem_lime_available ||
      formData.chem_polymer_received || formData.chem_polymer_usage || formData.chem_polymer_available ||
      formData.chem_odor_received || formData.chem_odor_usage || formData.chem_odor_available ||
      formData.chem_fog_received || formData.chem_fog_usage || formData.chem_fog_available ||
      formData.chem_cod_tube_received || formData.chem_cod_tube_usage || formData.chem_cod_tube_available
    ) {
      filledCategories.push({ key: 'cat6', name: 'หมวดที่ 6: สารเคมี (Chemical)' });
    }

    if (filledCategories.length === 0) {
      alert('กรุณากรอกข้อมูลอย่างน้อย 1 หมวดหมูก่อนกดบันทึก/ส่งขออนุมัติ');
      return;
    }

    let targetYear = selectedYear;
    let targetMonth = selectedMonth;
    if (formData.report_date) {
      const parts = formData.report_date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y)) targetYear = y;
        if (!isNaN(m) && m >= 1 && m <= 12) targetMonth = m;
      }
    }

    filledCategories.forEach((cat) => {
      const catFields = getCategoryFields(cat.key);
      const catPatch: Partial<ReportData> = {
        reporter_name: formData.reporter_name,
        reporter_id: formData.reporter_id,
        report_date: formData.report_date || new Date().toISOString().split('T')[0],
        submitted_category: cat.name,
      };
      catFields.forEach((f) => {
        (catPatch as any)[f] = (formData as any)[f];
      });

      saveCategorySubmission({
        year: targetYear,
        month: targetMonth,
        report_date: formData.report_date || new Date().toISOString().split('T')[0],
        category_key: cat.key,
        category_name: cat.name,
        status: isElevatedUser ? 'approved' : 'pending',
        reporter_name: formData.reporter_name,
        reporter_id: formData.reporter_id,
        data: catPatch,
      });
    });

    const catNames = filledCategories.map((c) => c.name).join(', ');
    if (isElevatedUser) {
      triggerNotify(`บันทึกข้อมูลเรียบร้อยแล้ว (${catNames})`);
    } else {
      triggerNotify(`ส่งคำขออนุมัติแยกเป็น ${filledCategories.length} หมวดหมู่เรียบร้อยแล้ว! (${catNames})`);
    }

    // Reset Form Fields back to empty/blank for fresh entry!
    setFormData({
      report_id: `report-${selectedYear}-${selectedMonth}`,
      reporter_name: currentUser?.email ? currentUser.email.split('@')[0] : '',
      reporter_id: '',
      report_date: new Date().toISOString().split('T')[0],
      production_cassava: 0,
      production_modified: 0,
      hours_cassava: 0,
      hours_modified: 0,
      electricity_kwh: 0,
      electricity_baht: 0,
      renewable_biogas_m3: 0,
      renewable_solar_kwh: 0,
      fuel_oil_a_liter: 0,
      fuel_oil_a_baht: 0,

      sludge_datetime: '',
      sludge_removal_desc: '',
      sludge_tons: 0,
      sludge_trips: 0,
      sludge_disposal_price: 0,
      sludge_trip_price: 0,
      sludge_total_baht: 0,

      sludge_use_vacuum_truck: false,
      sludge_vac_datetime: '',
      sludge_vac_removal_desc: '',
      sludge_vac_tons: 0,
      sludge_vac_trips: 0,
      sludge_vac_disposal_price: 0,
      sludge_vac_trip_price: 0,
      sludge_vac_total_baht: 0,
      sludge_grand_total_baht: 0,

      production_ms1: 0,
      production_ms2: 0,
      production_ms3: 0,
      production_total_ms: 0,

      fuel_oil_a_ms1_liter: 0,
      fuel_oil_a_ms2_liter: 0,
      fuel_oil_a_ms3_liter: 0,
      fuel_oil_a_total_liter: 0,

      gas_ms1_m3: 0,
      gas_ms2_m3: 0,
      gas_ms3_m3: 0,
      gas_total_m3: 0,

      elec_ms3_ms1_tf_on_peak: 0,
      elec_ms3_ms1_tf_off_peak: 0,
      elec_meter1_ms1_ms3_tf: 0,
      elec_ms2_mix_on_peak: 0,
      elec_ms2_mix_off_peak: 0,
      elec_meter3_ms2_mix: 0,
      elec_utl_on_peak: 0,
      elec_utl_off_peak: 0,
      elec_meter2_utl: 0,
      solar_meter1_ms2: 0,
      solar_meter2_tf: 0,
      elec_total_pea_kwh: 0,
      elec_total_solar_kwh: 0,
      elec_grand_total_kwh: 0,

      wwt_cod_native: 0,
      wwt_codt_mix1: 0,
      wwt_vfa_mix1: 0,
      wwt_ph_mix2: 0,
      wwt_cod_loading: 0,
      wwt_cod_eff_as: 0,

      biogas_flow_feed_mix2: 0,
      biogas_generate: 0,
      biogas_flare: 0,
      biogas_boiler_consumption: 0,
      biogas_pct_ch4: 0,
      biogas_pct_h2s: 0,
      biogas_removal: 0,
      biogas_sv60_eff: 0,

      biogas_flow: 0,
      biogas_temp: 0,
      biogas_pressure: 0,
      biogas_air_dryer_drain: '',
      biogas_motor_current: 0,

      chem_lime_received: 0,
      chem_lime_usage: 0,
      chem_lime_available: 0,
      chem_polymer_received: 0,
      chem_polymer_usage: 0,
      chem_polymer_available: 0,
      chem_odor_received: 0,
      chem_odor_usage: 0,
      chem_odor_available: 0,
      chem_fog_received: 0,
      chem_fog_usage: 0,
      chem_fog_available: 0,
      chem_cod_tube_received: 0,
      chem_cod_tube_usage: 0,
      chem_cod_tube_available: 0,
    });
  };

  const handleApproveClick = () => {
    onApproveReport(selectedMonth);
    triggerNotify('อนุมัติรายงานประจำเดือนเรียบร้อยแล้ว!');
  };

  const handleConfirmReject = () => {
    if (!rejectInputReason.trim()) {
      alert('กรุณาระบุเหตุผลการตีกลับ');
      return;
    }
    onRejectReport(selectedMonth, rejectInputReason);
    setRejectModalOpen(false);
    setRejectInputReason('');
    triggerNotify('ตีกลับรายงานไปยังสถานะร่างเรียบร้อยแล้ว');
  };

  // Calculations for Category 1 Sludge Formulas
  const mainSludgeTotal =
    ((Number(formData.sludge_tons) || 0) * (Number(formData.sludge_disposal_price) || 0) +
      (Number(formData.sludge_trip_price) || 0)) *
    (Number(formData.sludge_trips) || 0);

  const vacSludgeTotal = formData.sludge_use_vacuum_truck
    ? ((Number(formData.sludge_vac_tons) || 0) * (Number(formData.sludge_vac_disposal_price) || 0) +
      (Number(formData.sludge_vac_trip_price) || 0)) *
    (Number(formData.sludge_vac_trips) || 0)
    : 0;

  const grandSludgeTotal = mainSludgeTotal + vacSludgeTotal;

  // Category 2 Production Total
  const prodTotalMS =
    (Number(formData.production_ms1) || 0) +
    (Number(formData.production_ms2) || 0) +
    (Number(formData.production_ms3) || 0);

  // Category 3 Fuel Oil Total
  const fuelOilTotalLiter =
    (Number(formData.fuel_oil_a_ms1_liter) || 0) +
    (Number(formData.fuel_oil_a_ms2_liter) || 0) +
    (Number(formData.fuel_oil_a_ms3_liter) || 0);

  // Category 3 Gas Total
  const gasTotalM3 =
    (Number(formData.gas_ms1_m3) || 0) +
    (Number(formData.gas_ms2_m3) || 0) +
    (Number(formData.gas_ms3_m3) || 0);

  // Category 4 Electricity Totals
  const elecPeaTotal =
    (Number(formData.elec_meter1_ms1_ms3_tf) || 0) +
    (Number(formData.elec_meter2_utl) || 0) +
    (Number(formData.elec_meter3_ms2_mix) || 0);

  const elecSolarTotal =
    (Number(formData.solar_meter1_ms2) || 0) + (Number(formData.solar_meter2_tf) || 0);

  const elecGrandTotal = elecPeaTotal + elecSolarTotal;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] space-y-6 pb-28">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 md:right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}



      {/* STATUS & REJECT REASON ALERT */}
      {rejectReason && status === 'draft' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs">คำขอถูกตีกลับจากผู้อนุมัติ</h4>
            <p className="text-xs text-rose-700 mt-0.5">{rejectReason}</p>
          </div>
        </div>
      )}

      {/* REPORTER IDENTIFICATION CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">ข้อมูลผู้บันทึกรายงาน</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
          <input
            type="text"
            disabled={isFormLocked}
            value={formData.reporter_name}
            onChange={(e) => handleInputChange('reporter_name', e.target.value)}
            placeholder="ชื่อ-นามสกุล ผู้บันทึก *"
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium text-slate-800 disabled:opacity-60 min-w-[200px]"
          />
          <div className="relative inline-flex items-center min-w-[130px]">
            <input
              type="date"
              disabled={isFormLocked}
              value={formData.report_date}
              onChange={(e) => handleInputChange('report_date', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium disabled:opacity-60 cursor-pointer"
              style={{ color: 'transparent', caretColor: 'transparent' }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
              <span className="text-xs font-medium text-slate-800">
                {formData.report_date
                  ? (() => {
                    const parts = formData.report_date.split('-');
                    if (parts.length === 3) {
                      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
                    }
                    return formData.report_date;
                  })()
                  : 'dd/mm/yyyy'}
              </span>
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* 5 CATEGORY SELECTION HUB TABS */}
      {!isHideCategoryTabs && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 pb-2">
            เลือกหมวดข้อมูลที่ต้องการกรอก (Select Category)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">

            <button
              onClick={() => setActiveCategory('cat1')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat1'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
            >
              <Droplets className="w-4 h-4 text-amber-500" />
              <span>1. ตะกอน (Sludge)</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat2')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat2'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                }`}
            >
              <Factory className="w-4 h-4 text-blue-500" />
              <span>2. การผลิต (Production)</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat3')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat3'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-orange-50 text-orange-900 border border-orange-200 hover:bg-orange-100'
                }`}
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>3. น้ำมันเตา (Fuel Oil)</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat4')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat4'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'
                }`}
            >
              <Zap className="w-4 h-4 text-sky-500" />
              <span>4. ไฟฟ้า & โซลาร์</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat5')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat5'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                }`}
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>5. WWT & Biogas</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat6')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat6'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
            >
              <FlaskConical className="w-4 h-4 text-purple-500" />
              <span>6. สารเคมี (Chemical)</span>
            </button>
          </div>
        </div>
      )}

      {/* CATEGORY 1: ตะกอน (SLUDGE) */}
      {activeCategory === 'cat1' && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
                1
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span>หมวดที่ 1: ตะกอน (Sludge Removal)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  กรอกข้อมูลขนกำจัดตะกอนและรถดูดตะกอน คำนวณราคารวมอัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          {/* MAIN SLUDGE REMOVAL FIELDS */}
          <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>ข้อมูลการขนกำจัดตะกอน (ทั่วไป)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sludge Removal (รายละเอียดการขนกำจัด)</label>
                <input
                  type="text"
                  disabled={isFormLocked}
                  value={formData.sludge_removal_desc || ''}
                  onChange={(e) => handleInputChange('sludge_removal_desc', e.target.value)}
                  placeholder="เช่น ขนกำจัดตะกอนระบบบำบัดน้ำเสีย ล็อตที่ 1"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ขนกำจัดตะกอน (ตัน)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.sludge_tons || ''}
                  onChange={(e) => handleInputChange('sludge_tons', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">จำนวนเที่ยว (เที่ยว)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.sludge_trips || ''}
                  onChange={(e) => handleInputChange('sludge_trips', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ราคากำจัด (บาท/ตัน)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.sludge_disposal_price || ''}
                  onChange={(e) => handleInputChange('sludge_disposal_price', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ราคาเที่ยว (บาท/เที่ยว)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.sludge_trip_price || ''}
                  onChange={(e) => handleInputChange('sludge_trip_price', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2 bg-amber-100/70 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  รวม (บาท) = ((จำนวนขนตะกอน × ราคากำจัด) + ราคาเที่ยว) × จำนวนเที่ยว:
                </span>
                <span className="text-base font-black text-amber-900">
                  {mainSludgeTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })} <span className="text-xs font-semibold">บาท</span>
                </span>
              </div>
            </div>
          </div>

          {/* CHECKBOXES: รถดูดตะกอน & ตัวคำนวณต้นทุนประหยัดตะกอน */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">
              <input
                type="checkbox"
                disabled={isFormLocked}
                checked={Boolean(formData.sludge_use_vacuum_truck)}
                onChange={(e) => handleInputChange('sludge_use_vacuum_truck', e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-extrabold text-slate-900">
                ☑️ เพิ่มข้อมูล "รถดูดตะกอน" (เปิดช่องกรอกเพิ่มเติม)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer bg-[#1C6E5A]/10 p-3 rounded-xl border border-[#1C6E5A]/30 hover:bg-[#1C6E5A]/20 transition-all">
              <input
                type="checkbox"
                disabled={isFormLocked}
                checked={Boolean(formData.sludge_use_saving_calc)}
                onChange={(e) => {
                  handleInputChange('sludge_use_saving_calc', e.target.checked);
                }}
                className="w-4 h-4 rounded text-[#1C6E5A] focus:ring-[#1C6E5A] cursor-pointer"
              />
              <span className="text-xs font-extrabold text-[#123F33] flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#1C6E5A]" />
                <span>ตัวคำนวณต้นทุนประหยัด: การจัดการตะกอน (Sludge Cost-Saving)</span>
              </span>
            </label>
          </div>

          {/* VACUUM TRUCK EXPANDABLE FORM */}
          {formData.sludge_use_vacuum_truck && (
            <div className="space-y-3 bg-amber-100/40 p-4 rounded-xl border border-amber-300 animate-in fade-in zoom-in-95">
              <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-700" />
                <span>ข้อมูลรถดูดตะกอน (Vacuum Truck Removal)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sludge Removal (รายละเอียดรถดูด)</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_removal_desc || ''}
                    onChange={(e) => handleInputChange('sludge_vac_removal_desc', e.target.value)}
                    placeholder="เช่น รถดูดตะกอนบ่อตกตะกอน Mix2"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ปริมาณดูดตะกอน (ตัน)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_tons || ''}
                    onChange={(e) => handleInputChange('sludge_vac_tons', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">จำนวนเที่ยว (เที่ยว)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_trips || ''}
                    onChange={(e) => handleInputChange('sludge_vac_trips', Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ราคากำจัด (บาท/ตัน)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_disposal_price || ''}
                    onChange={(e) => handleInputChange('sludge_vac_disposal_price', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ราคาเที่ยว (บาท/เที่ยว)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_trip_price || ''}
                    onChange={(e) => handleInputChange('sludge_vac_trip_price', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div className="sm:col-span-2 bg-amber-200/80 p-3 rounded-xl border border-amber-300 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">
                    รวมรถดูดตะกอน (บาท):
                  </span>
                  <span className="text-base font-black text-amber-950">
                    {vacSludgeTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })} <span className="text-xs font-semibold">บาท</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SLUDGE COST-SAVING CALCULATOR EXPANDABLE FORM */}
          {formData.sludge_use_saving_calc && (() => {
            const currentSludgeTon = Number(formData.sludge_tons) || 0;
            const dispRate = Number(formData.sludge_saving_disposal_rate) || 0;
            const transRate = Number(formData.sludge_saving_transport_rate) || 0;
            const bagC = Number(formData.sludge_saving_bag_cost) || 0;
            const bagBasis = Number(formData.sludge_saving_bag_basis) || 0;
            const polyRate = Number(formData.sludge_saving_polymer_rate) || 0;
            const polyUsed = Number(formData.sludge_saving_polymer_used) || 0;
            const oRate = Number(formData.sludge_saving_oil_rate) || 0;
            const oUsed = Number(formData.sludge_saving_oil_used) || 0;

            const totalRatePerTon = dispRate + transRate;
            const totalDisposal = currentSludgeTon * totalRatePerTon;
            const bagRatePerTon = bagBasis !== 0 ? bagC / bagBasis : 0;
            const bagApplied = currentSludgeTon * bagRatePerTon;
            const polymerApplied = polyUsed * currentSludgeTon;
            const oilApplied = oRate * oUsed;
            const totalActual = bagApplied + polymerApplied + oilApplied;
            const saving = totalDisposal - totalActual;
            const savingPerTon = currentSludgeTon !== 0 ? saving / currentSludgeTon : 0;
            const savingPct = totalDisposal !== 0 ? Math.max(0, Math.min(100, (saving / totalDisposal) * 100)) : 0;

            const fmt = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

            const formattedTopDate = formData.report_date
              ? (() => {
                const parts = formData.report_date.split('-');
                if (parts.length === 3) {
                  return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
                }
                return formData.report_date;
              })()
              : 'ยังไม่ได้เลือกวันที่';

            const handleResetCalc = () => {
              handleInputChange('sludge_saving_disposal_rate', 0);
              handleInputChange('sludge_saving_transport_rate', 0);
              handleInputChange('sludge_saving_bag_cost', 0);
              handleInputChange('sludge_saving_bag_basis', 0);
              handleInputChange('sludge_saving_polymer_rate', 0);
              handleInputChange('sludge_saving_polymer_used', 0);
              handleInputChange('sludge_saving_oil_rate', 0);
              handleInputChange('sludge_saving_oil_used', 0);
              handleInputChange('sludge_saving_total_disposal', 0);
              handleInputChange('sludge_saving_total_actual', 0);
              handleInputChange('sludge_saving_net_baht', 0);
              handleInputChange('sludge_saving_per_ton', 0);
              handleInputChange('sludge_saving_pct', 0);
            };

            const handleCopySummary = () => {
              const text = `สรุปผลประหยัดต้นทุนการจัดการตะกอน — ประจำวันที่ ${formattedTopDate}
ปริมาณตะกอน: ${fmt(currentSludgeTon)} ตัน
ค่ากำจัดรวม (เดิม): ${fmt(totalDisposal)} บาท
รวมค่าใช้จ่ายจริง: ${fmt(totalActual)} บาท
  - ค่าถุงกรองตะกอน: ${fmt(bagApplied)} บาท
  - ค่าโพลิเมอร์: ${fmt(polymerApplied)} บาท
  - ค่าน้ำมันเชื้อเพลิง: ${fmt(oilApplied)} บาท
ประหยัดได้: ${fmt(saving)} บาท (${fmt(savingPerTon)} บาท/ตัน, ${Math.round(savingPct)}%)`;

              navigator.clipboard.writeText(text);
              setSavingCopied(true);
              setTimeout(() => setSavingCopied(false), 2000);
            };

            return (
              <div className="space-y-4 bg-[#EEF2F0] p-5 rounded-2xl border border-[#CBD6D0] animate-in fade-in zoom-in-95 text-[#13262C]">
                {/* Header of Saving Form */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#CBD6D0] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DE9F35] shadow-[0_0_0_2px_rgba(222,159,53,0.25)] shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-[#123F33] uppercase tracking-wide flex items-center gap-2">
                        <span>ตัวคำนวณต้นทุนประหยัด: การจัดการตะกอน</span>
                        <span className="text-[10px] font-mono font-bold bg-[#1C6E5A]/15 text-[#1C6E5A] px-2 py-0.5 rounded">
                          UTILITY · SLUDGE SAVING
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#4C6058] font-medium mt-0.5">
                        คำนวณเปรียบเทียบค่าใช้จ่ายเดิมกับค่าใช้จ่ายจริง (อ้างอิงจากปริมาณตะกอน {fmt(currentSludgeTon)} ตัน ด้านบน)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="py-1.5 px-3 bg-[#1C6E5A] hover:bg-[#123F33] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      {savingCopied ? <Check className="w-3.5 h-3.5 text-[#DE9F35]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{savingCopied ? 'คัดลอกแล้ว ✓' : 'คัดลอกสรุป'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetCalc}
                      className="py-1.5 px-3 bg-white hover:bg-slate-100 text-[#4C6058] text-xs font-bold rounded-lg border border-[#CBD6D0] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>รีเซ็ตเป็น 0</span>
                    </button>
                  </div>
                </div>

                {/* Date Synchronization from Top */}
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#CBD6D0]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1C6E5A]" />
                    <span className="text-xs font-mono font-bold uppercase text-[#4C6058]">วันที่บันทึกรายงาน:</span>
                  </div>
                  <div className="px-3 py-1 bg-[#1C6E5A]/10 border border-[#1C6E5A]/25 rounded-lg text-xs font-mono font-black text-[#123F33]">
                    {formattedTopDate}
                  </div>
                </div>

                {/* FLOW MEASUREMENT & SLUDGE REMOVAL CALCULATION BAR */}
                {(() => {
                  const flowBefore = Number(formData.sludge_saving_flow_before) || 0;
                  const flowAfter = Number(formData.sludge_saving_flow_after) || 0;
                  const flowDiff = flowAfter - flowBefore;
                  const removalTon = flowDiff * 0.05;

                  return (
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#CBD6D0] shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-dashed border-[#CBD6D0] pb-2.5">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-[#1C6E5A]" />
                          <span className="text-xs font-bold text-[#123F33] uppercase tracking-wide">
                            ตรวจวัดอัตราการไหล & คำนวณปริมาณตะกอน (Flow & Sludge Removal)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-[#1C6E5A]/10 text-[#1C6E5A] px-2 py-0.5 rounded">
                          Flow × 5%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        
                        {/* 1. Flow Before */}
                        <div className="bg-[#FBFCFB] p-3 rounded-xl border border-slate-200/90 shadow-xs hover:border-[#1C6E5A]/50 transition-all flex flex-col justify-between">
                          <span className="text-[11px] font-bold text-[#4C6058] block mb-1.5">
                            Flow ก่อนดูด (Before)
                          </span>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="any"
                              disabled={isFormLocked}
                              value={formData.sludge_saving_flow_before || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                handleInputChange('sludge_saving_flow_before', val);
                                const newDiff = flowAfter - val;
                                const newTon = newDiff * 0.05;
                                handleInputChange('sludge_saving_flow_diff', newDiff);
                                handleInputChange('sludge_saving_removal_ton', newTon);
                              }}
                              placeholder="0.00"
                              className="w-full font-mono text-sm font-bold pl-3 pr-14 py-2 rounded-lg border border-slate-200 bg-white focus:border-[#1C6E5A] focus:ring-1 focus:ring-[#1C6E5A] focus:outline-none text-[#13262C]"
                            />
                            <span className="absolute right-2.5 text-[11px] font-mono font-bold text-slate-400 pointer-events-none">
                              m³/h
                            </span>
                          </div>
                        </div>

                        {/* 2. Flow After */}
                        <div className="bg-[#FBFCFB] p-3 rounded-xl border border-slate-200/90 shadow-xs hover:border-[#1C6E5A]/50 transition-all flex flex-col justify-between">
                          <span className="text-[11px] font-bold text-[#4C6058] block mb-1.5">
                            Flow หลังดูด (After)
                          </span>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="any"
                              disabled={isFormLocked}
                              value={formData.sludge_saving_flow_after || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                handleInputChange('sludge_saving_flow_after', val);
                                const newDiff = val - flowBefore;
                                const newTon = newDiff * 0.05;
                                handleInputChange('sludge_saving_flow_diff', newDiff);
                                handleInputChange('sludge_saving_removal_ton', newTon);
                              }}
                              placeholder="0.00"
                              className="w-full font-mono text-sm font-bold pl-3 pr-14 py-2 rounded-lg border border-slate-200 bg-white focus:border-[#1C6E5A] focus:ring-1 focus:ring-[#1C6E5A] focus:outline-none text-[#13262C]"
                            />
                            <span className="absolute right-2.5 text-[11px] font-mono font-bold text-slate-400 pointer-events-none">
                              m³/h
                            </span>
                          </div>
                        </div>

                        {/* 3. after-before / Flow ดูด */}
                        <div className="bg-[#1C6E5A]/5 p-3 rounded-xl border border-[#1C6E5A]/25 shadow-xs flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-[#123F33]">
                              Flow ดูด (After − Before)
                            </span>
                            <span className="text-[9px] font-mono text-[#1C6E5A] font-bold bg-[#1C6E5A]/10 px-1.5 py-0.5 rounded">FX</span>
                          </div>
                          <div className="flex items-baseline justify-between bg-white px-3 py-2 rounded-lg border border-[#1C6E5A]/20">
                            <span className="font-mono text-base font-black text-[#123F33]">
                              {flowDiff.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-[#1C6E5A]">
                              m³/h
                            </span>
                          </div>
                        </div>

                        {/* 4. Flow ดูด * 5% / sludge removal Ton */}
                        <div className="bg-[#DE9F35]/10 p-3 rounded-xl border border-[#DE9F35]/35 shadow-xs flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-amber-950">
                              ปริมาณตะกอน (Flow ดูด × 5%)
                            </span>
                            <span className="text-[9px] font-mono text-amber-900 font-bold bg-[#DE9F35]/20 px-1.5 py-0.5 rounded">FX</span>
                          </div>
                          <div className="flex items-baseline justify-between bg-white px-3 py-2 rounded-lg border border-[#DE9F35]/30">
                            <span className="font-mono text-base font-black text-amber-900">
                              {removalTon.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[11px] font-mono font-extrabold text-amber-800">
                              Ton (ตัน)
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}

                {/* 4 Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CARD 01 */}
                  <div className="bg-white border border-[#CBD6D0] rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-dashed border-[#CBD6D0] pb-2">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-[#13262C]">
                        <Truck className="w-3.5 h-3.5 text-[#1C6E5A]" />
                        <span>01. ค่ากำจัด & ค่าขนส่ง</span>
                      </span>
                      <span className="font-mono font-black text-xs text-[#123F33] bg-[#1C6E5A]/10 px-2 py-0.5 rounded">
                        {fmt(totalDisposal)} บาท
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-[#4C6058] font-bold mb-1">ค่ากำจัด (บาท/ตัน)</label>
                        <input
                          type="number"
                          disabled={isFormLocked}
                          value={formData.sludge_saving_disposal_rate || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleInputChange('sludge_saving_disposal_rate', val);
                            handleInputChange('sludge_saving_total_disposal', currentSludgeTon * (val + transRate));
                            handleInputChange('sludge_saving_net_baht', currentSludgeTon * (val + transRate) - totalActual);
                          }}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#4C6058] font-bold mb-1">ค่าขนส่ง (บาท/ตัน)</label>
                        <input
                          type="number"
                          disabled={isFormLocked}
                          value={formData.sludge_saving_transport_rate || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleInputChange('sludge_saving_transport_rate', val);
                            handleInputChange('sludge_saving_total_disposal', currentSludgeTon * (dispRate + val));
                            handleInputChange('sludge_saving_net_baht', currentSludgeTon * (dispRate + val) - totalActual);
                          }}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[#1C6E5A]/5 border border-dashed border-[#1C6E5A]/30 text-[10px] font-mono text-[#123F33]">
                      FX: {fmt(currentSludgeTon)} × ({fmt(dispRate)} + {fmt(transRate)}) = {fmt(totalDisposal)} บาท
                    </div>
                  </div>

                  {/* CARD 02 */}
                  <div className="bg-white border border-[#CBD6D0] rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-dashed border-[#CBD6D0] pb-2">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-[#13262C]">
                        <Package className="w-3.5 h-3.5 text-[#1C6E5A]" />
                        <span>02. ถุงกรองตะกอน (Dewatering Bag)</span>
                      </span>
                      <span className="font-mono font-black text-xs text-[#123F33] bg-[#1C6E5A]/10 px-2 py-0.5 rounded">
                        {fmt(bagApplied)} บาท
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-[#4C6058] font-bold mb-1">ค่าใช้จ่ายรวม (บาท)</label>
                        <input
                          type="number"
                          disabled={isFormLocked}
                          value={formData.sludge_saving_bag_cost || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleInputChange('sludge_saving_bag_cost', val);
                          }}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#4C6058] font-bold mb-1">ตะกอนอ้างอิง (ตัน)</label>
                        <input
                          type="number"
                          disabled={isFormLocked}
                          value={formData.sludge_saving_bag_basis || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleInputChange('sludge_saving_bag_basis', val);
                          }}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[#1C6E5A]/5 border border-dashed border-[#1C6E5A]/30 text-[10px] font-mono text-[#123F33]">
                      FX: {fmt(currentSludgeTon)} × ({fmt(bagC)} ÷ {fmt(bagBasis)}) = {fmt(bagApplied)} บาท
                    </div>
                  </div>

                  {/* CARD 03 */}
                  <div className="bg-white border border-[#CBD6D0] rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-dashed border-[#CBD6D0] pb-2">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-[#13262C]">
                        <Droplets className="w-3.5 h-3.5 text-[#1C6E5A]" />
                        <span>03. โพลิเมอร์ (Polymer)</span>
                      </span>
                      <span className="font-mono font-black text-xs text-[#123F33] bg-[#1C6E5A]/10 px-2 py-0.5 rounded">
                        {fmt(polymerApplied)} บาท
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-[#4C6058] font-bold mb-1">ราคาอ้างอิง (บาท/กก.)</label>
                        <input
                          type="number"
                          disabled={isFormLocked}
                          value={formData.sludge_saving_polymer_rate || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleInputChange('sludge_saving_polymer_rate', val);
                          }}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#4C6058] font-bold mb-1">ปริมาณที่ใช้ (กก.)</label>
                        <input
                          type="number"
                          disabled={isFormLocked}
                          value={formData.sludge_saving_polymer_used || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleInputChange('sludge_saving_polymer_used', val);
                          }}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[#1C6E5A]/5 border border-dashed border-[#1C6E5A]/30 text-[10px] font-mono text-[#123F33]">
                      FX: {fmt(polyUsed)} × {fmt(currentSludgeTon)} = {fmt(polymerApplied)} บาท
                    </div>
                  </div>

                  {/* CARD 04 */}
                  <div className="bg-white border border-[#CBD6D0] rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-dashed border-[#CBD6D0] pb-2">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-[#13262C]">
                        <Fuel className="w-3.5 h-3.5 text-[#1C6E5A]" />
                        <span>04. น้ำมันเชื้อเพลิง (Oil)</span>
                      </span>
                      <span className="font-mono font-black text-xs text-[#123F33] bg-[#1C6E5A]/10 px-2 py-0.5 rounded">
                        {fmt(oilApplied)} บาท
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-[#4C6058] font-bold mb-1">ราคา (บาท/ลิตร)</label>
                        <input
                          type="number"
                          disabled={isFormLocked}
                          value={formData.sludge_saving_oil_rate || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleInputChange('sludge_saving_oil_rate', val);
                          }}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#4C6058] font-bold mb-1">ปริมาณที่ใช้ (ลิตร)</label>
                        <input
                          type="number"
                          disabled={isFormLocked}
                          value={formData.sludge_saving_oil_used || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleInputChange('sludge_saving_oil_used', val);
                          }}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold p-2 rounded-lg border border-[#CBD6D0] bg-[#FBFCFB] focus:border-[#1C6E5A] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[#1C6E5A]/5 border border-dashed border-[#1C6E5A]/30 text-[10px] font-mono text-[#123F33]">
                      FX: {fmt(oRate)} × {fmt(oUsed)} = {fmt(oilApplied)} บาท
                    </div>
                  </div>
                </div>

                {/* Summary Results Card */}
                <div className="bg-[#123F33] text-[#EAF2EF] rounded-2xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `conic-gradient(#DE9F35 ${savingPct}%, rgba(255,255,255,0.12) 0)`,
                      }}
                    >
                      <div className="w-14 h-14 rounded-full bg-[#123F33] flex flex-col items-center justify-center shadow-inner">
                        <span className="font-mono text-sm font-black">{Math.round(savingPct)}%</span>
                        <span className="text-[7px] text-[#9FC2B5]">ประหยัด</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#B9D6CB] block">
                        ผลประหยัดต้นทุนสุทธิ (Total Cost Saving)
                      </span>
                      <div className="font-mono text-2xl font-black text-white">
                        {fmt(saving)} <span className="text-xs font-medium text-[#B9D6CB]">บาท</span>
                      </div>
                      <div className="font-mono text-xs text-[#DE9F35] font-bold">
                        ≈ {fmt(savingPerTon)} บาท/ตัน
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-6 w-full sm:w-auto">
                    <div className="flex justify-between sm:justify-end gap-3 text-slate-300">
                      <span>ค่ากำจัดเดิมรวม:</span>
                      <strong className="font-mono text-white">{fmt(totalDisposal)} ฿</strong>
                    </div>
                    <div className="flex justify-between sm:justify-end gap-3 text-slate-300">
                      <span>รวมค่าใช้จ่ายจริง:</span>
                      <strong className="font-mono text-white">{fmt(totalActual)} ฿</strong>
                    </div>
                  </div>
                </div>

                {/* Breakdown Cost Table Matching HTML Source */}
                <div className="bg-white border border-[#CBD6D0] rounded-xl p-4 shadow-xs space-y-2 text-xs">
                  <h5 className="font-mono font-bold uppercase text-[#4C6058] border-b border-[#CBD6D0]/60 pb-2">
                    สรุปแจกแจงค่าใช้จ่าย (Cost Breakdown)
                  </h5>
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
                  <div className="p-2 rounded-lg bg-[#1C6E5A]/5 border border-dashed border-[#1C6E5A]/30 text-[10px] font-mono text-[#123F33]">
                    FX: {fmt(totalDisposal)} − ({fmt(bagApplied)} + {fmt(polymerApplied)} + {fmt(oilApplied)}) = {fmt(totalDisposal)} − {fmt(totalActual)} = {fmt(saving)} บาท
                  </div>
                </div>
              </div>
            );
          })()}

          {/* GRAND TOTAL SLUDGE SUMMARY */}
          <div className="bg-amber-900 text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
              ยอดเงินรวมหมวดตะกอนทั้งหมด (Grand Total Sludge Cost):
            </span>
            <span className="text-xl font-black text-amber-300">
              {grandSludgeTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-normal text-white">บาท</span>
            </span>
          </div>
        </div>
      )}

      {/* CATEGORY 2: การผลิต (PRODUCTION) */}
      {activeCategory === 'cat2' && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                2
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Factory className="w-5 h-5 text-blue-600" />
                  <span>หมวดที่ 2: การผลิต (Production)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  กรอกข้อมูลผลผลิต MS1, MS2, MS3 คำนวณรวม 3 MS อัตโนมัติ
                </p>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">MS1 (ตัน)</label>
              <input
                type="number"
                disabled={isFormLocked}
                value={formData.production_ms1 || ''}
                onChange={(e) => handleInputChange('production_ms1', Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">MS2 (ตัน)</label>
              <input
                type="number"
                disabled={isFormLocked}
                value={formData.production_ms2 || ''}
                onChange={(e) => handleInputChange('production_ms2', Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">MS3 (ตัน)</label>
              <input
                type="number"
                disabled={isFormLocked}
                value={formData.production_ms3 || ''}
                onChange={(e) => handleInputChange('production_ms3', Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="bg-blue-900 text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              รวมผลผลิต 3 MS ทั้งหมด (Total Production MS1 + MS2 + MS3):
            </span>
            <span className="text-xl font-black text-blue-300">
              {prodTotalMS.toLocaleString('th-TH', { maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-normal text-white">ตัน</span>
            </span>
          </div>
        </div>
      )}

      {/* CATEGORY 3: น้ำมันเตา (FUEL OIL) */}
      {activeCategory === 'cat3' && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm">
                3
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <span>หมวดที่ 3: น้ำมันเตา (Bunker Oil)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ปริมาณแก๊สที่ใช้ MS1, MS2, MS3 และ น้ำมันเตา A
                </p>
              </div>
            </div>

          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. น้ำมันเตา (Bunker oil)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MS1 (ลิตร)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.fuel_oil_a_ms1_liter || ''}
                  onChange={(e) => {
                    const ms1 = Number(e.target.value);
                    const ms2 = Number(formData.fuel_oil_a_ms2_liter) || 0;
                    const ms3 = Number(formData.fuel_oil_a_ms3_liter) || 0;
                    const newTotalLiters = ms1 + ms2 + ms3;
                    const price = Number(formData.fuel_oil_price_per_liter) || 0;
                    handleMultiInputChange({
                      fuel_oil_a_ms1_liter: ms1,
                      fuel_oil_a_baht: Math.round(newTotalLiters * price * 100) / 100,
                    });
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MS2 (ลิตร)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.fuel_oil_a_ms2_liter || ''}
                  onChange={(e) => {
                    const ms1 = Number(formData.fuel_oil_a_ms1_liter) || 0;
                    const ms2 = Number(e.target.value);
                    const ms3 = Number(formData.fuel_oil_a_ms3_liter) || 0;
                    const newTotalLiters = ms1 + ms2 + ms3;
                    const price = Number(formData.fuel_oil_price_per_liter) || 0;
                    handleMultiInputChange({
                      fuel_oil_a_ms2_liter: ms2,
                      fuel_oil_a_baht: Math.round(newTotalLiters * price * 100) / 100,
                    });
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MS3 (ลิตร)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.fuel_oil_a_ms3_liter || ''}
                  onChange={(e) => {
                    const ms1 = Number(formData.fuel_oil_a_ms1_liter) || 0;
                    const ms2 = Number(formData.fuel_oil_a_ms2_liter) || 0;
                    const ms3 = Number(e.target.value);
                    const newTotalLiters = ms1 + ms2 + ms3;
                    const price = Number(formData.fuel_oil_price_per_liter) || 0;
                    handleMultiInputChange({
                      fuel_oil_a_ms3_liter: ms3,
                      fuel_oil_a_baht: Math.round(newTotalLiters * price * 100) / 100,
                    });
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-orange-100/70 p-3 rounded-xl border border-orange-200 flex flex-col justify-between">
                <span className="text-xs font-bold text-orange-950">น้ำมันเตาที่ใช้ทั้งหมด (ลิตร):</span>
                <span className="text-base font-black text-orange-950 mt-1">
                  {fuelOilTotalLiter.toLocaleString('th-TH', { maximumFractionDigits: 2 })} ลิตร
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ราคาน้ำมันเตา (บาท/ลิตร)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.fuel_oil_price_per_liter || ''}
                  onChange={(e) => {
                    const price = Number(e.target.value);
                    const calculatedTotalBaht = Math.round(fuelOilTotalLiter * price * 100) / 100;
                    handleMultiInputChange({
                      fuel_oil_price_per_liter: price,
                      fuel_oil_a_baht: calculatedTotalBaht,
                    });
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div className="bg-orange-50 p-3 rounded-xl border border-orange-200/90 flex flex-col justify-between">
                <label className="block text-xs font-bold text-orange-950">ราคาน้ำมันเตารวม (บาท)</label>
                <div className="text-base font-black text-orange-950 mt-1">
                  {(formData.fuel_oil_a_baht || (fuelOilTotalLiter * (formData.fuel_oil_price_per_liter || 0))).toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท
                </div>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-2">
              2. ปริมาณแก๊สที่ใช้ (Biogas Consumption)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ปริมาณแก๊ส MS1 (Nm³)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.gas_ms1_m3 || ''}
                  onChange={(e) => handleInputChange('gas_ms1_m3', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ปริมาณแก๊ส MS2 (Nm³)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.gas_ms2_m3 || ''}
                  onChange={(e) => handleInputChange('gas_ms2_m3', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ปริมาณแก๊ส MS3 (Nm³)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.gas_ms3_m3 || ''}
                  onChange={(e) => handleInputChange('gas_ms3_m3', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="bg-orange-100/70 p-3 rounded-xl border border-orange-200 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-950">รวมแก๊สที่ใช้ทั้งหมด (Nm³):</span>
              <span className="text-base font-black text-orange-950">
                {gasTotalM3.toLocaleString('th-TH', { maximumFractionDigits: 2 })} Nm³
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 4: ไฟฟ้า & โซลาร์ (ELECTRICITY & SOLAR METERS) */}
      {activeCategory === 'cat4' && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-sm overflow-hidden space-y-6 p-6 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-base">
                4
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 tracking-wide">
                  <Zap className="w-5 h-5 text-sky-600" />
                  <span>หมวดที่ 4: ไฟฟ้า (Electricity & Solar Meters)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  กรอกข้อมูลมิเตอร์ไฟฟ้า On Peak / Off Peak และ มิเตอร์ Solar
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. MS3, MS1, TF (KWH) */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
                    MS3, MS1, TF (KWH)
                  </h4>
                  <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                    รวม: {((Number(formData.elec_ms3_ms1_tf_on_peak) || 0) + (Number(formData.elec_ms3_ms1_tf_off_peak) || 0)).toLocaleString('th-TH')} kWh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">On Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_ms3_ms1_tf_on_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_ms3_ms1_tf_on_peak', val);
                        const off = Number(formData.elec_ms3_ms1_tf_off_peak) || 0;
                        handleInputChange('elec_meter1_ms1_ms3_tf', val + off);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Off Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_ms3_ms1_tf_off_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_ms3_ms1_tf_off_peak', val);
                        const on = Number(formData.elec_ms3_ms1_tf_on_peak) || 0;
                        handleInputChange('elec_meter1_ms1_ms3_tf', on + val);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 2. MS 2 MIX (KWH) */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
                    MS 2 MIX (KWH)
                  </h4>
                  <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                    รวม: {((Number(formData.elec_ms2_mix_on_peak) || 0) + (Number(formData.elec_ms2_mix_off_peak) || 0)).toLocaleString('th-TH')} kWh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">On Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_ms2_mix_on_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_ms2_mix_on_peak', val);
                        const off = Number(formData.elec_ms2_mix_off_peak) || 0;
                        handleInputChange('elec_meter3_ms2_mix', val + off);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Off Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_ms2_mix_off_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_ms2_mix_off_peak', val);
                        const on = Number(formData.elec_ms2_mix_on_peak) || 0;
                        handleInputChange('elec_meter3_ms2_mix', on + val);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 3. UTL (KWH) */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
                    UTL (KWH)
                  </h4>
                  <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                    รวม: {((Number(formData.elec_utl_on_peak) || 0) + (Number(formData.elec_utl_off_peak) || 0)).toLocaleString('th-TH')} kWh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">On Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_utl_on_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_utl_on_peak', val);
                        const off = Number(formData.elec_utl_off_peak) || 0;
                        handleInputChange('elec_meter2_utl', val + off);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Off Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_utl_off_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_utl_off_peak', val);
                        const on = Number(formData.elec_utl_on_peak) || 0;
                        handleInputChange('elec_meter2_utl', on + val);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 4. SOLAR (KWH) */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
                    SOLAR (KWH)
                  </h4>
                  <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                    รวม: {((Number(formData.solar_meter1_ms2) || 0) + (Number(formData.solar_meter2_tf) || 0)).toLocaleString('th-TH')} kWh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">มิเตอร์ 1 (MS2)</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.solar_meter1_ms2 || ''}
                      onChange={(e) => handleInputChange('solar_meter1_ms2', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">มิเตอร์ 2 (TF)</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.solar_meter2_tf || ''}
                      onChange={(e) => handleInputChange('solar_meter2_tf', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. ค่าไฟฟ้า (บาท) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ค่าไฟฟ้าประจำเดือน (บาท)
              </h4>
              <input
                type="number"
                disabled={isFormLocked}
                value={formData.electricity_baht || ''}
                onChange={(e) => handleInputChange('electricity_baht', Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
              />
            </div>

            {/* OVERALL ON PEAK / OFF PEAK SUMMARY BADGES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-sky-800 uppercase">รวม On Peak ทั้งหมด</span>
                <span className="text-sm font-black text-sky-900">
                  {((Number(formData.elec_ms3_ms1_tf_on_peak) || 0) + (Number(formData.elec_ms2_mix_on_peak) || 0) + (Number(formData.elec_utl_on_peak) || 0)).toLocaleString('th-TH')} <span className="text-[10px] font-medium text-slate-500">kWh</span>
                </span>
              </div>

              <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-sky-800 uppercase">รวม Off Peak ทั้งหมด</span>
                <span className="text-sm font-black text-sky-900">
                  {((Number(formData.elec_ms3_ms1_tf_off_peak) || 0) + (Number(formData.elec_ms2_mix_off_peak) || 0) + (Number(formData.elec_utl_off_peak) || 0)).toLocaleString('th-TH')} <span className="text-[10px] font-medium text-slate-500">kWh</span>
                </span>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-amber-800 uppercase">รวม Solar ทั้งหมด</span>
                <span className="text-sm font-black text-amber-900">
                  {((Number(formData.solar_meter1_ms2) || 0) + (Number(formData.solar_meter2_tf) || 0)).toLocaleString('th-TH')} <span className="text-[10px] font-medium text-slate-500">kWh</span>
                </span>
              </div>
            </div>

            <div className="bg-sky-900 text-white p-3.5 rounded-xl flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                รวมไฟฟ้า PEA + โซลาร์ ทั้งหมด (Total Electricity kWh):
              </span>
              <span className="text-lg font-black text-sky-300">
                {elecGrandTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })}{' '}
                <span className="text-xs font-normal text-white">kWh</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 5: WWT & BIOGAS */}
      {activeCategory === 'cat5' && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                5
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <span>หมวดที่ 5: ระบบบำบัดน้ำเสีย & ก๊าซชีวภาพ (WWT & Biogas)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ข้อมูลบำบัดน้ำเสีย (WWT) ฝั่งซ้าย และ ข้อมูลก๊าซชีวภาพ (Biogas) ฝั่งขวา
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WWT SIDE (LEFT) */}
            <div className="space-y-4 bg-slate-50 text-slate-800 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-sm font-black text-emerald-700 uppercase tracking-wider">
                  WWT (ระบบบำบัดน้ำเสีย)
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Wastewater Treatment
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">COD Native</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.wwt_cod_native || ''}
                    onChange={(e) => handleInputChange('wwt_cod_native', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">CODt Mix1</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.wwt_codt_mix1 || ''}
                    onChange={(e) => handleInputChange('wwt_codt_mix1', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">VFA Mix1</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.wwt_vfa_mix1 || ''}
                    onChange={(e) => handleInputChange('wwt_vfa_mix1', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">pH Mix2</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.wwt_ph_mix2 || ''}
                    onChange={(e) => handleInputChange('wwt_ph_mix2', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">COD Loading (Kg/day):</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    เป้าหมาย &lt; 18,000
                  </span>
                </div>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.wwt_cod_loading || ''}
                  onChange={(e) => handleInputChange('wwt_cod_loading', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-700 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 text-xs font-semibold">COD eff AS</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.wwt_cod_eff_as || ''}
                  onChange={(e) => handleInputChange('wwt_cod_eff_as', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            {/* BIOGAS SIDE (RIGHT) */}
            <div className="space-y-4 bg-slate-50 text-slate-800 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-sm font-black text-sky-700 uppercase tracking-wider">
                  Biogas (ระบบก๊าซชีวภาพ)
                </h4>
                <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold border border-sky-200">
                  Biogas Generation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Flow Feed Mix2</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_flow_feed_mix2 || ''}
                    onChange={(e) => handleInputChange('biogas_flow_feed_mix2', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Biogas Generate</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_generate || ''}
                    onChange={(e) => handleInputChange('biogas_generate', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Biogas Flare</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_flare || ''}
                    onChange={(e) => handleInputChange('biogas_flare', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Boiler Consumption</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_boiler_consumption || ''}
                    onChange={(e) => handleInputChange('biogas_boiler_consumption', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">% CH4</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_pct_ch4 || ''}
                    onChange={(e) => handleInputChange('biogas_pct_ch4', Number(e.target.value))}
                    placeholder="0.00%"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">% H2S</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_pct_h2s || ''}
                    onChange={(e) => handleInputChange('biogas_pct_h2s', Number(e.target.value))}
                    placeholder="0.00%"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Removal</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_removal || ''}
                    onChange={(e) => handleInputChange('biogas_removal', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">SV60 eff Biogas</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_sv60_eff || ''}
                    onChange={(e) => handleInputChange('biogas_sv60_eff', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ADDITIONAL BIOGAS MACHINE PARAMETERS CARD (Flow, Temp, แรงดัน, การเดรนน้ำ Air Dryer, Flare, กระแสมอเตอร์) */}
          <div className="bg-slate-50 text-slate-800 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                บันทึกค่าพารามิเตอร์เครื่องจักร Biogas (Flow, Temp, แรงดัน, Air Dryer, Flare, กระแส)
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                Biogas Parameters
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Flow</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_flow ?? ''}
                  onChange={(e) => handleInputChange('biogas_flow', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Temp (°C)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_temp ?? ''}
                  onChange={(e) => handleInputChange('biogas_temp', Number(e.target.value))}
                  placeholder="0.00 °C"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">แรงดัน</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_pressure ?? ''}
                  onChange={(e) => handleInputChange('biogas_pressure', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">การเดรนน้ำ Air Dryer</label>
                <input
                  type="text"
                  disabled={isFormLocked}
                  value={formData.biogas_air_dryer_drain || ''}
                  onChange={(e) => handleInputChange('biogas_air_dryer_drain', e.target.value)}
                  placeholder="เดรนน้ำ..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Flare</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_flare ?? ''}
                  onChange={(e) => handleInputChange('biogas_flare', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">กระแสมอเตอร์</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_motor_current ?? ''}
                  onChange={(e) => handleInputChange('biogas_motor_current', Number(e.target.value))}
                  placeholder="0.00 A"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 6: สารเคมี (CHEMICAL USAGE & STOCK) */}
      {activeCategory === 'cat6' && (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                6
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                  <span>หมวดที่ 6: สารเคมี (Chemical Usage & Stock)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  กรอกข้อมูลปริมาณสารเคมีที่ได้รับ การใช้งาน และสต็อกคงเหลือประจำวัน
                </p>
              </div>
            </div>
          </div>

          {/* CHEMICAL USAGE & STOCK CARD */}
          <div className="bg-slate-50 text-slate-800 p-5 rounded-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black text-purple-700 uppercase tracking-wider">
                บันทึกปริมาณสารเคมี & สต็อกคงเหลือ (Chemical Usage & Stock)
              </h4>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold border border-purple-200">
                Chemical Stock
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. LIME 90% (20 KG) */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  LIME 90% (20 KG)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_lime_received ?? ''}
                      onChange={(e) => handleInputChange('chem_lime_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_lime_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_lime_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_lime_available ?? ''}
                      onChange={(e) => handleInputChange('chem_lime_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 2. POLYMER (25 KG) */}
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  POLYMER (25 KG)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_polymer_received ?? ''}
                      onChange={(e) => handleInputChange('chem_polymer_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_polymer_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_polymer_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_polymer_available ?? ''}
                      onChange={(e) => handleInputChange('chem_polymer_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 3. ODOR CONTROLLER (20 L) */}
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  ODOR CONTROLLER (20 L)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_odor_received ?? ''}
                      onChange={(e) => handleInputChange('chem_odor_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_odor_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_odor_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_odor_available ?? ''}
                      onChange={(e) => handleInputChange('chem_odor_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 4. FOG CONTROLLER (20 L) */}
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  FOG CONTROLLER (20 L)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_fog_received ?? ''}
                      onChange={(e) => handleInputChange('chem_fog_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_fog_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_fog_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_fog_available ?? ''}
                      onChange={(e) => handleInputChange('chem_fog_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 5. หลอด COD */}
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  หลอด COD
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(หลอด)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_cod_tube_received ?? ''}
                      onChange={(e) => handleInputChange('chem_cod_tube_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(หลอด)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_cod_tube_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_cod_tube_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(หลอด)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_cod_tube_available ?? ''}
                      onChange={(e) => handleInputChange('chem_cod_tube_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      {!isReadOnlyMode && (
        <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 z-20 shadow-lg">
        <div className="flex items-center gap-2">
          {isFormLocked && (
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
              <Lock className="w-4 h-4 text-sky-600" />
              <span>แบบฟอร์มถูกล็อกเนื่องจากอยู่ระหว่างรออนุมัติหรือได้รับการอนุมัติแล้ว</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isReadOnlyMode && (
            <button
              onClick={onCloseModal}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          )}

          {!isReadOnlyMode && onSaveEditItem && (
            <div className="flex items-center gap-3">
              <button
                onClick={onCloseModal}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => onSaveEditItem(formData)}
                className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          )}

          {!isReadOnlyMode && !onSaveEditItem && (
            <>
              {(!isFormLocked || currentUser?.role === 'admin') && (
                <button
                  onClick={handleSubmitClick}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isElevatedUser ? (
                    <>
                      <BadgeCheck className="w-4 h-4 text-emerald-400" />
                      <span>บันทึกข้อมูล</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>ส่งคำขออนุมัติ</span>
                    </>
                  )}
                </button>
              )}

              {(currentUser?.role === 'approver' || currentUser?.role === 'admin') &&
                status === 'pending' && (
                  <>
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>ตีกลับ (Reject)</span>
                    </button>

                    <button
                      onClick={handleApproveClick}
                      className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      <span>อนุมัติรายงาน (Approve)</span>
                    </button>
                  </>
                )}
            </>
          )}
        </div>
      </div>
      )}
      {/* REJECT MODAL DIALOG */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                ระบุเหตุผลในการตีกลับรายงาน (Reject)
              </h3>
            </div>

            <textarea
              rows={3}
              value={rejectInputReason}
              onChange={(e) => setRejectInputReason(e.target.value)}
              placeholder="ระบุข้อผิดพลาด เช่น ข้อมูลไฟฟ้าไม่ตรงกับใบแจ้งหนี้ PEA"
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
    </div>
  );
};
