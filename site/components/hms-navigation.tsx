"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Activity,
  Pill,
  ShieldCheck,
  Building2,
  DollarSign,
  Boxes,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Search,
  Bell,
  UserCheck,
  AlertTriangle,
  Hospital,
  User,
  Truck,
  LogOut,
} from "lucide-react";
import { GlassToggleSwitch } from "@/components/glass-toggle-switch";

export type HMSModuleId =
  | "overview"
  | "operations"
  | "patient-directory"
  | "patient-registration"
  | "emr-360"
  | "doctors"
  | "opd"
  | "emergency"
  | "ipd-beds"
  | "operation-theatre"
  | "laboratory"
  | "radiology-pacs"
  | "pharmacy"
  | "blood-bank"
  | "equipment"
  | "inventory"
  | "ambulance"
  | "billing"
  | "staff-hr"
  | "security-compliance";

export interface NavGroup {
  label: string;
  icon: React.ReactNode;
  items: { id: HMSModuleId; label: string; badge?: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4 text-[#111]" />,
    items: [
      { id: "overview", label: "Overview" },
      { id: "operations", label: "Hospital Operations" },
    ],
  },
  {
    label: "Patients",
    icon: <Users className="w-4 h-4 text-[#111]" />,
    items: [
      { id: "patient-directory", label: "Patient Directory" },
      { id: "patient-registration", label: "Registration Wizard" },
      { id: "emr-360", label: "EMR / Patient 360", badge: "Core" },
    ],
  },
  {
    label: "Clinical",
    icon: <Stethoscope className="w-4 h-4 text-[#111]" />,
    items: [
      { id: "doctors", label: "Doctors & Staff" },
      { id: "opd", label: "Appointments / OPD Queue" },
      { id: "emergency", label: "Emergency & Triage", badge: "Live" },
      { id: "ipd-beds", label: "Inpatient / Ward Bed Map" },
      { id: "operation-theatre", label: "Operation Theatre (OT)" },
    ],
  },
  {
    label: "Diagnostics",
    icon: <Activity className="w-4 h-4 text-[#111]" />,
    items: [
      { id: "laboratory", label: "Laboratory & Pipeline" },
      { id: "radiology-pacs", label: "Radiology / Simulated PACS" },
    ],
  },
  {
    label: "Pharmacy & Blood",
    icon: <Pill className="w-4 h-4 text-[#111]" />,
    items: [
      { id: "pharmacy", label: "Pharmacy Inventory & Rx" },
      { id: "blood-bank", label: "Blood Bank & Compatibility" },
    ],
  },
  {
    label: "Resources",
    icon: <Boxes className="w-4 h-4 text-[#111]" />,
    items: [
      { id: "equipment", label: "Medical Equipment" },
      { id: "inventory", label: "Consumable Inventory" },
      { id: "ambulance", label: "Ambulance Fleet" },
    ],
  },
  {
    label: "Finance",
    icon: <DollarSign className="w-4 h-4 text-[#111]" />,
    items: [{ id: "billing", label: "Billing & Insurance" }],
  },
  {
    label: "Administration",
    icon: <Building2 className="w-4 h-4 text-[#111]" />,
    items: [{ id: "staff-hr", label: "Staff Roster & HR" }],
  },
  {
    label: "Security",
    icon: <ShieldCheck className="w-4 h-4 text-[#111]" />,
    items: [{ id: "security-compliance", label: "RBAC & Audit Trail" }],
  },
];

function getNavGroupsForRole(role: string): NavGroup[] {
  if (role === "Patient") {
    return [
      {
        label: "Patient Care Portal",
        icon: <User className="w-4 h-4 text-[#111]" />,
        items: [
          { id: "overview", label: "My Health & Care Hub", badge: "Active" },
          { id: "ambulance", label: "Call Emergency Ambulance" },
        ],
      },
    ];
  }

  if (role === "Ambulance Driver") {
    return [
      {
        label: "Field Network",
        icon: <Truck className="w-4 h-4 text-[#111]" />,
        items: [
          { id: "ambulance", label: "Ambulance Telemetry & GPS", badge: "Live" },
          { id: "emergency", label: "Trauma Bay Link" },
        ],
      },
    ];
  }

  if (role === "Nurse") {
    return [
      {
        label: "Ward & Inpatient",
        icon: <Activity className="w-4 h-4 text-[#111]" />,
        items: [
          { id: "ipd-beds", label: "Ward & Smart ICU Ring", badge: "Live" },
          { id: "emergency", label: "Emergency & Triage" },
          { id: "emr-360", label: "Patient Vitals & EMR" },
          { id: "pharmacy", label: "Medication & Dispense" },
        ],
      },
    ];
  }

  if (role === "Doctor") {
    return [
      {
        label: "Dr. Dhanvantari Suite",
        icon: <Stethoscope className="w-4 h-4 text-[#111]" />,
        items: [
          { id: "opd", label: "Cardiology OPD Room 101", badge: "Live" },
          { id: "emr-360", label: "Patient 360 & Cardiac EMR", badge: "Core" },
          { id: "patient-directory", label: "My Patient Directory" },
          { id: "operation-theatre", label: "Cath Lab & Cardiac OT" },
          { id: "ipd-beds", label: "Cardiac Inpatient Rounds" },
        ],
      },
      {
        label: "Diagnostics & Rx",
        icon: <Activity className="w-4 h-4 text-[#111]" />,
        items: [
          { id: "laboratory", label: "Troponin & Blood Labs" },
          { id: "radiology-pacs", label: "Cardiac Imaging / PACS" },
          { id: "pharmacy", label: "Integrative Prescriptions" },
          { id: "doctors", label: "Clinical Roster" },
        ],
      },
    ];
  }

  return NAV_GROUPS;
}

interface HMSNavigationProps {
  activeModule: HMSModuleId;
  onSelectModule: (id: HMSModuleId) => void;
  activeRole: string;
  onChangeRole?: (role: string) => void;
  onLogout: () => void;
  children?: React.ReactNode;
}

const LANDING_GLASS_SIDEBAR = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(245, 244, 240, 0.45)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
  borderRight: "1px solid rgba(0, 0, 0, 0.07)",
} as const;

const LANDING_GLASS_HEADER = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(245, 244, 240, 0.50)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
  borderBottom: "1px solid rgba(0, 0, 0, 0.07)",
} as const;

export function HMSNavigation({
  activeModule,
  onSelectModule,
  activeRole,
  onChangeRole,
  onLogout,
  children,
}: HMSNavigationProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Dashboard: true,
    Patients: true,
    Clinical: true,
    Diagnostics: true,
    "Patient Care Portal": true,
    "Field Network": true,
    "Ward & Inpatient": true,
    "Clinical EHR": true,
    "Diagnostics & Rx": true,
  });

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  const navGroups = getNavGroupsForRole(activeRole);

  let activeGroupLabel = navGroups[0]?.label || "Dashboard";
  let activeItemLabel = navGroups[0]?.items[0]?.label || "Overview";
  navGroups.forEach((g) => {
    g.items.forEach((item) => {
      if (item.id === activeModule) {
        activeGroupLabel = g.label;
        activeItemLabel = item.label;
      }
    });
  });

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#F5F4F0] text-[#111]"
      style={{
        fontFamily: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ========================================================================= */}
      {/* LANDING PAGE MINIMALIST GLASS SIDEBAR NAVIGATION (Desktop) */}
      {/* ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col transition-all duration-300 z-30 ${
          collapsed ? "w-20" : "w-72"
        }`}
        style={LANDING_GLASS_SIDEBAR}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-black/[0.07]">
          {!collapsed ? (
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectModule("overview")}>
              <div className="w-9 h-9 rounded-xl bg-[#111] text-white flex items-center justify-center font-bold shadow-md">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <span className="font-pixel text-xs tracking-[0.2em] text-[#111] block">DRONAGIRI</span>
                <span className="text-[10px] text-black/50 font-semibold tracking-wider uppercase">Gandhamadana OS</span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#111] text-white flex items-center justify-center font-bold mx-auto shadow-md">
              <Hospital className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-black/40 hover:text-[#111] p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {navGroups.map((group) => {
            const isGroupExpanded = expandedGroups[group.label];
            const hasActiveChild = group.items.some((i) => i.id === activeModule);

            return (
              <div key={group.label} className="space-y-1">
                {/* Group Dropdown Header */}
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      hasActiveChild ? "text-[#111] bg-black/[0.04]" : "text-black/45 hover:text-[#111] hover:bg-black/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {group.icon}
                      <span className="font-pixel text-[10px] tracking-widest text-black/50 uppercase">{group.label}</span>
                    </div>
                    {isGroupExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-black/40" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-black/40" />
                    )}
                  </button>
                ) : (
                  <div
                    className="w-full flex justify-center py-2 text-black/45 hover:bg-black/[0.03] rounded-lg cursor-pointer"
                    title={group.label}
                  >
                    {group.icon}
                  </div>
                )}

                {/* Submenu Items */}
                {(!collapsed ? isGroupExpanded : true) && (
                  <div className={`${!collapsed ? "pl-7 space-y-0.5" : "space-y-1"}`}>
                    {group.items.map((item) => {
                      const isActive = item.id === activeModule;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectModule(item.id);
                            setMobileOpen(false);
                          }}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all ${
                            isActive
                              ? "bg-[#111] text-white font-medium shadow-md shadow-black/10"
                              : "text-black/60 hover:text-[#111] hover:bg-white/60"
                          }`}
                          title={collapsed ? item.label : undefined}
                        >
                          {!collapsed ? (
                            <>
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                    isActive ? "bg-white/20 text-white" : "bg-black/10 text-black/70"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] font-bold mx-auto">{item.label.slice(0, 2)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Info / Role Footer */}
        <div className="p-3 border-t border-black/[0.07] bg-black/[0.02]">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                  {activeRole.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#111] truncate">{activeRole}</div>
                  <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Online System
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-xs text-rose-700 hover:text-rose-900 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="w-full py-2 text-center text-xs text-rose-700 font-bold hover:bg-rose-50 rounded"
              title="Exit HMS"
            >
              Exit
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <div
        className={`fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 md:hidden flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={LANDING_GLASS_SIDEBAR}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-black/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#111] text-white flex items-center justify-center font-bold">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <span className="font-pixel text-xs tracking-[0.2em] text-[#111] block">DRONAGIRI</span>
              <span className="text-[10px] text-black/50 font-medium uppercase">Gandhamadana Mobile</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-black/40 hover:text-[#111] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {navGroups.map((g) => (
            <div key={g.label} className="space-y-1">
              <div className="font-pixel text-[10px] text-black/40 uppercase tracking-widest px-2 mb-1">
                {g.label}
              </div>
              {g.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectModule(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between ${
                    activeModule === item.id ? "bg-[#111] text-white font-medium" : "text-black/60 hover:bg-white/60"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/10 text-black/70 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TOP HEADER & CONTENT WRAPPER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* LANDING PAGE MINIMALIST GLASS TOP HEADER BAR */}
        <header className="h-16 px-4 md:px-6 flex items-center justify-between shrink-0 z-20" style={LANDING_GLASS_HEADER}>
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-black/60 hover:text-[#111] p-1.5 rounded-lg hover:bg-black/[0.04]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-black/50">
              <span className="hover:text-[#111] cursor-pointer font-medium">{activeGroupLabel}</span>
              <ChevronRight className="w-3.5 h-3.5 text-black/30" />
              <span className="font-semibold text-[#111]">{activeItemLabel}</span>
            </div>
          </div>

          {/* Center: Global Glass Search Bar */}
          <div className="hidden lg:flex items-center gap-2 bg-white/70 border border-black/10 rounded-xl px-3 py-1.5 w-80 text-xs backdrop-blur-md focus-within:bg-white focus-within:border-black/30 transition-all shadow-xs">
            <Search className="w-4 h-4 text-black/40" />
            <input
              type="text"
              placeholder={
                activeRole === "Patient"
                  ? "Search my prescriptions, labs, bills..."
                  : activeRole === "Ambulance Driver"
                  ? "Search dispatch route, ER status..."
                  : "Search Patient ID, Name, Doctor, Rx..."
              }
              className="bg-transparent border-none outline-none w-full text-[#111] placeholder:text-black/30"
            />
          </div>

          {/* Right Controls: Glass Toggle Switch, Role Switcher & Live Alerts */}
          <div className="flex items-center gap-3">
            {/* Glass Bubble Refraction Toggle Switch */}
            <div className="hidden sm:block">
              <GlassToggleSwitch />
            </div>

            {/* Emergency Live Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/70 border border-rose-300/80 text-rose-900 text-xs font-semibold backdrop-blur-sm shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-700 animate-bounce" />
              <span>
                {activeRole === "Patient" ? "Care Helpline: 108" : "ER Bay 1 Active"}
              </span>
            </div>

            {/* Authenticated User Profile Badge & Logout */}
            <div className="flex items-center gap-2.5 bg-white/85 backdrop-blur-md pl-2 pr-2.5 py-1 rounded-xl border border-black/10 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-[#111] text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs font-mono">
                {activeRole === "Patient"
                  ? "SR"
                  : activeRole === "Doctor"
                  ? "DH"
                  : activeRole === "Nurse"
                  ? "AN"
                  : activeRole === "Ambulance Driver"
                  ? "MR"
                  : "AD"}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-xs font-bold text-[#111] truncate max-w-[130px]">
                  {activeRole === "Patient"
                    ? "Srimannarayana"
                    : activeRole === "Doctor"
                    ? "Dr. Dhanvantari"
                    : activeRole === "Nurse"
                    ? "Nurse Ananya"
                    : activeRole === "Ambulance Driver"
                    ? "Driver Maruti"
                    : "Admin"}
                </div>
                <div className="text-[10px] text-black/50 font-medium">{activeRole}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 hover:bg-rose-50 rounded-lg text-black/40 hover:text-rose-700 transition-colors"
                title="Log Out & Switch User"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notifications Button */}
            <button className="relative p-2 text-black/60 hover:text-[#111] hover:bg-black/[0.04] rounded-xl transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#111]" />
            </button>
          </div>
        </header>

        {/* INNER CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
