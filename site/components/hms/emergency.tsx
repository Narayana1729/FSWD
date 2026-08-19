"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  Activity,
  Plus,
  User,
  HeartPulse,
  Clock,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Shield,
  Truck,
  BedDouble,
  X,
} from "lucide-react";
import { EmergencyCase, EmergencySeverity } from "@/lib/hms-data";

interface EmergencyViewProps {
  emergencyCases: EmergencyCase[];
  onAddEmergencyCase: (c: EmergencyCase) => void;
}

export function EmergencyView({ emergencyCases, onAddEmergencyCase }: EmergencyViewProps) {
  const [cases, setCases] = useState<EmergencyCase[]>(emergencyCases);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCase, setNewCase] = useState({
    patientName: "",
    age: "45",
    gender: "Male",
    severity: "RED" as EmergencySeverity,
    chiefComplaint: "Severe polytrauma, hypotension",
    assignedDoctor: "Dr. Ashwini Kumaras",
    traumaBay: "Bay 2 (Trauma)",
    bedNo: "ER-03",
  });

  const [emgError, setEmgError] = useState<string | null>(null);
  const [emgSuccess, setEmgSuccess] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // ── Dispatch Ambulance to Emergency Case ──
  const handleDispatchAmbulance = async (emgCase: EmergencyCase) => {
    setEmgError(null);
    setEmgSuccess(null);
    setLoadingAction(`dispatch-${emgCase.id}`);

    try {
      const res = await fetch("/api/ambulances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambulanceId: "AMB-01",
          availability: "On Dispatch",
          emergencyCaseId: emgCase.id,
          patientName: emgCase.patientName,
          pickupAddress: "Emergency Scene — " + emgCase.chiefComplaint,
          destination: "Dronagiri Emergency Bay 1",
          etaMins: 8,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setEmgError(json.error || "Failed to dispatch ambulance");
        return;
      }

      setEmgSuccess(json.message || `Ambulance AMB-01 dispatched for ${emgCase.patientName}! ETA: 8 mins.`);
    } catch (e: any) {
      setEmgError(e.message || "Network error while dispatching ambulance");
    } finally {
      setLoadingAction(null);
    }
  };

  // ── Admit Emergency Case to ICU (Atomic Transaction) ──
  const handleAdmitEmergencyCase = async (emgCase: EmergencyCase) => {
    setEmgError(null);
    setEmgSuccess(null);
    setLoadingAction(`admit-${emgCase.id}`);

    try {
      const res = await fetch("/api/emergency/admit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyCaseId: emgCase.id,
          bedNo: emgCase.severity === "RED" ? "ICU-03" : "GEN-302",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setEmgError(json.error || "Emergency admission transaction failed");
        return;
      }

      const updated = cases.map((c) => (c.id === emgCase.id ? { ...c, status: "Admitted" } : c));
      setCases(updated);
      setEmgSuccess(json.message || `Emergency Case #${emgCase.id} admitted! Billed ₹${json.triageFee}.`);
    } catch (e: any) {
      setEmgError(e.message || "Network error while admitting emergency case");
    } finally {
      setLoadingAction(null);
    }
  };

  // ── Register New Emergency Case ──
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmgError(null);
    setEmgSuccess(null);
    const c: EmergencyCase = {
      id: `EMG-${900 + cases.length + 1}`,
      patientName: newCase.patientName || "Emergency Patient",
      age: parseInt(newCase.age) || 45,
      gender: newCase.gender,
      arrivalTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      severity: newCase.severity,
      chiefComplaint: newCase.chiefComplaint,
      assignedDoctor: newCase.assignedDoctor,
      traumaBay: newCase.traumaBay,
      bedNo: newCase.bedNo,
      vitals: { bp: "110/70", pulse: 102, temp: "98.6 F", spo2: 96 },
      status: "Triaged",
    };

    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: c.patientName,
          age: c.age,
          gender: c.gender,
          severity: c.severity,
          chiefComplaint: c.chiefComplaint,
          assignedDoctor: c.assignedDoctor,
          traumaBay: c.traumaBay,
          bedNo: c.bedNo,
          vitals: c.vitals,
        }),
      });
      const json = await res.json();
      if (json.emergencyCase?.id) c.id = json.emergencyCase.id;
    } catch (err) {
      console.warn("Failed to persist emergency case:", err);
    }

    onAddEmergencyCase(c);
    setCases((prev) => [c, ...prev]);
    setShowNewModal(false);
    setEmgSuccess(`Registered Emergency Case #${c.id} (${c.severity} Triage).`);
  };

  const severityBorder = (s: string) =>
    s === "RED" ? "border-rose-300" : s === "YELLOW" ? "border-amber-300" : "border-emerald-300";
  const severityBg = (s: string) =>
    s === "RED" ? "bg-rose-100/60" : s === "YELLOW" ? "bg-amber-100/60" : "bg-emerald-100/60";
  const severityText = (s: string) =>
    s === "RED" ? "text-rose-950" : s === "YELLOW" ? "text-amber-950" : "text-emerald-950";

  return (
    <div className="space-y-6 text-[#111]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-md bg-white/10 hidden sm:block">
            <img src="/images/register-triage.png" alt="Register & Triage" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-xl font-bold tracking-tight">Emergency Department &amp; Triage Board</h2>
            </div>
            <p className="text-xs text-white/60">Critical care triage, trauma bays, resuscitations, ambulance dispatch, and rapid ICU transfers</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register Emergency Triage Case</span>
        </button>
      </div>

      {/* Success / Error Banners */}
      {emgSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{emgSuccess}</span>
          </div>
          <button onClick={() => setEmgSuccess(null)} className="text-emerald-400 hover:text-emerald-600"><X className="w-4 h-4" /></button>
        </div>
      )}
      {emgError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{emgError}</span>
          </div>
          <button onClick={() => setEmgError(null)} className="text-rose-400 hover:text-rose-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Triage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RED TRIAGE */}
        <div className="bg-[#F0EEE8] rounded-2xl border border-rose-300/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-rose-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
              <h3 className="text-xs font-pixel tracking-widest text-rose-900 uppercase">RED — Immediate Care</h3>
            </div>
            <span className="text-xs font-bold text-rose-700 font-mono">
              {cases.filter((c) => c.severity === "RED").length}
            </span>
          </div>

          <div className="space-y-3">
            {cases
              .filter((c) => c.severity === "RED")
              .map((c) => (
                <div key={c.id} className="p-4 bg-rose-100/60 border border-rose-300 rounded-xl space-y-2 text-xs text-rose-950">
                  <div className="flex items-center justify-between font-bold">
                    <span>{c.patientName} ({c.age}Y / {c.gender})</span>
                    <div className="flex items-center gap-2">
                      {c.status === "Admitted" && (
                        <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold uppercase">Admitted</span>
                      )}
                      <span className="font-mono text-[10px]">{c.arrivalTime}</span>
                    </div>
                  </div>
                  <div className="font-medium">{c.chiefComplaint}</div>
                  {c.vitals && (
                    <div className="p-2 bg-white/80 rounded-lg border border-rose-200 font-mono text-[11px]">
                      BP: {c.vitals.bp} | HR: {c.vitals.pulse} | SpO2: {c.vitals.spo2}%
                    </div>
                  )}

                  {/* Action Buttons */}
                  {c.status !== "Admitted" && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleDispatchAmbulance(c)}
                        disabled={loadingAction === `dispatch-${c.id}`}
                        className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        {loadingAction === `dispatch-${c.id}` ? "Dispatching..." : "Dispatch Ambulance"}
                      </button>
                      <button
                        onClick={() => handleAdmitEmergencyCase(c)}
                        disabled={loadingAction === `admit-${c.id}`}
                        className="flex-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <BedDouble className="w-3.5 h-3.5" />
                        {loadingAction === `admit-${c.id}` ? "Admitting..." : "Admit to ICU"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* YELLOW TRIAGE */}
        <div className="bg-[#F0EEE8] rounded-2xl border border-amber-300/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="text-xs font-pixel tracking-widest text-amber-900 uppercase">YELLOW — Urgent Care</h3>
            </div>
            <span className="text-xs font-bold text-amber-700 font-mono">
              {cases.filter((c) => c.severity === "YELLOW").length}
            </span>
          </div>

          <div className="space-y-3">
            {cases
              .filter((c) => c.severity === "YELLOW")
              .map((c) => (
                <div key={c.id} className="p-4 bg-amber-100/60 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-950">
                  <div className="flex items-center justify-between font-bold">
                    <span>{c.patientName} ({c.age}Y / {c.gender})</span>
                    <div className="flex items-center gap-2">
                      {c.status === "Admitted" && (
                        <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold uppercase">Admitted</span>
                      )}
                      <span className="font-mono text-[10px]">{c.arrivalTime}</span>
                    </div>
                  </div>
                  <div className="font-medium">{c.chiefComplaint}</div>
                  {c.status !== "Admitted" && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleDispatchAmbulance(c)}
                        disabled={loadingAction === `dispatch-${c.id}`}
                        className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        {loadingAction === `dispatch-${c.id}` ? "Dispatching..." : "Dispatch Ambulance"}
                      </button>
                      <button
                        onClick={() => handleAdmitEmergencyCase(c)}
                        disabled={loadingAction === `admit-${c.id}`}
                        className="flex-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <BedDouble className="w-3.5 h-3.5" />
                        {loadingAction === `admit-${c.id}` ? "Admitting..." : "Admit Inpatient"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* GREEN TRIAGE */}
        <div className="bg-[#F0EEE8] rounded-2xl border border-emerald-300/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-pixel tracking-widest text-emerald-900 uppercase">GREEN — Non-Urgent</h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              {cases.filter((c) => c.severity === "GREEN").length}
            </span>
          </div>

          <div className="space-y-3">
            {cases
              .filter((c) => c.severity === "GREEN")
              .map((c) => (
                <div key={c.id} className="p-4 bg-emerald-100/60 border border-emerald-300 rounded-xl space-y-2 text-xs text-emerald-950">
                  <div className="flex items-center justify-between font-bold">
                    <span>{c.patientName} ({c.age}Y / {c.gender})</span>
                    <div className="flex items-center gap-2">
                      {c.status === "Admitted" && (
                        <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold uppercase">Admitted</span>
                      )}
                      <span className="font-mono text-[10px]">{c.arrivalTime}</span>
                    </div>
                  </div>
                  <div className="font-medium">{c.chiefComplaint}</div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* New Emergency Triage Registration Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-black/10 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">Register Emergency Triage Patient</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Patient Name</label>
                  <input
                    required
                    value={newCase.patientName}
                    onChange={(e) => setNewCase({ ...newCase, patientName: e.target.value })}
                    placeholder="e.g. Vikramaditya"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={newCase.age}
                    onChange={(e) => setNewCase({ ...newCase, age: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newCase.gender}
                    onChange={(e) => setNewCase({ ...newCase, gender: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Triage Severity Level</label>
                  <select
                    value={newCase.severity}
                    onChange={(e) => setNewCase({ ...newCase, severity: e.target.value as EmergencySeverity })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white font-bold text-rose-700"
                  >
                    <option value="RED">🔴 RED — Immediate Resuscitation</option>
                    <option value="YELLOW">🟡 YELLOW — Urgent Care</option>
                    <option value="GREEN">🟢 GREEN — Non-Urgent Care</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Complaint &amp; Vitals Note</label>
                <textarea
                  value={newCase.chiefComplaint}
                  onChange={(e) => setNewCase({ ...newCase, chiefComplaint: e.target.value })}
                  placeholder="Describe emergency presentation, trauma mechanism..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned ER Doctor</label>
                  <input
                    value={newCase.assignedDoctor}
                    onChange={(e) => setNewCase({ ...newCase, assignedDoctor: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trauma Bay / Bed</label>
                  <input
                    value={newCase.traumaBay}
                    onChange={(e) => setNewCase({ ...newCase, traumaBay: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  Confirm Emergency Triage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
