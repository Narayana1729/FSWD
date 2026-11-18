"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  AlertCircle,
  Receipt,
  User,
  Trash2,
} from "lucide-react";
import { BillingInvoice, Patient } from "@/lib/hms-data";

interface BillingInsuranceViewProps {
  invoices: BillingInvoice[];
  onUpdateInvoices?: (invoices: BillingInvoice[]) => void;
  patients?: Patient[];
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hms_auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function BillingInsuranceView({
  invoices,
  onUpdateInvoices,
  patients: initialPatients = [],
}: BillingInsuranceViewProps) {
  const [invoiceList, setInvoiceList] = useState<BillingInvoice[]>(invoices);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(
    invoices[0] || null
  );
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Invoice creation modal state
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Payment recording modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [paymentReference, setPaymentReference] = useState<string>("");

  // New Invoice form state
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [customPatientName, setCustomPatientName] = useState<string>("");
  const [billDate, setBillDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [insurancePct, setInsurancePct] = useState<number>(80);
  const [lineItems, setLineItems] = useState<
    { description: string; category: string; amount: number }[]
  >([
    { description: "IPD Bed Charge & Ward Room Tariff", category: "Bed Charge", amount: 800 },
    { description: "Physician & Specialist Consultation Fee", category: "Consultation", amount: 600 },
    { description: "Pharmacy Prescriptions & Supplies", category: "Pharmacy", amount: 450 },
  ]);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemCat, setNewItemCat] = useState("Procedure");
  const [newItemAmt, setNewItemAmt] = useState("");

  // Fetch invoices from backend
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing", {
        headers: getAuthHeaders(),
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.invoices) && data.invoices.length > 0) {
        const mapped: BillingInvoice[] = data.invoices.map((inv: any) => ({
          id: inv.invoiceNo || inv.id,
          patientId: inv.patient?.mrn || inv.patientId,
          patientName: inv.patient?.name || "Patient",
          billDate: inv.billDate,
          items: (inv.items || []).map((it: any) => ({
            description: it.description,
            category: it.category,
            amount: it.amount,
          })),
          subtotal: inv.subtotal,
          insuranceCovered: inv.insuranceCovered,
          coPayAmount: inv.coPayAmount,
          discount: inv.discount || 0,
          tax: inv.tax || 0,
          finalAmount: inv.finalAmount,
          paymentStatus: inv.paymentStatus,
          payments: inv.payments || [],
        }));
        setInvoiceList(mapped);
        if (onUpdateInvoices) onUpdateInvoices(mapped);
        setSelectedInvoice((prev) => {
          if (!prev) return mapped[0];
          const found = mapped.find((i) => i.id === prev.id);
          return found || mapped[0];
        });
      }
    } catch (err: any) {
      console.warn("Could not fetch invoices from backend:", err.message);
    } finally {
      setLoading(false);
    }
  }, [onUpdateInvoices]);

  // Fetch patients if not provided
  useEffect(() => {
    if (patients.length === 0) {
      fetch("/api/patients", {
        headers: getAuthHeaders(),
        credentials: "same-origin",
      })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.patients) && d.patients.length > 0) {
            setPatients(d.patients);
            if (!selectedPatientId) setSelectedPatientId(d.patients[0].id || d.patients[0].mrn || "");
          }
        })
        .catch(() => {});
    } else if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id || patients[0].mrn || "");
    }
  }, [patients, selectedPatientId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Financial calculations for selected invoice
  const calculateInvoiceFinances = (inv: BillingInvoice | null) => {
    if (!inv) return { totalAmount: 0, amountPaid: 0, remainingBalance: 0 };
    const totalAmount = inv.finalAmount;
    const amountPaid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = Math.max(0, Math.round((totalAmount - amountPaid) * 100) / 100);
    return { totalAmount, amountPaid, remainingBalance };
  };

  const selectedFinances = calculateInvoiceFinances(selectedInvoice);

  // Open Payment Modal
  const handleOpenPaymentModal = () => {
    if (!selectedInvoice) return;
    setPaymentError(null);
    setPaymentSuccess(null);
    setPaymentAmount(selectedFinances.remainingBalance.toFixed(2));
    setPaymentMethod("UPI");
    setPaymentReference("");
    setShowPaymentModal(true);
  };

  // Submit payment to backend
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError("Please enter a valid positive payment amount.");
      return;
    }

    if (amt > selectedFinances.remainingBalance + 0.001) {
      setPaymentError(
        `Payment amount (₹${amt.toFixed(2)}) cannot exceed outstanding balance (₹${selectedFinances.remainingBalance.toFixed(2)}).`
      );
      return;
    }

    setSubmittingPayment(true);
    setPaymentError(null);

    try {
      const res = await fetch(`/api/billing/${selectedInvoice.id}/pay`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "same-origin",
        body: JSON.stringify({
          amount: amt,
          method: paymentMethod,
          reference: paymentReference || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data.error || "Failed to record payment.");
        setSubmittingPayment(false);
        return;
      }

      setPaymentSuccess(
        `Payment of ₹${amt.toFixed(2)} recorded successfully via ${paymentMethod}!`
      );

      // Refresh invoice list and keep current selected
      await fetchInvoices();
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccess(null);
      }, 1200);
    } catch (err: any) {
      setPaymentError(err.message || "Network error while recording payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle invoice generation submission
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      setInvoiceError("Please add at least one line item to the invoice.");
      return;
    }

    const patientRef = selectedPatientId || (patients[0]?.id || "P-1001");
    const subtotal = lineItems.reduce((sum, it) => sum + it.amount, 0);
    const insuranceCovered = (subtotal * insurancePct) / 100;
    const coPayAmount = Math.max(0, subtotal - insuranceCovered);
    const finalAmount = coPayAmount;

    setSubmittingInvoice(true);
    setInvoiceError(null);

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "same-origin",
        body: JSON.stringify({
          patientId: patientRef,
          billDate,
          items: lineItems,
          subtotal,
          insuranceCovered,
          coPayAmount,
          finalAmount,
          paymentStatus: finalAmount === 0 ? "Paid" : "Outstanding",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInvoiceError(data.error || "Failed to generate invoice.");
        setSubmittingInvoice(false);
        return;
      }

      setShowNewInvoiceModal(false);
      await fetchInvoices();
    } catch (err: any) {
      setInvoiceError(err.message || "Network error while creating invoice.");
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleAddLineItem = () => {
    const amt = parseFloat(newItemAmt);
    if (!newItemDesc.trim() || isNaN(amt) || amt <= 0) return;
    setLineItems([
      ...lineItems,
      { description: newItemDesc.trim(), category: newItemCat, amount: amt },
    ]);
    setNewItemDesc("");
    setNewItemAmt("");
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Filter invoices
  const filteredInvoices = invoiceList.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      inv.paymentStatus.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F0EEE8] p-5 rounded-2xl border border-black/10 shadow-sm relative overflow-hidden text-[#111]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/10 shadow-sm bg-white/60 hidden sm:block">
            <img
              src="/images/bill-discharge.png"
              alt="Bill & Discharge"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#111] tracking-tight">
              Billing &amp; Insurance Subsystem
            </h2>
            <p className="text-xs text-black/50">
              Itemized billing calculation, real-time payment recording, co-pay claims, and financial persistence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInvoices()}
            disabled={loading}
            title="Refresh Invoices from Server"
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setInvoiceError(null);
              setShowNewInvoiceModal(true);
            }}
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
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Invoice List Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Hospital Invoices ({filteredInvoices.length})
            </h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Outstanding">Outstanding</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Pending Insurance">Pending Insurance</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Invoice #, Patient Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-slate-400 bg-slate-50/50"
            />
          </div>

          {/* List items */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No invoices found matching criteria.
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const fin = calculateInvoiceFinances(inv);
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all text-xs ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                      <span>{inv.id}</span>
                      <span className="text-[10px] text-slate-400">{inv.billDate}</span>
                    </div>
                    <div className="font-bold text-slate-800 mt-1 flex items-center justify-between">
                      <span>{inv.patientName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{inv.patientId}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          ₹{inv.finalAmount.toFixed(2)}
                        </div>
                        {fin.amountPaid > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Paid: ₹{fin.amountPaid.toFixed(2)}
                            {fin.remainingBalance > 0 && ` (Due: ₹${fin.remainingBalance.toFixed(2)})`}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.paymentStatus === "Partially Paid"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Invoice Details & Action Box */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
          {selectedInvoice ? (
            <>
              {/* Top Banner */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    DRONAGIRI HOSPITAL
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gandhamadana Health Valley • Hospital Administrative Block
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    INVOICE #{selectedInvoice.id}
                  </span>
                  <div className="text-xs text-slate-500 mt-1">
                    Date: {selectedInvoice.billDate}
                  </div>
                </div>
              </div>

              {/* Patient Details & Status */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-slate-400 uppercase font-semibold text-[10px]">
                    Billed Patient
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedInvoice.patientName}
                  </div>
                  <div className="text-slate-500 font-mono">
                    MRN: {selectedInvoice.patientId}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-semibold text-[10px]">
                    Payment Status
                  </div>
                  <div
                    className={`font-bold text-sm ${
                      selectedInvoice.paymentStatus === "Paid"
                        ? "text-emerald-600"
                        : selectedInvoice.paymentStatus === "Partially Paid"
                        ? "text-amber-600"
                        : "text-rose-600"
                    }`}
                  >
                    {selectedInvoice.paymentStatus}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Balance: ₹{selectedFinances.remainingBalance.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Line Items Breakdown
                </h4>
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
                        <td className="py-2.5 font-semibold text-slate-900">
                          {item.description}
                        </td>
                        <td className="py-2.5 text-slate-500">{item.category}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Tariff:</span>
                  <span className="font-mono font-semibold">
                    ₹{selectedInvoice.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-blue-600 font-medium">
                  <span>Insurance Claim Portion:</span>
                  <span className="font-mono">
                    -₹{selectedInvoice.insuranceCovered.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-200">
                  <span>Patient Co-Pay Payable:</span>
                  <span className="font-mono">
                    ₹{selectedInvoice.coPayAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium pt-1">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono font-bold">
                    ₹{selectedFinances.amountPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold text-base pt-1">
                  <span>Outstanding Due Balance:</span>
                  <span className="font-mono">
                    ₹{selectedFinances.remainingBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Records Section */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recorded Payment Transactions ({selectedInvoice.payments.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedInvoice.payments.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold text-slate-800">{p.method}</span>
                          {p.reference && (
                            <span className="text-[10px] font-mono text-slate-400">
                              (Ref: {p.reference})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-700">
                            +₹{p.amount.toFixed(2)}
                          </span>
                          <div className="text-[9px] text-slate-400">
                            {new Date(p.paidAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                {selectedFinances.remainingBalance > 0 ? (
                  <button
                    onClick={handleOpenPaymentModal}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Record Payment (₹{selectedFinances.remainingBalance.toFixed(2)} Due)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Invoice Fully Settled</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select an invoice from the left to view details.
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Invoice #{selectedInvoice.id} • {selectedInvoice.patientName}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={submittingPayment}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Outstanding balance info */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total:</span>
                <span className="font-mono font-bold">₹{selectedInvoice.finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Amount Paid:</span>
                <span className="font-mono font-bold">₹{selectedFinances.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1 text-sm">
                <span>Outstanding Balance:</span>
                <span className="font-mono">₹{selectedFinances.remainingBalance.toFixed(2)}</span>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {paymentSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{paymentSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Payment Amount (₹)</label>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedFinances.remainingBalance.toFixed(2))}
                    className="text-[10px] text-emerald-700 hover:underline font-bold"
                  >
                    Pay Full Due
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedFinances.remainingBalance}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-semibold text-xs bg-white focus:border-emerald-500"
                >
                  <option value="UPI">UPI / Digital Payment</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cash">Cash (Hospital Counter)</option>
                  <option value="Insurance">Insurance Third-Party (TPA)</option>
                  <option value="Bank Transfer">NEFT / RTGS Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Reference / UTR (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UPI-984218721 or Card Auth #7721"
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none text-xs focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submittingPayment}
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingPayment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate New Invoice Modal */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Generate Hospital Invoice &amp; Co-Pay Claim
              </h3>
              <button
                onClick={() => setShowNewInvoiceModal(false)}
                disabled={submittingInvoice}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {invoiceError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{invoiceError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm bg-white"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn || p.id}) - {p.gender}, {p.age} Yrs
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Date</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-semibold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Insurance Coverage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={insurancePct}
                    onChange={(e) => setInsurancePct(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold text-sm text-blue-600"
                  />
                </div>
              </div>

              {/* Line items editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-semibold text-slate-700">Itemized Charges</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex-1">
                        <span className="font-semibold text-slate-800">{item.description}</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-slate-200 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          ₹{item.amount.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new item row */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Description (e.g. Lab Pathology)"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="flex-1 p-2 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                  <select
                    value={newItemCat}
                    onChange={(e) => setNewItemCat(e.target.value)}
                    className="w-28 p-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
                  >
                    <option value="Bed Charge">Bed Charge</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Imaging">Imaging</option>
                  </select>
                  <input
                    type="number"
                    placeholder="₹ Amount"
                    value={newItemAmt}
                    onChange={(e) => setNewItemAmt(e.target.value)}
                    className="w-24 p-2 border border-slate-200 rounded-xl text-xs outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Total calculations */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-right">
                {(() => {
                  const sub = lineItems.reduce((s, it) => s + it.amount, 0);
                  const ins = (sub * insurancePct) / 100;
                  const final = Math.max(0, sub - ins);
                  return (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-mono">₹{sub.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>Insurance Claim ({insurancePct}%):</span>
                        <span className="font-mono">-₹{ins.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-sm">
                        <span>Patient Co-Pay Total:</span>
                        <span className="font-mono">₹{final.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submittingInvoice}
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingInvoice ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Issuing...</span>
                    </>
                  ) : (
                    <span>Issue Invoice</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
