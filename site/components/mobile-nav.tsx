"use client"

import { useState, useEffect } from "react"
import { Sparkles, Hospital, ArrowRight } from "lucide-react"

const NAV_LINKS = [
  { label: "Platform",     href: "#platform" },
  { label: "Clinical",     href: "#agents" },
  { label: "Lifecycle",    href: "#workflow" },
  { label: "Integrations", href: "#integrations" },
  { label: "Security",     href: "#security" },
  { label: "Pricing",      href: "#pricing" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const close = () => setOpen(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={`fixed inset-x-0 z-50 flex justify-center pointer-events-none transition-all duration-500 ease-out ${
        isScrolled ? "top-4 px-4 sm:px-6 lg:px-8" : "top-0 px-4 sm:px-10 lg:px-16"
      }`}
    >
      <div
        className={`pointer-events-auto transition-all duration-500 ease-out ${
          isScrolled ? "w-full max-w-5xl lg:max-w-6xl" : "w-full max-w-7xl"
        }`}
      >

        {/* Main Nav — Starts 100% Transparent, Morphs into Floating Glass Pill on Scroll */}
        <nav
          className={`flex items-center justify-between transition-all duration-500 ease-out ${
            isScrolled
              ? "px-6 sm:px-8 py-3 rounded-2xl border border-black/[0.08]"
              : "px-2 sm:px-4 py-5 rounded-none border border-transparent bg-transparent"
          }`}
          style={
            isScrolled
              ? {
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  background: "rgba(245, 244, 240, 0.70)",
                  boxShadow:
                    "0 12px 40px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.85)",
                }
              : {
                  background: "transparent",
                  boxShadow: "none",
                }
          }
        >
          {/* Brand & Subtitle */}
          <a href="#" className="flex items-center gap-3 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-[#111] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
              <Hospital className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-pixel text-xs tracking-[0.25em] text-[#111] font-bold">DRONAGIRI</span>
              <span className="text-[11px] text-black/45 font-mono tracking-tight hidden sm:inline">(Gandhamadana)</span>
            </div>
          </a>

          {/* Desktop Navigation Links — Spacious & Elegant */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 mx-4" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                className="text-[12px] font-medium text-black/65 hover:text-[#111] transition-colors duration-200 tracking-wide hover:underline underline-offset-4 decoration-black/20"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA & Mobile Burger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="#portals"
              className="text-[11px] font-semibold px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-black/70 hover:text-[#111] border border-black/10 transition-all duration-200 tracking-wider hidden md:inline-flex items-center gap-1 shadow-2xs"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              <span>SIGN IN / PORTALS</span>
            </a>

            <a
              href="/hms"
              className="text-[11px] font-semibold px-4.5 py-2 rounded-xl bg-[#111] text-white hover:bg-black/85 transition-all duration-200 tracking-wider hidden md:inline-flex items-center gap-1.5 shadow-sm hover:shadow-md active:scale-95"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              <span>ENTER SYSTEM</span>
              <ArrowRight className="w-3 h-3 text-white/70" />
            </a>

            {/* Burger — mobile only */}
            <button
              onClick={() => setOpen(v => !v)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-xl hover:bg-black/[0.05] transition-colors border border-black/5"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span
                className="block h-px bg-black/70 transition-all duration-300 origin-center"
                style={{
                  width: "18px",
                  transform: open ? "translateY(6px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="block h-px bg-black/70 transition-all duration-300"
                style={{
                  width: "18px",
                  opacity: open ? 0 : 1,
                  transform: open ? "scaleX(0)" : "none",
                }}
              />
              <span
                className="block h-px bg-black/70 transition-all duration-300 origin-center"
                style={{
                  width: "18px",
                  transform: open ? "translateY(-6px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        <div
          className="md:hidden mt-2 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: open ? "360px" : "0px", opacity: open ? 1 : 0 }}
        >
          <div
            className="rounded-2xl border border-black/[0.08] p-4 flex flex-col gap-2 shadow-lg"
            style={{
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              background: "rgba(245, 244, 240, 0.85)",
            }}
          >
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={close}
                className="px-3 py-2 text-xs font-semibold text-black/70 hover:text-black hover:bg-black/[0.04] rounded-lg transition-colors"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-2 mt-1 border-t border-black/10">
              <a
                href="/hms"
                onClick={close}
                className="w-full text-center block px-4 py-2.5 text-xs font-bold rounded-xl bg-[#111] text-white shadow-sm"
              >
                ENTER SYSTEM
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
