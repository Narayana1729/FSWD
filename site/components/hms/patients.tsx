"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  UserCheck,
  Phone,
  Droplet,
  ChevronRight,
  CheckCircle,
  FileText,
  Shield,
  AlertCircle,
  ArrowRight,
  Check,
  Calendar,
} from "lucide-react";
import { Patient, PatientStatus } from "@/lib/hms-data";

interface PatientsViewProps {
  patients: Patient[];
  onAddPatient: (newPatient: Patient) => void;
  onSelectPatientEMR: (patientId: string) => void;
  activeRole?: string;
  loggedInUserName?: string;
}

const GLASS_CARD_STYLE = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.80), rgba(245, 242, 255, 0.65))",
  boxShadow: "0 10px 30px rgba(120, 110, 180, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
  border: "1px solid rgba(215, 205, 245, 0.6)",
} as const;

export function PatientsView({ patients, onAddPatient, onSelectPatientEMR, activeRole, loggedInUserName }: PatientsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showRegisterWizard, setShowRegisterWizard] = useState(false);

  // When logged in as a Doctor, scope to only their patients
  const isDoctor = activeRole === "Doctor" && !!loggedInUserName;
  const getDocStr = (doc: any) => (typeof doc === "object" ? doc?.name : doc) || "";

  const scopedPatients = isDoctor
    ? patients.filter((p) => getDocStr(p.doctor).toLowerCase() === (loggedInUserName || "").toLowerCase())
    : patients;

  // Filtered patients
  const filteredPatients = scopedPatients.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone || "").includes(searchTerm) ||
      getDocStr(p.doctor).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Wizard state (6 steps)
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Female" as "Female" | "Male" | "Other",
    phone: "",
    email: "",
    address: "",
    bloodGroup: "O+",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    medicalHistory: "",
    allergies: "",
    insuranceProvider: "",
    insurancePolicyNo: "",
    coverageLimit: "50000",
    department: "Integrative Medicine",
    doctor: "Dr. Dhanvantari",
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newP: Patient = {
      id: `P-${1000 + patients.length + 1}`,
      name: formData.name || "Aarav Sharma",
      age: parseInt(formData.age) || 35,
      gender: formData.gender,
      phone: formData.phone || "+91 98480 00000",
      email: formData.email || "aarav.sharma@dronagiri.health",
      address: formData.address || "Dronagiri Healthcare Enclave",
      bloodGroup: formData.bloodGroup,
      emergencyContact: {
        name: formData.emergencyName || "Ananya Sharma",
        relation: formData.emergencyRelation || "Spouse",
        phone: formData.emergencyPhone || "+91 98480 00001",
      },
      medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(",") : ["None reported"],
      allergies: formData.allergies ? formData.allergies.split(",") : ["None"],
      currentConditions: ["New Registration"],
      insurance: {
        provider: formData.insuranceProvider || "Self Pay",
        policyNo: formData.insurancePolicyNo || "N/A",
        coverageLimit: parseInt(formData.coverageLimit) || 0,
        coPayPct: 10,
      },
      department: formData.department,
      doctor: formData.doctor,
      status: "OPD Queue",
      lastVisit: new Date().toISOString().split("T")[0],
    };

    onAddPatient(newP);
    setShowRegisterWizard(false);
    setStep(1);
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl shadow-sm relative overflow-hidden" style={GLASS_CARD_STYLE}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/10 shadow-sm bg-white/60 hidden sm:block">
            <img src="/images/register-triage.png" alt="Register & Triage" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#111]">
              {isDoctor ? `My Patients — ${loggedInUserName}` : "Patient Directory & Registration"}
            </h2>
            <p className="text-xs text-black/50">
              {isDoctor
                ? `Showing only patients assigned to you (${scopedPatients.length} total)`
                : "Manage patient profiles, admissions, EMR records, and registration wizards"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowRegisterWizard(true)}
          className="px-4 py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Registration Wizard</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl shadow-sm" style={GLASS_CARD_STYLE}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Name, Patient ID, Phone, Doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-indigo-100/80 rounded-xl outline-none focus:border-indigo-400 bg-white/80"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-purple-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-indigo-950 bg-white/80 border border-indigo-100/80 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="All">All Statuses ({scopedPatients.length})</option>
            <option value="Admitted">Admitted</option>
            <option value="OPD Queue">OPD Queue</option>
            <option value="Emergency">Emergency</option>
            <option value="Discharged">Discharged</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl shadow-sm overflow-hidden" style={GLASS_CARD_STYLE}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-indigo-50/50 border-b border-indigo-100/60 text-[10px] font-pixel text-indigo-900/60 uppercase tracking-widest">
                <th className="py-3.5 px-4">Patient ID &amp; Name</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Phone / Email</th>
                <th className="py-3.5 px-4">Blood Group</th>
                <th className="py-3.5 px-4">Department &amp; Doctor</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Visit</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50/60 text-xs">
              {filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-white/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-indigo-950">{p.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 font-semibold">{p.id}</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {p.age} Yrs / {p.gender}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-indigo-950 font-mono">{p.phone}</div>
                    <div className="text-[10px] text-slate-400">{p.email}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full text-[11px]">
                      <Droplet className="w-3 h-3 fill-rose-600 text-rose-600" />
                      {p.bloodGroup}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-indigo-950">
                      {typeof (p as any).department === "object" ? (p as any).department?.name : p.department || "Cardiology"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {typeof (p as any).doctor === "object" ? (p as any).doctor?.name : (p as any).doctor || "Dr. Ashwini Kumaras"}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        p.status === "Admitted"
                          ? "bg-indigo-100 text-indigo-800"
                          : p.status === "Emergency"
                          ? "bg-rose-100 text-rose-800"
                          : p.status === "OPD Queue"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 font-mono">{p.lastVisit}</td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectPatientEMR(p.id)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-xs inline-flex items-center gap-1"
                    >
                      <span>View EMR 360</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6-Step Registration Wizard Modal */}
      {showRegisterWizard && (
        <div className="fixed inset-0 bg-indigo-950/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 rounded-3xl border border-indigo-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Patient Registration Wizard</h3>
                <p className="text-xs text-white/80">Step {step} of 6 — Complete structured patient intake</p>
              </div>
              <button
                onClick={() => setShowRegisterWizard(false)}
                className="text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider px-2 py-1 bg-white/20 rounded"
              >
                Close
              </button>
            </div>

            <div className="bg-indigo-50/50 border-b border-indigo-100 px-6 py-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
              {["Personal", "Contact", "History", "Allergies", "Insurance", "Review"].map((s, idx) => (
                <div
                  key={s}
                  className={`flex items-center gap-1.5 ${
                    step === idx + 1
                      ? "text-indigo-950 font-extrabold"
                      : step > idx + 1
                      ? "text-emerald-700 font-bold"
                      : "text-slate-300"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      step === idx + 1
                        ? "bg-indigo-600 text-white"
                        : step > idx + 1
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-100 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {step === 1 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-indigo-950 text-sm">Step 1: Personal Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Full Patient Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Srimannarayana"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Age (Years)</label>
                      <input
                        type="number"
                        placeholder="e.g. 42"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-indigo-100 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-950 font-semibold rounded-xl text-xs"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Confirm &amp; Register Patient
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
