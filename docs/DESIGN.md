# 🎨 UI/UX Design System Specification
## Dronagiri (Gandhamadana) — Enterprise Hospital Operating System

**Document Version:** 1.0.0  
**Design Philosophy:** Mission-Critical Clinical Clarity, Zero Cognitive Latency, High Information Density  
**Supported Themes:** High-Contrast Dark Mode (Default) & Clean Clinical Light Mode  

---

## 1. Design Philosophy & Vision

In acute healthcare environments (Emergency Bays, ICUs, Operating Theatres), human error is often triggered by visual clutter, poor contrast, and confusing navigation hierarchies. 

Dronagiri's interface is engineered around three pillars:
1. **Immediate Acuity Recognition:** Vital patient status and clinical alerts must be discernable from across a room in $< 200\text{ms}$.
2. **Information Density without Overload:** High-density data tables and visual matrix grids paired with progressive disclosure (drawers, sheets, modals).
3. **Tabular Telemetry Precision:** Tabular, monospaced numerical typography for vital signs, laboratory biomarkers, and pharmaceutical dosages to prevent layout jitter during real-time telemetry updates.

---

## 2. Color System & Semantic Tokens

### 2.1 Core Neutral Palette (Dark Theme Focus)

| Token Name | Hex Code | Tailwind Equivalent | Purpose / Application |
| :--- | :--- | :--- | :--- |
| `bg-primary` | `#020617` | `bg-slate-950` | Root background; minimizes eye fatigue in dimly lit clinical rooms. |
| `bg-surface` | `#0B1120` | `bg-slate-900/90` | Clinical subsystem cards, navigation shells, modal containers. |
| `bg-elevated`| `#1E293B` | `bg-slate-800` | Subsystem table headers, input backgrounds, active hover states. |
| `border-subtle`| `#334155` | `border-slate-700/60`| Card dividers, data grid row borders, input field outlines. |
| `text-primary`| `#F8FAFC` | `text-slate-50` | Primary patient names, clinical readings, header typography. |
| `text-muted` | `#94A3B8` | `text-slate-400` | Secondary metadata (MRN numbers, timestamps, lab units). |

### 2.2 Clinical Acuity & Triage Palette

The clinical color system adheres strictly to the Manchester Triage System (MTS) and Emergency Severity Index (ESI):

```
🔴 RED        #EF4444 (bg-red-500/20, text-red-400, border-red-500/50)
   • Immediate Resuscitation, Level-1 Trauma, Critical Lab Panic Values, Code Blue.

🟡 AMBER      #F59E0B (bg-amber-500/20, text-amber-400, border-amber-500/50)
   • Emergent / High Acuity, Approaching Medication Reorder Thresholds, Pending Lab Sign-off.

🟢 GREEN      #10B981 (bg-emerald-500/20, text-emerald-400, border-emerald-500/50)
   • Stable / Non-Urgent, Available Inpatient Beds, Discharged, Normal Lab Parameter Ranges.

🔵 BLUE / CYAN #0EA5E9 (bg-sky-500/20, text-sky-400, border-sky-500/50)
   • In Consultation, Diagnostic Modality Active, OPD Scheduled Encounter.

🟣 PURPLE     #A855F7 (bg-purple-500/20, text-purple-400, border-purple-500/50)
   • Surgical Suite In-Progress, Active Anesthesia Phase, WHO Checklist Active.
```

---

## 3. Typography & Hierarchy

### 3.1 Font Families
- **Display & Interface:** `Geist Sans`, `Inter`, system `-apple-system, BlinkMacSystemFont`. Engineered for legibility at small sizes.
- **Clinical Telemetry & Numerical Data:** `Geist Mono`, `JetBrains Mono`. Used for heart rate, blood pressure, SPO2, dosages, timestamps, and coordinates.

### 3.2 Typography Scale

| Class | Font Size | Line Height | Weight | Application |
| :--- | :--- | :--- | :--- | :--- |
| `display-hero` | 2.5rem (40px) | 1.1 | 700 (Bold) | Landing headers, Executive Dashboard Census KPI |
| `heading-section`| 1.5rem (24px) | 1.25 | 600 (Semibold)| Subsystem module titles (e.g., Trauma Bay, Pharmacy) |
| `heading-card` | 1.125rem (18px)| 1.35 | 600 (Semibold)| Card headers, modal titles, patient dossier name |
| `body-default` | 0.875rem (14px)| 1.5 | 400 (Regular) | Primary table cells, clinical notes, patient history |
| `body-small` | 0.75rem (12px) | 1.4 | 500 (Medium) | Acuity tags, timestamps, bed unit labels, units of measure |
| `telemetry-mono`| 0.875rem (14px)| 1.2 | 600 (Semibold)| `font-mono`: 120/80 mmHg, 98% SpO2, 72 bpm |

---

## 4. Subsystem Component Specifications

### 4.1 Executive KPI Cards
- Compact cards featuring current value, 24-hour delta badge (+/- percentage), micro-sparkline, and icon.
- Hover effect: Subtle 1px glow using `border-primary/40` and `transition: all 150ms ease-in-out`.

### 4.2 Inpatient Bed Matrix
- Ward tier tabs: **General Ward (Ward A/B)**, **Semi-Private**, **Deluxe Suites**, and **Intensive Care Unit (ICU)**.
- Each bed rendered as an interactive tile displaying:
  - Bed code (e.g., `ICU-04`).
  - Occupancy state (Color-coded indicator dot).
  - Patient Name & MRN (if occupied) or "Available" button.
  - Assigned nurse and daily tariff.

### 4.3 Emergency Triage Station
- Left pane: Real-time patient triage queue categorized into Red, Yellow, and Green buckets.
- Center/Right pane: Active resuscitation intake drawer with one-click direct admission to available ER beds (`ER-01` to `ER-12`).

### 4.4 Diagnostic PACS Canvas Viewer
- **Canvas Display Area:** 1:1 pixel rendering with black background (`#000000`).
- **Toolbar Overlay:** Floating top toolbar with Radix tooltips:
  - Window Level (WL) & Window Width (WW) slider controls.
  - Zoom (50% to 400%), Pan, Invert Greyscale, Reset View.
  - Measurement Calipers (pixel distance to mm conversion).
- **Clinical Sidebar:** Radiologist structured impression form, scan date, modality (`CT`, `MRI`, `X-RAY`), and verified sign-off button.

### 4.5 WHO Surgical Safety Checklist Board
- Segmented 3-phase stepper:
  1. **Sign In:** Patient identity confirmed, surgical site marked, pulse oximeter functioning, anesthesia safety check.
  2. **Time Out:** Entire surgical team verbally introduced, expected duration & blood loss reviewed, antibiotic prophylaxis verified.
  3. **Sign Out:** Procedure recorded, sponge and needle counts verified, specimen labeled correctly.
- Visual completion meter showing percent verified before incision can proceed.

---

## 5. Responsive Layout & Breakpoints

Dronagiri is optimized for multiple clinical form factors:
- **Mobile / Tablet (`< 1024px`):** Collapsible off-canvas navigation drawer, stacked tables with horizontal scroll, touch-friendly tap targets ($\ge 44\text{px}$).
- **Desktop Command Station (`1024px – 1920px`):** Fixed left navigation sidebar, multi-column dashboard grids, side-by-side patient dossiers.
- **Large Clinical Wallboards (`> 1920px`):** 4-column responsive grid suitable for nurse station status boards and triage monitoring hubs.

---

## 6. Accessibility & Micro-Interactions

- **Focus Visibility:** Standardized high-visibility focus ring: `focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none`.
- **Keyboard Navigation:** Full arrow-key navigation in data tables, Esc to close modals and drawers.
- **Subtle Motion:** Standard transition timing `duration-150 ease-out` for dropdowns, popovers, and accordions to preserve high perceived performance.
