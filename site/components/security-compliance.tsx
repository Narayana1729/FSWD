"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  Key,
  FileCheck,
  CheckCircle2,
  XCircle,
  Search,
  ShieldAlert,
} from "lucide-react";
import { AuditLogEntry } from "@/lib/hms-data";

interface SecurityComplianceViewProps {
  auditLogs: AuditLogEntry[];
}

export function SecurityComplianceView({ auditLogs }: SecurityComplianceViewProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(auditLogs);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter(
    (l) =>
      l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight">Security, Role-Based Access Control (RBAC) &amp; Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-300">256-bit AES patient record encryption, HIPAA compliance rules, role permissions, and immutable event logs</p>
        </div>
      </div>

      {/* RBAC Matrix Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Hospital Role-Based Access Control (RBAC) Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Role Title</th>
                <th className="py-2.5 px-3 text-center">Patient EMR</th>
                <th className="py-2.5 px-3 text-center">OPD Consult</th>
                <th className="py-2.5 px-3 text-center">Bed Allocation</th>
                <th className="py-2.5 px-3 text-center">Lab / Radiology</th>
                <th className="py-2.5 px-3 text-center">Pharmacy Rx</th>
                <th className="py-2.5 px-3 text-center">Billing Invoices</th>
                <th className="py-2.5 px-3 text-center">Audit Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[
                { role: "Super Admin", emr: "Full", opd: "Full", bed: "Full", lab: "Full", rx: "Full", bill: "Full", audit: "Full" },
                { role: "Doctor", emr: "Write", opd: "Full", bed: "Read", lab: "Order", rx: "Write", bill: "Read", audit: "Read" },
                { role: "Nurse", emr: "Read", opd: "Read", bed: "Write", lab: "Read", rx: "Read", bill: "None", audit: "Read" },
                { role: "Lab Tech", emr: "Read", opd: "None", bed: "None", lab: "Write", rx: "None", bill: "None", audit: "Read" },
                { role: "Pharmacist", emr: "Read", opd: "None", bed: "None", lab: "None", rx: "Dispense", bill: "Read", audit: "Read" },
                { role: "Billing Staff", emr: "Read", opd: "None", bed: "Read", lab: "Read", rx: "Read", bill: "Full", audit: "Read" },
              ].map((r) => (
                <tr key={r.role}>
                  <td className="py-3 px-3 font-bold text-slate-900">{r.role}</td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{r.emr}</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{r.opd}</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{r.bed}</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{r.lab}</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{r.rx}</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{r.bill}</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{r.audit}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Trail Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Immutable System Audit Trail</h3>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Log User, Action, Resource..."
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
                <th className="py-3.5 px-4">Log ID &amp; Timestamp</th>
                <th className="py-3.5 px-4">User &amp; Role</th>
                <th className="py-3.5 px-4">Action Performed</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 font-mono">{log.id}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.timestamp}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{log.user}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{log.role}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-blue-700 font-mono">{log.action}</td>
                  <td className="py-3.5 px-4 text-slate-700">{log.resource}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{log.ip}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 uppercase">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
