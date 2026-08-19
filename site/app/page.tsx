"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { IntroAnimation, INTRO_DURATION_MS, HERO_REVEAL_MS } from "@/components/intro-animation"
import { AgentInterface } from "@/components/agent-interface"
import { PixelIcon } from "@/components/pixel-icon"
import { LiveAgentFeed, LiveAgentCounter } from "@/components/live-agent-feed"
import { RevealText } from "@/components/reveal-text"
import { StackingAgentCards } from "@/components/stacking-agent-cards"
import { MobileNav } from "@/components/mobile-nav"
import { DevExSection } from "@/components/devex-section"
import AuthSwitch from "@/components/auth-switch"
import { Stethoscope, Activity, Truck, User, ShieldCheck, ArrowRight, X, Sparkles, Lock } from "lucide-react"

// ─── Intersection Observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1800
    const step = 16
    const increment = end / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [inView, end])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Bento card ──────────────────────────────────────────────────────────────
function BentoCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView(0.1)
  return (
    <div
      ref={ref}
      className={`group relative rounded-2xl border border-black/[0.07] bg-white overflow-hidden transition-all duration-700 hover:border-black/[0.15] hover:bg-[#fafaf8] ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s ease, background-color 0.3s ease`,
      }}
    >
      {/* Hover glow spot */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,0,0.03), transparent 60%)" }}
      />
      {children}
    </div>
  )
}

// ─── Pill tag ─────────────────────────────────────────────────────────────────
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/40 bg-black/[0.04]">
      {children}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AgenticPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [heroReady, setHeroReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const handleIntroDone = useCallback(() => {
    setHeroReady(true)
  }, [])

  // Start video zoom slightly before hero content reveals, for seamless overlap
  useEffect(() => {
    const t = setTimeout(() => setVideoReady(true), HERO_REVEAL_MS)
    return () => clearTimeout(t)
  }, [])

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`)
  }

  return (
    <div className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased">

      {/* ── INTRO ANIMATION ───────────────────────────────────────────────── */}
      <IntroAnimation onDone={handleIntroDone} />

      {/* ── STICKY NAV ────────────────────────────────────────────────────── */}
      <MobileNav />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative h-screen overflow-hidden">

        {/* Video background — zooms in once intro is done */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/videos/hero-video.mp4"
          style={{
            transform: videoReady ? "scale(1.05)" : "scale(0.85)",
            transition: "transform 2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />



        {/* Progressive blur + light gradient rising from bottom */}
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: "65%", background: "linear-gradient(to top, #F5F4F0 0%, #F5F4F0 18%, rgba(245,244,240,0.85) 35%, rgba(245,244,240,0.5) 55%, rgba(245,244,240,0.15) 75%, transparent 100%)" }} />
        {/* Backdrop blur layers — progressively lighter toward top */}
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: "20%", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", maskImage: "linear-gradient(to top, black 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: "38%", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", maskImage: "linear-gradient(to top, black 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: "55%", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", maskImage: "linear-gradient(to top, black 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)" }} />

        {/* Spacer so hero content doesn't sit under the fixed nav */}
        <div className="h-20" />

        {/* Title + metrics — anchored to bottom left */}
        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col px-6 md:px-12 pb-12 max-w-3xl">
          {/* Title */}
          <h1
            className="text-6xl sm:text-7xl md:text-8xl font-light text-[#111] leading-[1.0] tracking-tight mb-10"
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? "blur(0px)" : "blur(24px)",
              transform: heroReady ? "translateY(0px)" : "translateY(32px)",
              transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 0ms, filter 1s cubic-bezier(0.16,1,0.3,1) 0ms, transform 1s cubic-bezier(0.16,1,0.3,1) 0ms",
            }}
          >
            Enterprise<br />hospital operating<br />system for modern<br />healthcare.
          </h1>

          {/* 3 metrics — staggered after title */}
          <div className="flex gap-8 sm:gap-12">
            {[
              { value: "2.5M+", label: "Patients Served" },
              { value: "99.99%", label: "Clinical Uptime" },
              { value: "450+", label: "Medical Centers" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  opacity: heroReady ? 1 : 0,
                  filter: heroReady ? "blur(0px)" : "blur(16px)",
                  transform: heroReady ? "translateY(0px)" : "translateY(20px)",
                  transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${120 + i * 80}ms, filter 0.8s cubic-bezier(0.16,1,0.3,1) ${120 + i * 80}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${120 + i * 80}ms`,
                }}
              >
                <div className="text-3xl sm:text-4xl text-[#111] font-light tracking-tight" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>{stat.value}</div>
                <div className="text-xs text-black/40 tracking-widest uppercase mt-1" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM OVERVIEW (bento) ──────────────────────────────────────── */}
      <section id="platform" className="py-32 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <PixelIcon type="platform" size={40} />
            <div className="mt-4"><Tag>HOSPITAL OPERATING SYSTEM</Tag></div>
            <RevealText className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
              {"Everything you need\nto run your hospital."}
            </RevealText>
          </div>

          <div className="grid grid-cols-12 grid-rows-auto gap-3" onMouseMove={handleMouse}>
            {/* Big left card — full width now that multi-agent is removed */}
            <BentoCard className="col-span-12 p-8 md:p-10 min-h-[240px] flex flex-col justify-center relative overflow-hidden" delay={0}>
              {/* Arc background image — original opacity and position */}
              <img
                src="/images/arc.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "center 70%" }}
              />
              {/* Progressive blur layer — blurs from 45% downward */}
              <div className="absolute inset-0 pointer-events-none" style={{
                maskImage: "linear-gradient(to bottom, transparent 45%, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 45%, black 100%)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }} />
              {/* Fade-to-background gradient — matches site bg color #f5f4f0 */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to bottom, transparent 35%, rgba(245,244,240,0.3) 50%, rgba(245,244,240,0.75) 65%, rgba(245,244,240,0.95) 80%, rgb(245,244,240) 100%)",
                }}
              />
              {/* Content aligned cleanly on left */}
              <div className="relative z-10 max-w-lg">
                <div className="w-10 h-10 rounded-xl border border-black/10 bg-white/80 flex items-center justify-center mb-5 shadow-sm" style={{ backdropFilter: "blur(12px)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg>
                </div>
                <h3 className="text-xl md:text-2xl font-light mb-3 text-[#111] tracking-tight">Visual Clinical &amp; Patient Workflow Engine</h3>
                <p className="text-sm md:text-base text-black/55 leading-relaxed">
                  Streamline admissions, triage, OPD queues, and patient 360 histories through an intuitive operational engine. Zero friction. Integrated care delivery.
                </p>
              </div>
            </BentoCard>

            {/* Bottom row */}
            <BentoCard className="col-span-12 md:col-span-4 p-8 min-h-[200px]" delay={120}>
              <div className="w-10 h-10 rounded-xl border border-black/10 flex items-center justify-center mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3 className="text-lg font-light mb-2">Real-time Patient Monitoring</h3>
              <p className="text-sm text-black/45 leading-relaxed">Trace every clinical decision. Track ICU beds, emergency triage boards, and live vital logs.</p>
            </BentoCard>

            <BentoCard className="col-span-12 md:col-span-4 p-8 min-h-[200px]" delay={160}>
              <div className="w-10 h-10 rounded-xl border border-black/10 flex items-center justify-center mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10h8M8 14h5"/></svg>
              </div>
              <h3 className="text-lg font-light mb-2">EMR &amp; Patient 360</h3>
              <p className="text-sm text-black/45 leading-relaxed">Longitudinal medical records across visits, consultations, prescriptions, labs, and imaging.</p>
            </BentoCard>

            <BentoCard className="col-span-12 md:col-span-4 p-8 min-h-[200px]" delay={200}>
              <div className="w-10 h-10 rounded-xl border border-black/10 flex items-center justify-center mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="text-lg font-light mb-2">Guardrails &amp; Compliance</h3>
              <p className="text-sm text-black/45 leading-relaxed">Define role-based permissions (RBAC). Full HIPAA, NABH, and HL7 compliant data security.</p>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ── CLINICAL MODULES (4 cards) ───────────────────────────────────── */}
      <section id="agents" className="py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
            <div>
              <PixelIcon type="agents" size={40} />
              <div className="mt-4"><Tag>CLINICAL MODULES</Tag></div>
              <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
                {"Plug-and-play clinical modules\nready to deploy."}
              </RevealText>
            </div>
            <p className="text-sm text-black/45 leading-relaxed max-w-xs">
              Start with pre-configured hospital departments or customize workflows for your facility. Every module is fully audited, HIPAA-compliant, and interconnected.
            </p>
          </div>

          <StackingAgentCards />
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="workflow" className="py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06] overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <PixelIcon type="workflow" size={40} />
            <div className="mt-4"><Tag>PATIENT CARE LIFECYCLE</Tag></div>
            <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {"From patient registration to discharge\nin four seamless steps."}
            </RevealText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3" onMouseMove={handleMouse}>
            {[
              { n: "01", title: "Register & Triage", desc: "Fast-track patient intake, emergency severity coding (Red/Yellow/Green), and OPD token assignment.", delay: 0,   img: "/images/register-triage.png" },
              { n: "02", title: "Consult & Order",   desc: "Unified consultation workspace for vitals, symptom logging, e-prescriptions, and lab/imaging ordering.", delay: 80,  img: "/images/consult-order.png" },
              { n: "03", title: "Treat & Care",     desc: "Interactive ward bed map allocation, OT surgery prep checklists, medicine dispensing, and nurse duty tracking.", delay: 140, img: "/images/treat-care.png" },
              { n: "04", title: "Bill & Discharge",  desc: "Itemized billing, insurance claim processing, co-pay calculation, and discharge summary generation.", delay: 200, img: "/images/bill-discharge.png" },
            ].map((step) => (
              <BentoCard key={step.n} className="relative overflow-hidden flex flex-col min-h-[320px]" delay={step.delay}>
                {/* Image at top — mask fades it out strongly before the bottom edge */}
                <div className="absolute inset-x-0 top-0 h-56 pointer-events-none">
                  <img
                    src={step.img}
                    alt={step.title}
                    className="w-full h-full object-cover object-top"
                    style={{
                      maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 80%)",
                      WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 80%)",
                    }}
                  />
                </div>
                {/* Number top-left */}
                <div className="relative z-10 p-7">
                  <span className="font-pixel text-[11px] text-black/20 tracking-widest block">{step.n}</span>
                </div>
                {/* Text pushed further down */}
                <div className="relative z-10 px-7 pb-7 mt-auto pt-16">
                  <h3 className="text-2xl font-light mb-3">{step.title}</h3>
                  <p className="text-sm text-black/45 leading-relaxed">{step.desc}</p>
                </div>
              </BentoCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ──────────────────────────────────────────────────── */}
      <section id="integrations" className="py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
            <div>
              <PixelIcon type="integrations" size={40} />
              <div className="mt-4"><Tag>HEALTHCARE INTEGRATIONS</Tag></div>
              <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
                {"Connect any medical device.\nControl any department."}
              </RevealText>
            </div>
            <p className="text-sm text-black/45 leading-relaxed max-w-xs">
              200+ healthcare connectors. HL7, FHIR, DICOM/PACS, and LIMS integrations out of the box.
            </p>
          </div>

          {/* Full-width image block with glass cards underneath */}
          <div className="rounded-3xl border border-black/[0.08] bg-[#F5F4F0] p-6 md:p-8 space-y-6 shadow-sm" onMouseMove={handleMouse}>
            {/* Fully Scaled 3D Glass Diagram (Uncropped, Full Node Visibility) */}
            <div className="relative w-full h-[360px] md:h-[580px] rounded-2xl overflow-hidden border border-black/[0.06] shadow-inner flex items-center justify-center p-2" style={{ background: "#c0b3f2" }}>
              <img
                src="/images/hms-integrations.jpg"
                alt="Hospital System Architecture"
                className="w-full h-full object-contain drop-shadow-md transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>

            {/* Glass Cards Below Image (No Node Overlap) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="rounded-2xl border border-black/[0.08] p-6"
                style={{
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  background: "rgba(255,255,255,0.70)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
                }}
              >
                <Tag>HL7 / FHIR SDK</Tag>
                <h3 className="mt-3 text-xl font-light mb-2 text-[#111]">Build custom device tools</h3>
                <p className="text-xs text-black/50 leading-relaxed mb-4">Define custom telemetry hooks for ICU monitors, ventilators, and lab analyzers.</p>
                <div className="bg-black/[0.04] rounded-xl border border-black/[0.07] p-3 font-mono text-[11px] text-black/60 leading-relaxed">
                  <span className="text-black/30">// telemetry connector</span><br />
                  <span className="text-blue-600 font-semibold">connectDevice</span>{"({"}<br />
                  {"  "}<span className="text-amber-700 font-semibold">name</span>: <span className="text-emerald-700 font-semibold">&apos;ICU_Ventilator&apos;</span>,<br />
                  {"  "}<span className="text-amber-700 font-semibold">stream</span>: <span className="text-black/50">async (id) </span>={">"}<br />
                  {"    "}<span className="text-blue-600 font-semibold">Vitals</span>.get(id)<br />
                  {"})"}
                </div>
              </div>

              <div
                className="rounded-2xl border border-black/[0.08] p-6 flex flex-col justify-between"
                style={{
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  background: "rgba(255,255,255,0.70)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-pixel text-[10px] text-black/50 tracking-widest uppercase">FHIR REAL-TIME STREAM</span>
                  </div>
                  <h3 className="text-xl font-light mb-2 text-[#111]">Bi-directional Data Ingestion</h3>
                  <p className="text-sm text-black/50 leading-relaxed">
                    Full REST + FHIR R4 API suite. Stream patient vitals, telemetry alerts, and lab results directly into doctor workstations with sub-50ms latency.
                  </p>
                </div>

                <div className="pt-6 border-t border-black/10 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-[#111] text-white rounded-xl font-bold font-mono">200+</div>
                  <div className="p-2 bg-black/5 rounded-xl text-black/60 font-semibold text-[11px] flex items-center justify-center">HL7 v2/v3</div>
                  <div className="p-2 bg-black/5 rounded-xl text-black/60 font-semibold text-[11px] flex items-center justify-center">DICOM 3.0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY & OBSERVABILITY ──────────────────────────────────────── */}
      <section id="security" className="py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <PixelIcon type="platform" size={40} />
            <div className="mt-4"><Tag>SECURITY &amp; PRIVACY</Tag></div>
            <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {"Enterprise-grade healthcare\ncompliance from day one."}
            </RevealText>
          </div>

          {/* Asymmetric grid: left text + title, right interactive audit log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side — descriptions */}
            <div className="space-y-6">
              <p className="text-sm text-black/45 leading-relaxed">
                Every clinical edit is logged, every prescription is signed. Built for healthcare providers requiring strict HIPAA, NABH, and GDPR compliance.
              </p>

              <div className="space-y-4">
                {[
                  { label: "HIPAA & NABH Certified", desc: "Independently audited healthcare data security controls" },
                  { label: "Immutable Audit Trail", desc: "Every record view, prescription, and billing edit logged with full provenance" },
                  { label: "Real-time RBAC & Control", desc: "Fine-grained permission matrices for Doctors, Nurses, Pharmacists, and Admins" },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-1 bg-black/10 rounded-full shrink-0" />
                    <div>
                      <h3 className="text-sm font-light mb-1">{item.label}</h3>
                      <p className="text-xs text-black/35">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compliance badges — vertical stack */}
              <div className="pt-4 flex flex-col gap-2">
                {["HIPAA Ready", "NABH Compliant", "GDPR", "ISO 27001"].map((badge) => (
                  <div key={badge} className="flex items-center gap-2 text-xs text-black/25">
                    <span className="w-1 h-1 rounded-full bg-black/25" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            {/* Right side — live audit log visualization */}
            <BentoCard className="p-6 lg:row-span-1" delay={0}>
              <div className="text-xs text-black/30 tracking-widest uppercase mb-4">Live Audit Trail</div>
              <div className="space-y-2">
                {[
                  { time: "12:34:21", action: "patient_emr_viewed", status: "success" },
                  { time: "12:34:18", action: "prescription_dispensed", status: "success" },
                  { time: "12:34:15", action: "bed_allocated_icu", status: "success" },
                  { time: "12:34:12", action: "lab_result_verified", status: "success" },
                  { time: "12:34:09", action: "discharge_summary_generated", status: "success" },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer"
                    style={{
                      animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both`,
                    }}
                  >
                    <span className="text-[10px] text-black/25 font-mono min-w-[60px]">{log.time}</span>
                    <span className="text-[11px] text-black/50 font-light flex-1">{log.action}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors" />
                  </div>
                ))}
              </div>
              <style>{`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ── DEVELOPER EXPERIENCE ──────────────────────────────────────────── */}
      <DevExSection />

      {/* ── MARQUEE CAPABILITIES ──────────────────────────────────────────── */}
      <section className="py-0 border-t border-black/[0.06] overflow-hidden select-none">
        <div className="flex border-b border-black/[0.06]" style={{ animation: "marqueeLeft 28s linear infinite" }}>
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex shrink-0">
              {["Patient Directory", "OPD Token Queue", "EMR Patient 360", "Emergency Triage", "ICU Bed Allocation", "OT Surgery Planner", "E-Prescription Writer", "Lab Sample Pipeline", "Simulated PACS DICOM", "Blood Bank Stock"].map((cap) => (
                <div key={cap} className="flex items-center gap-6 px-10 py-5 border-r border-black/[0.06] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-black/20 shrink-0" />
                  <span className="text-sm text-black/45 whitespace-nowrap tracking-wide">{cap}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex" style={{ animation: "marqueeRight 22s linear infinite" }}>
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex shrink-0">
              {["Itemized Billing", "Insurance Claims", "Doctor Duty Roster", "Medical Equipment", "Pharmacy Inventory", "Immutable Audit Log", "Role-Based Access (RBAC)", "Discharge Generator", "Ambulance Dispatch", "Staff Attendance & HR"].map((cap) => (
                <div key={cap} className="flex items-center gap-6 px-10 py-5 border-r border-black/[0.06] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-black/12 shrink-0" />
                  <span className="text-sm text-black/30 whitespace-nowrap tracking-wide">{cap}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE HOSPITAL SYSTEM ──────────────────────────────────────────── */}
      <section id="live" className="py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <PixelIcon type="agents" size={40} />
              <div className="mt-4"><Tag>LIVE HOSPITAL SYSTEM</Tag></div>
              <RevealText className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
                {"Hospital operations running\n24 / 7, seamlessly."}
              </RevealText>
              <p className="mt-6 text-base text-black/40 leading-relaxed max-w-sm">
                At any moment, thousands of clinical actions, lab tests, and patient consultations are processed across hospital departments — zero delays.
              </p>
              <div className="mt-10 flex items-end gap-2">
                <LiveAgentCounter />
                <span className="text-black/30 text-sm mb-1 tracking-wide">active patient sessions</span>
              </div>
            </div>
            <div className="relative">
              <LiveAgentFeed />
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLE INTELLIGENCE & LOGIN PORTALS ────────────────────────────── */}
      <section id="portals" className="py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06] bg-black/[0.01]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <PixelIcon type="security" size={40} />
              <div className="mt-4"><Tag>ROLE INTELLIGENCE &amp; ACCESS PORTALS</Tag></div>
              <RevealText className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
                {"One operating system.\nFive distinct perspectives."}
              </RevealText>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-5 py-3 rounded-2xl bg-white border border-black/15 hover:border-black/30 shadow-sm text-xs font-bold transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <Lock className="w-4 h-4 text-black/60" />
              <span>Sign In with Custom Credentials</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onMouseMove={handleMouse}>
            {/* 01: Doctor Portal */}
            <BentoCard className="p-7 flex flex-col justify-between" delay={0}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-900 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="font-pixel text-[9px] px-2 py-0.5 rounded-full bg-black/5 text-black/60 font-bold uppercase">
                    DOC-101 TO DOC-107
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-light tracking-tight text-[#111]">Doctor / Physician Portal</h3>
                  <p className="text-xs text-black/50 mt-1 leading-relaxed">
                    Assigned consultation queue, longitudinal EMR 360, e-prescription writer, and OT surgical checklist.
                  </p>
                </div>
                <div className="pt-2 border-t border-black/5 text-[11px] text-black/40">
                  Default: <strong>Dr. Dhanvantari</strong> (CMO &amp; Cardiology)
                </div>
              </div>
              <a
                href="/hms?role=Doctor"
                className="mt-6 w-full py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Launch Doctor Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </BentoCard>

            {/* 02: Nurse & Smart ICU Ring */}
            <BentoCard className="p-7 flex flex-col justify-between" delay={80}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-900 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="font-pixel text-[9px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold uppercase">
                    SMART ICU RING
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-light tracking-tight text-[#111]">Nurse &amp; Ward Station</h3>
                  <p className="text-xs text-black/50 mt-1 leading-relaxed">
                    Real-time ward occupancy map, continuous telemetry vitals monitors, and multi-nurse cascading alert chain.
                  </p>
                </div>
                <div className="pt-2 border-t border-black/5 text-[11px] text-black/40">
                  Default: <strong>Nurse Ananya Sharma</strong> (ICU-01)
                </div>
              </div>
              <a
                href="/hms?role=Nurse"
                className="mt-6 w-full py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Launch Nurse Station</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </BentoCard>

            {/* 03: Ambulance Emergency Network */}
            <BentoCard className="p-7 flex flex-col justify-between" delay={140}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="font-pixel text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold uppercase">
                    LIVE GPS INGRESS
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-light tracking-tight text-[#111]">Ambulance Field Network</h3>
                  <p className="text-xs text-black/50 mt-1 leading-relaxed">
                    Driver duty status toggle, live simulated GPS breadcrumbs, speed telemetry, and trauma bay sync.
                  </p>
                </div>
                <div className="pt-2 border-t border-black/5 text-[11px] text-black/40">
                  Default: <strong>Driver Maruti Rescue</strong> (AMB-01)
                </div>
              </div>
              <a
                href="/hms?role=Ambulance+Driver"
                className="mt-6 w-full py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Launch Field Dispatch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </BentoCard>

            {/* 04: Patient Self-Service Portal */}
            <BentoCard className="p-7 flex flex-col justify-between" delay={200}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-900 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="font-pixel text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold uppercase">
                    AI TRIAGE INTAKE
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-light tracking-tight text-[#111]">Patient Care Portal</h3>
                  <p className="text-xs text-black/50 mt-1 leading-relaxed">
                    Symptom intake wizard, AI master physician matching, auto OPD token generator, and digital bills.
                  </p>
                </div>
                <div className="pt-2 border-t border-black/5 text-[11px] text-black/40">
                  Default: <strong>Sundar</strong> (MRN: P-1001)
                </div>
              </div>
              <a
                href="/hms?role=Patient"
                className="mt-6 w-full py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Launch Patient Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </BentoCard>

            {/* 05: Super Admin Command Center */}
            <BentoCard className="p-7 flex flex-col justify-between md:col-span-2 lg:col-span-2" delay={260}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-pixel text-[9px] px-2.5 py-0.5 rounded-full bg-black/10 text-black font-bold uppercase">
                    EXECUTIVE COMMAND
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-light tracking-tight text-[#111]">Hospital Command Center (Admin)</h3>
                  <p className="text-xs text-black/50 mt-1 leading-relaxed max-w-lg">
                    Full-hospital real-time glass matrix: Bed occupancy, ICU capacity, revenue flows, pending diagnostic orders, and immutable security audit logs.
                  </p>
                </div>
                <div className="pt-2 border-t border-black/5 text-[11px] text-black/40">
                  Access: <strong>Super Admin &amp; Hospital Operations Director</strong>
                </div>
              </div>
              <a
                href="/hms?role=Super+Admin"
                className="mt-6 w-full py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Launch Executive Command Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ── PRICING & EDITIONS ────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 flex flex-col items-center">
            <PixelIcon type="pricing" size={40} />
            <div className="mt-4"><Tag>EDITIONS</Tag></div>
            <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {"Tailored for clinics, hospitals, and networks."}
            </RevealText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" onMouseMove={handleMouse}>
            {[
              {
                name: "Clinic Edition",
                price: "Free",
                sub: "For single practice clinics",
                features: ["Up to 5 Doctors", "1,000 Patients/mo", "Basic EMR & OPD Queue", "Standard Prescriptions", "Community Support"],
                delay: 0,
              },
              {
                name: "Hospital Enterprise",
                price: "₹39,999",
                period: "/mo",
                sub: "For multi-specialty hospitals",
                features: ["Unlimited Doctors & Staff", "50,000 Patients/mo", "Full IPD, OT & ICU Beds", "Lab & PACS Integration", "Billing & Insurance", "REST & FHIR API"],
                highlight: true,
                delay: 80,
              },
              {
                name: "Medical Network",
                price: "Custom",
                sub: "For multi-hospital chains",
                features: ["Multi-tenant Architecture", "Unlimited Patients & Staff", "Dedicated Cloud Infra", "HIPAA / NABH SLA", "Custom Device Connectors", "24/7 Priority Support"],
                delay: 140,
              },
            ].map((plan) => (
              <BentoCard
                key={plan.name}
                className={`p-8 flex flex-col ${plan.highlight ? "border-black/20 bg-[#F0EEE8]" : ""}`}
                delay={plan.delay}
              >
                <div className="mb-8">
                  <div className="font-pixel text-[11px] tracking-widest text-black/40 mb-4">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-light">{plan.price}</span>
                    {plan.period && <span className="text-black/40 text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-xs text-black/35 tracking-wide">{plan.sub}</p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-black/55">
                      <div className="w-1 h-1 rounded-full bg-black/25 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/hms" className={`w-full py-3 rounded-xl text-sm tracking-widest transition-all duration-200 text-center block ${
                  plan.highlight
                    ? "bg-[#111] text-white hover:bg-[#333]"
                    : "border border-black/10 text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04]"
                }`}>
                  {plan.name === "Medical Network" ? "CONTACT SALES" : "GET STARTED"}
                </a>
              </BentoCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06] overflow-hidden">
        {/* Glass panels image — anchored to bottom center */}
        <img
          src="/images/footer.png"
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full object-cover object-bottom pointer-events-none select-none"
          style={{ opacity: 0.85 }}
        />
        {/* Progressive blur from bottom — blends into site bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage: "linear-gradient(to top, transparent 0%, black 55%)",
            WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 55%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        />
        {/* Colour fade from bottom to site bg #f5f4f0 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgb(245,244,240) 0%, rgba(245,244,240,0.92) 18%, rgba(245,244,240,0.55) 35%, transparent 55%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05] mb-6">
            Elevate your hospital<br />operating infrastructure.
          </h2>
          <p className="text-sm text-black/45 leading-relaxed mb-10">
            Join leading medical institutions deploying an interconnected, zero-latency hospital operating system.
          </p>
          {!submitted ? (
            <form
              onSubmit={e => { e.preventDefault(); if (email) setSubmitted(true) }}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="doctor@hospital.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-black/25 focus:outline-none focus:border-black/25 transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-[#111] text-white text-sm rounded-xl hover:bg-[#333] transition-colors tracking-widest font-medium"
              >
                ACCESS DEMO
              </button>
            </form>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-600/20 bg-emerald-50 text-emerald-700 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {"Registration received. Welcome to Dronagiri (Gandhamadana) OS."}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs tracking-[0.25em] text-black/70">DRONAGIRI</span>
            <span className="text-[11px] text-black/40 font-mono">(Gandhamadana)</span>
          </div>

          {/* Nav sections */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {[
              { label: "Platform",     href: "#platform" },
              { label: "Clinical",     href: "#agents" },
              { label: "Lifecycle",    href: "#workflow" },
              { label: "Integrations", href: "#integrations" },
              { label: "Security",     href: "#security" },
              { label: "Pricing",      href: "#pricing" },
            ].map(l => (
              <a key={l.label} href={l.href} className="text-xs text-black/35 hover:text-black/70 transition-colors tracking-widest">{l.label}</a>
            ))}
          </div>

          {/* Legal links */}
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "#" },
              { label: "Terms",   href: "#" },
              { label: "HIPAA",   href: "#" },
              { label: "Docs",    href: "#" },
            ].map(l => (
              <a key={l.label} href={l.href} className="text-xs text-black/25 hover:text-black/55 transition-colors tracking-widest">{l.label}</a>
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-black/[0.04]">
          <span className="text-xs text-black/30">© 2026 Dronagiri (Gandhamadana) Enterprise Hospital Operating System. All rights reserved.</span>
        </div>
      </footer>

      {/* ── ROLE SIGN IN MODAL OVERLAY ────────────────────────────────────── */}
      {showAuthModal && (
        <div
          onClick={() => setShowAuthModal(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl"
          >
            <AuthSwitch
              onClose={() => setShowAuthModal(false)}
              onLoginSuccess={(role) => {
                window.location.href = `/hms?role=${encodeURIComponent(role)}`;
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
