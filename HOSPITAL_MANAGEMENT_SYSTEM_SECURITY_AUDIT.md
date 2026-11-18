# Gandhamadana / Dronagiri HMS: Security Remediation Audit & Fix Plan

**Document Version:** 1.0.0  
**Date:** October 12, 2026  
**Auditor:** Senior Full-Stack Developer & Software Architect  
**Project:** Full Stack Web Development Course Project (Gandhamadana / Dronagiri HMS)  
**Target:** Next.js 16.2 App Router API Layer (`site/app/api/`)

---

## 1. Executive Direction: Security First

### Selected Direction
**Direction 1: Fix security first — systematically secure the backend.**

### Architectural Rationale
A Hospital Management System handles legally protected Protected Health Information (PHI) under HIPAA, DISHA, and modern data protection frameworks. In an evaluation or viva, exposing medical records, surgical bookings, and prescription generation over unauthenticated REST endpoints is a critical disqualifier. 

Securing the backend first provides the following advantages:
1. **Zero Breaking Changes to Valid Users:** Legitimate frontend sessions with valid JWTs in `hms_token` cookies or Bearer headers will continue functioning seamlessly.
2. **Defends Against IDOR & Data Tampering:** Prevents unauthenticated attackers from viewing, editing, or deleting patient charts via `/api/patients/[id]`.
3. **Stops Privilege Escalation:** Locks down `/api/auth/register` so arbitrary users cannot mint `ADMIN` accounts.
4. **Hardens Session Cookies:** Converts `hms_token` cookies to `httpOnly: true`, preventing credential exfiltration via Cross-Site Scripting (XSS).
5. **Provides Clean Grounding for Feature Completion:** Connecting Billing, Patient 360, and OT views (Phases B & C) onto a verified, secure API ensures frontend integration testing reflects production security conditions.

---

## 2. Comprehensive API Route Security Inventory (All 33 Endpoints)

Every API route handler in `site/app/api/` was inspected for:
* Verification of JWT authentication (`authenticateRequest`, `getCurrentUser`)
* Role-based access control (`authorizeRole`, `authorizePermission`, `requireRole`)
* Insecure Direct Object Reference (IDOR) vulnerabilities
* Insecure data modification / deletion operations
* Session cookie flag security

### Master Security Status Matrix

| # | Route Handler | Methods | Current Auth Status | Role Check | Security Rating | Primary Vulnerability / Concern |
|---|---|---|---|---|---|---|
| 1 | `/api/auth/login` | POST | None (Public by design) | None | **VULNERABLE (P1)** | Sets `httpOnly: false` on `hms_token` cookie; token exposed to document.cookie |
| 2 | `/api/auth/register` | POST | None | None | **CRITICAL (P0)** | Privilege escalation: Any unauthenticated client can register an `ADMIN` account |
| 3 | `/api/auth/me` | GET | `getCurrentUser` | None | **SECURE** | Validates JWT token from Bearer header or cookie |
| 4 | `/api/patients` | GET | `authenticateRequest` | None | **SECURE** | Requires authenticated session |
| 5 | `/api/patients` | POST | `authorizeRole` | ADMIN, DOCTOR, RECEPTIONIST, NURSE | **SECURE** | RBAC enforced |
| 6 | `/api/patients/[id]` | GET | **NONE** | **NONE** | **CRITICAL (P0)** | IDOR: Full clinical chart, appointments, lab/rad history open to unauthenticated access |
| 7 | `/api/patients/[id]` | PATCH | **NONE** | **NONE** | **CRITICAL (P0)** | IDOR / Data Tampering: Arbitrary caller can overwrite patient medical history and allergies |
| 8 | `/api/patients/[id]` | DELETE | **NONE** | **NONE** | **CRITICAL (P0)** | Unauthorized State Deletion: Anyone can mark patients as Discharged |
| 9 | `/api/prescriptions` | GET | **NONE** | **NONE** | **HIGH (P0)** | PHI Leak: Exposes all prescriptions, dosages, and patient names |
| 10 | `/api/prescriptions` | POST | **NONE** | **NONE** | **CRITICAL (P0)** | Medication Forgery: Anyone can create clinical prescriptions for any drug |
| 11 | `/api/beds` | GET | **NONE** | **NONE** | **MEDIUM (P0)** | Census Exposure: Ward occupancy and patient allocation visible without login |
| 12 | `/api/beds` | POST | **NONE** | **NONE** | **HIGH (P0)** | Unauthorized Inpatient Admission: Anyone can allocate beds and admit patients |
| 13 | `/api/beds` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Unauthorized Bed Tampering: Anyone can flip bed status |
| 14 | `/api/beds/[id]` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Unauthorized Bed Tampering: Direct status alteration by ID |
| 15 | `/api/discharges` | POST | **NONE** | **NONE** | **CRITICAL (P0)** | Unauthorized Discharge: Releases beds, settles billing, hardcodes "Dr. Sushruta" in logs |
| 16 | `/api/surgeries` | GET | **NONE** | **NONE** | **MEDIUM (P0)** | OT Schedule Disclosure: Exposes surgical schedule, surgeons, and patient names |
| 17 | `/api/surgeries` | POST | **NONE** | **NONE** | **HIGH (P0)** | Surgical Booking Forgery: Anyone can book surgery slots and assign surgeons |
| 18 | `/api/billing` | GET | `authenticateRequest` | None | **SECURE** | Requires authenticated session |
| 19 | `/api/billing` | POST | `authorizeRole` | ADMIN, BILLING | **SECURE** | Enforces billing role |
| 20 | `/api/billing/[id]/pay` | POST | **NONE** | **NONE** | **CRITICAL (P0)** | Financial Tampering: Anyone can record fake payments and mark invoices "Paid" |
| 21 | `/api/nursing/vitals` | POST | **NONE** | **NONE** | **HIGH (P0)** | Vitals Forgery: Hardcodes "Sister Anitha" fallback and IP `192.168.1.58` |
| 22 | `/api/emergency` | GET | `authenticateRequest` | None | **SECURE** | Requires authenticated session |
| 23 | `/api/emergency` | POST | `authorizeRole` | ADMIN, DOCTOR, NURSE, RECEPTIONIST | **SECURE** | RBAC enforced |
| 24 | `/api/emergency/[id]` | GET | **NONE** | **NONE** | **MEDIUM (P0)** | Emergency Case Disclosure: Exposes trauma case details |
| 25 | `/api/emergency/[id]` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Triage Tampering: Anyone can modify emergency triage severity and vitals |
| 26 | `/api/emergency/admit` | POST | `authorizeRole` | ADMIN, DOCTOR, NURSE | **SECURE** | RBAC enforced |
| 27 | `/api/appointments` | GET | `authenticateRequest` | None | **SECURE** | Requires authenticated session |
| 28 | `/api/appointments` | POST | `authorizeRole` | ADMIN, DOCTOR, RECEPTIONIST, NURSE | **SECURE** | RBAC enforced |
| 29 | `/api/appointments` | PATCH | `authorizeRole` | ADMIN, DOCTOR, RECEPTIONIST, NURSE | **SECURE** | RBAC enforced |
| 30 | `/api/appointments/[id]` | GET | **NONE** | **NONE** | **MEDIUM (P0)** | Appointment Disclosure: Details accessible without auth |
| 31 | `/api/appointments/[id]` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Status Tampering: Anyone can mark appointments Served / Cancelled |
| 32 | `/api/blood-bank` | GET | **NONE** | **NONE** | **MEDIUM (P0)** | Blood inventory levels accessible without auth |
| 33 | `/api/blood-bank` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Blood Unit Tampering: Anyone can deplete blood stock units |
| 34 | `/api/equipment` | GET | **NONE** | **NONE** | **LOW (P0)** | Equipment inventory accessible without auth |
| 35 | `/api/equipment` | POST | **NONE** | **NONE** | **MEDIUM (P0)** | Anyone can create biomedical equipment items |
| 36 | `/api/ambulances` | GET | **NONE** | **NONE** | **MEDIUM (P0)** | Fleet and live dispatch trips accessible without auth |
| 37 | `/api/ambulances` | POST | **NONE** | **NONE** | **HIGH (P0)** | Unauthorized Dispatch: Anyone can dispatch ambulances or register vehicles |
| 38 | `/api/ambulances` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Anyone can modify ambulance location and availability |
| 39 | `/api/doctors` | GET | **NONE** | **NONE** | **MEDIUM (P0)** | Doctor roster and contact details accessible without auth |
| 40 | `/api/doctors` | POST | **NONE** | **NONE** | **HIGH (P0)** | Anyone can add doctor staff records |
| 41 | `/api/staff` | GET | **NONE** | **NONE** | **HIGH (P0)** | Financial / HR Leak: Staff salaries and rosters accessible without auth |
| 42 | `/api/staff` | POST | **NONE** | **NONE** | **HIGH (P0)** | Anyone can onboard staff with arbitrary monthly salaries |
| 43 | `/api/radiology` | GET | **NONE** | **NONE** | **MEDIUM (P0)** | Radiology scan schedule & DICOM links accessible without auth |
| 44 | `/api/radiology` | POST | **NONE** | **NONE** | **HIGH (P0)** | Anyone can order imaging scans without clinical auth |
| 45 | `/api/radiology` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Anyone can modify radiology order status |
| 46 | `/api/radiology/reports` | POST | **NONE** | **NONE** | **CRITICAL (P0)** | Anyone can authorize reports & trigger billing; hardcodes "Dr. Jivaka" |
| 47 | `/api/lab-orders` | GET | `authenticateRequest` | None | **SECURE** | Requires authenticated session |
| 48 | `/api/lab-orders` | POST | `authorizeRole` | ADMIN, DOCTOR, NURSE, LAB_TECH | **SECURE** | RBAC enforced |
| 49 | `/api/lab-orders` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Lab order status update missing auth in `lab-orders/route.ts:L90` |
| 50 | `/api/lab-orders/[id]` | GET | **NONE** | **NONE** | **MEDIUM (P0)** | Patient test results accessible without auth |
| 51 | `/api/lab-orders/[id]` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Anyone can inject fake test results and modify lab order status |
| 52 | `/api/lab-orders/results` | POST | `authorizeRole` | ADMIN, DOCTOR, LAB_TECH | **SECURE** | Exists as reference implementation with transaction & audit log |
| 53 | `/api/pharmacy` | GET | `authenticateRequest` | None | **SECURE** | Requires authenticated session |
| 54 | `/api/pharmacy` | POST | `authorizeRole` | ADMIN, PHARMACIST | **SECURE** | RBAC enforced |
| 55 | `/api/pharmacy/[id]` | GET | **NONE** | **NONE** | **LOW (P0)** | Medicine details accessible without auth |
| 56 | `/api/pharmacy/[id]` | PATCH | **NONE** | **NONE** | **HIGH (P0)** | Anyone can decrement stock or trigger arbitrary restock |
| 57 | `/api/pharmacy/dispense` | POST | `authorizeRole` | ADMIN, PHARMACIST | **SECURE** | Enforces pharmacist role |
| 58 | `/api/dashboard/stats` | GET | **NONE** | **NONE** | **HIGH (P0)** | Financial & Census Leak: Total hospital revenue, census, audit logs exposed |
| 59 | `/api/audit-logs` | GET | `authorizeRole` | ADMIN, DOCTOR | **SECURE** | Enforces privileged read |
| 60 | `/api/audit-logs` | POST | **NONE** | **NONE** | **HIGH (P0)** | Log Tampering / Forgery: Anyone can write arbitrary audit log entries |

---

## 3. Minimal Security Fix Plan

To maintain stability and avoid breaking public entry points, we implement **defense-in-depth handler-level enforcement** using the existing `site/lib/auth.ts` and `site/lib/rbac.ts` helpers.

### Guiding Principles
1. **NO Blanket Global Edge Middleware:** Avoid intercepting all `/api/*` routes in Next.js middleware. Edge runtime route matchers frequently break public routes (`/api/auth/login`), static assets, and preflight OPTIONS requests.
2. **Keep Public Endpoints Accessible:** `/api/auth/login` remains unauthenticated.
3. **Strict Registration Control:** 
   - If no valid session is provided, registration accepts ONLY `role: "PATIENT"`.
   - Creating privileged staff roles (`ADMIN`, `DOCTOR`, `NURSE`, `PHARMACIST`, `LAB_TECH`, `RAD_TECH`, `BILLING`, `RECEPTIONIST`) requires an active `ADMIN` session verified via `authorizeRole(request, "ADMIN")`.
4. **Secure Cookie Configuration:** Enforce `httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production"` across all token cookies.
5. **Dynamic Audit Attribution:** Replace hardcoded strings (`"Dr. Sushruta"`, `"Sister Anitha"`, `"192.168.1.58"`) with real authenticated user context (`auth.user.id`, `auth.user.name`, `auth.user.role`, and real client IP).

---

## 4. Remediation Batches

### Batch 1: Authentication & Session Hardening (P0 / P1)
* **`site/app/api/auth/login/route.ts`**:
  * Set `httpOnly: true` (line 82).
* **`site/app/api/auth/register/route.ts`**:
  * Check requested role:
    * If `role.toUpperCase() !== "PATIENT"`, require `authorizeRole(request, "ADMIN")`.
    * If unauthorized, return `403 Forbidden` ("Creating staff accounts requires Administrator privileges").

### Batch 2: Core Patient & Clinical Protection (P0)
* **`site/app/api/patients/[id]/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST")`.
  * `DELETE`: Add `authorizeRole(request, "ADMIN", "DOCTOR")`.
* **`site/app/api/prescriptions/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `POST`: Add `authorizeRole(request, "ADMIN", "DOCTOR")`; use `auth.user.id` to bind doctor.
* **`site/app/api/discharges/route.ts`**:
  * `POST`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "NURSE")`; bind `auth.user.name` and `auth.user.role` to audit log.
* **`site/app/api/nursing/vitals/route.ts`**:
  * `POST`: Add `authorizeRole(request, "ADMIN", "NURSE", "DOCTOR")`; bind `auth.user.name` to `recordedBy` and audit log.

### Batch 3: Diagnostic, Surgical & Pharmacy Protection (P0)
* **`site/app/api/surgeries/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `POST`: Add `authorizeRole(request, "ADMIN", "DOCTOR")`.
* **`site/app/api/radiology/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `POST`: Add `authorizeRole(request, "ADMIN", "DOCTOR")`.
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "RAD_TECH")`.
* **`site/app/api/radiology/reports/route.ts`**:
  * `POST`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "RAD_TECH")`; bind `auth.user.name` to radiologist and audit log.
* **`site/app/api/lab-orders/route.ts`**:
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "LAB_TECH")`.
* **`site/app/api/lab-orders/[id]/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "LAB_TECH")`.
* **`site/app/api/pharmacy/[id]/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "PHARMACIST")`.

### Batch 4: Infrastructure, Inpatient, Billing & Audit Integrity (P0)
* **`site/app/api/billing/[id]/pay/route.ts`**:
  * `POST`: Add `authorizeRole(request, "ADMIN", "BILLING")`.
* **`site/app/api/beds/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `POST`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST")`.
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "NURSE", "DOCTOR")`.
* **`site/app/api/beds/[id]/route.ts`**:
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "NURSE", "DOCTOR")`.
* **`site/app/api/emergency/[id]/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "NURSE")`.
* **`site/app/api/appointments/[id]/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE")`.
* **`site/app/api/blood-bank/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "LAB_TECH")`.
* **`site/app/api/equipment/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `POST`: Add `authorizeRole(request, "ADMIN", "NURSE", "DOCTOR")`.
* **`site/app/api/ambulances/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `POST`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST")`.
  * `PATCH`: Add `authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST")`.
* **`site/app/api/doctors/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
  * `POST`: Add `authorizeRole(request, "ADMIN")`.
* **`site/app/api/staff/route.ts`**:
  * `GET`: Add `authorizeRole(request, "ADMIN")`.
  * `POST`: Add `authorizeRole(request, "ADMIN")`.
* **`site/app/api/dashboard/stats/route.ts`**:
  * `GET`: Add `authenticateRequest(request)`.
* **`site/app/api/audit-logs/route.ts`**:
  * `POST`: Add `authorizeRole(request, "ADMIN")`.

---

## 5. Verification Protocol

After applying each batch of fixes:
1. **TypeScript Static Check:** Run `npx tsc --noEmit` from `site/` to ensure zero compilation or signature errors.
2. **Next.js Build Verification:** Run `npm run build` to confirm all 33 route handlers compile cleanly into serverless Lambdas / Node handlers.
3. **Unauthenticated Probe Test:** Send curl/fetch requests without token to `/api/patients/[id]`, `/api/prescriptions`, `/api/billing/[id]/pay`, verifying each returns `401 Unauthorized` or `403 Forbidden`.
4. **Authorized Flow Test:** Log in via `/api/auth/login`, extract JWT token, and verify that authorized clinical operations succeed as expected.

---

## 6. Post-Remediation Verification Results (PASSED)

Executed on: October 12, 2026

### 6.1 TypeScript Compilation & Static Typecheck
```bash
npx tsc --noEmit
# Exit code: 0 (0 errors)
```

### 6.2 Next.js Turbopack Production Build
```bash
npm run build
# Compiled successfully in 6.6s
# 30 static pages, 32 dynamic API routes generated cleanly
# Exit code: 0
```

### 6.3 Automated Security Probes & Results
| Test Description | Path & Method | Expected | Actual Status | Result |
|---|---|---|---|---|
| Unauthenticated Patient Chart Fetch | `GET /api/patients/P-1001` | 401 Unauthorized | **401** | **PASS** |
| Unauthenticated Patient Chart Tamper | `PATCH /api/patients/P-1001` | 401 Unauthorized | **401** | **PASS** |
| Unauthenticated Prescriptions List | `GET /api/prescriptions` | 401 Unauthorized | **401** | **PASS** |
| Unauthenticated Prescription Creation | `POST /api/prescriptions` | 401 Unauthorized | **401** | **PASS** |
| Unauthenticated Invoice Payment Tampering | `POST /api/billing/inv-1/pay` | 401 Unauthorized | **401** | **PASS** |
| Unauthenticated Inpatient Discharge | `POST /api/discharges` | 401 Unauthorized | **401** | **PASS** |
| Unauthenticated Vitals Forgery | `POST /api/nursing/vitals` | 401 Unauthorized | **401** | **PASS** |
| Unauthenticated Hospital Stats & Revenue | `GET /api/dashboard/stats` | 401 Unauthorized | **401** | **PASS** |
| Unauthorized Staff/Admin Registration | `POST /api/auth/register` (`role: ADMIN`) | 403 Forbidden | **403** | **PASS** |
| Login & Session Cookie Flags | `POST /api/auth/login` | 200 OK + `HttpOnly` cookie | **200 OK** (`HttpOnly; Secure; SameSite=lax`) | **PASS** |
| Authenticated Bearer Patient Access | `GET /api/patients/P-1001` (Bearer JWT) | 200 OK | **200 OK** | **PASS** |
| Authenticated Bearer Dashboard Stats | `GET /api/dashboard/stats` (Bearer JWT) | 200 OK | **200 OK** | **PASS** |

