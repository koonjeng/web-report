'use client';

import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck, CheckCircle2, Loader2, Sparkles, Zap, Activity, BarChart3, Gauge, Cpu } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { signInUser } from '@/lib/supabase';

interface LandingPageProps {
  onContinueAsReporter: () => void;
  onLoginSuccess: (user: { email: string; role: UserRole }) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onContinueAsReporter,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);

    try {
      const result = await signInUser(email, password);
      setLoading(false);

      if ('error' in result) {
        setError(result.error);
        return;
      }

      onLoginSuccess({
        email: result.email,
        role: result.role,
      });
    } catch (err: any) {
      setLoading(false);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1b365d] flex flex-col md:flex-row relative overflow-hidden font-sans select-none">
      
      {/* LEFT HALF: Pure White Area with S-Curve Wave Divider matching template */}
      <div className="w-full md:w-[48%] lg:w-[44%] bg-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative z-10 min-h-screen md:min-h-0 shadow-2xl">
        
        {/* Brand Logo Top Left */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1b365d] to-[#365e94] flex items-center justify-center text-white shadow-md shadow-[#1b365d]/20">
            <Zap className="w-6 h-6 text-sky-400 fill-sky-400/20" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1b365d] tracking-tight leading-tight">
              Utility Management System
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
              Energy & Plant Operations
            </p>
          </div>
        </div>

        {/* Center Artwork: Arch Dome Frame with Modern Energy & Plant Dashboard Visual */}
        <div className="my-auto py-6 flex flex-col items-center text-center relative">
          
          {/* Geometric Circles Around Arch */}
          <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-[#395679] opacity-75 pointer-events-none hidden sm:block" />
          <div className="absolute top-8 -left-6 w-5 h-5 rounded-full bg-[#5b7899] opacity-85 pointer-events-none hidden sm:block" />
          <div className="absolute -top-6 right-6 w-8 h-8 rounded-tr-full bg-[#7a95b3] opacity-80 pointer-events-none hidden sm:block" />
          <div className="absolute -bottom-2 right-4 w-12 h-12 rounded-full bg-[#27466d] opacity-80 pointer-events-none hidden sm:block" />
          <div className="absolute bottom-6 right-20 w-4 h-4 rounded-full bg-[#46658b] opacity-90 pointer-events-none hidden sm:block" />

          {/* Arch Dome Photo Frame with Clean Utility & Energy Dashboard Graphic */}
          <div className="w-[230px] sm:w-[280px] h-[280px] sm:h-[330px] rounded-t-full rounded-b-2xl overflow-hidden shadow-xl border-4 border-white bg-gradient-to-b from-[#1b365d] via-[#162d4e] to-[#0f213b] relative group flex flex-col items-center justify-center p-6 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(56,189,248,0.15),transparent_70%)] pointer-events-none" />
            
            {/* Center Icon Glow */}
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-500">
                <Gauge className="w-10 h-10 text-sky-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/90 border-2 border-[#162d4e] flex items-center justify-center shadow-xs">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
              Energy & Utility
            </h3>
            <p className="text-xs text-sky-200/70 font-medium max-w-[200px] mt-1 text-center">
              Real-time monitoring, reporting, and operational efficiency
            </p>

            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] text-sky-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Plant & Utility Portal</span>
            </div>
          </div>
        </div>

        {/* Fast Action for Reporter Mode */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={onContinueAsReporter}
            className="w-full group py-3.5 px-4 bg-[#23436d] hover:bg-[#1b365d] active:scale-98 text-white rounded-2xl font-bold text-xs shadow-md shadow-[#1b365d]/20 transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="block leading-tight font-extrabold text-[13px]">
                  เจ้าหน้าที่บันทึกข้อมูล (Data Entry Officer)
                </span>
                <span className="block text-[10px] text-sky-200 font-medium">
                  เข้าใช้งานได้ทันที ไม่ต้องใส่รหัสผ่าน
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* SVG S-CURVE WAVE DIVIDER (Exact Seamless Match to Reference Mockup without straight artifacts) */}
      <div className="hidden md:block absolute left-[44%] lg:left-[41%] top-0 bottom-0 w-[160px] h-full z-15 pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 100 800"
          preserveAspectRatio="none"
          className="w-full h-full text-white fill-current"
        >
          <path d="M 0,-5 L 50,-5 C 100,180 15,380 75,580 C 100,690 85,805 50,805 L 0,805 Z" />
        </svg>
      </div>

      {/* RIGHT HALF: Deep Blue Login Screen (#1b365d matching template) */}
      <div className="w-full md:w-[52%] lg:w-[56%] bg-[#1b365d] p-8 sm:p-12 lg:p-20 flex flex-col justify-between text-white relative z-10 min-h-screen md:min-h-0">
        
        {/* Top Spacer / Header Badge */}
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#27466d] text-sky-200 text-xs font-bold border border-[#3b5d87]">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
            <span>Admin & Approver Access</span>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="my-auto py-8 max-w-md w-full mx-auto md:ml-auto md:mr-4 lg:mr-12 space-y-6">
          
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Login
            </h2>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-700 text-rose-200 rounded-2xl text-xs font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-sky-100 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tdc.com หรือ name@example.com"
                  className="w-full pl-4 pr-10 py-3.5 text-xs sm:text-sm bg-[#132742] border border-[#2b4b73] rounded-2xl focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder:text-sky-200/30 transition-all font-medium"
                />
                <Mail className="w-4 h-4 text-sky-200/40 absolute right-4 top-4 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-sky-100 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3.5 text-xs sm:text-sm bg-[#132742] border border-[#2b4b73] rounded-2xl focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder:text-sky-200/30 transition-all font-medium"
                />
                <Lock className="w-4 h-4 text-sky-200/40 absolute right-4 top-4 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 active:scale-98 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-sky-400/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>

            {/* Utility System Subtitle Under Login Button */}
            <div className="text-center pt-2">
              <span className="text-[11px] font-medium text-sky-200/50">
                Utility Management System
              </span>
            </div>
          </form>

        </div>

        {/* Footer Bottom */}
        <div className="flex items-center justify-end text-[11px] text-sky-200/40 border-t border-[#27466d] pt-4">
          <span className="font-semibold text-sky-200/60">Utility & Energy Management Platform</span>
        </div>

      </div>

    </div>
  );
};
