"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  User,
  Calendar,
  Stethoscope,
  Pill,
  Activity,
  FileText,
  Bed,
  CheckCircle2,
  Droplet,
  Shield,
  Clock,
  ChevronDown,
  Filter,
  Layers,
  Sparkles,
  Info,
  ArrowUpRight,
  ChevronRight,
  Thermometer,
  HeartPulse,
} from "lucide-react";
import { Patient, EMRTimelineEvent } from "@/lib/hms-data";

interface EMRPatient360ViewProps {
  patientId: string;
  patients: Patient[];
  onSelectPatient: (id: string) => void;
}

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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/40 bg-black/[0.04]">
      {children}
    </span>
  );
}

function SpotlightCard({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
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

export function EMRPatient360View({
  patientId,
  patients,
  onSelectPatient,
}: EMRPatient360ViewProps) {
  const patient = patients.find((p) => p.id === patientId) || patients[0];
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedEvent, setSelectedEvent] = useState<EMRTimelineEvent | null>(null);

  // Mock Timeline Events tailored for selected patient
  const mockTimeline: EMRTimelineEvent[] = [
    {
      id: "EVT-101",
      patientId: patient.id,
      timestamp: "2026-08-15 09:30 AM",
      type: "Admission",
      title: patient.ward
        ? `Admitted to ${patient.ward} Ward (${patient.bedNo || "Bed Assigned"})`
        : "OPD Consultation & Clinical Intake Completed",
      doctorName: typeof (patient as any).doctor === "object" ? (patient as any).doctor?.name : (patient as any).doctor || "Dr. Dhanvantari",
      department: typeof (patient as any).department === "object" ? (patient as any).department?.name : (patient as any).department || "Cardiology",
      summary: `${patient.name} presented for comprehensive health evaluation. Vitals recorded, preliminary diagnostic panel ordered.`,
      details: {
        ward: patient.ward || "Outpatient",
        bedNo: patient.bedNo || "N/A",
        vitalsAtAdmission: "BP: 120/80, Pulse: 72, SpO2: 99%, Temp: 98.6°F",
      },
    },
    {
      id: "EVT-102-A",
      patientId: patient.id,
      timestamp: "2026-08-17 09:00 AM",
      type: "Imaging",
      title: "Radiology Scan Ordered — CT Coronary Angiography (RAD-702)",
      doctorName: "Dr. Dhanvantari",
      department: "Cardiovascular Surgery",
      summary: "High-resolution 64-slice CT scan requested for coronary artery lumen evaluation. Status: Scheduled.",
      details: {
        scanType: "CT Scan",
        modality: "64-Slice CT",
        status: "Scheduled",
      },
    },
    {
      id: "EVT-102-B",
      patientId: patient.id,
      timestamp: "2026-08-17 09:30 AM",
      type: "Imaging",
      title: "DICOM Scan Acquired — Image Frame Link Verified",
      doctorName: "Rad-Tech Jayant",
      department: "Radiology & PACS Workstation",
      summary: "Coronary lumen acquisition complete. DICOM Series #1 (128 Slices) captured and uploaded to PACS workstation. Status: Acquired.",
      details: {
        scanType: "CT Scan",
        modality: "DICOM PACS Workstation",
        status: "Acquired",
      },
    },
    {
      id: "EVT-102-C",
      patientId: patient.id,
      timestamp: "2026-08-17 10:00 AM",
      type: "Imaging",
      title: "Radiologist Report Finalized & Signed Off",
      doctorName: "Dr. Jivaka",
      department: "Radiology & PACS Workstation",
      summary: "Diagnostic Impression: Patent coronary arteries without hemodynamically significant stenosis. Clear pericardial cavity. Status: Finalized.",
      details: {
        impression: "Normal 64-slice CT Coronary Angiogram",
        reportedBy: "Dr. Jivaka",
        status: "Finalized",
        billing: "₹3,500 Billed to Invoice #INV-88213",
      },
    },
    {
      id: "EVT-103",
      patientId: patient.id,
      timestamp: "2026-08-15 10:45 AM",
      type: "Lab Report",
      title: "Comprehensive Metabolic & Lipid Panel",
      doctorName: patient.doctor || "Dr. Charaka",
      department: "Central Pathology Lab",
      summary: "Hemoglobin: 14.8 g/dL. Fasting Glucose: 92 mg/dL. Electrolytes: Stable. Lipid profile optimal.",
      details: {
        hgb: "14.8 g/dL",
        glucose: "92 mg/dL",
        potassium: "4.2 mEq/L",
        status: "Verified",
      },
    },
    {
      id: "EVT-104",
      patientId: patient.id,
      timestamp: "2026-08-15 11:15 AM",
      type: "Prescription",
      title: "Care Protocol & Maintenance Regimen",
      doctorName: patient.doctor || "Dr. Nagarjuna",
      department: "Clinical Pharmacy",
      summary: "Preventive supplementation and post-consultation health routine dispensed under clinical supervision.",
      details: {
        rxList: ["Multivitamin Complex 1 Tab OD", "Hydration Protocol 2.5L/day"],
      },
    },
    // ── Emergency Episode Timeline Events ──
    {
      id: "EVT-EMG-01",
      patientId: patient.id,
      timestamp: "2026-08-17 03:15 PM",
      type: "Emergency",
      title: "Emergency Triage — RED Severity (Resuscitation)",
      doctorName: "Dr. Ashwini Kumaras",
      department: "Emergency Department",
      summary: `${patient.name} registered as RED triage emergency case. Chief complaint: Severe polytrauma, hypotension. Vitals: BP 110/70, HR 102, SpO2 96%.`,
      details: {
        severity: "RED",
        triageFee: "₹2,500",
        traumaBay: "Bay 2 (Trauma)",
        status: "Triaged",
      },
    },
    {
      id: "EVT-EMG-02",
      patientId: patient.id,
      timestamp: "2026-08-17 03:18 PM",
      type: "Emergency",
      title: "Ambulance Dispatched — AMB-01 (ETA 8 Mins)",
      doctorName: "Dispatch Control",
      department: "Ambulance Network",
      summary: `Advanced Life Support ambulance AMB-01 dispatched to emergency scene. Driver: Rajkumar Reddy. GPS tracking active.`,
      details: {
        ambulanceId: "AMB-01",
        driverName: "Rajkumar Reddy",
        etaMins: 8,
        status: "Dispatched",
      },
    },
    {
      id: "EVT-EMG-03",
      patientId: patient.id,
      timestamp: "2026-08-17 03:26 PM",
      type: "Emergency",
      title: "ER Bay Stabilization — Trauma Bay 2",
      doctorName: "Dr. Ashwini Kumaras",
      department: "Emergency Department",
      summary: "Patient stabilized in Trauma Bay 2. IV access established, crystalloid resuscitation initiated. Vitals trending toward hemodynamic stability.",
      details: {
        intervention: "IV Crystalloid Resuscitation",
        bay: "Trauma Bay 2",
        status: "Stabilized",
      },
    },
    {
      id: "EVT-EMG-04",
      patientId: patient.id,
      timestamp: "2026-08-17 03:40 PM",
      type: "Emergency",
      title: "Admitted to ICU Bed #3 — Ambulance Released",
      doctorName: "Dr. Ashwini Kumaras",
      department: "ICU / Emergency",
      summary: `Atomic admission transaction completed. Patient transferred to ICU Bed #3. Ambulance AMB-01 released to Available. Emergency RED Triage Fee ₹2,500 billed to invoice.`,
      details: {
        bedNo: "ICU-03",
        triageFee: "₹2,500",
        ambulanceReleased: true,
        invoiceStatus: "Outstanding",
        status: "Admitted",
      },
    },
  ];

  const filterCategories = [
    "All",
    "Visits",
    "Diagnosis",
    "Prescription",
    "Lab Report",
    "Imaging",
    "Procedure",
    "Admission",
    "Emergency",
  ];

  const filteredEvents = mockTimeline.filter((evt) => {
    if (activeFilter === "All") return true;
    return evt.type.toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div className="space-y-8 text-[#111]">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION: PATIENT 360 & OPD MANAGEMENT 3D SHOWCASE BANNER         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="rounded-3xl p-6 sm:p-8 lg:p-10 relative overflow-hidden"
        style={GLASS_BANNER}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          {/* Left Column: Headline & Patient Details */}
          <div className="flex-1 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <Tag>PATIENTS &amp; EMR 360°</Tag>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#111] text-white shadow-xs">
                {patient.status}
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#111] leading-[1.08] tracking-tight"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              Patient 360 &amp;<br />OPD Management.
            </h1>

            <p className="text-sm text-black/50 font-light max-w-xl leading-relaxed">
              Comprehensive patient directory, smart triage, token queues, electronic medical records, and automated discharge summaries.
            </p>

            {/* Quick Stat Highlights */}
            <div className="flex items-center gap-8 pt-2">
              <div>
                <div
                  className="text-3xl font-light tracking-tight text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  4.8M
                </div>
                <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">
                  Records
                </div>
              </div>

              <div className="w-px h-10 bg-black/10" />

              <div>
                <div
                  className="text-3xl font-light tracking-tight text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  0.4s
                </div>
                <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">
                  Retrieval
                </div>
              </div>

              <div className="w-px h-10 bg-black/10" />

              {/* Patient Switcher Dropdown */}
              <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-black/10 shadow-xs">
                <span className="text-xs text-[#111] font-semibold pl-2">Select:</span>
                <select
                  value={patient.id}
                  onChange={(e) => onSelectPatient(e.target.value)}
                  className="bg-white text-[#111] text-xs font-bold border border-black/10 outline-none py-1 px-3 rounded-xl cursor-pointer"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity 3D Glass Profile Stand & Hourglass */}
          <div className="w-full lg:w-[480px] shrink-0 relative flex items-center justify-center">
            <div className="relative group rounded-2xl overflow-hidden p-2 transition-transform duration-500 hover:scale-[1.02]">
              <Image
                src="/images/patient-360-3d-full.png"
                alt="3D Glass Patient 360 Profile Card"
                width={480}
                height={320}
                className="w-full h-auto object-contain drop-shadow-2xl rounded-xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Patient Key Vitals Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-black/10 text-xs">
          <div className="bg-white/80 p-3.5 rounded-2xl border border-black/10">
            <div className="text-black/40 text-[10px] uppercase font-bold tracking-wider font-pixel">
              Insurance Policy
            </div>
            <div className="font-bold text-[#111] mt-0.5">{patient.insurance?.provider || "Not on File"}</div>
            <div className="text-[10px] text-black/50 font-mono">{patient.insurance?.policyNo || "—"}</div>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-black/10">
            <div className="text-black/40 text-[10px] uppercase font-bold tracking-wider font-pixel">
              Known Allergies
            </div>
            <div className="font-bold text-rose-700 mt-0.5">
              {(patient.allergies || []).join(", ") || "None Reported"}
            </div>
            <div className="text-[10px] text-black/50">Verified Clinical Safety</div>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-black/10">
            <div className="text-black/40 text-[10px] uppercase font-bold tracking-wider font-pixel">
              Emergency Contact
            </div>
            <div className="font-bold text-[#111] mt-0.5">
              {patient.emergencyContact?.name || "Not Recorded"} ({patient.emergencyContact?.relation || "—"})
            </div>
            <div className="text-[10px] text-black/50 font-mono">{patient.emergencyContact?.phone || "—"}</div>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-black/10">
            <div className="text-black/40 text-[10px] uppercase font-bold tracking-wider font-pixel">
              Next Scheduled Appointment
            </div>
            <div className="font-bold text-emerald-800 mt-0.5">
              29 Aug 2026 • 10:30 AM
            </div>
            <div className="text-[10px] text-black/50">{patient.doctor}</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION: TIMELINE FILTER TABS                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="p-4 rounded-2xl shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none"
        style={GLASS_CARD}
      >
        <Filter className="w-4 h-4 text-black/50 shrink-0 ml-1" />
        <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase shrink-0 mr-2">
          Filter EMR Stream:
        </span>
        {filterCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === cat
                ? "bg-[#111] text-white shadow-md"
                : "bg-white/80 text-black/60 hover:bg-white hover:text-[#111]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION: VERTICAL EMR TIMELINE & DETAIL INSPECTOR                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vertical Timeline Feed (7 cols) */}
        <SpotlightCard className="lg:col-span-7 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-pixel text-[10px] tracking-widest text-black/40 uppercase mb-1">
                EHR 360° TIMELINE
              </div>
              <h3
                className="text-xl font-light text-[#111] flex items-center gap-2"
                style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
              >
                <Layers className="w-4 h-4 text-black/70" />
                <span>Chronological Medical Record</span>
              </h3>
            </div>
            <span className="text-xs text-black/40 font-mono">
              {filteredEvents.length} Events Logged
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-black/10">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className={`relative group cursor-pointer p-4 rounded-2xl border transition-all ${
                  selectedEvent?.id === evt.id
                    ? "bg-white border-black/30 shadow-md scale-[1.01]"
                    : "bg-white/70 border-black/10 hover:bg-white hover:border-black/20"
                }`}
              >
                {/* Timeline Dot */}
                <div className={`absolute -left-6 top-5 transform -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center shadow-sm ${
                  evt.type === "Emergency" ? "border-rose-600" : "border-[#111]"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    evt.type === "Emergency" ? "bg-rose-600 animate-pulse" : "bg-[#111]"
                  }`} />
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className={`font-pixel text-[9px] tracking-widest px-2.5 py-0.5 rounded-md uppercase font-bold ${
                    evt.type === "Emergency"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-black/10 text-black/80"
                  }`}>
                    {evt.type}
                  </span>
                  <span className="text-[11px] font-mono text-black/40 font-medium">
                    {evt.timestamp}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#111] mt-1">{evt.title}</h4>
                <p className="text-xs text-black/60 mt-1 leading-relaxed">{evt.summary}</p>

                <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] text-black/50 font-medium">
                  <span>Doc: {evt.doctorName}</span>
                  <span className="text-[#111] font-semibold group-hover:underline flex items-center gap-1">
                    View Record Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {/* Detailed Event Inspector Drawer (5 cols) */}
        <SpotlightCard className="lg:col-span-5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="font-pixel text-[10px] tracking-widest text-black/40 uppercase mb-1">
              CLINICAL PAYLOAD
            </div>
            <h3
              className="text-xl font-light text-[#111] mb-1 flex items-center gap-2"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              <Info className="w-4 h-4 text-black/70" />
              <span>Event Detail Inspector</span>
            </h3>
            <p className="text-xs text-black/50 mb-6">
              Select any timeline record on the left to inspect verified clinical payload
            </p>

            {selectedEvent ? (
              <div className="space-y-4 text-xs">
                <div
                  className="p-4 rounded-2xl space-y-1.5 shadow-sm text-[#111]"
                  style={GLASS_BANNER}
                >
                  <div className="font-pixel text-[9px] text-black/50 uppercase tracking-widest font-bold">
                    {selectedEvent.type} Record
                  </div>
                  <div className="text-base font-bold">{selectedEvent.title}</div>
                  <div className="text-xs text-black/60">
                    {selectedEvent.timestamp} • {selectedEvent.department}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-[#111] font-pixel text-[10px] tracking-wider uppercase text-black/40">
                    Attending Physician
                  </div>
                  <div className="p-2.5 bg-white/80 rounded-xl border border-black/10 font-medium text-black/80">
                    {selectedEvent.doctorName}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-[#111] font-pixel text-[10px] tracking-wider uppercase text-black/40">
                    Clinical Notes
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-black/10 text-black/70 leading-relaxed">
                    {selectedEvent.summary}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-[#111] font-pixel text-[10px] tracking-wider uppercase text-black/40">
                    Structured Payload Data
                  </div>
                  <pre className="p-3 bg-[#111] text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-white/60 rounded-2xl border border-dashed border-black/10">
                <Info className="w-8 h-8 text-black/30 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#111]">No timeline event selected</p>
                <p className="text-[11px] text-black/40 mt-1">
                  Click on any record entry in the timeline to load full clinical data
                </p>
              </div>
            )}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
