"use client";

import React, { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Brain,
  Pill,
  Activity,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  CheckCircle,
  BarChart3,
} from "lucide-react";

const LANDING_GLASS_CARD = {
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "rgba(255, 255, 255, 0.45)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
} as const;

export function IntelligenceLayerWidget() {
  const [activeTab, setActiveTab] = useState<"risk" | "forecasting" | "alerts" | "pharmacy">("risk");

  return (
    <div className="p-6 rounded-3xl shadow-sm space-y-4 text-[#111]" style={LANDING_GLASS_CARD}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111] text-white flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#111]">AI Intelligence &amp; Decision Support Layer</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-pixel tracking-widest bg-purple-100 text-purple-900 uppercase font-bold">
                Clinical ML Engine
              </span>
            </div>
            <p className="text-xs text-black/50">Real-time risk scoring, bed forecasting, no-show predictions &amp; decision alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/80 p-1.5 rounded-xl border border-black/10">
          {[
            { id: "risk", label: "Risk Scoring" },
            { id: "forecasting", label: "Bed & No-Show ML" },
            { id: "alerts", label: "Clinical Alerts" },
            { id: "pharmacy", label: "Rx Demand" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#111] text-white shadow-sm"
                  : "text-black/60 hover:bg-black/[0.04] hover:text-[#111]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: PATIENT RISK SCORING */}
      {activeTab === "risk" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between font-bold text-rose-900">
              <span>P-1001 • Sundar</span>
              <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px]">High Risk (88%)</span>
            </div>
            <p className="text-rose-800/80">Elevated Troponin T + Hemodynamic instability. ICU telemetry alert triggered.</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span>P-1003 • Upagna</span>
              <span className="px-2 py-0.5 bg-amber-600 text-white rounded-full text-[10px]">Moderate Risk (54%)</span>
            </div>
            <p className="text-amber-800/80">Post-op pulse balance recovery. SpO2 dipping to 92% during sleep monitoring.</p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between font-bold text-emerald-900">
              <span>P-1002 • Bhuvan</span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px]">Low Risk (12%)</span>
            </div>
            <p className="text-emerald-800/80">Stable vital parameters. Discharge approval pending final billing clearance.</p>
          </div>
        </div>
      )}

      {/* TAB 2: BED FORECASTING & NO-SHOW PREDICTION */}
      {activeTab === "forecasting" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-white/80 border border-black/10 rounded-2xl space-y-2">
            <div className="font-bold text-[#111]">Bed Occupancy Forecast (Next 48 Hours)</div>
            <p className="text-black/60">ML model projects 94% ICU capacity by tomorrow 18:00 due to planned cardiac procedures.</p>
            <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
              <div className="bg-[#111] h-full" style={{ width: "94%" }} />
            </div>
          </div>

          <div className="p-4 bg-white/80 border border-black/10 rounded-2xl space-y-2">
            <div className="font-bold text-[#111]">OPD Appointment No-Show Prediction</div>
            <p className="text-black/60">3 walk-in slots predicted to open in Neurology OPD based on historical arrival latency.</p>
            <div className="font-bold text-emerald-700">Recommended Action: Auto-assign token #18 from waiting queue</div>
          </div>
        </div>
      )}

      {/* TAB 3: CLINICAL DECISION ALERTS */}
      {activeTab === "alerts" && (
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl flex items-center justify-between text-amber-950 font-medium">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span><strong>Drug Interaction Alert:</strong> Co-administration of Aspirin + Warfarin requires INR monitoring.</span>
            </div>
            <span className="font-mono text-[10px] text-amber-800">CDSS Rule #402</span>
          </div>

          <div className="p-3 bg-rose-100/70 border border-rose-300 rounded-xl flex items-center justify-between text-rose-950 font-medium">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
              <span><strong>Allergy Warning:</strong> Patient P-1001 flagged allergic to Penicillin. Beta-lactam Rx blocked.</span>
            </div>
            <span className="font-mono text-[10px] text-rose-800">CDSS Rule #109</span>
          </div>
        </div>
      )}

      {/* TAB 4: PHARMACY DEMAND PREDICTION */}
      {activeTab === "pharmacy" && (
        <div className="p-4 bg-white/80 border border-black/10 rounded-2xl space-y-2 text-xs">
          <div className="font-bold text-[#111]">Predictive Stock Reordering Recommendations</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 bg-black/5 rounded-xl">
              <span className="font-bold text-[#111]">Atorvastatin 20mg</span>
              <span className="block text-[10px] text-rose-700 font-bold">Depletes in 3 days • Reorder +200 units</span>
            </div>
            <div className="p-2.5 bg-black/5 rounded-xl">
              <span className="font-bold text-[#111]">Paracetamol 500mg</span>
              <span className="block text-[10px] text-emerald-700 font-bold">Optimal Stock • 1,200 units on hand</span>
            </div>
            <div className="p-2.5 bg-black/5 rounded-xl">
              <span className="font-bold text-[#111]">IV Normal Saline 500ml</span>
              <span className="block text-[10px] text-amber-700 font-bold">High Demand • Reorder +50 IV bags</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
