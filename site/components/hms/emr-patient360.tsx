"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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
  RefreshCw,
  AlertCircle,
  FolderOpen,
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

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hms_auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

interface TimelineItem extends EMRTimelineEvent {
  isoTime?: number;
}

export function EMRPatient360View({
  patientId,
  patients,
  onSelectPatient,
}: EMRPatient360ViewProps) {
  const selectedBasicPatient =
    patients.find((p) => p.id === patientId || (p as any).mrn === patientId) ||
    patients[0];

  const [livePatient, setLivePatient] = useState<any>(selectedBasicPatient);
  const [timelineEvents, setTimelineEvents] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedEvent, setSelectedEvent] = useState<TimelineItem | null>(null);

  const fetchPatientHistory = useCallback(async (pId: string) => {
    if (!pId) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/patients/${pId}`, {
        headers: getAuthHeaders(),
        credentials: "same-origin",
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Patient record not found on server.");
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error("Unauthorized to access patient medical records.");
        }
        throw new Error(`Failed to load patient history (HTTP ${res.status}).`);
      }

      const json = await res.json();
      const p = json.patient;
      setLivePatient(p);

      const events: TimelineItem[] = [];

      // 1. Admissions & Discharges
      if (Array.isArray(p.admissions)) {
        p.admissions.forEach((adm: any) => {
          const admDate = new Date(adm.admittedAt);
          events.push({
            id: `ADM-${adm.id}`,
            patientId: p.id,
            timestamp: admDate.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
            isoTime: admDate.getTime(),
            type: "Admission",
            title: `Inpatient Admission — ${adm.bed?.room?.ward?.name || "General"} Ward (${adm.bed?.bedNo || "Bed Assigned"})`,
            doctorName: adm.attendingDoctor || "Attending Physician",
            department: adm.bed?.room?.ward?.name ? `${adm.bed.room.ward.name} Ward` : "Inpatient IPD",
            summary: adm.reason || "Patient admitted for clinical observation and therapy.",
            details: {
              status: adm.status,
              ward: adm.bed?.room?.ward?.name || "General",
              roomNo: adm.bed?.room?.roomNo || "—",
              bedNo: adm.bed?.bedNo || "—",
              dailyRate: adm.bed?.dailyRate ? `₹${adm.bed.dailyRate}` : "—",
              reason: adm.reason,
              admittedAt: adm.admittedAt,
            },
          });

          if (adm.dischargedAt || adm.status === "Discharged") {
            const disDate = new Date(adm.dischargedAt || adm.updatedAt);
            events.push({
              id: `DIS-${adm.id}`,
              patientId: p.id,
              timestamp: disDate.toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }),
              isoTime: disDate.getTime(),
              type: "Discharge",
              title: `Discharge Finalized — ${adm.bed?.room?.ward?.name || "Inpatient"}`,
              doctorName: adm.attendingDoctor || "Attending Physician",
              department: adm.bed?.room?.ward?.name ? `${adm.bed.room.ward.name} Ward` : "Inpatient IPD",
              summary: adm.dischargeSummary || "Patient discharged in stable hemodynamic state.",
              details: {
                status: adm.status,
                dischargeSummary: adm.dischargeSummary || "Discharged with instructions",
                dischargedAt: adm.dischargedAt,
              },
            });
          }
        });
      }

      // 2. Scheduled Appointments
      if (Array.isArray(p.appointments)) {
        p.appointments.forEach((apt: any) => {
          const aptDate = apt.appointmentDate
            ? new Date(apt.appointmentTime ? `${apt.appointmentDate} ${apt.appointmentTime}` : apt.appointmentDate)
            : new Date(apt.createdAt);
          events.push({
            id: `APT-${apt.id}`,
            patientId: p.id,
            timestamp: isNaN(aptDate.getTime())
              ? apt.appointmentDate
              : aptDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
            isoTime: isNaN(aptDate.getTime()) ? 0 : aptDate.getTime(),
            type: "Visits",
            title: `Appointment: ${apt.type || "OPD"} (${apt.status})`,
            doctorName: apt.doctor?.name || "Attending Doctor",
            department: apt.department?.name || apt.doctor?.specialization || "Outpatient Care",
            summary: apt.reason || `Scheduled ${apt.type || "Walk-in"} appointment. Queue #${apt.tokenNo || apt.queueNumber || "—"}.`,
            details: {
              tokenNo: apt.tokenNo,
              queueNumber: apt.queueNumber,
              status: apt.status,
              type: apt.type,
              reason: apt.reason,
              notes: apt.notes,
            },
          });
        });
      }

      // 3. Clinical Visits & Consultations & Prescriptions
      if (Array.isArray(p.visits)) {
        p.visits.forEach((vst: any) => {
          if (Array.isArray(vst.consultations)) {
            vst.consultations.forEach((cns: any) => {
              const cnsDate = new Date(cns.createdAt);
              events.push({
                id: `CNS-${cns.id}`,
                patientId: p.id,
                timestamp: cnsDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
                isoTime: cnsDate.getTime(),
                type: "Diagnosis",
                title: `Clinical Consultation: ${cns.diagnosis || "Medical Assessment"}`,
                doctorName: cns.doctor?.name || vst.doctor?.name || "Physician",
                department: vst.doctor?.specialization || "Clinical OPD",
                summary: cns.notes || `Chief Complaint: ${vst.chiefComplaint || "Unspecified"}. Assessment complete.`,
                details: {
                  diagnosis: cns.diagnosis,
                  clinicalNotes: cns.notes,
                  followUpDate: cns.followUpDate,
                  chiefComplaint: vst.chiefComplaint,
                  vitals: vst.vitals,
                },
              });
            });
          }

          if (Array.isArray(vst.prescriptions)) {
            vst.prescriptions.forEach((rx: any) => {
              const rxDate = new Date(rx.createdAt);
              const itemsStr = (rx.items || [])
                .map((it: any) => `${it.medicineName} (${it.dosage}, ${it.frequency})`)
                .join(", ");
              events.push({
                id: `RX-${rx.id}`,
                patientId: p.id,
                timestamp: rxDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
                isoTime: rxDate.getTime(),
                type: "Prescription",
                title: `Prescription Order (${rx.status})`,
                doctorName: rx.doctor?.name || "Physician",
                department: "Clinical Pharmacy",
                summary: itemsStr || rx.notes || "Medications prescribed for clinical regimen.",
                details: {
                  status: rx.status,
                  notes: rx.notes,
                  medications: rx.items,
                },
              });
            });
          }
        });
      }

      // 4. Lab Orders & Verified Results
      if (Array.isArray(p.labOrders)) {
        p.labOrders.forEach((lab: any) => {
          const labDate = new Date(lab.orderedAt);
          const resultsSummary =
            Array.isArray(lab.results) && lab.results.length > 0
              ? `Results: ${lab.results.map((r: any) => `${r.parameterName}: ${r.value} ${r.unit || ""}`).join("; ")}`
              : `Status: ${lab.status}. Priority: ${lab.priority}. Specimen analysis pending/in-progress.`;

          events.push({
            id: `LAB-${lab.id}`,
            patientId: p.id,
            timestamp: labDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
            isoTime: labDate.getTime(),
            type: "Lab Report",
            title: `Pathology Panel: ${lab.testName} (${lab.orderNo})`,
            doctorName: lab.doctor?.name || "Pathologist",
            department: "Central Pathology Laboratory",
            summary: resultsSummary,
            details: {
              orderNo: lab.orderNo,
              status: lab.status,
              priority: lab.priority,
              results: lab.results,
            },
          });
        });
      }

      // 5. Radiology & Imaging Reports
      if (Array.isArray(p.radiologyOrders)) {
        p.radiologyOrders.forEach((rad: any) => {
          const radDate = new Date(rad.createdAt);
          const impression =
            rad.report?.impression || rad.report?.findings || `Diagnostic ${rad.modality} requested. Urgency: ${rad.urgency}.`;

          events.push({
            id: `RAD-${rad.id}`,
            patientId: p.id,
            timestamp: radDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
            isoTime: radDate.getTime(),
            type: "Imaging",
            title: `Imaging: ${rad.modality} ${rad.bodyPart} (${rad.orderNo})`,
            doctorName: rad.doctor?.name || "Radiologist",
            department: "Radiology & PACS Workstation",
            summary: impression,
            details: {
              orderNo: rad.orderNo,
              modality: rad.modality,
              bodyPart: rad.bodyPart,
              urgency: rad.urgency,
              status: rad.status,
              report: rad.report,
            },
          });
        });
      }

      // 6. Surgical Procedures
      if (Array.isArray(p.surgeries)) {
        p.surgeries.forEach((srg: any) => {
          const srgDate = new Date(srg.createdAt || Date.now());
          events.push({
            id: `SRG-${srg.id}`,
            patientId: p.id,
            timestamp: srgDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
            isoTime: srgDate.getTime(),
            type: "Procedure",
            title: `Surgical Procedure: ${srg.procedure} (${srg.surgeryId})`,
            doctorName: srg.leadSurgeon?.name || "Lead Surgeon",
            department: srg.ot?.name ? `Operation Theatre (${srg.ot.name})` : "Surgical Suite",
            summary: `Status: ${srg.status}. Window: ${srg.startTime} - ${srg.endTime}. Anesthesia: ${srg.anesthetist || "Clinical"}.`,
            details: {
              surgeryId: srg.surgeryId,
              status: srg.status,
              ot: srg.ot?.name,
              startTime: srg.startTime,
              endTime: srg.endTime,
              leadSurgeon: srg.leadSurgeon?.name,
              anesthetist: srg.anesthetist,
              scrubNurse: srg.scrubNurse,
            },
          });
        });
      }

      // 7. Emergency Triage Episodes
      if (Array.isArray(p.emergencyCases)) {
        p.emergencyCases.forEach((emg: any) => {
          const emgDate = new Date(emg.createdAt);
          events.push({
            id: `EMG-${emg.id}`,
            patientId: p.id,
            timestamp: emgDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
            isoTime: emgDate.getTime(),
            type: "Emergency",
            title: `Emergency Triage: ${emg.severity} Severity (${emg.caseId})`,
            doctorName: emg.assignedDoctor || "Emergency Physician",
            department: "Emergency Department",
            summary: `Chief Complaint: ${emg.chiefComplaint}. Trauma Bay: ${emg.traumaBay}, Bed: ${emg.bedNo}.`,
            details: {
              caseId: emg.caseId,
              severity: emg.severity,
              chiefComplaint: emg.chiefComplaint,
              traumaBay: emg.traumaBay,
              bedNo: emg.bedNo,
              status: emg.status,
              vitals: emg.vitalsJson ? JSON.parse(emg.vitalsJson) : null,
            },
          });
        });
      }

      // 8. Invoices & Billing
      if (Array.isArray(p.invoices)) {
        p.invoices.forEach((inv: any) => {
          const invDate = new Date(inv.createdAt || inv.billDate);
          const paid = (inv.payments || []).reduce((s: number, pm: any) => s + pm.amount, 0);
          events.push({
            id: `INV-${inv.id}`,
            patientId: p.id,
            timestamp: invDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
            isoTime: invDate.getTime(),
            type: "Billing",
            title: `Hospital Invoice #${inv.invoiceNo} (${inv.paymentStatus})`,
            doctorName: "Finance & Accounts",
            department: "Hospital Billing",
            summary: `Final Amount: ₹${inv.finalAmount.toFixed(2)} (Paid: ₹${paid.toFixed(2)}, Due: ₹${Math.max(0, inv.finalAmount - paid).toFixed(2)}).`,
            details: {
              invoiceNo: inv.invoiceNo,
              subtotal: inv.subtotal,
              insuranceCovered: inv.insuranceCovered,
              coPayAmount: inv.coPayAmount,
              finalAmount: inv.finalAmount,
              paymentStatus: inv.paymentStatus,
              items: inv.items,
              payments: inv.payments,
            },
          });
        });
      }

      // Sort chronologically descending
      events.sort((a, b) => (b.isoTime || 0) - (a.isoTime || 0));
      setTimelineEvents(events);
      setSelectedEvent(events[0] || null);
    } catch (err: any) {
      console.error("Error fetching patient history:", err);
      setError(err.message || "Failed to retrieve patient medical records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const targetId = selectedBasicPatient?.id || patientId;
    fetchPatientHistory(targetId);
  }, [patientId, selectedBasicPatient?.id, fetchPatientHistory]);

  const filterCategories = [
    "All",
    "Visits",
    "Diagnosis",
    "Prescription",
    "Lab Report",
    "Imaging",
    "Procedure",
    "Admission",
    "Discharge",
    "Emergency",
    "Billing",
  ];

  const filteredEvents = timelineEvents.filter((evt) => {
    if (activeFilter === "All") return true;
    return evt.type.toLowerCase().includes(activeFilter.toLowerCase());
  });

  const displayPatient = livePatient || selectedBasicPatient;

  return (
    <div className="space-y-8 text-[#111] font-sans">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION: PATIENT 360 & CLINICAL PROFILE BANNER                   */}
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
                {displayPatient?.status || "Active"}
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#111] leading-[1.08] tracking-tight"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              {displayPatient?.name || "Patient Profile"}
              <span className="block text-xl sm:text-2xl font-mono text-black/50 mt-1">
                MRN: {displayPatient?.mrn || displayPatient?.id} • {displayPatient?.age} Yrs / {displayPatient?.gender}
              </span>
            </h1>

            <p className="text-sm text-black/50 font-light max-w-xl leading-relaxed">
              Unified electronic medical record timeline with real-time appointments, inpatient admissions, laboratory findings, radiology reports, prescriptions, and financial ledgers.
            </p>

            {/* Quick Stat Highlights */}
            <div className="flex items-center gap-6 pt-2">
              <div>
                <div
                  className="text-3xl font-light tracking-tight text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  {timelineEvents.length}
                </div>
                <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">
                  Clinical Events
                </div>
              </div>

              <div className="w-px h-10 bg-black/10" />

              <div>
                <div
                  className="text-3xl font-light tracking-tight text-emerald-800"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  {displayPatient?.bloodGroup || "—"}
                </div>
                <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">
                  Blood Group
                </div>
              </div>

              <div className="w-px h-10 bg-black/10" />

              {/* Patient Switcher Dropdown */}
              <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-black/10 shadow-xs">
                <span className="text-xs text-[#111] font-semibold pl-2">Patient:</span>
                <select
                  value={displayPatient?.id || patientId}
                  onChange={(e) => onSelectPatient(e.target.value)}
                  className="bg-white text-[#111] text-xs font-bold border border-black/10 outline-none py-1 px-3 rounded-xl cursor-pointer"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn || p.id})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => fetchPatientHistory(displayPatient?.id || patientId)}
                  disabled={loading}
                  title="Refresh Timeline"
                  className="p-1 text-black/60 hover:text-black disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Illustration Stand */}
          <div className="w-full lg:w-[420px] shrink-0 relative flex items-center justify-center">
            <div className="relative group rounded-2xl overflow-hidden p-2 transition-transform duration-500 hover:scale-[1.02]">
              <Image
                src="/images/patient-360-3d-full.png"
                alt="3D Glass Patient 360 Profile Card"
                width={420}
                height={280}
                className="w-full h-auto object-contain drop-shadow-2xl rounded-xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Patient Key Medical Profile Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-black/10 text-xs">
          <div className="bg-white/80 p-3.5 rounded-2xl border border-black/10">
            <div className="text-black/40 text-[10px] uppercase font-bold tracking-wider font-pixel">
              Insurance Policy
            </div>
            <div className="font-bold text-[#111] mt-0.5">
              {displayPatient?.insurance?.provider || "Self Pay / Cash"}
            </div>
            <div className="text-[10px] text-black/50 font-mono">
              {displayPatient?.insurance?.policyNo ? `Policy #${displayPatient.insurance.policyNo}` : "No policy on file"}
            </div>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-black/10">
            <div className="text-black/40 text-[10px] uppercase font-bold tracking-wider font-pixel">
              Documented Allergies
            </div>
            <div className="font-bold text-rose-700 mt-0.5 truncate">
              {Array.isArray(displayPatient?.allergies) && displayPatient.allergies.length > 0
                ? displayPatient.allergies.join(", ")
                : "None Reported"}
            </div>
            <div className="text-[10px] text-black/50">Verified Clinical Safety</div>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-black/10">
            <div className="text-black/40 text-[10px] uppercase font-bold tracking-wider font-pixel">
              Emergency Contact
            </div>
            <div className="font-bold text-[#111] mt-0.5 truncate">
              {displayPatient?.emergencyContact?.name
                ? `${displayPatient.emergencyContact.name} (${displayPatient.emergencyContact.relation || "Kin"})`
                : "Not Recorded"}
            </div>
            <div className="text-[10px] text-black/50 font-mono">
              {displayPatient?.emergencyContact?.phone || "—"}
            </div>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-black/10">
            <div className="text-black/40 text-[10px] uppercase font-bold tracking-wider font-pixel">
              Attending Physician
            </div>
            <div className="font-bold text-emerald-800 mt-0.5 truncate">
              {typeof displayPatient?.doctor === "object"
                ? displayPatient?.doctor?.name
                : displayPatient?.doctor || "Dr. Charaka"}
            </div>
            <div className="text-[10px] text-black/50">
              {displayPatient?.department?.name || displayPatient?.department || "General Medicine"}
            </div>
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
              {filteredEvents.length} Verified Events
            </span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-black/50">
              <RefreshCw className="w-6 h-6 animate-spin text-black/40" />
              <p className="text-xs font-mono">Querying patient medical record stream...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Error Loading Patient History</span>
              </div>
              <p className="text-xs">{error}</p>
              <button
                onClick={() => fetchPatientHistory(displayPatient?.id || patientId)}
                className="mt-2 px-3 py-1.5 bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Retry
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white/40 rounded-2xl border border-dashed border-black/10 p-8">
              <FolderOpen className="w-10 h-10 text-black/30 mx-auto" />
              <h4 className="text-sm font-bold text-[#111]">No Medical History Records</h4>
              <p className="text-xs text-black/50 max-w-sm mx-auto">
                No clinical events (consultations, admissions, laboratory tests, or invoices) were found for this patient in the database.
              </p>
            </div>
          ) : (
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
                  <div
                    className={`absolute -left-6 top-5 transform -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center shadow-sm ${
                      evt.type === "Emergency"
                        ? "border-rose-600"
                        : evt.type === "Admission" || evt.type === "Discharge"
                        ? "border-indigo-600"
                        : evt.type === "Lab Report"
                        ? "border-purple-600"
                        : evt.type === "Prescription"
                        ? "border-amber-600"
                        : evt.type === "Billing"
                        ? "border-emerald-600"
                        : "border-[#111]"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        evt.type === "Emergency"
                          ? "bg-rose-600 animate-pulse"
                          : evt.type === "Admission" || evt.type === "Discharge"
                          ? "bg-indigo-600"
                          : evt.type === "Lab Report"
                          ? "bg-purple-600"
                          : evt.type === "Prescription"
                          ? "bg-amber-600"
                          : evt.type === "Billing"
                          ? "bg-emerald-600"
                          : "bg-[#111]"
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-pixel text-[9px] tracking-widest px-2.5 py-0.5 rounded-md uppercase font-bold ${
                        evt.type === "Emergency"
                          ? "bg-rose-100 text-rose-800"
                          : evt.type === "Admission" || evt.type === "Discharge"
                          ? "bg-indigo-100 text-indigo-800"
                          : evt.type === "Lab Report"
                          ? "bg-purple-100 text-purple-800"
                          : evt.type === "Prescription"
                          ? "bg-amber-100 text-amber-800"
                          : evt.type === "Billing"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-black/10 text-black/80"
                      }`}
                    >
                      {evt.type}
                    </span>
                    <span className="text-[11px] font-mono text-black/40 font-medium">
                      {evt.timestamp}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#111] mt-1">{evt.title}</h4>
                  <p className="text-xs text-black/60 mt-1 leading-relaxed">{evt.summary}</p>

                  <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] text-black/50 font-medium">
                    <span>Provider: {evt.doctorName}</span>
                    <span className="text-[#111] font-semibold group-hover:underline flex items-center gap-1">
                      View Payload <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              Select any timeline event on the left to inspect authoritative database record fields
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
                    Attending Physician / Department
                  </div>
                  <div className="p-2.5 bg-white/80 rounded-xl border border-black/10 font-medium text-black/80">
                    {selectedEvent.doctorName} — {selectedEvent.department}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-[#111] font-pixel text-[10px] tracking-wider uppercase text-black/40">
                    Clinical Notes &amp; Summary
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-black/10 text-black/70 leading-relaxed">
                    {selectedEvent.summary}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-[#111] font-pixel text-[10px] tracking-wider uppercase text-black/40">
                    Database Payload Properties
                  </div>
                  <pre className="p-3 bg-[#111] text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed max-h-72">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-white/60 rounded-2xl border border-dashed border-black/10">
                <Info className="w-8 h-8 text-black/30 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#111]">No timeline event selected</p>
                <p className="text-[11px] text-black/40 mt-1">
                  Click on any verified event in the timeline feed to inspect detailed payload
                </p>
              </div>
            )}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
