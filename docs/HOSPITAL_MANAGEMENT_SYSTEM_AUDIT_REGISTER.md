# 📋 Dronagiri Hospital Management System: Audit Register

**Register Version:** 2.0.0  
**Last Updated:** October 19, 2026  
**Auditor:** Technical Reviewer, Security Engineer & QA Lead  
**Repository:** `/Users/srimannarayanadeevi/FSWD`  
**Application:** `/Users/srimannarayanadeevi/FSWD/site`  

---

## 1. Audit Status Overview

The Audit Register tracks the evaluation, verification status, and historical progression across all 18 technical audit categories. 

### Status Classification:
- 🟢 **COMPLETED:** Thoroughly audited with conclusive static and runtime evidence; requirements met or defect resolved and verified.
- 🟡 **PARTIALLY COMPLETED:** Audited with identified gaps, partial implementations, or remaining edge-case vulnerabilities.
- ⚪ **UNVERIFIED / PENDING EXECUTION:** Audit framework and tests designed, but live execution or remediation verification remains pending.

---

## 2. Comparative Audit History (Oct 12 vs Oct 15 vs Oct 19)

| # | Audit Category | Baseline (Oct 12) | Intermediate (Oct 15) | Current State (Oct 19) | Status | Key Evidence / Primary Observation |
| :-: | :--- | :---: | :---: | :---: | :---: | :--- |
| **1** | **Security & Authorization** | 19/33 endpoints auth (57%) | 33/33 endpoints auth (100%) | Edge middleware active; 8 GET routes lack role checks | 🟡 **PARTIALLY COMPLETED** | Middleware validates JWTs, but clinical collections leak data to `PATIENT` role (`app/api/appointments`, `prescriptions`, etc.). |
| **2** | **Authentication & Sessions** | Open admin registration; lax cookies | Admin registration restricted; HttpOnly cookies | JWT in `localStorage` + cookie; no session revocation | 🟡 **PARTIALLY COMPLETED** | `lib/auth.ts` requires prod secret, but token in `localStorage` defeats HttpOnly. `Session` table in DB is unused. |
| **3** | **Patient Privacy & Ownership** | Unauthenticated IDOR on patient ID | `isPatientOwner` on `patients/[id]` | Fixed on dossier; open on downstream collections | 🟡 **PARTIALLY COMPLETED** | `app/api/patients/[id]/route.ts:117` restricts dossier, but `app/api/prescriptions` has no owner check. |
| **4** | **API Contract & Validation** | Ad-hoc null checks; unvalidated payloads | Ad-hoc manual validation | Zod installed but unused; unsanitized PATCH data | 🟡 **PARTIALLY COMPLETED** | `app/api/patients/[id]/route.ts:168` passes raw `body` to Prisma; `POST /api/staff:40` generates fake foreign keys. |
| **5** | **Functional Completeness** | 12 subsystems wired | 18 subsystems wired | 18 live Prisma APIs; Inventory is pure local storage | 🟡 **PARTIALLY COMPLETED** | `components/hms/inventory-procurement.tsx` has no backend API endpoint (`/api/inventory` missing). |
| **6** | **End-to-End Workflows** | Decoupled billing & admissions | Live billing & emergency admit | 5 atomic workflows; OPD Rx unlinked from visits | 🟡 **PARTIALLY COMPLETED** | Emergency admit & Discharges work atomically; OPD consultation completion masks errors. |
| **7** | **Database Schema & Integrity** | 33 tables in SQLite | 35 tables in SQLite | 35 models; JSON fields unindexed; Staff FK defect | 🟡 **PARTIALLY COMPLETED** | `schema.prisma` is robust, but `POST /api/staff` inserts invalid foreign keys; lacks composite indexes. |
| **8** | **Transaction Atomicity** | No transactions; race conditions | 4 atomic routes ($transaction) | 5 routes atomic; `pharmacy/dispense` non-atomic | 🟡 **PARTIALLY COMPLETED** | `app/api/pharmacy/dispense/route.ts` lacks `$transaction`; `blood-bank` has concurrent lost update risk. |
| **9** | **Automated Test Coverage** | 0% (No test framework) | Vitest installed; 5 test files | 29 passing unit tests; zero integration/E2E tests | 🟡 **PARTIALLY COMPLETED** | `npm test` passes 29/29 in 1.17s, but financial and rollback tests test local mocks instead of real code. |
| **10** | **Frontend State Management** | Decoupled local state; silent fails | `useHmsApi` surgical rollback | Hook has rollback; 4 components bypass hook | 🟡 **PARTIALLY COMPLETED** | `useHmsApi.ts` has functional rollback, but `opd-appointments.tsx` uses raw `fetch` and masks HTTP 500 errors. |
| **11** | **UI Consistency & A11y** | Consistent styling | Clean compilation (~1.5s) | Clean Turbopack build (~3.9s); modal a11y gaps | 🟡 **PARTIALLY COMPLETED** | Custom modals lack ARIA dialog roles and focus traps; tables require mobile scrolling. |
| **12** | **Architecture & Maintainability** | Monolithic components | Component separation | 4 monolithic files >700 lines; duplicate helpers | 🟡 **PARTIALLY COMPLETED** | `opd-appointments.tsx` is 1,430 lines; `billing-insurance.tsx` is 1,006 lines. Presentation mixed with logic. |
| **13** | **Dependency Security** | Untracked audit state | Untracked audit state | 11 vulnerabilities (1 critical, 10 high) | 🟡 **PARTIALLY COMPLETED** | `npm audit` reveals Next.js App Router DoS/middleware bypass and deepmerge-ts stack exhaustion. |
| **14** | **Performance & Scalability** | Unmeasured | Fast static compile | Monolithic patient fetch query; SQLite locking | 🟡 **PARTIALLY COMPLETED** | `GET /api/patients/[id]` fetches 9 collections in one query; SQLite file lock limits concurrency. |
| **15** | **Deployment Readiness** | Dev-only configuration | Dev-only configuration | Serverless incompatible (SQLite); no Dockerfile | 🟡 **PARTIALLY COMPLETED** | SQLite `dev.db` requires persistent disk; deprecated middleware syntax warning in Next.js 16. |
| **16** | **Backup & Recovery** | Zero backups | One manual backup copy | Single manual backup file; no automated scripts | 🟡 **PARTIALLY COMPLETED** | `prisma/dev.db.backup_1792044613` exists; no automated WAL checkpointing or snapshot cron. |
| **17** | **Documentation Traceability** | Outdated initial docs | Audit & PRD updated | High PRD alignment; audit report claims vs code gap | 🟢 **COMPLETED** | Comprehensive PRD, Architecture, and Master Audit Plan documents maintained in repository. |
| **18** | **Academic / Viva Readiness** | 6.8 / 10 | 8.3 / 10 | 8.5 / 10 (Interactive demo ready; security gaps) | 🟢 **COMPLETED** | Multi-role demo ready with rich clinical figures; network inspector viva trap identified. |

---

## 3. Master Category-by-Category Register

### Category 1: Security and Authorization
* **Audit Lead:** Application Security Engineer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/middleware.ts:23-78`: Intercepts `/api/*` and verifies HS256 JWT using `jose`.
  - `site/lib/rbac.ts:28-114`: Defines role permission matrix across 9 hospital roles.
  - `site/app/api/appointments/route.ts:6-42`: Enforces auth but lacks role gate on `GET`.
  - `site/app/api/prescriptions/route.ts:11-49`: Enforces auth but lacks role gate on `GET`.
  - `site/app/api/lab-orders/route.ts:11-38`: Enforces auth but lacks role gate on `GET`.
  - `site/app/api/radiology/route.ts:11-38`: Enforces auth but lacks role gate on `GET`.
  - `site/app/api/emergency/route.ts:11-35`: Enforces auth but lacks role gate on `GET`.
  - `site/app/api/beds/route.ts:10-52`: Enforces auth but lacks role gate on `GET`.
  - `site/app/api/surgeries/route.ts:11-29`: Enforces auth but lacks role gate on `GET`.
  - `site/app/api/billing/route.ts:11-48`: Enforces auth but lacks role gate on `GET`.
  - `site/app/api/audit-logs/route.ts:12`: Allows `DOCTOR` role to view audit logs (`authorizeRole(request, "ADMIN", "DOCTOR")`).
* **Remaining Verification Gate:** Update route handlers to enforce role-specific permissions and patient ownership on all `GET` queries.

---

### Category 2: Authentication and Session Management
* **Audit Lead:** Application Security Engineer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/lib/auth.ts:18-30`: Throws fatal error in production if `JWT_SECRET` is unset.
  - `site/lib/auth.ts:50-59`: Uses `bcrypt.hash(password, 12)` and `bcrypt.compare`.
  - `site/app/api/auth/login/route.ts:81-87`: Sets `hms_token` cookie with `httpOnly: true, secure: prod, sameSite: "lax"`.
  - `site/app/api/auth/login/route.ts:76-79`: Returns `token` in JSON body, causing `site/hooks/use-hms-api.ts:8` to save it in `localStorage`.
  - `site/prisma/schema.prisma:36-46`: `Session` table exists with `token`, `userId`, `expiresAt`, but is completely unused by `auth.ts`.
* **Remaining Verification Gate:** Remove token from client `localStorage`; utilize `httpOnly` cookie exclusively or implement token revocation via the `Session` database table.

---

### Category 3: Patient Privacy and Resource Ownership
* **Audit Lead:** Security Engineer & QA Lead
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/lib/rbac.ts:256-285`: `getPatientForUser` resolves and links `userId` to `patient.id`.
  - `site/lib/rbac.ts:292-306`: `isPatientOwner` verifies match on `userId` or case-insensitive email.
  - `site/app/api/patients/[id]/route.ts:117-123`: Returns 403 Forbidden if `auth.user.role === "PATIENT"` and `!isPatientOwner`.
  - `site/app/api/patients/route.ts:26-30`: Restricts `GET /api/patients` to self-only records when called by `PATIENT`.
  - `site/__tests__/patient-auth.test.ts:1-90`: 6 unit tests verify `isPatientOwner` behavior.
  - **Negative Evidence:** `site/app/api/prescriptions/route.ts:22-24` accepts `patientId` query param, but does not verify ownership if caller is a patient.
* **Remaining Verification Gate:** Inject patient ownership filter into all 8 downstream clinical collections.

---

### Category 4: API Contract and Validation
* **Audit Lead:** Software Architect & QA Engineer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/package.json:69`: `"zod": "^3.24.1"` installed.
  - `site/app/api/patients/[id]/route.ts:168`: `const data: Record<string, unknown> = { ...body };` passed directly to `prisma.patient.update`.
  - `site/app/api/staff/route.ts:40,44`: Dummy string assignments for `userId` and `departmentId`.
  - `site/app/api/appointments/route.ts:72`: `new Date(appointmentDate)` without invalid date check.
* **Remaining Verification Gate:** Introduce standardized Zod schemas for request validation across all mutation routes.

---

### Category 5: Functional Completeness
* **Audit Lead:** Technical Reviewer & Architect
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - 18 subsystems connect to active Prisma APIs.
  - `site/components/hms/inventory-procurement.tsx:1-240`: Relies solely on `localStorage.getItem("dronagiri_inventory")`. Model `InventoryConsumable` exists in `schema.prisma:526` but no `/api/inventory` route exists.
  - `site/components/hms/blood-bank.tsx:1-350`: Supports stock unit adjustments; donor intake and cross-matching workflows are UI mockups.
* **Remaining Verification Gate:** Create `/api/inventory` route handler backed by `InventoryConsumable` model in Prisma.

---

### Category 6: End-to-End Workflow Correctness
* **Audit Lead:** QA Engineer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/app/api/emergency/admit/route.ts:25-140`: Fully atomic emergency admission with triage fee billing.
  - `site/app/api/discharges/route.ts:24-140`: Fully atomic bed release, stay calculation, and room tariff billing.
  - `site/app/api/lab-orders/results/route.ts:28-130`: Fully atomic lab result recording and billing.
  - `site/app/api/radiology/reports/route.ts:27-125`: Fully atomic report creation and imaging billing.
  - `site/components/hms/opd-appointments.tsx:843-885`: OPD consultation completion triggers disconnected API calls and masks errors.
* **Remaining Verification Gate:** Refactor OPD consultation completion into an atomic `/api/consultations/complete` endpoint.

---

### Category 7: Database Schema and Integrity
* **Audit Lead:** Database Engineer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/prisma/schema.prisma:1-676`: 35 models defined with relational attributes.
  - `site/prisma/schema.prisma:91-95`: JSON text fields used on `Patient` without validation.
  - `site/app/api/staff/route.ts:38-49`: Inserts invalid foreign keys breaking relational constraints.
  - Zero composite indexes on high-frequency query filters (`appointmentDate`, `createdAt`, `status`).
* **Remaining Verification Gate:** Correct foreign key insertion in `staff/route.ts` and add schema indexes for frequently filtered columns.

---

### Category 8: Transaction Atomicity and Concurrency
* **Audit Lead:** Database Engineer & Architect
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/app/api/emergency/admit/route.ts:25`: Atomic `$transaction`.
  - `site/app/api/discharges/route.ts:24`: Atomic `$transaction`.
  - `site/app/api/lab-orders/results/route.ts:28`: Atomic `$transaction`.
  - `site/app/api/radiology/reports/route.ts:27`: Atomic `$transaction`.
  - `site/app/api/billing/[id]/pay/route.ts:38`: Atomic `$transaction`.
  - `site/app/api/pharmacy/dispense/route.ts:90-156`: **Non-atomic.** Sequential updates without transaction.
  - `site/app/api/blood-bank/route.ts:48-52`: Memory addition without atomic increment.
* **Remaining Verification Gate:** Wrap `pharmacy/dispense` in `prisma.$transaction` and update `blood-bank` with atomic `increment`.

---

### Category 9: Automated Test Coverage and Quality
* **Audit Lead:** QA Lead
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/__tests__/auth.test.ts`: 7 unit tests (real `lib/auth.ts` imports). Passed in 1031ms.
  - `site/__tests__/rbac.test.ts`: 6 unit tests (real `lib/rbac.ts` imports). Passed in 3ms.
  - `site/__tests__/patient-auth.test.ts`: 6 unit tests (real `lib/rbac.ts` imports). Passed in 2ms.
  - `site/__tests__/financial-transactions.test.ts`: 6 unit tests (inline local mock function `processPayment`). Passed in 3ms.
  - `site/__tests__/state-rollback.test.ts`: 4 unit tests (inline local mock class `MockStateStore`). Passed in 25ms.
  - Test run output: 5 test files, 29 tests passed in 1.17s.
  - Zero API route integration tests; zero database tests; zero E2E browser tests.
* **Remaining Verification Gate:** Implement integration tests against live Next.js API handlers and SQLite database.

---

### Category 10: Frontend State Management
* **Audit Lead:** Senior Frontend Engineer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/hooks/use-hms-api.ts:94-167`: `createItem` applies optimistic insert with functional state updater; rolls back cleanly on non-2xx response.
  - `site/hooks/use-hms-api.ts:173-245`: `updateItem` captures previous item state and reverts cleanly on server rejection.
  - `site/components/hms/opd-appointments.tsx:783-801`: Bypasses `useHmsApi`; catches error and sets success state regardless of failure.
* **Remaining Verification Gate:** Migrate remaining components to `useHmsApi` or enforce strict `res.ok` handling in local fetch calls.

---

### Category 11: UI Consistency, Accessibility, and Responsive Design
* **Audit Lead:** Frontend / UI Reviewer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - Responsive design with Tailwind CSS v4 and Radix UI headless components.
  - Next.js build clean pass (~3.9s compilation).
  - Modals in `opd-appointments.tsx:1330` and `laboratory.tsx:190` lack ARIA modal attributes, focus trap, and Escape key listener.
* **Remaining Verification Gate:** Replace raw `fixed inset-0` modal overlays with accessible Radix Dialog components.

---

### Category 12: Architecture and Code Maintainability
* **Audit Lead:** Software Architect
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - Total repository size: 59 files modified (+12,428 lines, -2,895 lines).
  - `opd-appointments.tsx`: 1,430 lines.
  - `billing-insurance.tsx`: 1,006 lines.
  - `patients.tsx`: 903 lines.
  - `emr-patient360.tsx`: 765 lines.
* **Remaining Verification Gate:** Decompose monolithic component files into modular subcomponents (e.g. `AppointmentList`, `ConsultationSuite`, `BookingModal`).

---

### Category 13: Dependency and Configuration Security
* **Audit Lead:** Security Engineer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `npm audit` executed October 19, 2026.
  - Found 11 vulnerabilities (1 critical, 10 high).
  - Critical advisory: `next@16.2.0` (Server Components DoS, Middleware bypass).
  - High advisories: `deepmerge-ts` / `prisma@6.19.3` (stack exhaustion), `postcss@8.5.22` (path traversal).
* **Remaining Verification Gate:** Evaluate and apply non-breaking dependency updates (`next@16.3.8+` or latest patch release).

---

### Category 14: Performance and Scalability
* **Audit Lead:** Database Engineer & Architect
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/app/api/patients/[id]/route.ts:21-109`: Monolithic query loading 9 related models without pagination.
  - SQLite table-level locking limits concurrent writes under load.
* **Remaining Verification Gate:** Add pagination / limit parameters to nested relational queries and benchmark response times.

---

### Category 15: Deployment Readiness
* **Audit Lead:** DevOps & Platform Engineer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `next build` passes with zero TypeScript/lint errors.
  - Database is configured to local SQLite (`DATABASE_URL="file:./dev.db"`).
  - Next.js 16 emits warning: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`
  - No `Dockerfile` or container build manifest exists.
* **Remaining Verification Gate:** Create `Dockerfile` and configure PostgreSQL connection string capability for production deployment.

---

### Category 16: Backup and Recovery
* **Audit Lead:** Database Engineer
* **Current Status:** 🟡 **PARTIALLY COMPLETED**
* **Concrete Evidence References:**
  - `site/prisma/dev.db.backup_1792044613` exists as an ad-hoc manual snapshot.
  - No automated backup script, cron job, or SQLite `.backup` utility in place.
* **Remaining Verification Gate:** Implement an automated backup script (`npm run db:backup`) utilizing SQLite online backup API.

---

### Category 17: Documentation and Requirements Traceability
* **Audit Lead:** Technical Reviewer
* **Current Status:** 🟢 **COMPLETED**
* **Concrete Evidence References:**
  - `docs/PRD.md`: Complete functional requirements across all 20 subsystems.
  - `docs/ARCHITECTURE.md`: High-level system architecture and entity relationships.
  - `HOSPITAL_MANAGEMENT_SYSTEM_MASTER_AUDIT_PLAN.md`: Full 18-category audit plan.
  - `HOSPITAL_MANAGEMENT_SYSTEM_AUDIT_REGISTER.md`: Living audit tracking register.
* **Remaining Verification Gate:** Maintain documentation synchronization during remediation phases.

---

### Category 18: Academic Submission and Demonstration Readiness
* **Audit Lead:** Senior Architect & Technical Reviewer
* **Current Status:** 🟢 **COMPLETED**
* **Concrete Evidence References:**
  - Seed database populates full clinical ecosystem with diverse patient personas and doctor suites.
  - Quick-switch user persona widget in `site/components/auth-switch.tsx` enables instantaneous role switching.
  - Live local dev server running smoothly on `http://localhost:3000/hms`.
* **Remaining Verification Gate:** Complete pre-viva dry run ensuring no network inspection traps remain open.
