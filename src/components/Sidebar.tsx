'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Zap,
  LogOut,
  ShieldCheck,
  UserCheck,
  Users,
  Settings,
  Clock,
  Menu,
  X,
  Database,
  Wrench,
  ShieldAlert,
  FileText,
  Map,
  Droplets,
  History,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { UserRole, FullMonthlyReportData } from '@/lib/types';
import { isSupabaseConfigured, supabase, fetchPondSubmissions } from '@/lib/supabase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { email: string; role: UserRole } | null;
  reportsData: FullMonthlyReportData[];
  onLogout: () => void;
  onOpenLogin: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: number | null;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  reportsData,
  onLogout,
  onOpenLogin,
}) => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [extraPendingCount, setExtraPendingCount] = useState<number>(0);

  // Fetch real-time pending pond submissions & PM records
  useEffect(() => {
    let isMounted = true;
    const fetchPendingCounts = async () => {
      try {
        const pondSubs = await fetchPondSubmissions();
        const pendingPondCount = pondSubs.filter((p) => p.status === 'pending').length;
        
        let pendingPMCount = 0;
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.from('maintenance_history').select('status').eq('status', 'pending');
          pendingPMCount = data ? data.length : 0;
        } else {
          const saved = localStorage.getItem('tdc_maintenance_history');
          if (saved) {
            const list = JSON.parse(saved);
            pendingPMCount = list.filter((m: any) => m.status === 'pending').length;
          }
        }

        if (isMounted) {
          setExtraPendingCount(pendingPondCount + pendingPMCount);
        }
      } catch {}
    };

    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const monthlyPendingCount = reportsData.filter((r) => r.report.status === 'pending').length;
  const pendingCount = monthlyPendingCount + extraPendingCount;

  const hasRole = Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'approver'));

  // State to track collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (title: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Menu categories organized with clean English labels
  const menuCategories: MenuCategory[] = [
    {
      title: 'Overview & Analytics',
      items: [
        { id: 'overview', label: 'Overview', icon: Map, badge: null },
        ...(hasRole ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null }] : []),
      ],
    },
    {
      title: 'Data Entry & Operations',
      items: [
        { id: 'data-entry', label: 'Daily Report', icon: FileSpreadsheet, badge: null },
        { id: 'pond-entry', label: 'Pond Entry', icon: Droplets, badge: null },
        { id: 'maintenance', label: 'Preventive Maintenance', icon: Wrench, badge: null },
      ],
    },
  ];

  const adminItems: MenuItem[] = [];
  if (hasRole) {
    adminItems.push({
      id: 'pending',
      label: 'Pending Approvals',
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : null,
    });
    adminItems.push({
      id: 'energy-report',
      label: 'A4 Energy Report',
      icon: FileText,
      badge: null,
    });
    adminItems.push({ id: 'history', label: 'System History', icon: Database, badge: null });
    adminItems.push({ id: 'pond-history', label: 'Pond History', icon: History, badge: null });
    adminItems.push({ id: 'troubleshooting', label: 'Troubleshoot Guide', icon: ShieldAlert, badge: null });
    if (currentUser?.role === 'admin') {
      adminItems.push({ id: 'users', label: 'User Management', icon: Users, badge: null });
    }
  }

  if (hasRole && adminItems.length > 0) {
    menuCategories.push({
      title: 'Approvals & Admin',
      items: adminItems,
    });
  }

  if (currentUser) {
    menuCategories.push({
      title: 'Account',
      items: [{ id: 'settings', label: 'Account Settings', icon: Settings, badge: null }],
    });
  }

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header & Menu */}
      <div className="flex flex-col min-h-0 overflow-y-auto no-scrollbar">
        {/* Brand Header */}
        <div className={`p-3.5 flex ${isSidebarCollapsed ? 'flex-col items-center gap-2.5' : 'items-center justify-between'} border-b border-[#2b4b73]/70 shrink-0`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 text-white">
                <Zap className="w-5 h-5 text-white fill-white/20" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-lg leading-tight tracking-wide text-white truncate">
                  Utility System
                </h1>
                <p className="text-[10px] text-sky-300 font-bold uppercase tracking-wider">Energy & Plant</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 text-white" title="Utility System">
              <Zap className="w-5 h-5 text-white fill-white/20" />
            </div>
          )}

          {/* Desktop Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex text-sky-200/70 hover:text-white p-1.5 rounded-xl hover:bg-[#27466d] transition-all cursor-pointer items-center justify-center shrink-0"
            title={isSidebarCollapsed ? 'ขยายแถบเมนู (Expand Sidebar)' : 'พับแถบเมนูไปทางซ้าย (Collapse Sidebar)'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 text-sky-400" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-sky-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu Grouped by Category */}
        <nav className="py-3 pl-3 pr-0 space-y-4 flex-1">
          {menuCategories.map((cat, catIdx) => {
            const isCollapsed = Boolean(collapsedCategories[cat.title]);

            return (
              <div key={catIdx} className="space-y-1">
                {/* Category Header with Collapse Toggle */}
                {!isSidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.title)}
                    className="w-full flex items-center justify-between pl-2.5 pr-4 py-1 text-[10px] font-black uppercase tracking-wider text-sky-300/90 hover:text-sky-100 transition-colors cursor-pointer group"
                  >
                    <span className="truncate">{cat.title}</span>
                    <div className="text-sky-300/60 group-hover:text-sky-100">
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                )}

                {/* Collapsible Menu Items with Seamless Inverted Notch Curve */}
                {(!isCollapsed || isSidebarCollapsed) && (
                  <div className="space-y-1.5 pt-0.5 animate-fadeIn">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <div key={item.id} className="relative">
                          <button
                            onClick={() => handleNavClick(item.id)}
                            title={isSidebarCollapsed ? item.label : undefined}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-2.5 px-2' : 'justify-between pl-3.5 pr-4 py-2.5'} rounded-l-2xl text-xs font-bold transition-all duration-150 cursor-pointer relative z-10 ${isActive
                              ? 'bg-white text-slate-900 font-extrabold shadow-none'
                              : 'text-sky-100/80 hover:bg-[#27466d]/70 hover:text-white font-semibold rounded-r-xl mr-2'
                              }`}
                            style={isActive ? { width: 'calc(100% + 2px)' } : undefined}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-amber-500' : 'text-sky-300'}`} />
                              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                            </div>
                            {!isSidebarCollapsed && item.badge !== null && (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-black rounded-full ${isActive ? 'bg-amber-500 text-slate-950' : 'bg-amber-500 text-slate-950 animate-pulse'
                                  }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>

                          {/* Outer Inverted Curved Corners (Flawless Notch Match in Pure White) */}
                          {isActive && (
                            <>
                              {/* Top Curved Notch */}
                              <div className="absolute -top-4 w-4 h-4 overflow-hidden pointer-events-none z-10" style={{ right: '-2px' }}>
                                <div className="w-full h-full bg-[#1b365d] rounded-br-2xl" />
                                <div className="absolute inset-0 bg-white -z-10" />
                              </div>
                              {/* Bottom Curved Notch */}
                              <div className="absolute -bottom-4 w-4 h-4 overflow-hidden pointer-events-none z-10" style={{ right: '-2px' }}>
                                <div className="w-full h-full bg-[#1b365d] rounded-tr-2xl" />
                                <div className="absolute inset-0 bg-white -z-10" />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Info / Role Footer */}
      <div className="p-3 border-t border-[#2b4b73]/70 bg-[#132742] shrink-0 mt-auto">
        {currentUser ? (
          <div className="space-y-2">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#27466d] border border-[#3b5d87] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-semibold text-sky-100 truncate"
                    title={currentUser.email}
                  >
                    {currentUser.email}
                  </p>
                  <span className="inline-block px-1.5 py-0.5 text-[10px] uppercase font-extrabold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#27466d] border border-[#3b5d87] flex items-center justify-center mx-auto" title={currentUser.email}>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
            )}

            <button
              onClick={() => {
                onLogout();
                setMobileOpen(false);
              }}
              title={isSidebarCollapsed ? 'Logout' : undefined}
              className={`w-full flex items-center justify-center gap-2 ${isSidebarCollapsed ? 'p-2' : 'px-3 py-2'} text-xs font-semibold text-sky-200 bg-[#27466d] hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-700/60 rounded-xl border border-[#3b5d87] transition-all shadow-xs cursor-pointer`}
            >
              <LogOut className="w-4 h-4" />
              {!isSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2 text-xs text-sky-200">
                <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">Reporter Mode</span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#27466d] border border-[#3b5d87] flex items-center justify-center mx-auto" title="Reporter Mode">
                <UserCheck className="w-4 h-4 text-sky-400" />
              </div>
            )}
            <button
              onClick={() => {
                onOpenLogin();
                setMobileOpen(false);
              }}
              title={isSidebarCollapsed ? 'Login' : undefined}
              className={`w-full flex items-center justify-center gap-2 ${isSidebarCollapsed ? 'p-2' : 'px-3 py-2'} text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all border border-sky-500 shadow-sm cursor-pointer font-bold`}
            >
              <ShieldCheck className="w-4 h-4" />
              {!isSidebarCollapsed && <span>Approver Login</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TOP BAR (Only visible on screens < md) */}
      <div className="w-full md:hidden bg-[#1b365d] text-white px-4 py-3 border-b border-[#2b4b73] flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shrink-0 shadow-md text-white">
            <Zap className="w-4 h-4 text-white fill-white/20" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-tight">Utility System</h1>
            <p className="text-[10px] text-sky-300 font-medium">Energy & Plant</p>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-[#27466d] hover:bg-[#325a8c] text-sky-300 rounded-xl border border-[#3b5d87] transition-all"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY (Slides in from the right matching top-right menu button) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 bg-[#1b365d] text-white flex flex-col h-full shadow-2xl z-50 animate-in slide-in-from-right duration-200 border-l border-[#2b4b73]">
            {navContent}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR (Visible on screens >= md) */}
      <aside className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-[#1b365d] text-white flex-col justify-between h-screen sticky top-0 shrink-0 z-20`}>
        {navContent}
      </aside>
    </>
  );
};
