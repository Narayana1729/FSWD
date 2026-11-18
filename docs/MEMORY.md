# 🧠 Project Memory & Context Log
## Dronagiri (Gandhamadana) — Enterprise Hospital Operating System

**Document Version:** 1.0.0  
**Purpose:** Living architectural context, decision records (ADRs), domain vocabulary, and active development state.  

---

## 📌 Project Overview & Identity

- **Project Name:** Dronagiri (Gandhamadana)
- **Repository Location:** `/Users/srimannarayanadeevi/FSWD`
- **Application Directory:** `/Users/srimannarayanadeevi/FSWD/site`
- **Domain:** Acute Healthcare Informatics & Hospital Management System (HMS / EHR)
- **Core Technology Stack:**
  - Next.js 16.2.0 (App Router, Server Actions, Route Handlers)
  - React 19.0.0
  - TypeScript 5.0
  - Prisma ORM 6.19.3
  - SQLite (`dev.db`) for local prototyping / PostgreSQL target
  - Tailwind CSS v4 & Radix UI Primitives

---

## 📑 Architectural Decision Records (ADRs)

### ADR-001: Adoption of Next.js 16 App Router & React 19
- **Context:** The application requires high-density clinical views, fast page transitions, and server-side data security.
- **Decision:** Utilize Next.js 16 App Router with React 19. Server components are used for initial dashboard shells and SEO/metadata; client components (`'use client'`) are isolated to interactive clinical subsystems (Canvas PACS, bed matrices, interactive triage).
- **Consequence:** Clean separation of presentation and data endpoints without maintaining a separate backend Node/Express server.

### ADR-002: Local SQLite Prototyping with PostgreSQL Target
- **Context:** The prototype is actively evaluated in local development and academic viva settings where running external Docker containers or managed cloud databases can introduce friction or network dependency.
- **Decision:** Use local SQLite (`dev.db`) managed via Prisma ORM for development and demo mode. Schema design enforces strict foreign key relations and models matching standard PostgreSQL data types to allow seamless future migration via Prisma datasource switching.
- **Consequence:** Zero setup time for reviewers; all data is self-contained in `site/prisma/dev.db`.

### ADR-003: Dual Data Architecture (Live API + Deterministic Fallback)
- **Context:** Network latency, database push errors, or unseeded local environments should never break a live clinical demonstration or test run.
- **Decision:** The custom hook `useHmsApi` (`hooks/use-hms-api.ts`) queries `/api/*` endpoints first. If the API is unreachable, down, or returning empty records, it gracefully falls back to deterministic mock datasets in `lib/hms-data.ts`.
- **Consequence:** 100% UI stability during presentations and offline evaluation.

### ADR-004: In-Browser Simulated PACS Canvas Engine
- **Context:** Clinical medical imaging requires DICOM inspection tools (Window Width, Window Level, Zoom, Pan, Invert, Calipers). However, full DICOM server suites (Orthanc, DCM4CHEE) and Cornerstone.js dependencies add excessive bundle weight and server infrastructure overhead.
- **Decision:** Implemented an in-browser HTML5 Canvas viewer (`components/hms/radiology-pacs.tsx`) that directly executes windowing algorithms on grayscale medical scan arrays.
- **Consequence:** Instant, zero-server-dependency medical imaging inspection directly inside the browser.

### ADR-005: Academic Demo Persona Switcher vs. Server-Side RBAC
- **Context:** Evaluators need to inspect clinical views from the perspective of different hospital staff (Doctor, Nurse, Pharmacist, Billing, Admin) without repeatedly logging out and logging in with multiple test credentials.
- **Decision:** Included an accessible Persona Switcher (`components/auth-switch.tsx` and `?role=` URL query parameter) for testing. In `site/lib/rbac.ts`, server-side RBAC guards are defined independently of the frontend switcher to prepare for production hardening.
- **Consequence:** Easy testing and presentation, with clear architectural documentation noting that frontend switching is strictly for demo evaluation.

---

## 📖 Key Domain Terminology & Clinical Acronyms

| Term | Full Form / Meaning | Clinical Significance in Dronagiri |
| :--- | :--- | :--- |
| **MRN** | Medical Record Number | Unique, immutable identifier (e.g., `P-1001`) assigned to every patient across all visits. |
| **OPD** | Outpatient Department | Ambulatory patient visits, doctor consultations, token scheduling. |
| **IPD** | Inpatient Department | Admitted patients occupying hospital ward beds across General, Semi-Private, Deluxe, and ICU. |
| **Triage (RED/YELLOW/GREEN)** | Acuity Classification | Emergency severity index sorting patients by clinical urgency for resuscitation bed allocation. |
| **PACS** | Picture Archiving & Communication System | Digital medical imaging repository for X-Rays, CT scans, MRIs, and Ultrasounds. |
| **WW / WL** | Window Width / Window Level | Contrast and brightness mapping parameters used in diagnostic radiography. |
| **WHO Checklist**| Surgical Safety Checklist | Standard 3-phase checklist (*Sign In*, *Time Out*, *Sign Out*) preventing wrong-site surgery. |
| **ATC Code**| Anatomical Therapeutic Chemical | International drug classification system used in pharmacy inventory cataloging. |
| **BLS / ALS**| Basic / Advanced Life Support | Equipment and staffing classification level for emergency ambulances. |

---

## ⚙️ Environment Variables & Operational Commands

### Environment Configuration (`site/.env`)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="hms-enterprise-jwt-secret-key-change-in-production-2026"
```

### Key CLI Commands (run from `site/`)
```bash
# Install dependencies
npm install

# Start local Next.js development server (default port 3000)
npm run dev

# Regenerate Prisma Client
npx prisma generate

# Push schema changes to SQLite dev.db
npx prisma db push

# Re-seed test clinical dataset
npx prisma db seed

# Run production build and type-checking
npm run build
```

---

## 📝 Recent Activity & Ongoing Focus

- **Current Repository State:** Complete 20-module frontend UI, 35-model Prisma relational schema, and active REST API route handlers.
- **Active Focus:** Production hardening across `/api/*` endpoints — implementing `requireRole()` guards, cryptographic session audit logging, and preparing PostgreSQL migration scripts.
