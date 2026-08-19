"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Users,
  Calendar,
  Bed,
  AlertOctagon,
  Activity,
  HeartPulse,
  FileCheck,
  CreditCard,
  ChevronRight,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Play,
  AlertTriangle,
  Stethoscope,
  Zap,
  ShieldCheck,
  BarChart3,
  Thermometer,
  Boxes,
  Truck,
  Sparkles,
} from "lucide-react";
import {
  Patient,
  Doctor,
  OPDToken,
  BedItem,
  EmergencyCase,
  LabOrder,
  BillingInvoice,
  AuditLogEntry,
} from "@/lib/hms-data";
import { IntelligenceLayerWidget } from "@/components/hms/intelligence-layer";

interface DashboardProps {
  patients: Patient[];
  doctors: Doctor[];
  opdTokens: OPDToken[];
  beds: BedItem[];
  emergencyCases: EmergencyCase[];
  labOrders: LabOrder[];
  invoices: BillingInvoice[];
  auditLogs: AuditLogEntry[];
  onNavigate: (module: any) => void;
}

// ─── Exact Landing Page Design Tokens ────────────────────────────────────────
const GLASS_CARD = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(255, 255, 255, 0.45)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
} as const;

const GLASS_BANNER = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(255, 255, 255, 0.70)",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
  border: "1px solid rgba(0, 0, 0, 0.10)",
} as const;

// ─── Pixel Tag — matches landing page Tag component exactly ──────────────────
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/40 bg-black/[0.04]">
      {children}
    </span>
  );
}

// ─── Spotlight Bento Card — exact replication of landing page BentoCard ──────
function BentoCard({
  children,
  className = "",
  style = {},
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onClick={onClick}
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}
      style={{ ...GLASS_CARD, ...style }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
        style={{
          background:
            "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,0,0.03), transparent 60%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({
  value,
  max,
  colorClass = "bg-[#111]",
}: {
  value: number;
  max: number;
  colorClass?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-black/[0.07] rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClass} rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function DashboardView({
  patients,
  doctors,
  opdTokens,
  beds,
  emergencyCases,
  labOrders,
  invoices,
  auditLogs,
  onNavigate,
}: DashboardProps) {
  // ── Computed stats ──
  const totalPatients = patients.length;
  const todayAppointments = opdTokens.length + 12;
  const currentlyAdmitted = patients.filter((p) => p.status === "Admitted").length;
  const emergencyCount = emergencyCases.length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;
  const totalBeds = beds.length;
  const icuOccupied = beds.filter((b) => b.ward === "ICU" && b.status === "Occupied").length;
  const icuTotal = beds.filter((b) => b.ward === "ICU").length;
  const pendingLabs = labOrders.filter((l) => l.status !== "Verified").length;
  const outstanding = invoices
    .filter((i) => i.paymentStatus !== "Paid")
    .reduce((sum, i) => sum + i.finalAmount, 0);

  // ── OPD Token Queue ──
  const [tokens, setTokens] = useState<OPDToken[]>(opdTokens);
  const serving = tokens.find((t) => t.status === "Serving") || tokens[0];
  const waiting = tokens.filter((t) => t.status === "Waiting");

  const handleNextToken = () => {
    if (!waiting.length) return;
    const next = waiting[0];
    setTokens((prev) =>
      prev.map((t) => {
        if (t.tokenNo === serving.tokenNo) return { ...t, status: "Completed" };
        if (t.tokenNo === next.tokenNo) return { ...t, status: "Serving" };
        return t;
      })
    );
  };

  // ── KPI cards config ──
  const kpis = [
    {
      label: "Total Patients",
      value: totalPatients.toString(),
      sub: "4.8k historical records on file",
      icon: Users,
      badge: "+12.4%",
      badgeClass: "text-emerald-700 bg-emerald-100/60",
      iconClass: "text-[#111] bg-black/5",
    },
    {
      label: "Today's Appointments",
      value: todayAppointments.toString(),
      sub: "Across 14 OPD specialty suites",
      icon: Calendar,
      badge: "84% Filled",
      badgeClass: "text-emerald-700 bg-emerald-100/60",
      iconClass: "text-[#111] bg-black/5",
    },
    {
      label: "Currently Admitted",
      value: currentlyAdmitted.toString(),
      sub: "IPD wards & private rooms",
      icon: Bed,
      badge: "Steady Rate",
      badgeClass: "text-black/60 bg-black/10",
      iconClass: "text-[#111] bg-black/5",
    },
    {
      label: "Emergency Cases",
      value: `${emergencyCount} Active`,
      sub: "Avg triage wait: < 3 mins",
      icon: AlertOctagon,
      badge: "Red Triage",
      badgeClass: "text-rose-800 bg-rose-100/60",
      iconClass: "text-rose-700 bg-rose-100 animate-pulse",
      accent: true,
    },
    {
      label: "Available Beds",
      value: `${availableBeds} / ${totalBeds}`,
      sub: "Ready after sanitization",
      icon: HeartPulse,
      badge: `${Math.round((availableBeds / totalBeds) * 100)}% Free`,
      badgeClass: "text-emerald-700 bg-emerald-100/60",
      iconClass: "text-[#111] bg-black/5",
    },
    {
      label: "ICU Occupancy",
      value: `${icuOccupied} / ${icuTotal}`,
      sub: "2 ICU beds available",
      icon: Activity,
      badge: "High Priority",
      badgeClass: "text-amber-800 bg-amber-100/60",
      iconClass: "text-[#111] bg-black/5",
    },
    {
      label: "Pending Lab Results",
      value: pendingLabs.toString(),
      sub: "CBC, LFT & Electrolytes pipeline",
      icon: FileCheck,
      badge: "In Processing",
      badgeClass: "text-black/60 bg-black/10",
      iconClass: "text-[#111] bg-black/5",
    },
    {
      label: "Outstanding Payments",
      value: `₹${outstanding.toLocaleString('en-IN')}`,
      sub: "2 claims awaiting co-pay verify",
      icon: CreditCard,
      badge: "Insurance Pending",
      badgeClass: "text-black/60 bg-black/10",
      iconClass: "text-[#111] bg-black/5",
    },
  ];

  return (
    <div className="space-y-8 text-[#111]">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO HEADER — Landing Page Grand Title Style + Contextual 3D Artwork   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl p-8 lg:p-10 relative overflow-hidden" style={GLASS_BANNER}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <Tag>DRONAGIRI (GANDHAMADANA) • COMMAND CENTER</Tag>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#111] leading-[1.08] tracking-tight"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              Dronagiri Operations<br />&amp; Clinical Intelligence.
            </h1>
            <p className="text-sm text-black/50 font-light leading-relaxed">
              A unified operating view of patients, care workflows, live token queues, acute bed allocations, and Dhanvantari medical resources.
            </p>

            {/* Metric counters */}
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div
                  className="text-3xl font-light tracking-tight text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  {totalPatients}
                </div>
                <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">
                  Active Patients
                </div>
              </div>

              <div className="w-px h-10 bg-black/10" />

              <div>
                <div
                  className="text-3xl font-light tracking-tight text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  {availableBeds}/{totalBeds}
                </div>
                <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">
                  Beds Free
                </div>
              </div>

              <div className="w-px h-10 bg-black/10" />

              <div>
                <div
                  className="text-3xl font-light tracking-tight text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  {emergencyCount} ER
                </div>
                <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">
                  Live Triage
                </div>
              </div>
            </div>
          </div>

          {/* Contextual 3D Glass Artwork Container */}
          <div className="w-full lg:w-[380px] shrink-0 relative flex items-center justify-center">
            <div className="relative group rounded-2xl overflow-hidden p-2 transition-transform duration-500 hover:scale-[1.02]">
              <Image
                src="/images/treat-care.png"
                alt="3D Glass Hospital Care Artwork"
                width={380}
                height={240}
                className="w-full h-auto object-contain drop-shadow-xl rounded-xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: BENTO KPI GRID                                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase">
            LIVE OPERATIONAL METRICS
          </span>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <BentoCard
                key={kpi.label}
                className="p-5 rounded-2xl cursor-default"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase">
                    {kpi.label}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.iconClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div
                  className={`text-3xl font-light tracking-tight mb-1 ${kpi.accent ? "text-rose-900" : "text-[#111]"}`}
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  {kpi.value}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-black/40">{kpi.sub}</p>
                  <span
                    className={`ml-2 shrink-0 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${kpi.badgeClass}`}
                  >
                    {kpi.badge}
                  </span>
                </div>
              </BentoCard>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* AI INTELLIGENCE LAYER                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <IntelligenceLayerWidget />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: LIVE OPD QUEUE + EMERGENCY TRIAGE                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase">
            PATIENT INTAKE &amp; EMERGENCY TRAUMA
          </span>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* OPD Token Queue (7 cols) */}
          <BentoCard className="lg:col-span-7 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase block mb-1">
                  OUTPATIENT DEPARTMENT
                </span>
                <h3
                  className="text-xl font-light text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  Live OPD Consultation Queue
                </h3>
              </div>
              <button
                onClick={() => onNavigate("opd")}
                className="text-xs text-black/50 hover:text-[#111] flex items-center gap-1 font-medium transition-colors"
              >
                <span>Full Queue</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Currently Serving Banner */}
            {serving && (
              <div
                className="p-5 rounded-2xl border border-black/10 mb-6 relative overflow-hidden"
                style={GLASS_BANNER}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#111] text-white flex flex-col items-center justify-center font-mono shadow-md">
                      <span className="text-[10px] font-pixel text-white/50 tracking-wider">TOKEN</span>
                      <span className="text-2xl font-light leading-none">#{serving.tokenNo}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[9px] tracking-widest text-black/40 uppercase">
                          NOW SERVING
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      </div>
                      <h4 className="text-lg font-bold text-[#111]">{serving.patientName}</h4>
                      <p className="text-xs text-black/50">{serving.doctorName} • {serving.department}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleNextToken}
                    disabled={waiting.length === 0}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#111] hover:bg-[#333] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>Call Next Token</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Waiting Queue List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-black/40 font-pixel uppercase tracking-widest px-1">
                <span>Waiting in Queue ({waiting.length})</span>
                <span>Est. Wait</span>
              </div>

              {waiting.slice(0, 3).map((token) => (
                <div
                  key={token.tokenNo}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-black/5 hover:bg-white/90 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-black/60 w-8">#{token.tokenNo}</span>
                    <div>
                      <div className="font-bold text-[#111]">{token.patientName}</div>
                      <div className="text-[10px] text-black/40">{token.doctorName} • {token.department}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-black/50">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{token.avgWaitMins}m</span>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Emergency Triage Board (5 cols) */}
          <BentoCard className="lg:col-span-5 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="font-pixel text-[10px] tracking-widest text-rose-700 uppercase block mb-1">
                  LEVEL-1 TRAUMA
                </span>
                <h3
                  className="text-xl font-light text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  Active Emergency Triage
                </h3>
              </div>
              <button
                onClick={() => onNavigate("emergency")}
                className="text-xs text-black/50 hover:text-[#111] flex items-center gap-1 font-medium transition-colors"
              >
                <span>ER Bay</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {emergencyCases.slice(0, 3).map((emg) => (
                <div
                  key={emg.id}
                  className={`p-4 rounded-xl border transition-all text-xs ${
                    emg.severity === "RED"
                      ? "bg-rose-50/80 border-rose-200"
                      : emg.severity === "YELLOW"
                      ? "bg-amber-50/80 border-amber-200"
                      : "bg-emerald-50/80 border-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold font-mono text-[#111]">{emg.caseId}</span>
                    <span
                      className={`font-pixel text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        emg.severity === "RED"
                          ? "bg-rose-600 text-white"
                          : emg.severity === "YELLOW"
                          ? "bg-amber-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {emg.severity} TRIAGE
                    </span>
                  </div>

                  <div className="font-bold text-[#111] text-sm mt-1">{emg.patientName}</div>
                  <p className="text-[11px] text-black/60 mt-0.5 leading-snug">{emg.chiefComplaint}</p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 text-[10px] text-black/50">
                    <span>{emg.traumaBay} • Bed {emg.bedNo}</span>
                    <span className="font-mono">{emg.arrivalTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: BED MAP METRICS & QUICK ACTION MODULES                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase">
            HOSPITAL BED INVENTORY &amp; SUBSYSTEMS
          </span>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inpatient Bed Map Snapshot */}
          <BentoCard className="p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase">
                IPD OCCUPANCY
              </span>
              <button
                onClick={() => onNavigate("ipd-beds")}
                className="text-xs text-black/50 hover:text-[#111] flex items-center gap-1"
              >
                <span>Bed Matrix</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#111]">ICU Ward</span>
                  <span className="font-mono text-black/50">{icuOccupied}/{icuTotal} Occupied</span>
                </div>
                <ProgressBar value={icuOccupied} max={icuTotal} colorClass="bg-rose-700" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#111]">Deluxe Suite</span>
                  <span className="font-mono text-black/50">1/2 Occupied</span>
                </div>
                <ProgressBar value={1} max={2} colorClass="bg-[#111]" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#111]">General Ward</span>
                  <span className="font-mono text-black/50">2/4 Occupied</span>
                </div>
                <ProgressBar value={2} max={4} colorClass="bg-[#111]" />
              </div>
            </div>
          </BentoCard>

          {/* Quick Access: Patient 360 Feature Card */}
          <BentoCard
            onClick={() => onNavigate("emr-360")}
            className="p-6 rounded-2xl cursor-pointer hover:border-black/30"
          >
            <div className="flex items-center justify-between mb-3">
              <Tag>FEATURED CORE</Tag>
              <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#111]" />
              </div>
            </div>

            <h4
              className="text-xl font-light text-[#111] mb-1"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              Patient 360 &amp; EMR
            </h4>
            <p className="text-xs text-black/50 leading-relaxed mb-4">
              Inspect longitudinal medical histories, verified diagnostic scans, and clinical notes.
            </p>

            <div className="flex items-center gap-1 text-xs font-semibold text-[#111] group-hover:underline">
              <span>Open Patient 360</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </BentoCard>

          {/* Quick Access: Blood Bank & Compatibility */}
          <BentoCard
            onClick={() => onNavigate("blood-bank")}
            className="p-6 rounded-2xl cursor-pointer hover:border-black/30"
          >
            <div className="flex items-center justify-between mb-3">
              <Tag>TRANSFUSION SAFETY</Tag>
              <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center">
                <Boxes className="w-4 h-4 text-rose-700" />
              </div>
            </div>

            <h4
              className="text-xl font-light text-[#111] mb-1"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              Blood Bank Matrix
            </h4>
            <p className="text-xs text-black/50 leading-relaxed mb-4">
              Real-time stock meters, donor compatibility matrix, and shelf-life alert thresholds.
            </p>

            <div className="flex items-center gap-1 text-xs font-semibold text-[#111] group-hover:underline">
              <span>Check Stock Meters</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </BentoCard>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: REAL-TIME AUDIT TRAIL — Immutable Compliance Log            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase">
            IMMUTABLE SECURITY AUDIT TRAIL
          </span>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        <BentoCard className="p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-[#111]">Live System Event Ledger</span>
            </div>
            <button
              onClick={() => onNavigate("security-compliance")}
              className="text-xs text-black/50 hover:text-[#111] flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white/60 border border-black/5 text-xs gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-black/40 w-16">{log.id}</span>
                  <span className="font-bold text-[#111]">{log.userName}</span>
                  <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-black/5 text-black/60 uppercase">
                    {log.action}
                  </span>
                  <span className="text-black/60 truncate max-w-xs">{log.resource}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-black/40 shrink-0">
                  <span>IP: {log.ip}</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
