# 📋 Task Tracker & Engineering Roadmap
## Dronagiri (Gandhamadana) — Enterprise Hospital Operating System

**Document Version:** 1.0.0  
**Project Status:** Subsystem Complete (95%) | Production Hardening (In Progress)  
**Legend:** `[x]` Completed | `[/]` In Progress | `[ ]` Planned / Backlog  

---

## 🎯 Phase 1: Core Architecture & Data Modeling (Complete)

- [x] **Schema Design:** Define all 35 relational models in `site/prisma/schema.prisma` covering clinical, administrative, diagnostic, and logistics workflows.
- [x] **Local Database Engine:** Initialize and synchronize SQLite database (`site/prisma/dev.db`).
- [x] **Seed Dataset:** Author comprehensive demographic, doctor, ward, medicine, lab, and ambulance mock records in `site/prisma/seed.ts`.
- [x] **Frontend Foundation:** Initialize Next.js 16 (App Router), React 19, and Tailwind CSS v4 design system.
- [x] **Design Tokens:** Configure clinical dark/light color palettes, Geist fonts, and Radix UI headless primitives.

---

## 🏥 Phase 2: Clinical Subsystem Views & UI Modules (Complete)

- [x] **Executive Dashboard (`components/hms/dashboard-overview.tsx`):** Real-time hospital census, bed occupancy gauges, ER case alerts, and revenue tracking.
- [x] **Patient Directory & Dossier (`components/hms/patient-directory.tsx`):** Filterable master patient index with status tags and medical record numbers.
- [x] **Patient Registration Wizard (`components/hms/patient-registration.tsx`):** Multi-step intake capturing demographics, allergies, emergency contacts, and insurance.
- [x] **EMR / Patient 360 (`components/hms/patient-360.tsx`):** Longitudinal timeline combining vitals, clinical encounters, lab tests, and prescriptions.
- [x] **Outpatient (OPD) Queue (`components/hms/opd-queue.tsx`):** Daily token appointment scheduler and wait-time estimator.
- [x] **Emergency & Trauma Bay (`components/hms/emergency-bay.tsx`):** Level-1 triage desk with RED/YELLOW/GREEN acuity tags and trauma bed assignments.
- [x] **Inpatient Bed Matrix (`components/hms/bed-matrix.tsx`):** Interactive visual ward layout for General, Semi-Private, Deluxe, and ICU beds.
- [x] **Operation Theatre Suite (`components/hms/operation-theatre.tsx`):** OT room schedules, surgical team assignments, and WHO Surgical Safety Checklist.
- [x] **Laboratory Pipeline (`components/hms/laboratory.tsx`):** Multi-stage diagnostic test tracking with abnormal parameter flagging.
- [x] **Radiology / PACS Viewer (`components/hms/radiology-pacs.tsx`):** In-browser simulated canvas viewer supporting windowing (WW/WL), zoom, pan, and radiologist reports.
- [x] **Pharmacy & Dispensary (`components/hms/pharmacy.tsx`):** Medicine inventory register, stock alerts, batch expiry tracking, and prescription dispensing.
- [x] **Blood Bank & Serology (`components/hms/blood-bank.tsx`):** Unit inventory tracker, expiration countdowns, and ABO/Rh donor-recipient compatibility matrix.
- [x] **Biomedical Asset Management (`components/hms/biomedical-equipment.tsx`):** Asset registry, preventative maintenance schedules, and breakdown logging.
- [x] **Consumable Supplies (`components/hms/consumables-inventory.tsx`):** Surgical consumables, PPE, and IV stock levels with supplier metadata.
- [x] **Ambulance Fleet Logistics (`components/hms/ambulance-fleet.tsx`):** Fleet telemetry, driver tracking, BLS/ALS equipment levels, and dispatch command view.
- [x] **Billing & Invoicing (`components/hms/billing-invoicing.tsx`):** Tariff calculation, insurance co-pay deductions, payment recording, and invoice generation.
- [x] **Staff HR & Rostering (`components/hms/staff-roster.tsx`):** Shift allocation (Morning, Evening, Night) and staff attendance register.
- [x] **Security & Audit Subsystem (`components/hms/audit-logs.tsx`):** Filterable audit log viewer capturing actor IDs, timestamps, and resource actions.
- [x] **Patient Care Portal (`components/hms/patient-portal.tsx`):** Self-service patient portal mockup for viewing health history and ordering transport.
- [x] **Command Center Navigation (`components/hms-navigation.tsx`):** Responsive sidebar navigation with instant search and subsystem routing.

---

## ⚡ Phase 3: REST API Handlers & Real-Time Sync (Complete / Polishing)

- [x] **Authentication Endpoints:** `/api/auth/login` (bcrypt verification, JWT generation) and `/api/auth/me`.
- [x] **Patient Handlers:** `/api/patients` (listing, search, patient creation).
- [x] **Emergency Handlers:** `/api/emergency` (triage listings, priority sort) and `/api/emergency/admit` (trauma-to-inpatient bed allocation).
- [x] **Inpatient Bed Handlers:** `/api/beds` (ward occupancy, status changes).
- [x] **Diagnostics & Pharmacy Handlers:** `/api/lab-orders`, `/api/lab-orders/results`, `/api/radiology`, `/api/pharmacy`, `/api/pharmacy/dispense`.
- [x] **Data Synchronization Hook:** `hooks/use-hms-api.ts` implementing configurable polling and seamless fallback to `lib/hms-data.ts`.

---

## 🛡️ Phase 4: Security & Production Hardening (Under Active Remediation)

- [/] **Server-Side API Route Guards:**
  - [x] Document and configure RBAC permission matrix in `site/lib/rbac.ts`.
  - [ ] Enforce `requireRole()` checks across all `/api/billing/*`, `/api/pharmacy/*`, and `/api/emergency/*` mutating routes.
- [/] **Audit Trail Verification:**
  - [x] Audit log schema and viewer component.
  - [ ] Ensure `actorId` and `clientIp` are strictly extracted from verified server sessions rather than request bodies.
- [ ] **Global Next.js Middleware:**
  - [ ] Implement `site/middleware.ts` to intercept protected routes and decode JWT tokens before execution.
- [ ] **Request Payload Validation:**
  - [ ] Add runtime `Zod` schemas for all incoming POST/PATCH bodies to reject malformed inputs.
- [ ] **Bypass Mode Lockdown:**
  - [ ] Gate the frontend demo persona switcher (`?role=`) so it is disabled when running in production mode (`NODE_ENV === "production"`).

---

## 🚀 Phase 5: Production Database Migration (PostgreSQL)

- [ ] **PostgreSQL Schema Configuration:**
  - [ ] Update `prisma/schema.prisma` datasource to `postgresql`.
  - [ ] Convert SQLite stringified JSON fields (`allergiesJson`, `medicalHistoryJson`, `insuranceJson`) to native `Json` (`JSONB`).
- [ ] **Database Indexing:**
  - [ ] Add explicit B-Tree indexes on high-frequency query keys (`patientId`, `doctorId`, `visitId`, `status`, `mrn`).
- [ ] **Connection Pooling:**
  - [ ] Integrate PgBouncer or Prisma Accelerate for concurrent multi-user load.

---

## 🧪 Phase 6: Automated Testing & CI/CD Pipeline

- [ ] **Unit & Security Tests:**
  - [ ] Jest / Vitest test suite validating RBAC matrix permissions for each role.
  - [ ] Password hashing and JWT generation / expiration unit tests.
- [ ] **End-to-End Clinical Flow Tests:**
  - [ ] Playwright tests verifying the end-to-end patient lifecycle: Registration ➔ OPD Appointment ➔ Doctor Consultation ➔ Lab Order ➔ Billing.
  - [ ] Emergency trauma intake ➔ Resuscitation bed allocation test.
- [ ] **CI/CD Integration:**
  - [ ] GitHub Actions workflow for linting (`eslint`), TypeScript verification (`tsc --noEmit`), and automated builds.
