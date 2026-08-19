"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  User,
  Calendar,
  FileText,
  CreditCard,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Activity,
  HeartPulse,
  Plus,
  Shield,
  Search,
  Sparkles,
  Stethoscope,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Patient, OPDToken, BillingInvoice, LabOrder } from "@/lib/hms-data";
import { matchSymptomsToDoctor, TriageResult } from "@/lib/clinical-triage";

interface PatientPortalViewProps {
  patient: Patient;
  tokens: OPDToken[];
  invoices: BillingInvoice[];
  labOrders: LabOrder[];
  onBookAppointment: () => void;
  onGenerateToken?: (token: OPDToken) => void;
}

const LANDING_GLASS_CARD = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(255, 255, 255, 0.50)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
} as const;

const LANDING_GLASS_BANNER = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(255, 255, 255, 0.75)",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
  border: "1px solid rgba(0, 0, 0, 0.10)",
} as const;

export function PatientPortalView({
  patient,
  tokens,
  invoices,
  labOrders,
  onBookAppointment,
  onGenerateToken,
}: PatientPortalViewProps) {
  const [activeTab, setActiveTab] = useState<"intake" | "overview" | "appointments" | "prescriptions" | "labs" | "billing">("intake");
  const [symptomText, setSymptomText] = useState("Sudden chest tightness and high pulse after physical workout");
  const [triageResult, setTriageResult] = useState<TriageResult>(() => matchSymptomsToDoctor("Sudden chest tightness and high pulse after physical workout"));
  const [tokenGenerated, setTokenGenerated] = useState<OPDToken | null>(null);

  const myTokens = tokens.filter((t) => t.patientId === patient.id || t.patientName === patient.name);
  const myInvoices = invoices.filter((i) => i.patientId === patient.id || i.patientName === patient.name);
  const myLabs = labOrders.filter((l) => l.patientId === patient.id || l.patientName === patient.name);

  const handleSymptomChange = (text: string) => {
    setSymptomText(text);
    const result = matchSymptomsToDoctor(text);
    setTriageResult(result);
  };

  const handleGenerateToken = () => {
    const newTokenNo = tokens.length + 101;
    const newToken: OPDToken = {
      tokenNo: newTokenNo,
      patientId: patient.id,
      patientName: patient.name,
      age: patient.age,
      gender: patient.gender,
      doctorName: triageResult.doctorName,
      department: triageResult.department,
      appointmentTime: new Date(Date.now() + triageResult.estimatedWaitMins * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "Waiting",
      avgWaitMins: triageResult.estimatedWaitMins,
    };

    setTokenGenerated(newToken);
    if (onGenerateToken) {
      onGenerateToken(newToken);
    }
  };

  return (
    <div className="space-y-6 text-[#111]">
      {/* Patient Self-Service Banner */}
      <div className="rounded-3xl p-6 md:p-8 text-[#111] relative overflow-hidden" style={LANDING_GLASS_BANNER}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#111] text-white flex items-center justify-center text-2xl font-bold font-mono shadow-md">
              {patient.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-[#111]">Welcome, {patient.name}</h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#111] text-white shadow-xs">
                  MRN: {patient.id}
                </span>
                <span className="font-pixel text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold uppercase tracking-wider">
                  Care Portal Active
                </span>
              </div>
              <p className="text-xs text-black/50 mt-1">
                Dronagiri Patient Portal • Symptom Intake, AI Doctor Matching, e-Prescriptions &amp; Billing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("intake")}
              className="px-4 py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Symptom Intake Wizard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="p-2 rounded-2xl shadow-sm flex items-center gap-2 overflow-x-auto" style={LANDING_GLASS_CARD}>
        {[
          { id: "intake", label: "01. Symptom Intake & AI Match", badge: "AI" },
          { id: "overview", label: "Health Summary" },
          { id: "appointments", label: `My Appointments (${myTokens.length})` },
          { id: "prescriptions", label: "e-Prescriptions" },
          { id: "labs", label: `Lab & Diagnostics (${myLabs.length})` },
          { id: "billing", label: `Invoices (${myInvoices.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-[#111] text-white shadow-md"
                : "bg-white/70 text-black/60 hover:bg-white hover:text-[#111]"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 01. INTAKE & AI DOCTOR MATCH TAB */}
      {activeTab === "intake" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Symptom Input Card */}
          <div className="lg:col-span-6 p-6 rounded-2xl shadow-sm space-y-4" style={LANDING_GLASS_CARD}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase block mb-0.5">
                  STEP 1: CLINICAL INTAKE
                </span>
                <h3 className="text-lg font-bold text-[#111]">Describe Your Symptoms</h3>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <p className="text-xs text-black/60">
              Type your symptoms, affected body area, or conditions. The Dronagiri Clinical Triage Engine will match you with the master physician best suited for your care.
            </p>

            <textarea
              rows={4}
              value={symptomText}
              onChange={(e) => handleSymptomChange(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/90 border border-black/10 text-xs text-[#111] placeholder:text-black/30 outline-none focus:border-black/30 shadow-inner"
              placeholder="e.g. Sharp pain in right knee after running, swollen joint..."
            />

            {/* Quick Sample Chips */}
            <div>
              <span className="text-[10px] font-pixel text-black/40 uppercase block mb-1.5">Quick Symptom Presets</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Chest pain & palpitations",
                  "Right knee ligament strain",
                  "Migraine headache & pulse numbness",
                  "Child high fever with cough",
                  "Digestive discomfort & metabolism",
                  "Accident trauma & laceration",
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => handleSymptomChange(sample)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/80 hover:bg-[#111] hover:text-white border border-black/10 transition-all font-medium text-black/70"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Doctor Match Recommendation */}
          <div className="lg:col-span-6 p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between" style={LANDING_GLASS_CARD}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-pixel text-[10px] tracking-widest text-emerald-800 uppercase block mb-0.5">
                    STEP 2: AI CLINICAL MATCH
                  </span>
                  <h3 className="text-lg font-bold text-[#111]">Recommended Master Physician</h3>
                </div>
                <span className={`font-pixel text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  triageResult.urgency === "Emergency"
                    ? "bg-rose-600 text-white"
                    : triageResult.urgency === "Priority"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}>
                  {triageResult.urgency} Care
                </span>
              </div>

              {/* Matched Doctor Card */}
              <div className="p-4 rounded-xl bg-white/90 border border-black/10 flex items-center gap-4 shadow-sm">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/5 shrink-0 border border-black/10">
                  <Image
                    src={triageResult.doctorAvatar}
                    alt={triageResult.doctorName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-[#111] truncate">{triageResult.doctorName}</h4>
                  <p className="text-xs text-black/60 line-clamp-1">{triageResult.specialization}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-black/50">
                    <span className="font-semibold text-emerald-800">{triageResult.department}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-black/40" />
                      ~{triageResult.estimatedWaitMins}m est. wait
                    </span>
                  </div>
                </div>
              </div>

              {/* Clinical Rationale Box */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Clinical Assignment Rationale</span>
                </div>
                <p className="text-emerald-900/90 text-[11px] leading-relaxed">
                  {triageResult.clinicalRationale}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              {tokenGenerated ? (
                <div className="p-3.5 rounded-xl bg-[#111] text-white flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-amber-300">OPD Token #{tokenGenerated.tokenNo} Confirmed!</div>
                    <div className="text-[11px] text-white/70">
                      Assigned to {tokenGenerated.doctorName} • Scheduled for {tokenGenerated.appointmentTime}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <span>View Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateToken}
                  className="w-full py-3 rounded-xl bg-[#111] hover:bg-[#333] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Confirm &amp; Generate OPD Consultation Token</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEALTH SUMMARY TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Vitals & Summary */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-2xl shadow-sm space-y-4" style={LANDING_GLASS_CARD}>
              <h3 className="text-base font-bold text-[#111]">Current Vital Metrics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-white/80 p-4 rounded-xl border border-black/10">
                  <span className="text-[10px] font-pixel text-black/40 uppercase block">Blood Pressure</span>
                  <span className="text-xl font-bold text-[#111]">120/80</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Normal</span>
                </div>
                <div className="bg-white/80 p-4 rounded-xl border border-black/10">
                  <span className="text-[10px] font-pixel text-black/40 uppercase block">Heart Rate</span>
                  <span className="text-xl font-bold text-[#111]">76 bpm</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Resting</span>
                </div>
                <div className="bg-white/80 p-4 rounded-xl border border-black/10">
                  <span className="text-[10px] font-pixel text-black/40 uppercase block">Oxygen SpO2</span>
                  <span className="text-xl font-bold text-[#111]">98%</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Optimal</span>
                </div>
                <div className="bg-white/80 p-4 rounded-xl border border-black/10">
                  <span className="text-[10px] font-pixel text-black/40 uppercase block">Blood Group</span>
                  <span className="text-xl font-bold text-rose-700">{patient.bloodGroup}</span>
                  <span className="text-[10px] text-black/40 font-semibold block">Verified</span>
                </div>
              </div>
            </div>

            {/* Medical History & Allergies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl shadow-sm space-y-3" style={LANDING_GLASS_CARD}>
                <h4 className="text-sm font-bold text-[#111]">Known Allergies</h4>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((a) => (
                    <span key={a} className="px-3 py-1 bg-rose-100/80 text-rose-900 font-bold rounded-full text-xs border border-rose-300">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl shadow-sm space-y-3" style={LANDING_GLASS_CARD}>
                <h4 className="text-sm font-bold text-[#111]">Medical History</h4>
                <ul className="space-y-1.5 text-xs text-black/70 list-disc pl-4">
                  {patient.medicalHistory.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Contact & Doctor Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl shadow-sm space-y-4" style={LANDING_GLASS_CARD}>
              <h3 className="text-base font-bold text-[#111]">Attending Physician</h3>
              <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-black/10">
                <div className="w-10 h-10 rounded-full bg-[#111] text-white flex items-center justify-center font-bold text-xs">
                  DOC
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111]">
                    {typeof (patient as any).doctor === "object" ? (patient as any).doctor?.name : (patient as any).doctor || "Dr. Ashwini Kumaras"}
                  </div>
                  <div className="text-[10px] text-black/50">
                    {typeof (patient as any).department === "object" ? (patient as any).department?.name : (patient as any).department || "Cardiology"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl shadow-sm space-y-4" style={LANDING_GLASS_CARD}>
              <h3 className="text-base font-bold text-[#111]">Insurance Info</h3>
              <div className="space-y-2 text-xs bg-white/80 p-4 rounded-xl border border-black/10">
                <div><span className="font-bold">Provider:</span> {patient.insurance.provider}</div>
                <div><span className="font-bold">Policy No:</span> {patient.insurance.policyNo}</div>
                <div><span className="font-bold">Coverage:</span> ₹{patient.insurance.coverageLimit.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === "appointments" && (
        <div className="p-6 rounded-2xl shadow-sm space-y-4" style={LANDING_GLASS_CARD}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111]">My Active OPD Tokens &amp; Scheduled Visits</h3>
            <button
              onClick={() => setActiveTab("intake")}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#111] text-white font-medium hover:bg-[#333]"
            >
              + New Symptom Intake
            </button>
          </div>
          <div className="space-y-3">
            {myTokens.length === 0 ? (
              <div className="p-8 text-center text-xs text-black/40">
                No active appointments found. Use the Symptom Intake Wizard above to generate your consultation token.
              </div>
            ) : (
              myTokens.map((t) => (
                <div key={t.tokenNo} className="p-4 bg-white/80 rounded-xl border border-black/10 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-[#111]">{t.doctorName} • {t.department}</div>
                    <div className="text-black/50">Token #{t.tokenNo} • Scheduled: {t.appointmentTime} • Est. Wait: ~{t.avgWaitMins}m</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
                    t.status === "Serving" ? "bg-emerald-700 text-white" : "bg-amber-600 text-white"
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PRESCRIPTIONS TAB */}
      {activeTab === "prescriptions" && (
        <div className="p-6 rounded-2xl shadow-sm space-y-4" style={LANDING_GLASS_CARD}>
          <h3 className="text-base font-bold text-[#111]">Active Prescriptions &amp; Care Regimen</h3>
          <div className="space-y-3">
            {[
              { med: "Atorvastatin 20mg", dosage: "1 Tablet", freq: "Nightly before sleep", doctor: "Dr. Dhanvantari", status: "Active" },
              { med: "Amoxicillin 500mg", dosage: "1 Capsule", freq: "Twice daily after meals", doctor: "Dr. Sushruta", status: "Completed" },
            ].map((rx, idx) => (
              <div key={idx} className="p-4 bg-white/80 rounded-xl border border-black/10 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-[#111]">{rx.med} ({rx.dosage})</div>
                  <div className="text-black/50">{rx.freq} • Prescribed by {rx.doctor}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  rx.status === "Active" ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-slate-100 text-slate-600"
                }`}>
                  {rx.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LABS TAB */}
      {activeTab === "labs" && (
        <div className="p-6 rounded-2xl shadow-sm space-y-4" style={LANDING_GLASS_CARD}>
          <h3 className="text-base font-bold text-[#111]">Verified Laboratory &amp; Diagnostic Reports</h3>
          <div className="space-y-3">
            {myLabs.length === 0 ? (
              <div className="p-8 text-center text-xs text-black/40">No pending or verified lab orders for this patient.</div>
            ) : (
              myLabs.map((lab) => (
                <div key={lab.id} className="p-4 bg-white/80 rounded-xl border border-black/10 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-[#111]">{lab.testName} ({lab.category})</div>
                    <div className="text-black/50">Order #{lab.id} • Sample: {lab.sampleType} • Ordered by {lab.doctorName}</div>
                    {lab.result && <div className="text-emerald-800 font-semibold">{lab.result}</div>}
                  </div>
                  <span className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
                    lab.status === "Verified" ? "bg-emerald-700 text-white" : "bg-amber-600 text-white"
                  }`}>
                    {lab.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BILLING TAB */}
      {activeTab === "billing" && (
        <div className="p-6 rounded-2xl shadow-sm space-y-4" style={LANDING_GLASS_CARD}>
          <h3 className="text-base font-bold text-[#111]">Itemized Invoices &amp; Online Payment</h3>
          <div className="space-y-3">
            {myInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-black/40">No outstanding invoices on file.</div>
            ) : (
              myInvoices.map((inv) => (
                <div key={inv.id} className="p-4 bg-white/80 rounded-xl border border-black/10 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#111]">{inv.id} — {inv.billDate}</div>
                    <div className="text-black/50">Subtotal: ₹{inv.subtotal.toFixed(2)} | Insurance Coverage: ₹{inv.insuranceCovered.toFixed(2)}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm font-bold text-[#111]">Co-Pay: ₹{inv.finalAmount.toFixed(2)}</div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                      inv.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-amber-100 text-amber-900 border border-amber-300"
                    }`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
