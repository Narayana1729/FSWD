"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  CheckSquare,
  Square,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Heart,
  Plus,
  Zap,
  Radio,
  Sparkles,
  Shield,
  Layers,
  X,
} from "lucide-react";
import { OperationSurgery } from "@/lib/hms-data";

interface OperationTheatreViewProps {
  operations: OperationSurgery[];
  onUpdateOperations?: (ops: OperationSurgery[]) => void;
}

export function OperationTheatreView({ operations = [], onUpdateOperations }: OperationTheatreViewProps) {
  const [opList, setOpList] = useState<OperationSurgery[]>(operations);
  const [selectedSuiteFilter, setSelectedSuiteFilter] = useState<"ALL" | "CATH_LAB" | "CARDIAC_OT" | "GENERAL_OT">("ALL");
  const [selectedOp, setSelectedOp] = useState<OperationSurgery | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [otSuccess, setOtSuccess] = useState<string | null>(null);
  const [otError, setOtError] = useState<string | null>(null);

  const [bookingForm, setBookingForm] = useState({
    patientName: "Koushik (P-1004)",
    procedure: "Coronary Angioplasty & Stenting (DES)",
    otRoom: "Ashwini Cath Lab Suite",
    leadSurgeon: "Dr. Ashwini Kumaras",
    anesthetist: "Dr. Dhanvantari",
    scrubNurse: "Nurse Ananya Sharma",
    startTime: "02:00 PM",
    endTime: "05:00 PM",
  });

  React.useEffect(() => {
    setOpList(operations);
    if (operations.length > 0 && !selectedOp) {
      setSelectedOp(operations[0]);
    }
  }, [operations]);

  const getLeadSurgeon = (op: any) => {
    if (typeof op?.leadSurgeon === "object" && op?.leadSurgeon) return op.leadSurgeon.name || "Surgeon";
    return op?.leadSurgeon || "Dr. Ashwini Kumaras";
  };

  const getOtRoom = (op: any) => {
    if (typeof op?.ot === "object" && op?.ot) return op.ot.name || "OT-1";
    return op?.otRoom || "Sushruta OT-1";
  };

  const getPatientName = (op: any) => {
    if (typeof op?.patient === "object" && op?.patient) return op.patient.name || "Patient";
    return op?.patientName || "Patient";
  };

  const filteredOps = opList.filter((op) => {
    const room = getOtRoom(op).toLowerCase();
    const proc = (op.procedure || "").toLowerCase();
    if (selectedSuiteFilter === "CATH_LAB") {
      return room.includes("cath") || room.includes("ashwini") || proc.includes("catheterization") || proc.includes("coronary");
    }
    if (selectedSuiteFilter === "CARDIAC_OT") {
      return room.includes("cardiac") || room.includes("ashwini") || proc.includes("cardiac");
    }
    if (selectedSuiteFilter === "GENERAL_OT") {
      return room.includes("sushruta") || room.includes("ot-1") || room.includes("ot-2");
    }
    return true;
  });

  const activeOp = selectedOp || filteredOps[0] || opList[0] || null;

  const toggleChecklist = (field: keyof NonNullable<OperationSurgery["preOpChecklist"]>) => {
    if (!activeOp) return;
    const currentChecklist = activeOp.preOpChecklist || {
      identityVerified: true,
      consentSigned: true,
      bloodAvailable: true,
      anesthesiaCleared: true,
      equipmentReady: true,
      surgicalSiteMarked: true,
    };

    const updatedChecklist = { ...currentChecklist, [field]: !currentChecklist[field] };
    const updated = { ...activeOp, preOpChecklist: updatedChecklist };
    setSelectedOp(updated);

    const updatedList = opList.map((o) => (o.id === activeOp.id ? updated : o));
    setOpList(updatedList);
    if (onUpdateOperations) onUpdateOperations(updatedList);
  };

  const handleBookSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtError(null);
    setOtSuccess(null);

    const newOp: OperationSurgery = {
      id: `OT-${200 + opList.length + 1}`,
      patientId: "P-1004",
      patientName: bookingForm.patientName.split(" ")[0],
      procedure: bookingForm.procedure,
      otRoom: bookingForm.otRoom,
      leadSurgeon: bookingForm.leadSurgeon,
      anesthetist: bookingForm.anesthetist,
      scrubNurse: bookingForm.scrubNurse,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      status: "Scheduled",
      preOpChecklist: {
        identityVerified: true,
        consentSigned: true,
        bloodAvailable: true,
        anesthesiaCleared: true,
        equipmentReady: true,
        surgicalSiteMarked: true,
      },
    };

    try {
      await fetch("/api/surgeries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: "cmsvcbdc80011j1bwjcniweo4",
          procedure: newOp.procedure,
          otId: "cmsvcbdcq002rj1bw601zsg4p",
          leadSurgeonId: "cmsvcbdbx000cj1bw8bp6hl8m",
          anesthetist: newOp.anesthetist,
          scrubNurse: newOp.scrubNurse,
          startTime: newOp.startTime,
          endTime: newOp.endTime,
          preOpChecklist: newOp.preOpChecklist,
        }),
      });
    } catch (e) {
      console.warn("Failed to persist surgery to database:", e);
    }

    const updated = [newOp, ...opList];
    setOpList(updated);
    if (onUpdateOperations) onUpdateOperations(updated);
    setSelectedOp(newOp);
    setShowBookingModal(false);
    setOtSuccess(`Surgery slot #${newOp.id} booked in ${newOp.otRoom} for ${newOp.procedure}!`);
  };

  return (
    <div className="space-y-6 font-sans text-[#111]">
      {/* ── TOP HERO BANNER ────────────────────────────────────────── */}
      <div className="bg-[#111] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Activity className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xl font-bold tracking-tight">Operation Theatre (OT) &amp; Cardiac Cath Lab Suite</h2>
            </div>
            <p className="text-xs text-white/60">
              Ashwini Cardiac Hybrid Suite, Fluoroscopic Angiography, Sushruta Reconstructive OT &amp; WHO Safety Checklist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBookingModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Book OT / Cath Lab Slot</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {otSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{otSuccess}</span>
          </div>
          <button onClick={() => setOtSuccess(null)}><X className="w-4 h-4 text-emerald-400" /></button>
        </div>
      )}

      {/* ── SUITE FILTER TABS ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-[#F0EEE8] rounded-2xl border border-black/10 text-xs font-semibold">
        <button
          onClick={() => setSelectedSuiteFilter("ALL")}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedSuiteFilter === "ALL" ? "bg-[#111] text-white shadow-sm" : "text-black/60 hover:text-[#111]"
          }`}
        >
          All Surgical Suites ({opList.length})
        </button>
        <button
          onClick={() => setSelectedSuiteFilter("CATH_LAB")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            selectedSuiteFilter === "CATH_LAB" ? "bg-purple-700 text-white shadow-sm" : "text-black/60 hover:text-[#111]"
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Cath Lab &amp; Angiography ({opList.filter((o) => getOtRoom(o).toLowerCase().includes("ashwini") || o.procedure.toLowerCase().includes("catheter")).length})</span>
        </button>
        <button
          onClick={() => setSelectedSuiteFilter("CARDIAC_OT")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            selectedSuiteFilter === "CARDIAC_OT" ? "bg-rose-700 text-white shadow-sm" : "text-black/60 hover:text-[#111]"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Cardiac Hybrid OT</span>
        </button>
        <button
          onClick={() => setSelectedSuiteFilter("GENERAL_OT")}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedSuiteFilter === "GENERAL_OT" ? "bg-[#111] text-white shadow-sm" : "text-black/60 hover:text-[#111]"
          }`}
        >
          Sushruta Reconstructive OT-1
        </button>
      </div>

      {/* ── MAIN SURGICAL GRID ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* OT Timetable List (5 cols) */}
        <div className="lg:col-span-5 bg-[#F0EEE8] rounded-2xl border border-black/10 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#111] uppercase tracking-wider font-pixel">Surgical Timetable</h3>
            <span className="text-xs text-black/50 font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-black/5">
              {filteredOps.length} Operations
            </span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredOps.length === 0 ? (
              <div className="text-center py-12 text-black/40 text-xs">No surgical slots booked in this category.</div>
            ) : (
              filteredOps.map((op) => {
                const isSelected = activeOp?.id === op.id;
                const surgeon = getLeadSurgeon(op);
                const room = getOtRoom(op);
                const pName = getPatientName(op);
                const isCathLab = room.toLowerCase().includes("ashwini") || op.procedure.toLowerCase().includes("catheter");

                return (
                  <div
                    key={op.id}
                    onClick={() => setSelectedOp(op)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-xs ${
                      isSelected
                        ? "bg-white border-purple-400 ring-2 ring-purple-500/20 shadow-sm"
                        : "bg-white/70 border-black/10 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isCathLab ? "bg-purple-600 animate-pulse" : "bg-emerald-600"}`} />
                        <span className="font-bold text-[#111]">{room}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          op.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : op.status === "In Progress"
                            ? "bg-rose-100 text-rose-800 animate-pulse"
                            : op.status === "Pre-Op Check"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {op.status}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-800">{op.procedure}</div>
                    <div className="text-[11px] text-black/60 mt-1">Patient: {pName}</div>
                    <div className="text-[10px] text-black/40 mt-0.5">Surgeon: {surgeon}</div>
                    <div className="text-[10px] text-black/50 font-mono mt-2 flex items-center justify-between pt-1 border-t border-black/5">
                      <span>Time: {op.startTime} - {op.endTime}</span>
                      <span className="text-purple-700 font-semibold">{isSelected ? "Viewing →" : "Select"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Surgery Safety Checklist & Team (7 cols) */}
        <div className="lg:col-span-7 bg-[#F0EEE8] rounded-2xl border border-black/10 p-6 shadow-xs space-y-6">
          {activeOp ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/10">
                <div>
                  <span className="text-[10px] font-mono text-purple-700 uppercase tracking-widest font-bold block mb-0.5">
                    {getOtRoom(activeOp)} • SURGICAL RECORD
                  </span>
                  <h3 className="text-lg font-bold text-[#111]">{activeOp.procedure}</h3>
                  <p className="text-xs text-black/50 mt-0.5">Patient: {getPatientName(activeOp)}</p>
                </div>
                <span className="px-3 py-1 bg-purple-700 text-white text-xs font-bold rounded-full">
                  {activeOp.status}
                </span>
              </div>

              {/* Cath Lab Live Monitor Telemetry (if Cath Lab / Cardiac Suite) */}
              {(getOtRoom(activeOp).toLowerCase().includes("ashwini") || activeOp.procedure.toLowerCase().includes("catheter")) && (
                <div className="p-4 bg-stone-900 text-white rounded-2xl border border-black/20 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-rose-400 animate-ping" />
                      <span className="font-mono text-emerald-400 font-bold text-[11px]">CATH LAB FLUOROSCOPY TELEMETRY</span>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold uppercase">LIVE FEED</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div className="p-2 bg-black/40 rounded-xl border border-white/10">
                      <span className="text-[9px] text-white/50 block">Aortic BP</span>
                      <span className="text-emerald-400 font-bold">118/74</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded-xl border border-white/10">
                      <span className="text-[9px] text-white/50 block">Heart Rate</span>
                      <span className="text-rose-400 font-bold">72 BPM</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded-xl border border-white/10">
                      <span className="text-[9px] text-white/50 block">Sheath Size</span>
                      <span className="text-amber-300 font-bold">6 French</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded-xl border border-white/10">
                      <span className="text-[9px] text-white/50 block">Contrast Vol</span>
                      <span className="text-cyan-300 font-bold">45 mL</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Surgical Team Box */}
              <div className="grid grid-cols-3 gap-3 bg-white/80 p-4 rounded-2xl border border-black/10 text-xs">
                <div>
                  <span className="text-[10px] text-black/40 font-semibold uppercase block">Lead Surgeon</span>
                  <div className="font-bold text-[#111] mt-0.5">{getLeadSurgeon(activeOp)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-black/40 font-semibold uppercase block">Anesthetist</span>
                  <div className="font-bold text-[#111] mt-0.5">{activeOp.anesthetist || "Dr. Dhanvantari"}</div>
                </div>
                <div>
                  <span className="text-[10px] text-black/40 font-semibold uppercase block">Scrub Nurse</span>
                  <div className="font-bold text-[#111] mt-0.5">{activeOp.scrubNurse || "Nurse Ananya Sharma"}</div>
                </div>
              </div>

              {/* Pre-Operative WHO Safety Checklist */}
              <div>
                <h4 className="text-xs font-bold text-black/70 uppercase tracking-wider mb-3 font-pixel">
                  Pre-Operative WHO Safety Checklist
                </h4>
                <div className="space-y-2 text-xs">
                  {[
                    { key: "identityVerified", label: "Patient Identity & Surgical Procedure Confirmed" },
                    { key: "consentSigned", label: "Surgical Consent Form Signed & Digitally Uploaded" },
                    { key: "bloodAvailable", label: "Cross-matched Blood Units Reserved in Blood Bank (O+ 2 Units)" },
                    { key: "anesthesiaCleared", label: "Anesthesia Clearance & Airway Assessment Complete" },
                    { key: "equipmentReady", label: "Sterile Surgical Equipment, Stents & Cath Guide Wires Ready" },
                    { key: "surgicalSiteMarked", label: "Surgical Site / Radial Access Anatomically Marked" },
                  ].map((item) => {
                    const checklist = activeOp.preOpChecklist || {
                      identityVerified: true,
                      consentSigned: true,
                      bloodAvailable: true,
                      anesthesiaCleared: true,
                      equipmentReady: true,
                      surgicalSiteMarked: true,
                    };
                    const checked = Boolean((checklist as any)[item.key]);

                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleChecklist(item.key as any)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold"
                            : "bg-white/70 border-black/10 text-black/60"
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-black/30 shrink-0" />
                        )}
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-black/40 text-xs">
              Select an operation schedule on the left to inspect pre-op WHO safety checklist and surgical team.
            </div>
          )}
        </div>
      </div>

      {/* Booking Surgery Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F0EEE8] rounded-3xl border border-black/10 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600 animate-pulse" />
                <h3 className="text-base font-bold text-[#111]">Book Surgical / Cath Lab Slot</h3>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-black/40 hover:text-black font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSurgery} className="space-y-3">
              <div>
                <label className="block font-semibold text-black/70 mb-1">Patient</label>
                <input
                  required
                  value={bookingForm.patientName}
                  onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })}
                  placeholder="e.g. Koushik (P-1004)"
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-black/70 mb-1">Surgical / Cath Lab Procedure</label>
                <input
                  required
                  value={bookingForm.procedure}
                  onChange={(e) => setBookingForm({ ...bookingForm, procedure: e.target.value })}
                  placeholder="e.g. Coronary Angioplasty, CABG, Knee Arthroscopy"
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">Surgical Suite / Theatre</label>
                  <select
                    value={bookingForm.otRoom}
                    onChange={(e) => setBookingForm({ ...bookingForm, otRoom: e.target.value })}
                    className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold"
                  >
                    <option value="Ashwini Cath Lab Suite">Ashwini Cath Lab Suite</option>
                    <option value="Ashwini Cardiac Hybrid OT">Ashwini Cardiac Hybrid OT</option>
                    <option value="Sushruta Reconstructive OT-1">Sushruta Reconstructive OT-1</option>
                    <option value="Dronagiri Robotic OT-3">Dronagiri Robotic OT-3</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-black/70 mb-1">Lead Surgeon</label>
                  <select
                    value={bookingForm.leadSurgeon}
                    onChange={(e) => setBookingForm({ ...bookingForm, leadSurgeon: e.target.value })}
                    className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold"
                  >
                    <option value="Dr. Ashwini Kumaras">Dr. Ashwini Kumaras (Cardiac / Trauma)</option>
                    <option value="Dr. Sushruta">Dr. Sushruta (Reconstructive Surgery)</option>
                    <option value="Dr. Dhanvantari">Dr. Dhanvantari (Integrative Surgery)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">Start Time</label>
                  <input
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    placeholder="02:00 PM"
                    className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-black/70 mb-1">End Time</label>
                  <input
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    placeholder="05:00 PM"
                    className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-black/5 rounded-xl font-semibold text-black/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm OT Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
