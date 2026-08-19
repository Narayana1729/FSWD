"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Droplet,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Activity,
  Heart,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { BloodBankStock, Patient } from "@/lib/hms-data";
import { usePersistentState } from "@/hooks/use-persistent-state";

export interface PatientBloodRequisition {
  id: string;
  patientId: string;
  patientName: string;
  bloodGroup: string;
  units: number;
  reason: string;
  urgency: "Emergency ER" | "Surgery OT" | "ICU High Risk" | "Elective Transfusion";
  status: "Issued & Reserved" | "Transfused";
  requestedAt: string;
}

interface BloodBankViewProps {
  bloodBankStock: BloodBankStock[];
  patients?: Patient[];
  onUpdateBloodBank?: (stock: BloodBankStock[]) => void;
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

export function BloodBankView({ bloodBankStock, patients = [], onUpdateBloodBank }: BloodBankViewProps) {
  const [stockList, setStockList] = useState<BloodBankStock[]>(bloodBankStock);
  const [selectedRecipientGroup, setSelectedRecipientGroup] = useState<string>("AB+");
  const [selectedDonorGroup, setSelectedDonorGroup] = useState<string>("O-");
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [showPatientRequestModal, setShowPatientRequestModal] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [requisitions, setRequisitions] = usePersistentState<PatientBloodRequisition[]>("dronagiri_blood_requisitions", [
    { id: "REQ-901", patientId: "P-1001", patientName: "Sundar", bloodGroup: "O-", units: 2, reason: "ICU Cardiac Resuscitation", urgency: "ICU High Risk", status: "Issued & Reserved", requestedAt: "Today, 10:15 AM" },
    { id: "REQ-902", patientId: "P-1002", patientName: "Bhuvan", bloodGroup: "A+", units: 1, reason: "Pre-Op Arthroscopic Surgery Prep", urgency: "Surgery OT", status: "Transfused", requestedAt: "Yesterday, 02:30 PM" },
    { id: "REQ-903", patientId: "P-1004", patientName: "Koushik", bloodGroup: "B+", units: 3, reason: "Trauma Bay Emergency Hemorrhage", urgency: "Emergency ER", status: "Issued & Reserved", requestedAt: "Today, 08:45 AM" },
  ]);

  useEffect(() => {
    setStockList(bloodBankStock);
  }, [bloodBankStock]);

  const recipientStock = stockList.find((b) => b.group === selectedRecipientGroup);

  return (
    <div className="space-y-8 text-[#111]">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO BANNER WITH 3D GLASS BLOOD DROPLET ARTWORK                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="rounded-3xl p-8 lg:p-10 relative overflow-hidden"
        style={GLASS_BANNER}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-xl text-left">
            <Tag>TRANSFUSION &amp; HEMATOLOGY MATRIX</Tag>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#111] leading-[1.08] tracking-tight"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              Blood Bank Inventory<br />&amp; Safety Matrix.
            </h1>
            <p className="text-sm text-black/50 font-light leading-relaxed">
              Real-time multi-group blood stock meters, donor registry, automated shelf-life alerts, and interactive cross-match compatibility analysis.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <div>
                <div
                  className="text-3xl font-light tracking-tight text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  8 Groups
                </div>
                <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">
                  Monitored 24/7
                </div>
              </div>

              <div className="w-px h-10 bg-black/10" />

              <div>
                <div
                  className="text-3xl font-light tracking-tight text-rose-800"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  100% Verified
                </div>
                <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">
                  Agglutination Safety
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    setRequestError(null);
                    setShowPatientRequestModal(true);
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Droplet className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <span>Request Blood for Patient</span>
                </button>

                <button
                  onClick={() => setShowAddDonorModal(true)}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Unit Intake</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3D Glass Blood Droplet Artwork Container */}
          <div className="w-full lg:w-[360px] shrink-0 relative flex items-center justify-center">
            <div className="relative group rounded-2xl overflow-hidden p-2 transition-transform duration-500 hover:scale-[1.02]">
              <Image
                src="/images/blood-bank-droplet.png"
                alt="3D Glass Blood Droplet Artwork"
                width={360}
                height={260}
                className="w-full h-auto object-contain drop-shadow-2xl rounded-xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION: 8 BLOOD GROUP STOCK METERS                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase">
            LIVE BLOOD GROUP RESERVES
          </span>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {bloodBankStock.map((b) => (
            <SpotlightCard
              key={b.group}
              className={`p-5 rounded-2xl transition-all ${
                b.unitsAvailable <= b.minAlertThreshold
                  ? "bg-rose-50/80 border-rose-200"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-2xl font-light text-[#111]"
                  style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  {b.group}
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Droplet className="w-4 h-4 text-rose-600 fill-rose-600" />
                </div>
              </div>

              <div
                className="text-3xl font-light tracking-tight mb-1 text-[#111]"
                style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
              >
                {b.unitsAvailable} <span className="text-xs font-normal text-black/40 font-mono">Units</span>
              </div>
              <div className="text-[11px] text-black/40">Threshold: {b.minAlertThreshold} units</div>

              {b.unitsAvailable <= b.minAlertThreshold && (
                <div className="mt-3 px-2 py-1 bg-rose-100/70 text-rose-800 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 font-pixel">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Low Reserve Alert</span>
                </div>
              )}
            </SpotlightCard>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION: TRANSFUSION COMPATIBILITY CHECKER                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SpotlightCard className="p-8 rounded-3xl">
        <div className="mb-6">
          <div className="font-pixel text-[10px] tracking-widest text-black/40 uppercase mb-1">
            CROSS-MATCH VERIFICATION
          </div>
          <h3
            className="text-2xl font-light text-[#111]"
            style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
          >
            Interactive Transfusion Compatibility Checker
          </h3>
          <p className="text-xs text-black/50 mt-1">
            Select recipient and donor blood groups to verify immunological compatibility and prevent hemolytic reaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-black/10 bg-white/60">
          <div className="space-y-2">
            <label className="block text-xs font-pixel font-bold text-black/50 uppercase tracking-wider">
              Select Patient / Recipient Group
            </label>
            <select
              value={selectedRecipientGroup}
              onChange={(e) => setSelectedRecipientGroup(e.target.value)}
              className="w-full p-3 border border-black/10 rounded-xl text-sm font-bold text-[#111] bg-white outline-none cursor-pointer"
            >
              {bloodBankStock.map((b) => (
                <option key={b.group} value={b.group}>
                  Blood Group {b.group}
                </option>
              ))}
            </select>
            {recipientStock && (
              <div className="mt-3 text-xs text-black/60 space-y-1.5 pt-2">
                <div>
                  <span className="font-bold text-[#111]">Compatible Donors:</span>{" "}
                  <span className="text-emerald-800 font-semibold">{recipientStock.compatibleDonors.join(", ")}</span>
                </div>
                <div>
                  <span className="font-bold text-[#111]">Expiring in 30 Days:</span> {recipientStock.expiringIn30Days} units
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-pixel font-bold text-black/50 uppercase tracking-wider">
              Select Donor Blood Bag Group
            </label>
            <select
              value={selectedDonorGroup}
              onChange={(e) => setSelectedDonorGroup(e.target.value)}
              className="w-full p-3 border border-black/10 rounded-xl text-sm font-bold text-[#111] bg-white outline-none cursor-pointer"
            >
              {bloodBankStock.map((b) => (
                <option key={b.group} value={b.group}>
                  Blood Group {b.group}
                </option>
              ))}
            </select>

            {recipientStock && (
              <div className="mt-4 p-4 rounded-xl border flex items-center gap-3 transition-all">
                {recipientStock.compatibleDonors.includes(selectedDonorGroup) ||
                recipientStock.compatibleDonors.includes("Everyone (Universal Recipient)") ||
                selectedDonorGroup === "O-" ? (
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Transfusion Safe: {selectedDonorGroup} is compatible with {selectedRecipientGroup}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>Incompatible Transfusion: Agglutination risk detected!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SpotlightCard>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION: PATIENT BLOOD TRANSFUSION REQUISITIONS                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SpotlightCard className="p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-pixel text-[10px] tracking-widest text-black/40 uppercase mb-1">
              TRANSFUSION REQUISITION LOG
            </div>
            <h3
              className="text-2xl font-light text-[#111]"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              Patient Blood Issue &amp; Allocation Registry
            </h3>
            <p className="text-xs text-black/50 mt-1">
              Tracks cross-matched blood bags issued to emergency, operating theatre, and inpatient ward patients.
            </p>
          </div>

          <button
            onClick={() => {
              setRequestError(null);
              setShowPatientRequestModal(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Droplet className="w-3.5 h-3.5 fill-white" />
            <span>Issue Blood to Patient</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/[0.03] text-black/60 font-pixel text-[10px] uppercase border-b border-black/10">
              <tr>
                <th className="py-3 px-4">Req ID</th>
                <th className="py-3 px-4">Patient Name &amp; ID</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Units Issued</th>
                <th className="py-3 px-4">Clinical Indication</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] font-sans">
              {requisitions.map((req) => (
                <tr key={req.id} className="hover:bg-rose-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-black/80">{req.id}</td>
                  <td className="py-3.5 px-4 font-bold text-[#111]">
                    {req.patientName}
                    <span className="block text-[10px] font-normal text-black/40 font-mono">{req.patientId}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-pixel text-[11px]">
                      {req.bloodGroup}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold font-mono text-[#111]">{req.units} Bag(s)</td>
                  <td className="py-3.5 px-4 text-black/70">{req.reason}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.urgency.includes("Emergency") || req.urgency.includes("ICU")
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {req.urgency}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        req.status === "Issued & Reserved"
                          ? "bg-amber-100 text-amber-900 border border-amber-300/50"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300/50"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpotlightCard>

      {/* Add Blood Unit Intake Modal */}
      {showAddDonorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600 fill-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Record Blood Donation / Unit Intake</h3>
              </div>
              <button onClick={() => setShowAddDonorModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const group = formData.get("group") as string;
                const unitsToAdd = parseInt(formData.get("units") as string) || 1;

                const updated = stockList.map((b) => (b.group === group ? { ...b, unitsAvailable: b.unitsAvailable + unitsToAdd } : b));
                setStockList(updated);
                if (onUpdateBloodBank) onUpdateBloodBank(updated);
                setShowAddDonorModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select name="group" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold bg-white text-sm">
                  {stockList.map((b) => (
                    <option key={b.group} value={b.group}>
                      Blood Group {b.group} (Current: {b.unitsAvailable} Units)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Number of Tested Units (350ml/bag)</label>
                <input type="number" name="units" defaultValue="5" min="1" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm text-slate-900" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Donor Name / Source Registry</label>
                <input name="donorName" placeholder="e.g. Voluntary Donor Camp #402" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddDonorModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md">
                  Add to Blood Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: RESERVE & ISSUE BLOOD UNITS TO PATIENT                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showPatientRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600 fill-rose-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request &amp; Issue Blood for Patient</h3>
                  <p className="text-[11px] text-slate-500">Cross-matches patient blood group and allocates units from live stock.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPatientRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {requestError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{requestError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setRequestError(null);
                const formData = new FormData(e.currentTarget);
                const patientName = formData.get("patientName") as string;
                const bloodGroup = formData.get("bloodGroup") as string;
                const unitsNeeded = parseInt(formData.get("unitsNeeded") as string) || 1;
                const reason = formData.get("reason") as string;
                const urgency = formData.get("urgency") as any;

                const targetStock = stockList.find((b) => b.group === bloodGroup);
                if (!targetStock || targetStock.unitsAvailable < unitsNeeded) {
                  setRequestError(
                    `Insufficient stock! Only ${targetStock ? targetStock.unitsAvailable : 0} units available for Blood Group ${bloodGroup}. (Universal O- can also be issued if authorized).`
                  );
                  return;
                }

                // Deduct stock
                const updatedStock = stockList.map((b) =>
                  b.group === bloodGroup ? { ...b, unitsAvailable: b.unitsAvailable - unitsNeeded } : b
                );
                setStockList(updatedStock);
                if (onUpdateBloodBank) onUpdateBloodBank(updatedStock);

                // Add Requisition
                const newReq: PatientBloodRequisition = {
                  id: `REQ-${Math.floor(904 + Math.random() * 90)}`,
                  patientId: `P-${Math.floor(1005 + Math.random() * 90)}`,
                  patientName,
                  bloodGroup,
                  units: unitsNeeded,
                  reason,
                  urgency,
                  status: "Issued & Reserved",
                  requestedAt: "Just now",
                };

                setRequisitions([newReq, ...requisitions]);
                setShowPatientRequestModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient</label>
                {patients && patients.length > 0 ? (
                  <select
                    name="patientName"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold bg-white text-sm"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.id} • {p.age}y {p.gender})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    name="patientName"
                    placeholder="Enter Patient Name (e.g. Sundar)"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group Required</label>
                  <select
                    name="bloodGroup"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold bg-white text-sm"
                  >
                    {stockList.map((b) => (
                      <option key={b.group} value={b.group}>
                        {b.group} ({b.unitsAvailable} Units Available)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Units Required (350ml)</label>
                  <input
                    type="number"
                    name="unitsNeeded"
                    defaultValue="1"
                    min="1"
                    max="10"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Urgency &amp; Priority</label>
                  <select
                    name="urgency"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold bg-white text-sm"
                  >
                    <option value="Emergency ER">Emergency ER Trauma</option>
                    <option value="Surgery OT">Scheduled Surgery OT</option>
                    <option value="ICU High Risk">ICU Resuscitation</option>
                    <option value="Elective Transfusion">Elective Transfusion</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Indication</label>
                  <input
                    required
                    name="reason"
                    placeholder="e.g. Acute Hemorrhage / Pre-Op"
                    defaultValue="Emergency ER Resuscitation"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Issuing blood will cross-match antibody titers and immediately deduct tested bags from live Blood Bank inventory.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPatientRequestModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reserve &amp; Issue Blood Units</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
