"use client";

import React, { useState, useEffect } from "react";
import {
  Bed,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRightLeft,
  FileCheck,
  User,
  Clock,
  Activity,
  Plus,
  Shield,
  HeartPulse,
  BellRing,
  AlertTriangle,
  Radio,
  Zap,
  Users,
  ShieldAlert,
} from "lucide-react";
import { BedItem, Patient, BedWard, BedStatus } from "@/lib/hms-data";

interface InpatientIPDViewProps {
  beds: BedItem[];
  patients: Patient[];
  onUpdateBeds?: (updatedBeds: BedItem[]) => void;
}

const LANDING_GLASS_CARD = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(255, 255, 255, 0.50)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
} as const;

const HOUSEKEEPING_ROSTER = [
  "Housekeeper Ramesh K. (Sanitation Crew A)",
  "Housekeeper Sunita M. (Terminal Disinfection)",
  "Housekeeper Alex Vance (Bio-Hazard Team)",
  "Housekeeper Priya N. (Deep Clean Unit)",
];

export function InpatientIPDView({ beds, patients, onUpdateBeds }: InpatientIPDViewProps) {
  const [bedList, setBedList] = useState<BedItem[]>(beds);
  const [activeWardFilter, setActiveWardFilter] = useState<string>("All");
  const [showTransferWizard, setShowTransferWizard] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedBedForDischarge, setSelectedBedForDischarge] = useState<BedItem | null>(null);

  const handleUpdateCleaningStaff = (bedNo: string, staffName: string) => {
    const updated = bedList.map((b) => (b.bedNo === bedNo ? { ...b, cleaningStaff: staffName } : b));
    setBedList(updated);
    if (onUpdateBeds) onUpdateBeds(updated);
  };

  const handleMarkBedAvailable = (bedNo: string) => {
    const updated = bedList.map((b) => {
      if (b.bedNo === bedNo) {
        return {
          bedNo: b.bedNo,
          ward: b.ward,
          status: "Available" as BedStatus,
          dailyRate: b.dailyRate,
        };
      }
      return b;
    });
    setBedList(updated);
    if (onUpdateBeds) onUpdateBeds(updated);
  };

  const handleSendBedToCleaning = (bedNo: string, staffName?: string) => {
    const updated = bedList.map((b) => {
      if (b.bedNo === bedNo) {
        return {
          ...b,
          status: "Cleaning" as BedStatus,
          cleaningStaff: staffName || HOUSEKEEPING_ROSTER[0],
        };
      }
      return b;
    });
    setBedList(updated);
    if (onUpdateBeds) onUpdateBeds(updated);
  };

  // Smart ICU Telemetry State
  const [icuVitals, setIcuVitals] = useState({
    "ICU-01": { hr: 118, spo2: 94, bp: "90/60", resp: 22, abnormal: true },
    "ICU-02": { hr: 72, spo2: 99, bp: "120/80", resp: 16, abnormal: false },
  });

  // Cascading Alarm State
  const [alarmStage, setAlarmStage] = useState<"IDLE" | "PRIMARY_NURSE" | "CASCADED_BACKUP" | "RESOLVED">("PRIMARY_NURSE");
  const [escalationCountdown, setEscalationCountdown] = useState(8);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (alarmStage === "PRIMARY_NURSE" && escalationCountdown > 0) {
      timer = setTimeout(() => setEscalationCountdown((prev) => prev - 1), 1000);
    } else if (alarmStage === "PRIMARY_NURSE" && escalationCountdown === 0) {
      setAlarmStage("CASCADED_BACKUP");
    }
    return () => clearTimeout(timer);
  }, [alarmStage, escalationCountdown]);

  const [transferData, setTransferData] = useState({
    sourceBedNo: "DLX-104",
    destWard: "ICU" as BedWard,
    destBedNo: "ICU-03",
    reason: "Escalation to continuous hemodynamic telemetry monitoring",
  });

  const handleSimulateCriticalBreach = () => {
    setIcuVitals((prev) => ({
      ...prev,
      "ICU-01": { hr: 144, spo2: 83, bp: "82/52", resp: 30, abnormal: true },
    }));
    setAlarmStage("PRIMARY_NURSE");
    setEscalationCountdown(8);
  };

  const handleAcknowledgeAlert = () => {
    setIcuVitals((prev) => ({
      ...prev,
      "ICU-01": { hr: 78, spo2: 98, bp: "118/78", resp: 18, abnormal: false },
    }));
    setAlarmStage("RESOLVED");
  };

  const handleBedTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceBed = bedList.find((b) => b.bedNo === transferData.sourceBedNo);
    if (!sourceBed || !sourceBed.patientId) return;

    const updated = bedList.map((b) => {
      if (b.bedNo === transferData.sourceBedNo) {
        return { bedNo: b.bedNo, ward: b.ward, status: "Cleaning" as BedStatus, dailyRate: b.dailyRate };
      }
      if (b.bedNo === transferData.destBedNo) {
        return {
          ...b,
          status: "Occupied" as BedStatus,
          patientId: sourceBed.patientId,
          patientName: sourceBed.patientName,
          admittedDate: sourceBed.admittedDate,
          attendingDoctor: sourceBed.attendingDoctor,
          nurseAssigned: sourceBed.nurseAssigned,
        };
      }
      return b;
    });

    setBedList(updated);
    if (onUpdateBeds) onUpdateBeds(updated);
    setShowTransferWizard(false);
  };

  const [dischargeError, setDischargeError] = useState<string | null>(null);
  const [dischargeSuccess, setDischargeSuccess] = useState<string | null>(null);

  const handleConfirmDischarge = async () => {
    setDischargeError(null);
    setDischargeSuccess(null);
    if (!selectedBedForDischarge || !selectedBedForDischarge.patientId) return;

    try {
      const res = await fetch("/api/discharges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedBedForDischarge.patientId,
          bedNo: selectedBedForDischarge.bedNo,
          dischargeNotes: "Discharged in stable condition.",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setDischargeError(json.error || "Discharge transaction failed");
        return;
      }

      const updated = bedList.map((b) => {
        if (b.bedNo === selectedBedForDischarge.bedNo) {
          return { bedNo: b.bedNo, ward: b.ward, status: "Available" as BedStatus, dailyRate: b.dailyRate };
        }
        return b;
      });

      setBedList(updated);
      if (onUpdateBeds) onUpdateBeds(updated);
      setShowDischargeModal(false);
      setDischargeSuccess(json.message || `Patient discharged cleanly! Bed #${selectedBedForDischarge.bedNo} released.`);
    } catch (e: any) {
      setDischargeError(e.message || "Network error while processing discharge");
    }
  };

  const filteredBeds = bedList.filter((b) => {
    if (activeWardFilter === "All") return true;
    return b.ward === activeWardFilter;
  });

  return (
    <div className="space-y-6 text-[#111]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-black/10 shadow-sm relative overflow-hidden" style={LANDING_GLASS_CARD}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#111] text-white flex items-center justify-center shadow-md shrink-0">
            <Bed className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase">
                LAYER 02: HOSPITAL SIGNALS
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#111]">Inpatient (IPD) &amp; Smart ICU Bed Ring</h2>
            <p className="text-xs text-black/50">Live ward occupancy, telemetry vitals monitoring, and multi-nurse cascading alert chain</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateCriticalBreach}
            className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 animate-pulse"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Simulate Vitals Anomaly (ICU-01)</span>
          </button>

          <button
            onClick={() => {
              const occupied = bedList.find((b) => b.status === "Occupied");
              if (occupied) setTransferData({ ...transferData, sourceBedNo: occupied.bedNo });
              setShowTransferWizard(true);
            }}
            className="px-4 py-2 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Bed Transfer Wizard</span>
          </button>
        </div>
      </div>

      {/* 02. SMART ICU BED RING & CASCADING MULTI-NURSE ESCALATION PANEL */}
      <div className="p-6 rounded-3xl border border-black/10 shadow-sm space-y-4" style={LANDING_GLASS_CARD}>
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
            <span className="font-pixel text-xs tracking-widest uppercase font-bold text-[#111]">
              SMART ICU BED RING — LIVE TELEMETRY STREAM
            </span>
          </div>
          <span className="text-xs text-black/50 font-mono">Telemetry Protocol v4.2 • 24/7 Monitored</span>
        </div>

        {/* CASCADING ESCALATION BANNER */}
        {alarmStage !== "RESOLVED" && (
          <div className={`p-4 rounded-2xl border transition-all ${
            alarmStage === "CASCADED_BACKUP"
              ? "bg-rose-100/90 border-rose-400 text-rose-950 shadow-md"
              : "bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">
                      {alarmStage === "CASCADED_BACKUP"
                        ? "🚨 CASCADED ESCALATION: Secondary Backup Nurse Alerted!"
                        : "⚠️ PRIMARY NURSE ALERT: Vitals Breach Detected on ICU-01"}
                    </span>
                    <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-rose-700 text-white font-bold">
                      PATIENT: KOUSHIK
                    </span>
                  </div>

                  <p className="text-[11px] mt-0.5 text-black/70">
                    {alarmStage === "CASCADED_BACKUP" ? (
                      <span>
                        Primary nurse (<strong>Nurse Ananya Sharma</strong>) did not acknowledge within 10s. Alert has <strong>automatically cascaded</strong> to neighboring bed nurse (<strong>Nurse Priya Nair — ICU-02</strong>).
                      </span>
                    ) : (
                      <span>
                        Assigned Primary: <strong>Nurse Ananya Sharma</strong>. Auto-escalating to adjacent ward nurse in <strong className="font-mono text-rose-700">{escalationCountdown}s</strong> if unacknowledged.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {alarmStage === "PRIMARY_NURSE" && (
                  <button
                    onClick={() => setAlarmStage("CASCADED_BACKUP")}
                    className="px-3 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-xs font-semibold"
                  >
                    Test Escalation Failover
                  </button>
                )}
                <button
                  onClick={handleAcknowledgeAlert}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Acknowledge &amp; Stabilize Vitals</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ICU Beds Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* ICU-01 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            icuVitals["ICU-01"].abnormal
              ? "bg-rose-50/80 border-rose-300 ring-2 ring-rose-400"
              : "bg-white/80 border-black/10"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#111]">ICU-01</span>
                <span className="font-bold text-xs text-[#111]">Koushik (Age 29, Male)</span>
              </div>
              <span className="text-[10px] font-pixel px-2 py-0.5 rounded bg-black/10 text-black/70 font-bold">
                Attending: Dr. Ashwini Kumaras
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
              <div className="bg-white/90 p-2 rounded-xl border border-black/10">
                <span className="text-[9px] font-pixel text-black/40 uppercase block">HR (bpm)</span>
                <span className={`font-mono font-bold text-sm ${icuVitals["ICU-01"].hr > 120 ? "text-rose-700 font-extrabold" : "text-[#111]"}`}>
                  {icuVitals["ICU-01"].hr}
                </span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl border border-black/10">
                <span className="text-[9px] font-pixel text-black/40 uppercase block">SpO2 (%)</span>
                <span className={`font-mono font-bold text-sm ${icuVitals["ICU-01"].spo2 < 90 ? "text-rose-700 font-extrabold" : "text-[#111]"}`}>
                  {icuVitals["ICU-01"].spo2}%
                </span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl border border-black/10">
                <span className="text-[9px] font-pixel text-black/40 uppercase block">BP (mmHg)</span>
                <span className="font-mono font-bold text-sm text-[#111]">{icuVitals["ICU-01"].bp}</span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl border border-black/10">
                <span className="text-[9px] font-pixel text-black/40 uppercase block">Resp Rate</span>
                <span className="font-mono font-bold text-sm text-[#111]">{icuVitals["ICU-01"].resp}/m</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-black/60 pt-2 border-t border-black/10">
              <span>Primary Nurse: <strong>Nurse Ananya Sharma</strong></span>
              <span className="text-emerald-800 font-semibold">Backup Ring: Nurse Priya Nair (ICU-02)</span>
            </div>
          </div>

          {/* ICU-02 */}
          <div className="p-4 rounded-2xl border bg-white/80 border-black/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#111]">ICU-02</span>
                <span className="font-bold text-xs text-[#111]">Sundar (Age 32, Male)</span>
              </div>
              <span className="text-[10px] font-pixel px-2 py-0.5 rounded bg-black/10 text-black/70 font-bold">
                Attending: Dr. Dhanvantari
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
              <div className="bg-white/90 p-2 rounded-xl border border-black/10">
                <span className="text-[9px] font-pixel text-black/40 uppercase block">HR (bpm)</span>
                <span className="font-mono font-bold text-sm text-emerald-800">{icuVitals["ICU-02"].hr}</span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl border border-black/10">
                <span className="text-[9px] font-pixel text-black/40 uppercase block">SpO2 (%)</span>
                <span className="font-mono font-bold text-sm text-emerald-800">{icuVitals["ICU-02"].spo2}%</span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl border border-black/10">
                <span className="text-[9px] font-pixel text-black/40 uppercase block">BP (mmHg)</span>
                <span className="font-mono font-bold text-sm text-[#111]">{icuVitals["ICU-02"].bp}</span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl border border-black/10">
                <span className="text-[9px] font-pixel text-black/40 uppercase block">Resp Rate</span>
                <span className="font-mono font-bold text-sm text-[#111]">{icuVitals["ICU-02"].resp}/m</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-black/60 pt-2 border-t border-black/10">
              <span>Primary Nurse: <strong>Nurse Priya Nair</strong></span>
              <span className="text-emerald-800 font-semibold">Backup Ring: Nurse Deepa Menon (Gen Ward)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ward Filter Bar */}
      <div className="p-3 rounded-2xl border border-black/10 shadow-sm flex items-center gap-2 overflow-x-auto" style={LANDING_GLASS_CARD}>
        <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase mr-2 shrink-0">Filter Ward:</span>
        {["All", "ICU", "Deluxe", "Semi-Private", "General"].map((w) => (
          <button
            key={w}
            onClick={() => setActiveWardFilter(w)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeWardFilter === w
                ? "bg-[#111] text-white shadow-md"
                : "bg-white/80 text-black/60 hover:bg-white"
            }`}
          >
            {w} Ward
          </button>
        ))}
      </div>

      {/* Housekeeping & Sanitization Operations Bar */}
      <div className="p-4 rounded-2xl border border-black/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" style={LANDING_GLASS_CARD}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] tracking-widest text-amber-900 uppercase font-bold">
                HOUSEKEEPING & SANITIZATION QUEUE
              </span>
              <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {bedList.filter((b) => b.status === "Cleaning").length} Beds Cleaning
              </span>
            </div>
            <p className="text-xs text-black/60 font-medium mt-0.5">
              Terminal disinfection, linen change, and UV sterilizer allocation roster
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {bedList.some((b) => b.status === "Cleaning") && (
            <button
              onClick={() => {
                const updated = bedList.map((b) => (b.status === "Cleaning" ? { bedNo: b.bedNo, ward: b.ward, status: "Available" as BedStatus, dailyRate: b.dailyRate } : b));
                setBedList(updated);
                if (onUpdateBeds) onUpdateBeds(updated);
              }}
              className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Mark All Cleaned &amp; Available
            </button>
          )}
        </div>
      </div>

      {/* Interactive Hospital Bed Map Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => (
          <div
            key={bed.bedNo}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              bed.status === "Occupied"
                ? "bg-white/70 border-black/20"
                : bed.status === "Available"
                ? "bg-emerald-50/70 border-emerald-300"
                : bed.status === "Cleaning"
                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/50"
                : "bg-slate-50/70 border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-extrabold font-mono text-[#111]">{bed.bedNo}</span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                    bed.status === "Occupied"
                      ? "bg-[#111] text-white"
                      : bed.status === "Available"
                      ? "bg-emerald-700 text-white"
                      : bed.status === "Cleaning"
                      ? "bg-amber-600 text-white animate-pulse"
                      : "bg-black/40 text-white"
                  }`}
                >
                  {bed.status}
                </span>
              </div>

              <div className="text-xs text-black/50 font-medium mb-3">{bed.ward} Ward • ${bed.dailyRate}/Day</div>

              {bed.status === "Occupied" && (
                <div className="space-y-1.5 text-xs bg-white/80 p-3 rounded-xl border border-black/10 shadow-sm">
                  <div className="font-bold text-[#111]">{bed.patientName}</div>
                  <div className="text-[11px] text-black/50">Doc: {typeof bed.attendingDoctor === "object" ? (bed.attendingDoctor as any)?.name : bed.attendingDoctor || "Dr. Dhanvantari"}</div>
                  <div className="text-[11px] text-black/50">Nurse: {typeof bed.nurseAssigned === "object" ? (bed.nurseAssigned as any)?.name : bed.nurseAssigned || "Sister Anitha"}</div>
                  <div className="text-[10px] text-black/40 font-mono">Admitted: {bed.admittedDate}</div>
                </div>
              )}

              {bed.status === "Cleaning" && (
                <div className="space-y-2 text-xs bg-white/90 p-3 rounded-xl border border-amber-200 shadow-sm">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: "6s" }} />
                    Sanitization &amp; Disinfection In Progress
                  </div>
                  <div className="text-[11px] text-black/60">
                    <span className="font-semibold text-black/70 block mb-1">Allocated Housekeeping Staff:</span>
                    <select
                      value={bed.cleaningStaff || HOUSEKEEPING_ROSTER[0]}
                      onChange={(e) => handleUpdateCleaningStaff(bed.bedNo, e.target.value)}
                      className="w-full p-1.5 bg-amber-50/80 border border-amber-300 rounded-lg text-xs font-semibold text-amber-900 outline-none cursor-pointer"
                    >
                      {HOUSEKEEPING_ROSTER.map((staff) => (
                        <option key={staff} value={staff}>
                          {staff}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {bed.status === "Available" && (
                <div className="py-4 text-center text-xs text-emerald-800 font-semibold bg-emerald-100/50 rounded-xl border border-emerald-200/60 p-3">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  Ready for patient admission
                </div>
              )}

              {bed.status === "Maintenance" && (
                <div className="py-4 text-center text-xs text-slate-800 font-semibold bg-slate-100/80 rounded-xl border border-slate-200 p-3">
                  <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                  {bed.maintenanceNotes || "Engineering & Bio-Med Repairs"}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-black/10">
              {bed.status === "Occupied" && (
                <button
                  onClick={() => {
                    setSelectedBedForDischarge(bed);
                    setShowDischargeModal(true);
                  }}
                  className="w-full py-2 bg-[#111] hover:bg-[#333] text-white text-xs font-bold rounded-xl transition-colors text-center"
                >
                  Initiate Discharge Summary
                </button>
              )}

              {bed.status === "Cleaning" && (
                <button
                  onClick={() => handleMarkBedAvailable(bed.bedNo)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors text-center flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Complete Cleaning &amp; Mark Available
                </button>
              )}

              {bed.status === "Available" && (
                <button
                  onClick={() => handleSendBedToCleaning(bed.bedNo)}
                  className="w-full py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  Send for Sanitization / Deep Clean
                </button>
              )}

              {bed.status === "Maintenance" && (
                <button
                  onClick={() => handleMarkBedAvailable(bed.bedNo)}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark Maintenance Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bed Transfer Modal */}
      {showTransferWizard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F0EEE8] rounded-3xl border border-black/10 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-[#111]">Patient Bed Transfer</h3>
            <form onSubmit={handleBedTransfer} className="space-y-3">
              <div>
                <label className="block text-black/60 font-semibold mb-1">Source Occupied Bed</label>
                <select
                  value={transferData.sourceBedNo}
                  onChange={(e) => setTransferData({ ...transferData, sourceBedNo: e.target.value })}
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white"
                >
                  {bedList
                    .filter((b) => b.status === "Occupied")
                    .map((b) => (
                      <option key={b.bedNo} value={b.bedNo}>
                        {b.bedNo} — {b.patientName} ({b.ward})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-black/60 font-semibold mb-1">Destination Available Bed</label>
                <select
                  value={transferData.destBedNo}
                  onChange={(e) => setTransferData({ ...transferData, destBedNo: e.target.value })}
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white"
                >
                  {bedList
                    .filter((b) => b.status === "Available")
                    .map((b) => (
                      <option key={b.bedNo} value={b.bedNo}>
                        {b.bedNo} ({b.ward} Ward)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-black/60 font-semibold mb-1">Reason for Transfer</label>
                <textarea
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none h-16 bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferWizard(false)}
                  className="px-4 py-2 bg-black/5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#111] text-white font-bold rounded-xl hover:bg-[#333]">
                  Confirm Bed Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Summary Modal */}
      {showDischargeModal && selectedBedForDischarge && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F0EEE8] rounded-3xl border border-black/10 shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-base font-bold text-[#111]">Discharge Summary &amp; Bed Clearance</h3>
              <span className="font-mono text-black/40">Bed: {selectedBedForDischarge.bedNo}</span>
            </div>

            <div className="p-4 bg-white/80 rounded-2xl border border-black/10 space-y-2">
              <div><span className="font-bold">Patient:</span> {selectedBedForDischarge.patientName}</div>
              <div><span className="font-bold">Attending Doctor:</span> {typeof selectedBedForDischarge.attendingDoctor === "object" ? (selectedBedForDischarge.attendingDoctor as any)?.name : selectedBedForDischarge.attendingDoctor || "Dr. Dhanvantari"}</div>
              <div><span className="font-bold">Admission Date:</span> {selectedBedForDischarge.admittedDate}</div>
              <div><span className="font-bold">Discharge Date:</span> {new Date().toISOString().split("T")[0]}</div>
            </div>

            <div>
              <label className="block text-[#111] font-bold mb-1">Final Discharge Advice &amp; Medications</label>
              <textarea
                defaultValue="Patient stable for discharge. Continue oral formulation for 5 days. Follow up in Outpatient Clinic in 2 weeks."
                className="w-full p-3 border border-black/10 rounded-xl outline-none h-24 bg-white"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDischargeModal(false)}
                className="px-4 py-2 bg-black/5 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDischarge}
                className="px-5 py-2 bg-[#111] text-white font-bold rounded-xl hover:bg-[#333]"
              >
                Approve Discharge &amp; Release Bed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
