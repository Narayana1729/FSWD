"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  Shield,
  DollarSign,
  FileText,
  Search,
  Plus,
} from "lucide-react";
import { BillingInvoice } from "@/lib/hms-data";

interface BillingInsuranceViewProps {
  invoices: BillingInvoice[];
  onUpdateInvoices?: (invoices: BillingInvoice[]) => void;
}

export function BillingInsuranceView({ invoices, onUpdateInvoices }: BillingInsuranceViewProps) {
  const [invoiceList, setInvoiceList] = useState<BillingInvoice[]>(invoices);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice>(invoiceList[0] || invoices[0]);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);

  React.useEffect(() => {
    setInvoiceList(invoices);
  }, [invoices]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F0EEE8] p-5 rounded-2xl border border-black/10 shadow-sm relative overflow-hidden text-[#111]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/10 shadow-sm bg-white/60 hidden sm:block">
            <img src="/images/bill-discharge.png" alt="Bill & Discharge" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#111] tracking-tight">Billing &amp; Insurance Subsystem</h2>
            <p className="text-xs text-black/50">Itemized billing calculation, insurance co-pay claims, refunds, and discharge invoices</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewInvoiceModal(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Invoice</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Itemized Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Invoice List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Hospital Invoices</h3>
          {invoiceList.map((inv) => (
            <div
              key={inv.id}
              onClick={() => setSelectedInvoice(inv)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all text-xs ${
                selectedInvoice.id === inv.id
                  ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                <span>{inv.id}</span>
                <span className="text-[10px] text-slate-400">{inv.billDate}</span>
              </div>
              <div className="font-bold text-slate-800 mt-1">{inv.patientName}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 text-sm">₹{inv.finalAmount.toFixed(2)}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  {inv.paymentStatus}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Printable Itemized Invoice Render Box */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">DRONAGIRI HOSPITAL</h2>
              <p className="text-xs text-slate-500 mt-0.5">Gandhamadana Health Valley • Hospital Administrative Block</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-400">INVOICE #{selectedInvoice.id}</span>
              <div className="text-xs text-slate-500 mt-1">Date: {selectedInvoice.billDate}</div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <div className="text-slate-400 uppercase font-semibold text-[10px]">Billed Patient</div>
              <div className="font-bold text-slate-900 text-sm">{selectedInvoice.patientName}</div>
              <div className="text-slate-500 font-mono">ID: {selectedInvoice.patientId}</div>
            </div>
            <div>
              <div className="text-slate-400 uppercase font-semibold text-[10px]">Payment Status</div>
              <div className="font-bold text-emerald-600 text-sm">{selectedInvoice.paymentStatus}</div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2">Description</th>
                <th className="py-2">Category</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {selectedInvoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 font-semibold text-slate-900">{item.description}</td>
                  <td className="py-2.5 text-slate-500">{item.category}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Breakdown */}
          <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-right">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">₹{selectedInvoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-blue-600 font-medium">
              <span>Insurance Claim Portion:</span>
              <span className="font-mono">-₹{selectedInvoice.insuranceCovered.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-200">
              <span>Patient Co-Pay Payable Total:</span>
              <span className="font-mono">₹{selectedInvoice.coPayAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generate New Invoice Modal */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Generate Hospital Invoice &amp; Co-Pay Claim</h3>
              <button onClick={() => setShowNewInvoiceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const patientName = (formData.get("patientName") as string) || "Koushik";
                const amount = parseFloat(formData.get("amount") as string) || 1200.0;
                const insurancePct = parseFloat(formData.get("insurancePct") as string) || 80.0;

                const insuranceCovered = (amount * insurancePct) / 100;
                const coPayAmount = amount - insuranceCovered;

                const newInvoice: BillingInvoice = {
                  id: `INV-${Math.floor(800 + Math.random() * 90)}`,
                  patientId: `P-${Math.floor(1000 + Math.random() * 900)}`,
                  patientName,
                  billDate: new Date().toISOString().slice(0, 10),
                  items: [
                    { description: "IPD Bed Charge & Ward Room Tariff", category: "Bed Charge", amount: amount * 0.4 },
                    { description: "Physician & Specialist Consultation Fee", category: "Consultation", amount: amount * 0.3 },
                    { description: "Pharmacy Prescriptions & Supplies", category: "Pharmacy", amount: amount * 0.3 },
                  ],
                  subtotal: amount,
                  insuranceCovered,
                  coPayAmount,
                  finalAmount: coPayAmount,
                  paymentStatus: "Pending",
                };

                const updated = [newInvoice, ...invoiceList];
                setInvoiceList(updated);
                if (onUpdateInvoices) onUpdateInvoices(updated);
                setSelectedInvoice(newInvoice);
                setShowNewInvoiceModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Name</label>
                <input required name="patientName" placeholder="e.g. Bhuvan" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Bill Amount (₹)</label>
                  <input type="number" name="amount" defaultValue="1850" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Insurance Coverage (%)</label>
                  <input type="number" name="insurancePct" defaultValue="80" max="100" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm text-blue-600" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowNewInvoiceModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md">
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
