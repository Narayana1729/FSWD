"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Play,
  CheckCircle,
  FileText,
  Stethoscope,
  Pill,
  Activity,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Heart,
  FileCheck,
  Check,
  X,
  HeartPulse,
} from "lucide-react";
import { Patient, Doctor, OPDToken } from "@/lib/hms-data";

interface OPDAppointmentsViewProps {
  patients: Patient[];
  doctors: Doctor[];
  opdTokens: OPDToken[];
  onAddToken: (token: OPDToken) => void;
  onUpdateTokens?: (tokens: OPDToken[]) => void;
}

export function OPDAppointmentsView({
  patients = [],
  doctors = [],
  opdTokens = [],
  onAddToken,
  onUpdateTokens,
}: OPDAppointmentsViewProps) {
  const [tokens, setTokens] = useState<OPDToken[]>(opdTokens);
  const [filterMode, setFilterMode] = useState<"dhanvantari" | "all">("dhanvantari");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeConsultationToken, setActiveConsultationToken] = useState<OPDToken | null>(null);

  // Sync with incoming tokens
  useEffect(() => {
    setTokens(opdTokens);
    if (opdTokens.length > 0 && !activeConsultationToken) {
      const match = opdTokens.find((t) => {
        const docName = typeof t.doctorName === "string" ? t.doctorName : (t as any).doctor?.name || "";
        return docName.includes("Dhanvantari");
      }) || opdTokens[0];
      setActiveConsultationToken(match);
    }
  }, [opdTokens]);

  const [bookingData, setBookingData] = useState({
    patientId: patients[0]?.id || "P-1001",
    department: "Cardiology & Integrative Medicine",
    doctorName: "Dr. Dhanvantari",
    doctorId: doctors.find((d) => d.name.includes("Dhanvantari"))?.id || "DOC-101",
    time: "11:30 AM",
    reason: "Hypertension & Cardiac Follow-up",
  });

  const [vitals, setVitals] = useState({
    bp: "128/84 mmHg",
    pulse: "76 bpm",
    temp: "98.6 °F",
    spo2: "99%",
    ecg: "Normal Sinus Rhythm",
  });

  const [symptoms, setSymptoms] = useState("Sudden chest tightness and high pulse after exertion, mild exertion fatigue.");
  const [diagnosis, setDiagnosis] = useState("Stage 1 Essential Hypertension • Pre-anginal strain • Vata-Pitta Imbalance");
  const [clinicalNotes, setClinicalNotes] = useState("Cardiology OPD consultation completed. Patient advised dietary moderation, lifestyle regularities, and prescription regimen.");
  const [prescriptionItems, setPrescriptionItems] = useState([
    { med: "Arjuna Bark Extract 500mg", dosage: "1 Capsule", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
    { med: "Atorvastatin 10mg", dosage: "1 Tablet", freq: "Once Daily (Night)", duration: "30 Days" },
    { med: "Aspirin 81mg", dosage: "1 Tablet", freq: "Once Daily (Morning)", duration: "30 Days" },
  ]);
  const [newMed, setNewMed] = useState("");
  const [orderedTests, setOrderedTests] = useState<string[]>(["Lipid Profile", "Cardiac Troponin I", "2D Echocardiogram"]);
  const [consultationSaved, setConsultationSaved] = useState(false);
  const [opdSuccess, setOpdSuccess] = useState<string | null>(null);

  const getDocName = (t: OPDToken) => {
    if (typeof t.doctorName === "string" && t.doctorName) return t.doctorName;
    if (typeof (t as any).doctor === "object") return (t as any).doctor?.name || "Dr. Dhanvantari";
    return (t as any).doctor || "Dr. Dhanvantari";
  };

  const getPatientName = (t: OPDToken) => {
    if (typeof t.patientName === "string" && t.patientName) return t.patientName;
    if (typeof (t as any).patient === "object") return (t as any).patient?.name || "Patient";
    return (t as any).patient || "Patient";
  };

  const getDept = (t: OPDToken) => {
    if (typeof t.department === "string" && t.department) return t.department;
    if (typeof (t as any).doctor?.department === "object") return (t as any).doctor?.department?.name || "Cardiology";
    return "Cardiology";
  };

  const filteredTokens = tokens.filter((t) => {
    if (filterMode === "dhanvantari") {
      const dName = getDocName(t);
      const dept = getDept(t);
      return dName.includes("Dhanvantari") || dept.includes("Cardiology");
    }
    return true;
  });

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const selPatient = patients.find((p) => p.id === bookingData.patientId) || patients[0] || {
      id: "P-1001",
      name: "Patient",
      age: 45,
      gender: "Male",
    };

    const tokenNum = tokens.length + 101;
    const newT: OPDToken = {
      tokenNo: tokenNum,
      patientId: selPatient.id,
      patientName: selPatient.name,
      age: selPatient.age,
      gender: selPatient.gender,
      doctorName: bookingData.doctorName,
      department: bookingData.department,
      appointmentTime: bookingData.time,
      status: "Waiting",
      avgWaitMins: 15,
    };

    try {
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selPatient.id,
          doctorId: bookingData.doctorId || "DOC-101",
          appointmentDate: new Date().toISOString(),
          appointmentTime: bookingData.time,
          type: "Walk-in",
          notes: bookingData.reason,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist appointment:", err);
    }

    const updated = [newT, ...tokens];
    setTokens(updated);
    onAddToken(newT);
    if (onUpdateTokens) onUpdateTokens(updated);
    setActiveConsultationToken(newT);
    setShowBookingModal(false);
    setOpdSuccess(`Token #${newT.tokenNo} issued for ${newT.patientName} in Cardiology Suite 101.`);
  };

  const handleAddMedication = () => {
    if (!newMed.trim()) return;
    setPrescriptionItems((prev) => [
      ...prev,
      { med: newMed, dosage: "1 Tablet", freq: "Twice Daily", duration: "14 Days" },
    ]);
    setNewMed("");
  };

  const handleFinishConsultation = async () => {
    if (!activeConsultationToken) return;

    // Issue Prescription to database via REST API
    if (prescriptionItems.length > 0) {
      try {
        await fetch("/api/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: activeConsultationToken.patientId,
            doctorId: "DOC-101",
            notes: clinicalNotes || diagnosis || "Dr. Dhanvantari OPD Prescription",
            items: prescriptionItems.map((item) => ({
              medicineName: item.med,
              dosage: item.dosage,
              frequency: item.freq,
              duration: item.duration,
              quantity: 10,
            })),
          }),
        });
      } catch (e) {
        console.warn("Error creating prescription in database:", e);
      }
    }

    // Update appointment status to Completed in API
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenNo: activeConsultationToken.tokenNo,
          status: "Completed",
        }),
      });
    } catch (e) {
      console.warn("Error updating appointment status:", e);
    }

    const updated = tokens.map((t) =>
      t.tokenNo === activeConsultationToken.tokenNo ? { ...t, status: "Completed" as const } : t
    );
    setTokens(updated);
    if (onUpdateTokens) onUpdateTokens(updated);
    setActiveConsultationToken((prev) => (prev ? { ...prev, status: "Completed" } : null));
    setConsultationSaved(true);
    setOpdSuccess(`Consultation finalized for Token #${activeConsultationToken.tokenNo} (${getPatientName(activeConsultationToken)})! Prescription & diagnostics dispatched.`);
    setTimeout(() => setConsultationSaved(false), 5000);
  };

  return (
    <div className="space-y-6 text-[#111]">
      {/* ── DR. DHANVANTARI CLINICAL SUITE BANNER ──────────────────────── */}
      <div className="bg-[#F0EEE8] p-6 rounded-2xl border border-black/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-black/10 shadow-xs bg-white">
            <img src="/images/doctors/dr-dhanvantari.jpg" alt="Dr. Dhanvantari" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[#111]">
                Dr. Dhanvantari&apos;s Cardiology &amp; OPD Consultation Suite
              </h2>
              <span className="text-[10px] font-pixel px-2 py-0.5 rounded-md bg-[#111] text-white uppercase">
                Room 101 • CMO
              </span>
            </div>
            <p className="text-xs text-black/50 mt-0.5">
              Cardiology &amp; Integrative Divine Medicine • NMC Reg: NMC-48821 • Active Duty
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/70 p-1 rounded-xl border border-black/10 text-xs font-semibold">
            <button
              onClick={() => setFilterMode("dhanvantari")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === "dhanvantari"
                  ? "bg-[#111] text-white shadow-xs"
                  : "text-black/60 hover:text-[#111]"
              }`}
            >
              My Cardiology Queue ({tokens.filter((t) => getDocName(t).includes("Dhanvantari") || getDept(t).includes("Cardiology")).length})
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === "all"
                  ? "bg-[#111] text-white shadow-xs"
                  : "text-black/60 hover:text-[#111]"
              }`}
            >
              All Hospital OPD ({tokens.length})
            </button>
          </div>

          <button
            onClick={() => setShowBookingModal(true)}
            className="px-4 py-2 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Patient Token</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {opdSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{opdSuccess}</span>
          </div>
          <button onClick={() => setOpdSuccess(null)}><X className="w-4 h-4 text-emerald-400" /></button>
        </div>
      )}

      {/* ── MAIN CLINICAL GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dr. Dhanvantari's OPD Queue */}
        <div className="lg:col-span-5 bg-[#F0EEE8] rounded-2xl border border-black/10 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111]">
                {filterMode === "dhanvantari" ? "Assigned Cardiology Tokens" : "All OPD Consultations"}
              </h3>
              <p className="text-[11px] text-black/40">Click a token to open live consultation room</p>
            </div>
            <span className="text-xs text-black/50 font-mono font-bold bg-white/80 px-2 py-0.5 rounded-md border border-black/5">
              {filteredTokens.length} in Queue
            </span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-12 text-black/40 text-xs">
                No patients in queue. Click &quot;Add Patient Token&quot; to issue a new OPD token.
              </div>
            ) : (
              filteredTokens.map((t) => {
                const isSelected = activeConsultationToken?.tokenNo === t.tokenNo;
                const pName = getPatientName(t);
                const dName = getDocName(t);
                return (
                  <div
                    key={t.tokenNo}
                    onClick={() => setActiveConsultationToken(t)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-black/40 ring-2 ring-black/10 shadow-sm"
                        : "bg-white/70 border-black/10 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#111] text-white text-xs font-bold font-mono flex items-center justify-center">
                          #{t.tokenNo}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#111]">{pName}</div>
                          <div className="text-[10px] text-black/50">
                            {t.age}Y / {t.gender} • ID: {t.patientId} • {dName}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          t.status === "Serving"
                            ? "bg-[#111] text-white"
                            : t.status === "Waiting"
                            ? "bg-amber-100/90 text-amber-900 border border-amber-300"
                            : "bg-emerald-100/90 text-emerald-900 border border-emerald-300"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-black/50 mt-2 pt-2 border-t border-black/5">
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-black/40" />
                        <span>{t.appointmentTime} (est. {t.avgWaitMins || 10}m)</span>
                      </div>
                      <span className="text-[#111] font-semibold flex items-center gap-0.5">
                        {isSelected ? "Consulting Active" : "Open Suite →"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Dr. Dhanvantari's Active Clinical Suite */}
        <div className="lg:col-span-7 bg-[#F0EEE8] rounded-2xl border border-black/10 p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Suite Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#111] text-white flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111]">Cardiovascular &amp; Integrative Consultation Room</h3>
                  <p className="text-[11px] text-black/50">Dr. Dhanvantari (DOC-101) • Cardiology Suite 101 Active</p>
                </div>
              </div>

              {activeConsultationToken && (
                <span className="px-3 py-1 bg-[#111] text-white rounded-full text-xs font-mono font-bold">
                  Token #{activeConsultationToken.tokenNo}
                </span>
              )}
            </div>

            {activeConsultationToken ? (
              <div className="space-y-5">
                {/* Patient Summary Header Box */}
                <div className="p-4 bg-white/90 rounded-xl border border-black/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-pixel text-[9px] text-black/40 uppercase tracking-wider block">Patient Profile</span>
                    <div className="font-bold text-[#111] text-sm mt-0.5">{getPatientName(activeConsultationToken)}</div>
                    <div className="text-black/50 font-medium text-[11px]">
                      {activeConsultationToken.age}Y / {activeConsultationToken.gender} • MRN: {activeConsultationToken.patientId}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-pixel text-[9px] text-black/40 uppercase tracking-wider block">Attending Consultant</span>
                    <div className="font-bold text-[#111] mt-0.5">{getDocName(activeConsultationToken)}</div>
                    <div className="text-[10px] text-emerald-800 font-semibold flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Cardiology Suite 101
                    </div>
                  </div>
                </div>

                {/* Vitals Log */}
                <div>
                  <label className="font-pixel text-[10px] tracking-widest text-black/40 uppercase mb-2 block">
                    Cardiovascular &amp; Vital Biomarkers
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10">
                      <span className="text-[10px] text-black/40 uppercase font-bold">Blood Pressure</span>
                      <input
                        type="text"
                        value={vitals.bp}
                        onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                        className="w-full font-bold text-[#111] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10">
                      <span className="text-[10px] text-black/40 uppercase font-bold">Heart Rate</span>
                      <input
                        type="text"
                        value={vitals.pulse}
                        onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                        className="w-full font-bold text-[#111] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10">
                      <span className="text-[10px] text-black/40 uppercase font-bold">SpO2 Oxygen</span>
                      <input
                        type="text"
                        value={vitals.spo2}
                        onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                        className="w-full font-bold text-[#111] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10">
                      <span className="text-[10px] text-black/40 uppercase font-bold">Temperature</span>
                      <input
                        type="text"
                        value={vitals.temp}
                        onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                        className="w-full font-bold text-[#111] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-black/40 uppercase font-bold">ECG Rhythm</span>
                      <input
                        type="text"
                        value={vitals.ecg}
                        onChange={(e) => setVitals({ ...vitals, ecg: e.target.value })}
                        className="w-full font-bold text-emerald-800 text-[11px] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Symptoms & Clinical Diagnosis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#111] mb-1">Chief Clinical Complaint</label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full p-2.5 border border-black/10 rounded-xl outline-none focus:border-black/30 bg-white h-20 text-xs leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111] mb-1">Cardiology Assessment &amp; Diagnosis</label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full p-2.5 border border-black/10 rounded-xl outline-none focus:border-black/30 bg-white h-20 text-xs leading-relaxed font-medium"
                    />
                  </div>
                </div>

                {/* Integrative e-Prescription Suite */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-pixel text-[10px] tracking-widest text-black/40 uppercase flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-black/70" />
                      <span>Dr. Dhanvantari Integrative e-Prescription</span>
                    </label>
                    <span className="text-[10px] text-black/40">Ayurvedic + Modern Cardiology</span>
                  </div>

                  <div className="space-y-1.5">
                    {prescriptionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white/90 rounded-xl border border-black/10 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#111]">{item.med}</span>
                          <span className="text-black/50 ml-2">
                            ({item.dosage} • {item.freq} • {item.duration})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-800 font-semibold">Verified Rx</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add medication (e.g. Arjuna Bark Extract 500mg, Metoprolol 25mg)"
                      value={newMed}
                      onChange={(e) => setNewMed(e.target.value)}
                      className="flex-1 px-3 py-2 border border-black/10 rounded-xl text-xs outline-none bg-white placeholder:text-black/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="px-4 py-2 bg-[#111] text-white text-xs font-bold rounded-xl hover:bg-[#333] transition-colors"
                    >
                      Add Rx Item
                    </button>
                  </div>
                </div>

                {/* Ordered Diagnostic Tests */}
                <div>
                  <label className="font-pixel text-[10px] tracking-widest text-black/40 uppercase mb-2 block">
                    Diagnostic Lab &amp; Imaging Orders
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {orderedTests.map((test, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white/90 border border-black/10 rounded-xl text-xs font-medium text-[#111] flex items-center gap-1.5"
                      >
                        <Activity className="w-3 h-3 text-emerald-700" />
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-black/40 text-xs">
                Select an OPD Token on the left to begin Dr. Dhanvantari&apos;s consultation
              </div>
            )}
          </div>

          {/* Consultation Action Footer */}
          {activeConsultationToken && (
            <div className="pt-6 mt-6 border-t border-black/10 flex items-center justify-between">
              <div className="text-[11px] text-black/50">
                Digitally Authenticated: <strong>Dr. Dhanvantari (CMO)</strong>
              </div>

              <div className="flex items-center gap-3">
                {consultationSaved && (
                  <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Consultation Completed &amp; Rx Dispatched!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleFinishConsultation}
                  className="px-5 py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Complete Consultation &amp; Sign Rx</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F0EEE8] rounded-3xl border border-black/10 shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111]">Generate OPD Token for Dr. Dhanvantari</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-black/40 hover:text-black font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-black/60 mb-1">Select Patient</label>
                <select
                  value={bookingData.patientId}
                  onChange={(e) => setBookingData({ ...bookingData, patientId: e.target.value })}
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id} • {p.age}Y/{p.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-black/60 mb-1">Attending Physician</label>
                <input
                  type="text"
                  value="Dr. Dhanvantari (Cardiology & Integrative Medicine)"
                  disabled
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-black/5 text-black/60 font-semibold"
                />
              </div>

              <div>
                <label className="block text-black/60 mb-1">Chief Reason for Consultation</label>
                <input
                  type="text"
                  value={bookingData.reason}
                  onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-medium"
                  placeholder="e.g. Chest pain follow up, high blood pressure"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-black/5 rounded-xl font-semibold text-xs text-black/70 hover:bg-black/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111] text-white rounded-xl text-xs font-bold hover:bg-[#333]"
                >
                  Generate Token &amp; Dispatch to Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
