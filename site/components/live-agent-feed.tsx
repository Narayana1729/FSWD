"use client"

import { useEffect, useState, useRef } from "react"

const AGENT_NAMES = [
  "emr-core", "triage-opd", "lab-analyzer", "pharmacy-v2",
  "icu-monitor", "ot-schedule", "billing-engine", "blood-bank",
  "pacs-imaging", "vitals-feed",
]

const TASKS = [
  "Verifying CBC lab result for Patient #P-8921",
  "Allocated ICU Bed #4 to Emergency Triage",
  "Dispensing 3 prescriptions from Pharmacy",
  "Processing OPD Token #14 for Dr. Sarah Jenkins",
  "Pre-op surgical checklist approved for OT-2",
  "Itemized discharge bill generated for Admission #A-304",
  "Blood Bank reservation confirmed for B+ Unit #882",
  "Updating duty roster for Night Shift Nurses",
  "HL7 telemetry feed synced with ICU Bay 3",
  "Ambulance #A-04 dispatched to North Avenue",
  "Radiologist verified MRI brain scan report",
  "Checking stock levels for IV Infusion sets",
]

const REGIONS = ["Emergency", "ICU Ward", "OPD Clinic", "Central Lab", "Pharmacy", "OT Complex"]
const STATUSES = [
  { label: "active",     color: "#4ade80" },
  { label: "active",     color: "#4ade80" },
  { label: "processing", color: "#60a5fa" },
  { label: "queued",     color: "#facc15" },
  { label: "complete",   color: "#34d399" },
]

type AgentRow = {
  id: string
  name: string
  task: string
  region: string
  status: typeof STATUSES[number]
  progress: number
  elapsed: string
  key: number
}

function randomRow(key: number): AgentRow {
  return {
    id: Math.random().toString(36).slice(2, 8).toUpperCase(),
    name: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)],
    task: TASKS[Math.floor(Math.random() * TASKS.length)],
    region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
    status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    progress: Math.floor(Math.random() * 85 + 10),
    elapsed: `${Math.floor(Math.random() * 14 + 1)}m ${Math.floor(Math.random() * 59)}s`,
    key,
  }
}

// Animated progress bar that slowly ticks forward
function ProgressBar({ initial }: { initial: number }) {
  const [pct, setPct] = useState(initial)
  const rafRef = useRef<number>(0)
  const pctRef = useRef(initial)

  useEffect(() => {
    const tick = () => {
      pctRef.current = Math.min(99, pctRef.current + 0.015)
      setPct(Math.round(pctRef.current))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{ width: "100%", height: 2, background: "rgba(0,0,0,0.08)", borderRadius: 9 }}>
      <div style={{
        height: "100%", borderRadius: 9,
        width: `${pct}%`,
        background: "rgba(0,0,0,0.35)",
        transition: "width 0.5s linear",
      }} />
    </div>
  )
}

// Stable seed rows — same on server and client, no random values
const SEED_ROWS: AgentRow[] = [
  { id: "P8921", name: "lab-analyzer",   task: "Verifying CBC lab result for Patient #P-8921",  region: "Central Lab", status: STATUSES[0], progress: 42, elapsed: "3m 12s", key: 0 },
  { id: "B4ICU", name: "icu-monitor",    task: "Allocated ICU Bed #4 to Emergency Triage",      region: "ICU Ward",    status: STATUSES[0], progress: 67, elapsed: "7m 48s", key: 1 },
  { id: "RX302", name: "pharmacy-v2",    task: "Dispensing 3 prescriptions from Pharmacy",      region: "Pharmacy",    status: STATUSES[2], progress: 18, elapsed: "1m 05s", key: 2 },
  { id: "TK014", name: "triage-opd",     task: "Processing OPD Token #14 for Dr. Sarah Jenkins", region: "OPD Clinic",  status: STATUSES[0], progress: 55, elapsed: "5m 30s", key: 3 },
  { id: "OT2S1", name: "ot-schedule",    task: "Pre-op surgical checklist approved for OT-2",   region: "OT Complex",  status: STATUSES[0], progress: 80, elapsed: "11m 22s", key: 4 },
  { id: "BL882", name: "blood-bank",     task: "Blood Bank reservation confirmed for B+ Unit",  region: "Emergency",   status: STATUSES[4], progress: 99, elapsed: "14m 01s", key: 5 },
]

export function LiveAgentFeed() {
  const [rows, setRows] = useState<AgentRow[]>(SEED_ROWS)
  const [mounted, setMounted] = useState(false)
  const keyRef = useRef(100)

  useEffect(() => {
    // Hydrate with random data only after client mount
    setMounted(true)
    setRows(Array.from({ length: 6 }, (_, i) => randomRow(i)))

    const t = setInterval(() => {
      keyRef.current++
      setRows(prev => [...prev.slice(1), randomRow(keyRef.current)])
    }, 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      background: "rgba(255,255,255,0.7)",
    }}>
      {/* Table header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 90px 70px",
        padding: "8px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(0,0,0,0.03)",
      }}>
        {["MODULE", "HOSPITAL ACTIVITY", "DEPARTMENT", "STATUS"].map(h => (
          <span key={h} style={{ fontSize: 8, letterSpacing: "0.16em", color: "rgba(0,0,0,0.30)", fontFamily: "monospace" }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ overflow: "hidden" }}>
        {rows.map((row, i) => (
          <div
            key={row.key}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 90px 70px",
              padding: "10px 16px",
              borderBottom: "1px solid rgba(0,0,0,0.04)",
              gap: 8,
              alignItems: "center",
              animation: i === rows.length - 1 ? "rowSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both" : "none",
            }}
          >
            {/* Agent */}
            <div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(0,0,0,0.65)", marginBottom: 1 }}>{row.name}</div>
              <div style={{ fontSize: 7.5, fontFamily: "monospace", color: "rgba(0,0,0,0.25)" }}>#{row.id}</div>
            </div>

            {/* Task + progress */}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 9, color: "rgba(0,0,0,0.50)", lineHeight: 1.35, marginBottom: 5,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{row.task}</div>
              <ProgressBar initial={row.progress} />
            </div>

            {/* Region */}
            <div style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(0,0,0,0.30)" }}>{row.region}</div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: row.status.color,
                boxShadow: row.status.label === "running" ? `0 0 6px ${row.status.color}` : "none",
                animation: row.status.label === "running" ? "statusPulse 2s ease-in-out infinite" : "none",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(0,0,0,0.35)" }}>{row.status.label}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes rowSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

export function LiveAgentCounter() {
  const [count, setCount] = useState(3847)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => {
      setCount(v => v + Math.floor(Math.random() * 3 - 1))
    }, 1200)
    return () => clearInterval(t)
  }, [])

  return (
    <span style={{
      fontFamily: "monospace",
      fontSize: "clamp(3rem, 6vw, 5rem)",
      fontWeight: 300,
      color: "rgba(0,0,0,0.85)",
      lineHeight: 1,
      letterSpacing: "-0.02em",
      transition: "color 0.3s ease",
    }}>
      {mounted ? count.toLocaleString("en-US") : "3,847"}
    </span>
  )
}
