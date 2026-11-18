"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Hospital,
  ShieldCheck,
  Stethoscope,
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  Truck,
  Activity,
  UserCheck,
  Sparkles,
  KeyRound,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

interface AuthSwitchProps {
  onLoginSuccess?: (role: string, userName: string) => void;
  onClose?: () => void;
}

const LANDING_GLASS_PANEL = {
  backdropFilter: "blur(32px)",
  WebkitBackdropFilter: "blur(32px)",
  background: "rgba(255, 255, 255, 0.35)",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
} as const;

const GLASS_INPUT_STYLE = {
  background: "rgba(255, 255, 255, 0.55)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(0, 0, 0, 0.09)",
  boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.02)",
} as const;

export default function AuthSwitch({ onLoginSuccess, onClose }: AuthSwitchProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState("Doctor");
  const [email, setEmail] = useState("dr.dhanvantari@dronagiri.health");
  const [password, setPassword] = useState("••••••••••••");
  const [name, setName] = useState("Dr. Dhanvantari");
  const [department, setDepartment] = useState("Cardiology & Integrative Medicine");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    {
      id: "Doctor",
      label: "Doctor",
      email: "dr.dhanvantari@dronagiri.health",
      name: "Dr. Dhanvantari",
      dept: "Cardiology",
    },
    {
      id: "Nurse",
      label: "Nurse",
      email: "nurse.ananya@dronagiri.health",
      name: "Nurse Ananya Sharma",
      dept: "Smart ICU Ring",
    },
    {
      id: "Ambulance Driver",
      label: "Ambulance",
      email: "driver.maruti@dronagiri.health",
      name: "Driver Maruti Rescue",
      dept: "Emergency Fleet",
    },
    {
      id: "Patient",
      label: "Patient",
      email: "srimannarayana@dronagiri.health",
      name: "Srimannarayana",
      dept: "Care Portal",
    },
    {
      id: "Super Admin",
      label: "Admin",
      email: "admin@dronagiri.health",
      name: "Super Admin",
      dept: "Executive Command",
    },
  ];

  const handleSelectRole = (r: typeof roles[0]) => {
    setSelectedRole(r.id);
    setEmail(r.email);
    setName(r.name);
    setDepartment(r.dept);
    setAuthError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const loginPassword = password === "••••••••••••" ? "Password123!" : password;
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("hms_auth_token", data.token);
        localStorage.setItem("hms_auth_user", JSON.stringify(data.user));
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.user.role || selectedRole, data.user.name || name);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setAuthError(err.message || "Failed to sign in. Please check credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div
      className="min-h-screen bg-[#F5F4F0] text-[#111] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative overflow-hidden select-none font-sans"
      style={{ fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      {/* ── BACKGROUND ARTWORK & IRIDESCENT LIGHTING ─────────────────────── */}
      <img
        src="/images/arc.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 mix-blend-multiply"
        style={{ objectPosition: "center 85%" }}
      />

      {/* Atmospheric iridescent glow spots */}
      <div
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, rgba(220, 210, 255, 0.4), transparent 70%)" }}
      />
      <div
        className="absolute bottom-10 left-10 w-80 h-80 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, rgba(200, 240, 220, 0.4), transparent 70%)" }}
      />

      {/* ── TOP HEADER ────────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-6xl mx-auto">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-[#111] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
            <Hospital className="w-4 h-4" />
          </div>
          <div>
            <span className="font-pixel text-xs tracking-[0.25em] text-[#111] font-bold block">
              DRONAGIRI OS
            </span>
            <span className="text-[10px] text-black/45 font-mono tracking-tight">
              HOSPITAL MANAGEMENT SYSTEM
            </span>
          </div>
        </a>

        <div className="flex items-center gap-3">
          {onClose ? (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-black/50 hover:text-[#111] hover:bg-black/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <a
              href="/"
              className="text-xs text-black/50 hover:text-[#111] transition-colors tracking-wide hidden sm:inline"
            >
              ← Back to Overview
            </a>
          )}
        </div>
      </header>

      {/* ── EDITORIAL CENTER CONTENT & GLASS LOGIN PANEL ─────────────────── */}
      <main className="relative z-20 w-full max-w-6xl mx-auto my-auto py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Side — Editorial Typography & Metrics */}
        <div className="lg:col-span-6 space-y-8 text-left hidden lg:block">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-pixel text-black/40 bg-black/[0.04] mb-4 uppercase">
              SECURE CLINICAL WORKSPACE
            </span>
            <h1 className="text-5xl xl:text-6xl font-light text-[#111] leading-[1.06] tracking-tight">
              Enterprise<br />hospital operating<br />system.
            </h1>
          </div>

          <p className="text-sm text-black/50 leading-relaxed max-w-md">
            One connected care operating system. Real-time patient signals, smart ICU bed ring telemetry, ambulance field dispatch, and clinical intelligence.
          </p>

          <div className="flex gap-8 pt-4 border-t border-black/[0.08]">
            <div>
              <div className="text-2xl font-light text-[#111]">2.5M+</div>
              <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">Patients Served</div>
            </div>
            <div>
              <div className="text-2xl font-light text-[#111]">99.99%</div>
              <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">Clinical Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-light text-[#111]">15 Modules</div>
              <div className="text-[10px] text-black/40 tracking-widest uppercase font-pixel mt-0.5">Connected Core</div>
            </div>
          </div>
        </div>

        {/* Right Side — Translucent Glass Login Card */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto">
          <div
            className="rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all"
            style={LANDING_GLASS_PANEL}
          >
            {/* Form Header */}
            <div className="space-y-1.5 mb-6">
              <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase block">
                {mode === "login" ? "WELCOME BACK" : "STAFF ONBOARDING"}
              </span>
              <h2 className="text-2xl font-light tracking-tight text-[#111]">
                {mode === "login" ? "Sign in to your hospital workspace." : "Create your clinical credential."}
              </h2>
            </div>

            {/* Subtle Glass Role Selector Pills */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-pixel text-black/45 tracking-wider uppercase">
                  Select Role Workspace:
                </span>
                <span className="text-[10px] text-black/40">Demo Quick-Select</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                      selectedRole === r.id
                        ? "bg-[#111] text-white shadow-xs"
                        : "bg-white/60 hover:bg-white text-black/60 border border-black/5"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-black/60">Full Name &amp; Title</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Sushruta"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs text-[#111] placeholder:text-black/30 outline-none focus:border-black/30 transition-colors"
                    style={GLASS_INPUT_STYLE}
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-black/60">Email / Employee ID</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@dronagiri.health"
                    className="w-full pl-3.5 pr-3.5 py-2.5 rounded-xl text-xs text-[#111] placeholder:text-black/30 outline-none focus:border-black/30 transition-colors font-mono"
                    style={GLASS_INPUT_STYLE}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-black/60">Password</label>
                  {mode === "login" && (
                    <a href="#" className="text-[11px] text-black/40 hover:text-black/70 transition-colors">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs text-[#111] placeholder:text-black/30 outline-none focus:border-black/30 transition-colors font-mono"
                    style={GLASS_INPUT_STYLE}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-black/40 hover:text-black/70"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-black/60">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-black/20 text-[#111] focus:ring-black w-3.5 h-3.5"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {authError}
                </div>
              )}

              {/* Primary CTA Matching Landing Page Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#111] hover:bg-[#333] active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 mt-3"
              >
                <span>{isSubmitting ? "AUTHENTICATING..." : "SIGN IN →"}</span>
              </button>


              {/* Sign In / Register Mode Switch */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-xs text-black/50 hover:text-[#111] transition-colors"
                >
                  {mode === "login" ? "New clinical staff? Register profile" : "Already registered? Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ── FOOTER METADATA ──────────────────────────────────────────────── */}
      <footer className="relative z-20 w-full max-w-6xl mx-auto flex items-center justify-between text-[11px] text-black/40 pt-6 border-t border-black/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-pixel uppercase tracking-wider">SECURE CLINICAL ACCESS</span>
        </div>
        <span>HIPAA &amp; NABH Verified • 256-bit AES Encryption</span>
      </footer>
    </div>
  );
}
