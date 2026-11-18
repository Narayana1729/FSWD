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
  RefreshCw,
  User,
  Heart,
  Activity,
  CreditCard,
  MapPin,
  Mail,
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

export function PatientsView({
  patients,
  onAddPatient,
  onSelectPatientEMR,
  activeRole,
  loggedInUserName,
}: PatientsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showRegisterWizard, setShowRegisterWizard] = useState(false);

  // When logged in as a Doctor, scope to only their patients
  const isDoctor = activeRole === "Doctor" && !!loggedInUserName;
  const getDocStr = (doc: any) => (typeof doc === "object" ? doc?.name : doc) || "";

  const scopedPatients = isDoctor
    ? patients.filter(
        (p) => getDocStr(p.doctor).toLowerCase() === (loggedInUserName || "").toLowerCase()
      )
    : patients;

  // Filtered patients
  const filteredPatients = scopedPatients.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((p as any).mrn || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone || "").includes(searchTerm) ||
      getDocStr(p.doctor).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Wizard state (6 steps)
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardSuccess, setWizardSuccess] = useState<string | null>(null);

  const initialFormData = {
    name: "",
    age: "",
    gender: "Female" as "Female" | "Male" | "Other",
    bloodGroup: "O+",
    phone: "",
    email: "",
    address: "",
    emergencyName: "",
    emergencyRelation: "Spouse",
    emergencyPhone: "",
    medicalHistory: "",
    department: "Integrative Medicine",
    doctor: "Dr. Dhanvantari",
    allergies: "",
    currentConditions: "Clinical Intake",
    insuranceProvider: "Self Pay",
    insurancePolicyNo: "",
    coverageLimit: "250000",
    coPayPct: "10",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Validate current step before proceeding
  const validateStep = (currentStep: number): boolean => {
    setWizardError(null);
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setWizardError("Full patient name is required.");
        return false;
      }
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
        setWizardError("Please enter a valid age between 0 and 130.");
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      if (!formData.phone.trim()) {
        setWizardError("Phone number is required for contact.");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    setSubmitting(true);
    setWizardError(null);
    setWizardSuccess(null);

    const ageNum = parseInt(formData.age, 10) || 30;

    const payload = {
      name: formData.name.trim(),
      age: ageNum,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      status: "OPD Queue",
      department: formData.department,
      doctor: formData.doctor,
      emergencyContact: formData.emergencyName.trim()
        ? {
            name: formData.emergencyName.trim(),
            relation: formData.emergencyRelation.trim() || "Contact",
            phone: formData.emergencyPhone.trim() || formData.phone.trim(),
          }
        : null,
      medicalHistory: formData.medicalHistory.trim()
        ? formData.medicalHistory
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["None reported"],
      allergies: formData.allergies.trim()
        ? formData.allergies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["No known drug allergies"],
      currentConditions: formData.currentConditions.trim()
        ? [formData.currentConditions.trim()]
        : ["New Registration"],
      insurance: formData.insuranceProvider.trim()
        ? {
            provider: formData.insuranceProvider.trim(),
            policyNo: formData.insurancePolicyNo.trim() || "N/A",
            coverageLimit: parseInt(formData.coverageLimit, 10) || 0,
            coPayPct: parseInt(formData.coPayPct, 10) || 10,
          }
        : null,
    };

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setWizardError(data.error || "Failed to create patient on server.");
        setSubmitting(false);
        return;
      }

      const createdPatient = data.patient;
      const formattedPatient: Patient = {
        id: createdPatient.id,
        name: createdPatient.name,
        age: createdPatient.age,
        gender: createdPatient.gender,
        phone: createdPatient.phone,
        email: createdPatient.email || "",
        address: createdPatient.address || "",
        bloodGroup: createdPatient.bloodGroup || "O+",
        status: createdPatient.status || "OPD Queue",
        lastVisit: new Date().toISOString().split("T")[0],
        department: createdPatient.department?.name || formData.department,
        doctor: formData.doctor,
        emergencyContact: createdPatient.emergencyContact || payload.emergencyContact || { name: "", relation: "", phone: "" },
        medicalHistory: createdPatient.medicalHistory || payload.medicalHistory,
        allergies: createdPatient.allergies || payload.allergies,
        currentConditions: createdPatient.currentConditions || payload.currentConditions,
        insurance: createdPatient.insurance || payload.insurance || { provider: "Self Pay", policyNo: "N/A", coverageLimit: 0, coPayPct: 0 },
      };

      setWizardSuccess(
        `Patient successfully registered with Medical Record Number: ${createdPatient.mrn || createdPatient.id}`
      );

      // Notify parent to add patient into state
      onAddPatient(formattedPatient);

      setTimeout(() => {
        setShowRegisterWizard(false);
        setStep(1);
        setFormData(initialFormData);
        setWizardSuccess(null);
      }, 1500);
    } catch (err: any) {
      setWizardError(err.message || "Network error registering patient.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Top Action Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl shadow-sm relative overflow-hidden"
        style={GLASS_CARD_STYLE}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/10 shadow-sm bg-white/60 hidden sm:block">
            <img
              src="/images/register-triage.png"
              alt="Register & Triage"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#111]">
              {isDoctor ? `My Patients — ${loggedInUserName}` : "Patient Directory & Registration"}
            </h2>
            <p className="text-xs text-black/50">
              {isDoctor
                ? `Showing only patients assigned to you (${scopedPatients.length} total)`
                : "Manage patient profiles, admissions, EMR records, and full structured registration"}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setStep(1);
            setWizardError(null);
            setWizardSuccess(null);
            setShowRegisterWizard(true);
          }}
          className="px-4 py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Registration Wizard</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl shadow-sm"
        style={GLASS_CARD_STYLE}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Name, MRN, Phone, Doctor..."
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
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No patient records found.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-indigo-950">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 font-semibold">
                        {(p as any).mrn || p.id}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {p.age} Yrs / {p.gender}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-indigo-950 font-mono">{p.phone}</div>
                      <div className="text-[10px] text-slate-400">{p.email || "—"}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full text-[11px]">
                        <Droplet className="w-3 h-3 fill-rose-600 text-rose-600" />
                        {p.bloodGroup}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-indigo-950">
                        {typeof (p as any).department === "object"
                          ? (p as any).department?.name
                          : p.department || "General Medicine"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {typeof (p as any).doctor === "object"
                          ? (p as any).doctor?.name
                          : (p as any).doctor || "Dr. Dhanvantari"}
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

                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {p.lastVisit || new Date().toISOString().slice(0, 10)}
                    </td>

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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6-Step Registration Wizard Modal */}
      {showRegisterWizard && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-indigo-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Patient Registration Wizard</h3>
                <p className="text-xs text-white/80">
                  Step {step} of 6 — Complete structured patient intake and database persistence
                </p>
              </div>
              <button
                onClick={() => setShowRegisterWizard(false)}
                disabled={submitting}
                className="text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider px-2 py-1 bg-white/20 rounded disabled:opacity-50"
              >
                Close
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="bg-indigo-50/60 border-b border-indigo-100 px-6 py-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
              {["Personal", "Contact", "History", "Allergies", "Insurance", "Review"].map(
                (s, idx) => (
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
                )
              )}
            </div>

            {/* Error or Success notification inside modal */}
            {wizardError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{wizardError}</span>
              </div>
            )}

            {wizardSuccess && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{wizardSuccess}</span>
              </div>
            )}

            {/* Wizard Form Content */}
            <form
              onSubmit={handleRegisterSubmit}
              className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-sans"
            >
              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h4>Step 1: Personal Demographics</h4>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Full Patient Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Srimannarayana Deevi"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-semibold text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Age (Years) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 42"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-semibold text-sm"
                        required
                        min="0"
                        max="130"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Gender <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value as any })
                        }
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-semibold text-xs"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Blood Group</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-bold text-xs text-rose-700"
                      >
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Contact Details & Emergency Contacts */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    <h4>Step 2: Contact Information &amp; Emergency Kin</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98480 22334"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-mono text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="patient@dronagiri.health"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Residential Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Gandhamadana Heights, Health Enclave"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white text-xs"
                    />
                  </div>

                  <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                    <div className="font-semibold text-indigo-900 text-xs">
                      Emergency Contact Details
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-medium mb-1">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          placeholder="Kin Name"
                          value={formData.emergencyName}
                          onChange={(e) =>
                            setFormData({ ...formData, emergencyName: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-medium mb-1">
                          Relationship
                        </label>
                        <input
                          type="text"
                          placeholder="Spouse / Parent"
                          value={formData.emergencyRelation}
                          onChange={(e) =>
                            setFormData({ ...formData, emergencyRelation: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-medium mb-1">
                          Emergency Phone
                        </label>
                        <input
                          type="tel"
                          placeholder="+91 98480..."
                          value={formData.emergencyPhone}
                          onChange={(e) =>
                            setFormData({ ...formData, emergencyPhone: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none text-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Medical History & Department */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <h4>Step 3: Clinical Background &amp; Department Intake</h4>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Past Medical History &amp; Chronic Conditions (comma-separated)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Type 2 Diabetes, Hypertension, Appendectomy (2022)"
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                      className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Assigned Clinical Department
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-semibold text-xs"
                      >
                        <option value="Integrative Medicine">Integrative Medicine</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="General Surgery">General Surgery</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Oncology">Oncology</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Attending Physician
                      </label>
                      <select
                        value={formData.doctor}
                        onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-semibold text-xs"
                      >
                        <option value="Dr. Dhanvantari">Dr. Dhanvantari (Cardiology)</option>
                        <option value="Dr. Charaka">Dr. Charaka (Internal Medicine)</option>
                        <option value="Dr. Sushruta">Dr. Sushruta (General Surgery)</option>
                        <option value="Dr. Jivaka">Dr. Jivaka (Radiology &amp; Neuro)</option>
                        <option value="Dr. Ashwini Kumaras">Dr. Ashwini Kumaras (Emergency)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Allergies & Alerts */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                    <Shield className="w-4 h-4 text-rose-600" />
                    <h4>Step 4: Clinical Alerts &amp; Drug Allergies</h4>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    Please document any known drug allergies, adverse reactions to food or latex, to safeguard inpatient medication dispensation.
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Known Drug &amp; Environmental Allergies (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Penicillin, Sulfa drugs, Peanuts, Latex"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white text-xs font-semibold text-rose-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Presenting Complaints &amp; Current Symptoms
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acute chest discomfort, Shortness of breath, Fever"
                      value={formData.currentConditions}
                      onChange={(e) =>
                        setFormData({ ...formData, currentConditions: e.target.value })
                      }
                      className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: Insurance & Coverage */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <h4>Step 5: Health Insurance &amp; Third-Party Payer</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Insurance Provider
                      </label>
                      <select
                        value={formData.insuranceProvider}
                        onChange={(e) =>
                          setFormData({ ...formData, insuranceProvider: e.target.value })
                        }
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-semibold text-xs"
                      >
                        <option value="Self Pay">Self Pay / Private Cash</option>
                        <option value="Star Health">Star Health Allied Insurance</option>
                        <option value="HDFC ERGO">HDFC ERGO General Insurance</option>
                        <option value="ICICI Lombard">ICICI Lombard Health Care</option>
                        <option value="Ayushman Bharat">Ayushman Bharat PM-JAY</option>
                        <option value="Max Bupa">Niva Bupa Health Insurance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Policy / Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="POL-8842100"
                        value={formData.insurancePolicyNo}
                        onChange={(e) =>
                          setFormData({ ...formData, insurancePolicyNo: e.target.value })
                        }
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Coverage Limit (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.coverageLimit}
                        onChange={(e) =>
                          setFormData({ ...formData, coverageLimit: e.target.value })
                        }
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-bold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Patient Co-Pay (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.coPayPct}
                        onChange={(e) => setFormData({ ...formData, coPayPct: e.target.value })}
                        className="w-full p-2.5 border border-indigo-100 rounded-xl outline-none focus:border-indigo-400 bg-white font-bold text-xs text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Review & Final Confirmation */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h4>Step 6: Review Registration &amp; Confirm Persistence</h4>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                      <div>
                        <div className="text-base font-bold text-slate-900">{formData.name}</div>
                        <div className="text-slate-500 text-xs">
                          {formData.age} Yrs • {formData.gender} • Blood Group:{" "}
                          <span className="font-bold text-rose-700">{formData.bloodGroup}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        OPD Queue
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px]">
                          Contact Phone &amp; Email
                        </span>
                        <div className="font-mono text-slate-800">{formData.phone}</div>
                        <div className="text-slate-500">{formData.email || "—"}</div>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px]">
                          Department &amp; Doctor
                        </span>
                        <div className="font-bold text-slate-800">{formData.department}</div>
                        <div className="text-slate-500">{formData.doctor}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px]">
                          Emergency Contact Kin
                        </span>
                        <div className="font-medium text-slate-800">
                          {formData.emergencyName || "None"} ({formData.emergencyRelation})
                        </div>
                        <div className="font-mono text-slate-500 text-[10px]">
                          {formData.emergencyPhone || formData.phone}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px]">
                          Insurance Payer Policy
                        </span>
                        <div className="font-medium text-slate-800">
                          {formData.insuranceProvider}
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          Policy: {formData.insurancePolicyNo || "N/A"} • Co-Pay {formData.coPayPct}%
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <span className="text-slate-400 block font-semibold text-[10px]">
                        Documented Allergies
                      </span>
                      <div className="font-semibold text-rose-700">
                        {formData.allergies || "None reported"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Bottom Nav Buttons */}
              <div className="pt-4 border-t border-indigo-100 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setStep((s) => s - 1)}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Persisting to Database...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm &amp; Register Patient</span>
                      </>
                    )}
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
