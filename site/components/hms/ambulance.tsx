"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Phone,
  Fuel,
  MapPin,
  Clock,
  Plus,
  AlertOctagon,
  CheckCircle,
  Navigation,
  Radio,
  ArrowUpRight,
  Zap,
  Activity,
  Shield,
  Send,
  Sparkles,
  X,
  AlertTriangle,
} from "lucide-react";
import { AmbulanceItem } from "@/lib/hms-data";

interface AmbulanceViewProps {
  fleet: AmbulanceItem[];
  onEmergencyDispatch?: (ambId: string, details: any) => void;
  onUpdateFleet?: (fleet: AmbulanceItem[]) => void;
}

const GLASS_CARD = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(255, 255, 255, 0.50)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
} as const;

const GLASS_BANNER = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(255, 255, 255, 0.75)",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
  border: "1px solid rgba(0, 0, 0, 0.10)",
} as const;

export function AmbulanceView({ fleet, onEmergencyDispatch, onUpdateFleet }: AmbulanceViewProps) {
  const [fleetList, setFleetList] = useState<AmbulanceItem[]>(fleet);
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceItem>(fleet[0]);
  const [driverDutyStatus, setDriverDutyStatus] = useState<"READY" | "DISPATCHED" | "EN_ROUTE" | "INGRESS">("DISPATCHED");
  const [etaMinutes, setEtaMinutes] = useState(6);
  const [currentSpeedKmph, setCurrentSpeedKmph] = useState(68);
  const [ambSuccess, setAmbSuccess] = useState<string | null>(null);
  const [ambError, setAmbError] = useState<string | null>(null);

  useEffect(() => {
    setFleetList(fleet);
  }, [fleet]);

  // Live GPS simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (driverDutyStatus === "DISPATCHED" || driverDutyStatus === "EN_ROUTE") {
        setEtaMinutes((prev) => (prev > 1 ? prev - 1 : 6));
        setCurrentSpeedKmph(60 + Math.floor(Math.random() * 20));
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [driverDutyStatus]);

  const handleToggleDuty = async (status: "READY" | "DISPATCHED" | "EN_ROUTE" | "INGRESS") => {
    setDriverDutyStatus(status);
    setAmbError(null);
    setAmbSuccess(null);

    const availability = status === "READY" ? "Available" : "On Dispatch";

    // Update local state
    const updated = fleetList.map((a) => {
      if (a.id === selectedAmbulance.id) {
        return {
          ...a,
          availability: status === "READY" ? ("Available" as const) : ("On Dispatch" as const),
        };
      }
      return a;
    });
    setFleetList(updated);
    if (onUpdateFleet) onUpdateFleet(updated);

    // Persist to API
    try {
      const res = await fetch("/api/ambulances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambulanceId: selectedAmbulance.id,
          availability,
          pickupAddress: status !== "READY" ? "Emergency Scene" : undefined,
          destination: status !== "READY" ? "Dronagiri Emergency Bay 1" : undefined,
          etaMins: status !== "READY" ? etaMinutes : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAmbError(json.error || "Failed to update ambulance status");
        return;
      }
      setAmbSuccess(json.message || `${selectedAmbulance.vehicleNo} status updated.`);
    } catch (e: any) {
      setAmbError(e.message || "Network error");
    }
  };

  return (
    <div className="space-y-6 text-[#111]">
      {/* 03. AMBULANCE NETWORK BANNER */}
      <div className="rounded-3xl p-6 md:p-8 relative overflow-hidden" style={GLASS_BANNER}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl text-left">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] tracking-widest text-black/40 uppercase">
                LAYER 03: FIELD SIGNALS
              </span>
              <span className="font-pixel text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold uppercase">
                LIVE GPS TELEMETRY
              </span>
            </div>
            <h1
              className="text-2xl lg:text-3xl font-light tracking-tight text-[#111]"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              Ambulance Network &amp; Field Emergency Dispatch
            </h1>
            <p className="text-xs text-black/60 leading-relaxed font-sans">
              Real-time driver command, live GPS breadcrumb tracking, dynamic ETA computation, and direct Ashwini Trauma Bay ingress routing.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/80 rounded-2xl border border-black/10 text-center min-w-[100px]">
              <span className="text-[10px] font-pixel text-black/40 uppercase block">Active Fleet</span>
              <span className="text-xl font-bold text-[#111]">{fleetList.length} Units</span>
            </div>
            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-300 text-center min-w-[100px]">
              <span className="text-[10px] font-pixel text-emerald-800 uppercase block">Ready on Duty</span>
              <span className="text-xl font-bold text-emerald-900">
                {fleetList.filter((a) => a.availability === "Available").length} Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      {ambSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{ambSuccess}</span>
          </div>
          <button onClick={() => setAmbSuccess(null)}><X className="w-4 h-4 text-emerald-400" /></button>
        </div>
      )}
      {ambError && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{ambError}</span>
          </div>
          <button onClick={() => setAmbError(null)}><X className="w-4 h-4 text-rose-400" /></button>
        </div>
      )}

      {/* DRIVER COMMAND & LIVE TELEMETRY CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Driver Duty & Unit Profile */}
        <div className="lg:col-span-5 p-6 rounded-3xl border border-black/10 shadow-sm space-y-4" style={GLASS_CARD}>
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div>
              <span className="font-pixel text-[10px] text-black/40 uppercase tracking-widest block mb-0.5">
                DRIVER TELEMETRY CONSOLE
              </span>
              <h3 className="text-lg font-bold text-[#111]">{selectedAmbulance.vehicleNo}</h3>
            </div>
            <span className={`font-pixel text-[9px] px-2.5 py-1 rounded-full font-bold uppercase ${
              driverDutyStatus === "READY"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white animate-pulse"
            }`}>
              {driverDutyStatus === "READY" ? "READY FOR DUTY" : "TRANSIT DISPATCH ACTIVE"}
            </span>
          </div>

          {/* Unit Details */}
          <div className="p-4 rounded-2xl bg-white/80 border border-black/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-black/50">Assigned Driver:</span>
              <span className="font-bold text-[#111]">{selectedAmbulance.driverName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/50">Emergency Contact:</span>
              <span className="font-mono text-[#111]">{selectedAmbulance.driverPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/50">Life Support Class:</span>
              <span className="font-bold text-emerald-800">{selectedAmbulance.equipmentType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/50">Current Base:</span>
              <span className="text-[#111]">{selectedAmbulance.location}</span>
            </div>
          </div>

          {/* Duty Mode Controls */}
          <div>
            <span className="text-[10px] font-pixel text-black/40 uppercase block mb-2">Driver Status Control</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleToggleDuty("READY")}
                className={`p-2.5 rounded-xl font-bold text-center transition-all ${
                  driverDutyStatus === "READY"
                    ? "bg-[#111] text-white shadow-md"
                    : "bg-white/80 hover:bg-white border border-black/10 text-black/70"
                }`}
              >
                🟢 Ready for Duty
              </button>
              <button
                onClick={() => handleToggleDuty("DISPATCHED")}
                className={`p-2.5 rounded-xl font-bold text-center transition-all ${
                  driverDutyStatus === "DISPATCHED"
                    ? "bg-rose-700 text-white shadow-md"
                    : "bg-white/80 hover:bg-white border border-black/10 text-black/70"
                }`}
              >
                🚨 En Route to Scene
              </button>
              <button
                onClick={() => handleToggleDuty("EN_ROUTE")}
                className={`p-2.5 rounded-xl font-bold text-center transition-all ${
                  driverDutyStatus === "EN_ROUTE"
                    ? "bg-amber-600 text-white shadow-md"
                    : "bg-white/80 hover:bg-white border border-black/10 text-black/70"
                }`}
              >
                🚑 Transporting Patient
              </button>
              <button
                onClick={() => handleToggleDuty("INGRESS")}
                className={`p-2.5 rounded-xl font-bold text-center transition-all ${
                  driverDutyStatus === "INGRESS"
                    ? "bg-emerald-700 text-white shadow-md"
                    : "bg-white/80 hover:bg-white border border-black/10 text-black/70"
                }`}
              >
                🏥 Ingress to ER Bay 1
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live GPS Simulation & Trauma Bay Telemetry */}
        <div className="lg:col-span-7 p-6 rounded-3xl border border-black/10 shadow-sm space-y-4 flex flex-col justify-between" style={GLASS_CARD}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-rose-600" />
                <h3 className="text-base font-bold text-[#111]">Live Field Telemetry &amp; GPS Breadcrumbs</h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-black/40" />
                <span className="font-bold text-rose-700">ETA: {etaMinutes} Mins to ER</span>
              </div>
            </div>

            {/* Simulated Live GPS Map Viewport */}
            <div className="h-44 rounded-2xl bg-stone-900 text-white p-4 relative overflow-hidden flex flex-col justify-between shadow-inner border border-black/20">
              {/* Grid Background Pattern */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-md text-[11px] font-mono border border-white/10">
                  <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                  <span>GPS: 17.3850° N, 78.4867° E</span>
                </div>
                <div className="bg-rose-600/90 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                  Speed: {currentSpeedKmph} km/h
                </div>
              </div>

              {/* Transit Route Visualization */}
              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-white/70">
                  <span>Pickup: 440 Vedic Enclave</span>
                  <span>Destination: Dronagiri Trauma Bay 1</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, ((6 - etaMinutes) / 6) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Trauma Bay Direct Sync Card */}
            <div className="p-3.5 rounded-2xl bg-white/80 border border-black/10 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-[#111]">Ashwini Emergency Bay Sync Active</div>
                <div className="text-[11px] text-black/50">
                  Trauma Bay-1 reserved • Dr. Ashwini Kumaras notified with in-transit vitals
                </div>
              </div>
              <span className="font-pixel text-[9px] px-2 py-1 rounded bg-emerald-100 text-emerald-900 font-bold uppercase">
                ER STANDBY
              </span>
            </div>
          </div>

          {/* Unit Switcher */}
          <div className="pt-2 border-t border-black/10 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-pixel text-black/40 uppercase shrink-0">Switch Unit:</span>
            {fleetList.map((amb) => (
              <button
                key={amb.id}
                onClick={() => setSelectedAmbulance(amb)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedAmbulance.id === amb.id
                    ? "bg-[#111] text-white shadow-sm"
                    : "bg-white/80 text-black/60 hover:bg-white"
                }`}
              >
                {amb.vehicleNo} ({amb.driverName.split(" ")[0]})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
