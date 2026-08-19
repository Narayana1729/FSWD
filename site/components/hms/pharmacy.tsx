"use client";

import React, { useState } from "react";
import {
  Pill,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  CheckCircle,
  CheckCircle2,
  FileText,
  Boxes,
  ArrowUpRight,
  TrendingDown,
  ShoppingBag,
} from "lucide-react";
import { PharmacyItem } from "@/lib/hms-data";

interface PharmacyViewProps {
  pharmacyItems: PharmacyItem[];
  onAddPharmacyItem: (item: PharmacyItem) => void;
  onUpdatePharmacyItems?: (items: PharmacyItem[]) => void;
}

export function PharmacyView({ pharmacyItems, onAddPharmacyItem, onUpdatePharmacyItems }: PharmacyViewProps) {
  const [items, setItems] = useState<PharmacyItem[]>(pharmacyItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [selectedItemForDispense, setSelectedItemForDispense] = useState<PharmacyItem | null>(null);
  const [dispenseQty, setDispenseQty] = useState(1);
  const [pendingPrescriptions, setPendingPrescriptions] = useState<any[]>([]);
  const [dispenseError, setDispenseError] = useState<string | null>(null);
  const [dispenseSuccess, setDispenseSuccess] = useState<string | null>(null);

  const fetchPrescriptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/prescriptions?status=Active");
      if (res.ok) {
        const json = await res.json();
        if (json.prescriptions) setPendingPrescriptions(json.prescriptions);
      }
    } catch (e) {
      console.warn("Failed to fetch active prescriptions:", e);
    }
  }, []);

  React.useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  React.useEffect(() => {
    setItems(pharmacyItems);
  }, [pharmacyItems]);

  const filteredItems = items.filter(
    (i) =>
      (i.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.batchNo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDispensePrescription = async (prescriptionId: string, medicineId?: string, qty?: number) => {
    setDispenseError(null);
    setDispenseSuccess(null);
    try {
      const res = await fetch("/api/pharmacy/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId, medicineId, quantity: qty }),
      });

      const json = await res.json();

      if (!res.ok) {
        setDispenseError(json.error || "Failed to dispense prescription");
        return;
      }

      setDispenseSuccess(json.message || "Prescription dispensed and billed successfully!");

      // Update local stock state
      if (medicineId) {
        const updated = items.map((i) => (i.id === medicineId ? { ...i, stockQty: Math.max(0, i.stockQty - (qty || 1)) } : i));
        setItems(updated);
        if (onUpdatePharmacyItems) onUpdatePharmacyItems(updated);
      }

      // Re-fetch pending prescriptions
      fetchPrescriptions();
    } catch (err: any) {
      setDispenseError(err.message || "Network error while dispensing prescription");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pharmacy Stock &amp; Dispensing Console</h2>
          <p className="text-xs text-slate-500">Batch tracking, 30/60/90-day expiry monitors, Rx dispensing, and automated purchase orders</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine Batch</span>
        </button>
      </div>

      {/* Feedback Banners */}
      {dispenseError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{dispenseError}</span>
          </div>
          <button onClick={() => setDispenseError(null)} className="text-rose-600 font-bold text-sm">✕</button>
        </div>
      )}

      {dispenseSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{dispenseSuccess}</span>
          </div>
          <button onClick={() => setDispenseSuccess(null)} className="text-emerald-600 font-bold text-sm">✕</button>
        </div>
      )}

      {/* ── PENDING DOCTOR PRESCRIPTIONS QUEUE (CASCADING WORKFLOW) ──────── */}
      {pendingPrescriptions.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Pending Doctor Prescriptions (Auto-Received from OPD)</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs font-mono">
              {pendingPrescriptions.length} Active Rx
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Rx ID</th>
                  <th className="py-3 px-4">Patient Name &amp; MRN</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Prescribed Medicines</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingPrescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{(rx.id ? String(rx.id).slice(-6) : "RX-01").toUpperCase()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {rx.visit?.patient?.name || "OPD Patient"}
                      <span className="block text-[10px] font-normal text-slate-400 font-mono">
                        {rx.visit?.patient?.mrn || "P-1001"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rx.doctor?.name || "Dr. Dhanvantari"}</td>
                    <td className="py-3 px-4">
                      {rx.items?.map((item: any) => (
                        <div key={item.id} className="text-slate-800 font-semibold">
                          • {item.medicineName} ({item.dosage}, {item.frequency}) — Qty: {item.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDispensePrescription(rx.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 ml-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispense &amp; Bill Rx</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Total Batch Stock</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {items.reduce((sum, i) => sum + i.stockQty, 0).toLocaleString()} Units
            </div>
          </div>
          <Pill className="w-8 h-8 text-rose-600 p-1 bg-rose-50 rounded-xl" />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-700 font-semibold uppercase">Low Stock Alerts</div>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {items.filter((i) => i.stockQty <= i.reorderLevel).length} Items
            </div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-600 p-1 bg-amber-100 rounded-xl" />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Expiring in 30 Days</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {items.filter((i) => i.expiryDate < "2026-10-01").length} Batches
            </div>
          </div>
          <Clock className="w-8 h-8 text-purple-600 p-1 bg-purple-50 rounded-xl" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Medicine Name, Batch No, Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-600 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Medicine Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Batch No</th>
                <th className="py-3.5 px-4">Stock Qty</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{item.batchNo}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                        item.stockQty <= item.reorderLevel
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.stockQty} Units
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{item.expiryDate}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedItemForDispense(item);
                        setShowDispenseModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors"
                    >
                      Dispense Rx
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Medicine Batch</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = (formData.get("name") as string) || "New Medicine";
                const category = (formData.get("category") as string) || "General";
                const batchNo = (formData.get("batchNo") as string) || `BAT-${Math.floor(10000 + Math.random() * 90000)}`;
                const stockQty = parseInt(formData.get("stockQty") as string) || 100;
                const reorderLevel = parseInt(formData.get("reorderLevel") as string) || 50;
                const supplier = (formData.get("supplier") as string) || "Dronagiri Pharma";
                const expiryDate = (formData.get("expiryDate") as string) || "2027-12-31";
                const unitPrice = parseFloat(formData.get("unitPrice") as string) || 10.0;
                const prescriptionRequired = formData.get("prescriptionRequired") === "on";

                const newItem: PharmacyItem = {
                  id: `RX-${Math.floor(10 + Math.random() * 90)}`,
                  name,
                  category,
                  batchNo,
                  stockQty,
                  reorderLevel,
                  supplier,
                  expiryDate,
                  unitPrice,
                  prescriptionRequired,
                };

                const updated = [newItem, ...items];
                setItems(updated);
                onAddPharmacyItem(newItem);
                if (onUpdatePharmacyItems) onUpdatePharmacyItems(updated);
                setShowAddModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medicine Name</label>
                  <input required name="name" placeholder="e.g. Azithromycin 500mg" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select name="category" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white">
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Analgesics">Analgesics</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch No</label>
                  <input name="batchNo" placeholder="BAT-90123" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock Qty</label>
                  <input type="number" name="stockQty" defaultValue="500" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input type="number" step="0.01" name="unitPrice" defaultValue="15.00" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input type="date" name="expiryDate" defaultValue="2027-06-30" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier</label>
                  <input name="supplier" defaultValue="Dronagiri Pharma" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="prescriptionRequired" name="prescriptionRequired" defaultChecked className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4" />
                <label htmlFor="prescriptionRequired" className="font-semibold text-slate-700">Prescription Required (Rx)</label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md">
                  Save Medicine Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispense Modal */}
      {showDispenseModal && selectedItemForDispense && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-xs font-sans">
            <h3 className="text-base font-bold text-slate-900">Dispense Prescription Medicine</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">{selectedItemForDispense.name}</div>
              <div className="text-slate-500">Batch: {selectedItemForDispense.batchNo} • Current Stock: {selectedItemForDispense.stockQty} Units</div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Quantity to Dispense</label>
              <input
                type="number"
                value={dispenseQty}
                onChange={(e) => setDispenseQty(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDispenseModal(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button onClick={handleDispense} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md">
                Confirm Dispensing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
