"use client";

import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  FlaskConical,
  FileText,
  AlertCircle,
  Search,
  Check,
  ChevronRight,
  Filter,
  Plus,
} from "lucide-react";
import { LabOrder, LabSampleStatus } from "@/lib/hms-data";
import { getAuthHeaders } from "@/hooks/use-hms-api";

interface LaboratoryViewProps {
  labOrders: LabOrder[];
  onUpdateLabOrders?: (orders: LabOrder[]) => void;
}

export function LaboratoryView({ labOrders, onUpdateLabOrders }: LaboratoryViewProps) {
  const [orders, setOrders] = useState<LabOrder[]>(labOrders);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(orders[0] || null);
  const [showNewLabModal, setShowNewLabModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const statuses: LabSampleStatus[] = [
    "Requested",
    "Collected",
    "Lab Processing",
    "Result Ready",
    "Verified",
  ];

  const handleAdvanceStatus = async (orderId: string) => {
    setOrderError(null);
    setOrderSuccess(null);
    const target = orders.find((o) => o.id === orderId || (o as any).orderId === orderId);
    if (!target) return;

    const currentIdx = statuses.indexOf(target.status);
    const nextStatus = statuses[Math.min(statuses.length - 1, currentIdx + 1)];

    if (target.status === "Verified") {
      setOrderError("Lab order is already verified and finalized.");
      return;
    }

    try {
      const res = await fetch("/api/lab-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "same-origin",
        body: JSON.stringify({ id: target.id, orderId: (target as any).orderId, status: nextStatus, technician: "Tech Alok Verma" }),
      });

      const json = await res.json();
      if (!res.ok) {
        setOrderError(json.error || "Failed to update lab order status");
        return;
      }

      const updated = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
      setOrders(updated);
      if (onUpdateLabOrders) onUpdateLabOrders(updated);
      setOrderSuccess(`Lab Order #${target.id} status updated to "${nextStatus}".`);
    } catch (e: any) {
      setOrderError(e.message || "Network error while updating lab status");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Laboratory &amp; Sample Pipeline Console</h2>
          <p className="text-xs text-slate-500">Track specimen collection, automated lab analyzer results, abnormal flags, and doctor sign-offs</p>
        </div>

        <button
          onClick={() => setShowNewLabModal(true)}
          className="px-4 py-2.5 bg-[#111] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Order New Lab Test</span>
        </button>
      </div>

      {/* Kanban Pipeline (5 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {statuses.map((status) => {
          const colOrders = orders.filter((o) => o.status === status);
          return (
            <div key={status} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 min-w-[220px] space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{status}</span>
                <span className="text-xs font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-full text-slate-700">
                  {colOrders.length}
                </span>
              </div>

              <div className="space-y-2">
                {colOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      selectedOrder?.id === o.id
                        ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold text-slate-900">{o.testName}</div>
                    <div className="text-[11px] text-slate-500">{o.patientName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{o.orderedTime}</div>

                    {o.isAbnormal && (
                      <div className="mt-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                        ⚠️ Abnormal Result Flag
                      </div>
                    )}

                    {o.status !== "Verified" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvanceStatus(o.id);
                        }}
                        className="w-full mt-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800"
                      >
                        Advance Pipeline →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Result Inspection */}
      {selectedOrder && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Lab Test Report: {selectedOrder.testName}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div><span className="text-slate-400 font-semibold uppercase">Patient:</span> <div className="font-bold text-slate-900">{selectedOrder.patientName}</div></div>
            <div><span className="text-slate-400 font-semibold uppercase">Ordering Doctor:</span> <div className="font-bold text-slate-900">{selectedOrder.doctorName}</div></div>
            <div><span className="text-slate-400 font-semibold uppercase">Specimen:</span> <div className="font-bold text-slate-900">{selectedOrder.sampleType}</div></div>
            <div><span className="text-slate-400 font-semibold uppercase">Status:</span> <div className="font-bold text-blue-600">{selectedOrder.status}</div></div>
          </div>

          {selectedOrder.result && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
              <div className="text-[10px] text-blue-400 uppercase font-mono tracking-widest">Verified Result Payload</div>
              <div className="text-base font-bold font-mono">{selectedOrder.result}</div>
              <div className="text-xs text-slate-300">Reference Range: {selectedOrder.referenceRange} {selectedOrder.unit}</div>
            </div>
          )}
        </div>
      )}

      {/* Order New Lab Test Modal */}
      {showNewLabModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Order New Laboratory Diagnostic Test</h3>
              </div>
              <button onClick={() => setShowNewLabModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const patientName = (formData.get("patientName") as string) || "Sundar";
                const testName = (formData.get("testName") as string) || "Complete Blood Count (CBC)";
                const category = (formData.get("category") as string) || "Hematology";
                const doctorName = (formData.get("doctorName") as string) || "Dr. Dhanvantari";
                const sampleType = (formData.get("sampleType") as string) || "Venous Blood";

                const newOrder: LabOrder = {
                  id: `LAB-${Math.floor(400 + Math.random() * 90)}`,
                  patientId: `P-${Math.floor(1000 + Math.random() * 900)}`,
                  patientName,
                  testName,
                  category,
                  doctorName,
                  orderedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  sampleType,
                  status: "Requested",
                };

                try {
                  fetch("/api/lab-orders", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...getAuthHeaders(),
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                      patientId: "cmsvcbdc80011j1bwjcniweo4",
                      doctorId: "DOC-101",
                      testName,
                      category,
                      sampleType,
                    }),
                  });
                } catch (e) {
                  console.warn("Failed to persist lab order to DB:", e);
                }

                setOrders((prev) => [newOrder, ...prev]);
                if (onUpdateLabOrders) onUpdateLabOrders([newOrder, ...orders]);
                setSelectedOrder(newOrder);
                setShowNewLabModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Name</label>
                  <input required name="patientName" placeholder="e.g. Koushik" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ordering Physician</label>
                  <input name="doctorName" defaultValue="Dr. Dhanvantari" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Test Name</label>
                  <select name="testName" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white font-semibold">
                    <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                    <option value="Troponin T & Cardiac Enzymes">Troponin T &amp; Cardiac Enzymes</option>
                    <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                    <option value="Renal & Electrolyte Panel">Renal &amp; Electrolyte Panel</option>
                    <option value="HbA1c Glycated Hemoglobin">HbA1c Glycated Hemoglobin</option>
                    <option value="Thyroid Profile (T3/T4/TSH)">Thyroid Profile (T3/T4/TSH)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diagnostic Category</label>
                  <select name="category" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white">
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Nephrology">Nephrology</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specimen / Sample Type</label>
                <input name="sampleType" defaultValue="Venous Blood (EDTA Tube)" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowNewLabModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#111] hover:bg-slate-800 text-white font-bold rounded-xl shadow-md">
                  Submit Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
