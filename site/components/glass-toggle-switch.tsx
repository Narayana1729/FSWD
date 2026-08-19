"use client";

import React, { useState } from "react";
import { Sun, Moon, Sparkles } from "lucide-react";

interface GlassToggleSwitchProps {
  value?: "light" | "dark";
  onChange?: (mode: "light" | "dark") => void;
}

export function GlassToggleSwitch({ value = "light", onChange }: GlassToggleSwitchProps) {
  const [mode, setMode] = useState<"light" | "dark">(value);

  const toggleMode = (newMode: "light" | "dark") => {
    setMode(newMode);
    if (onChange) onChange(newMode);
  };

  return (
    <div className="relative flex items-center select-none">
      {/* Outer Pill Frame with Inner Shadow & Drop Shadow */}
      <div
        className="relative flex items-center p-1 rounded-full cursor-pointer transition-all duration-500 overflow-hidden"
        style={{
          width: "120px",
          height: "42px",
          background: mode === "dark" ? "#1E2021" : "rgba(240, 238, 232, 0.70)",
          border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow:
            mode === "dark"
              ? "inset -2px -4px 4px rgba(0, 0, 0, 0.35), inset 0px 2px 10px rgba(255, 255, 255, 0.25), 0px 20px 50px rgba(30, 32, 33, 0.5)"
              : "inset -2px -4px 4px rgba(0, 0, 0, 0.08), inset 0px 2px 10px rgba(255, 255, 255, 0.6), 0px 10px 30px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Background Labels */}
        <div
          onClick={() => toggleMode("light")}
          className={`flex-1 text-center text-xs font-semibold z-10 transition-colors duration-300 flex items-center justify-center gap-1.5 ${
            mode === "light" ? "text-[#111]" : "text-white/40"
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </div>

        <div
          onClick={() => toggleMode("dark")}
          className={`flex-1 text-center text-xs font-semibold z-10 transition-colors duration-300 flex items-center justify-center gap-1.5 ${
            mode === "dark" ? "text-white" : "text-black/40"
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </div>

        {/* Sliding Glass Lens Bubble Highlight Lens */}
        <div
          className="absolute top-1 bottom-1 w-[54px] rounded-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 pointer-events-none"
          style={{
            transform: mode === "dark" ? "translateX(58px)" : "translateX(2px)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            background: mode === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.65)",
            border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.4)" : "1px solid rgba(255, 255, 255, 0.9)",
            boxShadow:
              mode === "dark"
                ? "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.6)"
                : "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)",
          }}
        />
      </div>
    </div>
  );
}
