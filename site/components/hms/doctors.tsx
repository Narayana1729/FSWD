"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Stethoscope,
  Calendar,
  Clock,
  Phone,
  Mail,
  UserCheck,
  Building,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Sparkles,
  Award,
} from "lucide-react";
import { Doctor } from "@/lib/hms-data";

interface DoctorsViewProps {
  doctors: Doctor[];
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

export function DoctorsView({ doctors }: DoctorsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const filteredDoctors = doctors.filter((d) => {
    const deptStr = typeof (d as any).department === "object" ? (d as any).department?.name || "" : d.department || "";
    const matchesSearch =
      (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.specialization || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      deptStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "All" || deptStr === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8 text-[#111]">
      {/* Hero Banner */}
      <div className="rounded-3xl p-8 lg:p-10 relative overflow-hidden" style={GLASS_BANNER}>
        <div className="space-y-3 max-w-2xl text-left">
          <Tag>CLINICAL FACULTY &amp; MASTER HEALERS</Tag>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#111] leading-[1.08] tracking-tight"
            style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
          >
            Dronagiri Medical Faculty<br />&amp; Master Physicians.
          </h1>
          <p className="text-sm text-black/50 font-light leading-relaxed">
            Pioneering physicians and master surgeons leading integrative medicine, reconstructive surgery, emergency resuscitation, and neuro-diagnostics.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <SpotlightCard className="p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-black/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Physician, Specialty, Dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-black/10 rounded-xl outline-none focus:border-black/30 bg-white/80"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-black/40" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs font-semibold text-[#111] bg-white border border-black/10 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="All">All Departments</option>
            <option value="Integrative Medicine & Cardiology">Integrative Medicine</option>
            <option value="Emergency & Critical Care">Emergency & Critical Care</option>
            <option value="Surgical Sciences & Orthopedics">Surgical Sciences</option>
            <option value="Internal Medicine & Pathology">Internal Medicine</option>
            <option value="Neurology & Diagnostics">Neurology</option>
            <option value="Pharmacology & Emergency Critical Care">Pharmacology</option>
            <option value="Pediatrics & Obstetrics">Pediatrics & Obstetrics</option>
          </select>
        </div>
      </SpotlightCard>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <SpotlightCard key={doc.id} className="p-6 rounded-3xl space-y-4">
            <div className="flex items-start gap-4">
              <img
                src={doc.avatar}
                alt={doc.name}
                className="w-14 h-14 rounded-2xl object-cover border border-black/10 shrink-0 shadow-sm"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-[#111] truncate">{doc.name}</h3>
                  {doc.name.includes("Dhanvantari") && (
                    <span className="font-pixel text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold uppercase">
                      CHIEF
                    </span>
                  )}
                  {doc.name.includes("Ashwini") && (
                    <span className="font-pixel text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold uppercase">
                      DUAL
                    </span>
                  )}
                  {doc.name.includes("Sushruta") && (
                    <span className="font-pixel text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-bold uppercase">
                      SURGERY
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-black/70 mt-0.5 leading-snug">{doc.specialization}</p>
                <div className="text-[11px] text-black/40 mt-1 flex items-center gap-1 font-medium">
                  <Building className="w-3 h-3 text-black/40" /> {typeof (doc as any).department === "object" ? (doc as any).department?.name : doc.department || "Cardiology"} • {doc.experienceYears} Yrs Exp
                </div>
              </div>
            </div>

            {/* Status Ribbon */}
            <div className="flex items-center justify-between pt-3 border-t border-black/10 text-xs">
              <span className="text-black/50 font-medium">Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-pixel ${
                  doc.availability === "Available"
                    ? "bg-emerald-100/80 text-emerald-800"
                    : doc.availability === "In Consultation"
                    ? "bg-black/10 text-[#111]"
                    : doc.availability === "In Surgery"
                    ? "bg-purple-100/80 text-purple-900"
                    : "bg-amber-100/80 text-amber-900"
                }`}
              >
                {doc.availability}
              </span>
            </div>

            {/* Stats Box */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs bg-white/80 p-3 rounded-xl border border-black/10">
              <div>
                <div className="text-base font-bold text-[#111]">{doc.todayAppointmentsCount}</div>
                <div className="text-[10px] text-black/40 font-medium">Today's Appts</div>
              </div>
              <div>
                <div className="text-base font-bold text-[#111]">{doc.currentPatientsCount}</div>
                <div className="text-[10px] text-black/40 font-medium">Active Patients</div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs text-black/60 font-medium pt-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-black/40" />
                <span>Shift: {doc.shift}</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-black/40" />
                <span>Location: {doc.roomNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-black/40" />
                <span className="font-mono">{doc.phone}</span>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
