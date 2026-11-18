# ⚠️ Dronagiri Hospital Management System: Master Risk Register

**Register Version:** 2.0.0  
**Audit Date:** October 19, 2026  
**Auditor:** Application Security Engineer & Lead Technical Auditor  
**Repository:** `/Users/srimannarayanadeevi/FSWD`  
**Application:** `/Users/srimannarayanadeevi/FSWD/site`  

---

## 1. Risk Evaluation & Classification Methodology

Risks in this register are classified using the standard **OWASP Risk Rating Methodology**, prioritizing exploitability, business/clinical impact, and prevalence rather than raw finding counts.

### Severity Levels:
- 🔴 **CRITICAL:** Immediate security exploitability, regulatory violation (HIPAA/DISHA breach), patient safety compromise, or financial corruption. Requires immediate remediation before production deployment or academic viva.
- 🟠 **HIGH:** High probability of data inconsistency, privilege escalation under specific conditions, severe performance degradation, or missing transaction boundaries.
- 🟡 **MEDIUM:** Moderate operational risk, unvalidated input payloads, client-side state desynchronization, architectural maintainability bottlenecks.
- 🔵 **LOW:** Minor accessibility issues, non-critical dependency warnings, minor UI inconsistencies.
- ⚪ **INFORMATIONAL:** Architectural observations, optimization opportunities, or standard platform notices.

### Confidence Levels:
- **CONFIRMED DEFECT:** Proved via source code inspection, reproduction command, or test execution failure.
- **HIGH RISK:** Clear vulnerability pattern with direct theoretical exploitability.
- **POTENTIAL RISK:** Unverified assumption or architecture pattern susceptible to failure under load or specific inputs.

---

## 2. Summary Risk Matrix

| Risk ID | Title | Category | Severity | Confidence | Exploitability | Impact |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **RSK-SEC-01** | Horizontal Clinical Data Leak (IDOR) on 8 API Collections | Security & Privacy (1, 3) | 🔴 **CRITICAL** | **CONFIRMED DEFECT** | High | Severe |
| **RSK-ATO-01** | Non-Atomic Medication Dispensing & Inventory Drift | Transaction Atomicity (8) | 🔴 **CRITICAL** | **CONFIRMED DEFECT** | Medium | Severe |
| **RSK-SEC-02** | JWT Token Exfiltration via LocalStorage Exposure | Authentication (2) | 🟠 **HIGH** | **CONFIRMED DEFECT** | Medium | High |
| **RSK-DAT-01** | Foreign Key Violation in Staff Onboarding | Database Integrity (7) | 🟠 **HIGH** | **CONFIRMED DEFECT** | High | High |
| **RSK-SEC-03** | Sensitive Financial & System Metrics Leak on Dashboard | Security & Privacy (1, 3) | 🟠 **HIGH** | **CONFIRMED DEFECT** | High | High |
| **RSK-CON-01** | Concurrent Lost Updates in Blood Bank Inventory | Concurrency (8) | 🟠 **HIGH** | **CONFIRMED DEFECT** | Medium | High |
| **RSK-TST-01** | False Confidence from Simulated Mock Unit Tests | Automated Testing (9) | 🟠 **HIGH** | **CONFIRMED DEFECT** | Low | High |
| **RSK-UI-01** | Optimistic Error Masking in OPD Consultations | Frontend State (10) | 🟠 **HIGH** | **CONFIRMED DEFECT** | Medium | High |
| **RSK-DEP-01** | Known Critical & High Dependency Vulnerabilities | Dependency Security (13) | 🟠 **HIGH** | **CONFIRMED DEFECT** | Medium | High |
| **RSK-API-01** | Unsanitized Mass-Assignment in Patient Updates | API Contract (4) | 🟡 **MEDIUM** | **CONFIRMED DEFECT** | Medium | Medium |
| **RSK-SEC-04** | Broad Audit Log Read Permission Granted to Doctor Role | Authorization (1) | 🟡 **MEDIUM** | **CONFIRMED DEFECT** | Low | Medium |
| **RSK-PERF-01**| Monolithic Patient Dossier Query Performance Degradation | Performance (14) | 🟡 **MEDIUM** | **HIGH RISK** | Low | Medium |
| **RSK-DEP-02** | Single-Node SQLite File Locking in Production | Deployment (15) | 🟡 **MEDIUM** | **HIGH RISK** | Low | High |
| **RSK-BAK-01** | Absence of Automated Database Backup & Recovery | Backup & Recovery (16) | 🟡 **MEDIUM** | **CONFIRMED DEFECT** | Low | High |
| **RSK-A11Y-01**| Non-Accessible Modal Dialogs and Raw Overlays | UI & A11y (11) | 🔵 **LOW** | **CONFIRMED DEFECT** | N/A | Low |
| **RSK-ARC-01** | Monolithic Frontend Component Architectures | Architecture (12) | 🔵 **LOW** | **CONFIRMED DEFECT** | N/A | Low |
| **RSK-DEP-03** | Next.js 16 Deprecated Middleware File Convention | Deployment (15) | ⚪ **INFO** | **CONFIRMED DEFECT** | N/A | Low |

---

## 3. Evidence-Backed Detailed Risk Findings

### 🔴 RSK-SEC-01: Horizontal Clinical Data Leak (IDOR) on 8 API Collections
* **Category:** Security and Authorization (1) / Patient Privacy and Resource Ownership (3)
* **Severity:** 🔴 **CRITICAL** | **Confidence:** **CONFIRMED DEFECT**
* **File References:**
  - `site/app/api/appointments/route.ts:11-37`
  - `site/app/api/prescriptions/route.ts:16-44`
  - `site/app/api/lab-orders/route.ts:16-33`
  - `site/app/api/radiology/route.ts:16-33`
  - `site/app/api/emergency/route.ts:16-30`
  - `site/app/api/beds/route.ts:15-47`
  - `site/app/api/surgeries/route.ts:16-24`
  - `site/app/api/billing/route.ts:16-43`
* **Evidence:**
  In all eight endpoints, `authenticateRequest(request)` validates that the caller has a valid JWT, but **none of these routes verify the user's role or enforce patient data ownership**. 
  For example, in `site/app/api/prescriptions/route.ts:22-24`:
  ```typescript
  if (patientId) {
    where.visit = { patientId };
  }
  ```
  If an authenticated patient makes a request without `?patientId=`, the `where` clause is `{}` (empty), and Prisma returns **every prescription for every patient in the entire hospital**. If they provide another patient's ID (e.g. `?patientId=P-1002`), Prisma returns that patient's medications without verifying whether the caller owns that record.
* **Impact:** Total breach of patient confidentiality (Protected Health Information / PHI). Any patient registered on the portal can scrape medical histories, diagnoses, surgery schedules, trauma admissions, and billing invoices of all hospital patients. Immediate violation of HIPAA, DISHA, and GDPR.
* **Reproduction Method:**
  1. Mint a JWT with role `PATIENT` and ID `usr-patient-1`.
  2. Send `GET /api/prescriptions` with `Authorization: Bearer <token>`.
  3. Inspect JSON response: all prescriptions from all patients are returned.
* **Recommended Remediation:**
  In each of these route handlers, check `auth.user.role`:
  ```typescript
  if (auth.user.role.toUpperCase() === "PATIENT") {
    const patientRecord = await getPatientForUser(auth.user);
    if (!patientRecord) return NextResponse.json({ items: [] });
    where.patientId = patientRecord.id; // or where.visit = { patientId: patientRecord.id }
  }
  ```
  For endpoints that patients have no clinical right to inspect (e.g. `surgeries`, `beds`, `emergency`), return `403 Forbidden`.
* **Suggested Regression Test:**
  Create integration test `tests/security/patient-collection-idor.test.ts` where a patient user queries each endpoint without parameters and asserts that only self-owned records (or 403 Forbidden) are returned.

---

### 🔴 RSK-ATO-01: Non-Atomic Medication Dispensing & Inventory Drift
* **Category:** Transaction Atomicity and Concurrency (8)
* **Severity:** 🔴 **CRITICAL** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `site/app/api/pharmacy/dispense/route.ts:90-175`
* **Evidence:**
  In `POST /api/pharmacy/dispense`, five database write operations occur sequentially without a Prisma transaction boundary:
  ```typescript
  // Step 2: Deduct stock in DB
  await prisma.medicine.update({ where: { id: med.id }, data: { stockQty: ... } });
  // Step 3: Mark Prescription as Dispensed
  await prisma.prescription.update({ where: { id: prescriptionId }, data: { status: "Dispensed" } });
  // Step 4: Create or update Invoice
  await prisma.invoice.create({ ... }); // or invoice.update(...)
  // Step 5: Add Invoice Item
  await prisma.invoiceItem.create({ ... });
  // Step 6: Create Audit Log
  await prisma.auditLog.create({ ... });
  ```
  If an error occurs during Step 4 or 5 (e.g., constraint error, database lock, schema validation failure), Step 2 and Step 3 have already committed. 
* **Impact:** Medications are deducted from inventory and marked dispensed, but the patient is never billed. Alternatively, in multi-item prescriptions, partial stock deduction leaves the inventory in an unrecoverable corrupted state.
* **Reproduction Method:**
  1. Simulate an invoice creation failure (e.g. invalid invoice data or database constraint).
  2. Call `POST /api/pharmacy/dispense`.
  3. Verify that medicine stock was decremented in `Medicine` table despite 500 error returned to client.
* **Recommended Remediation:**
  Wrap the entire operation inside `prisma.$transaction(async (tx) => { ... })`:
  ```typescript
  const transactionResult = await prisma.$transaction(async (tx) => {
    // 1. Deduct stock using tx.medicine.update
    // 2. Update prescription status using tx.prescription.update
    // 3. Upsert invoice using tx.invoice.upsert
    // 4. Create invoice item using tx.invoiceItem.create
    // 5. Create audit log using tx.auditLog.create
  });
  ```
* **Suggested Regression Test:**
  `tests/integration/pharmacy-atomicity.test.ts` simulating a simulated failure mid-transaction and asserting that medicine stock remains untouched.

---

### 🟠 RSK-SEC-02: JWT Token Exfiltration via LocalStorage Exposure
* **Category:** Authentication and Session Management (2)
* **Severity:** 🟠 **HIGH** | **Confidence:** **CONFIRMED DEFECT**
* **File References:**
  - `site/app/api/auth/login/route.ts:76-87`
  - `site/hooks/use-hms-api.ts:8-10`
* **Evidence:**
  `POST /api/auth/login` sets a secure cookie `hms_token` with `httpOnly: true`. However, lines 76-79 also return `{ user, token }` in the JSON response body. 
  The frontend then explicitly stores this token in browser local storage:
  ```typescript
  // site/hooks/use-hms-api.ts:8
  const token = localStorage.getItem("hms_auth_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  ```
* **Impact:** Storing tokens in `localStorage` nullifies the primary defense of `HttpOnly` cookies. Any Cross-Site Scripting (XSS) vulnerability or compromised third-party script can read `localStorage.getItem("hms_auth_token")` and exfiltrate credentials.
* **Reproduction Method:**
  1. Log into the application at `/hms`.
  2. Open browser console and execute `localStorage.getItem("hms_auth_token")`.
  3. The raw JWT is returned in plain text.
* **Recommended Remediation:**
  Rely exclusively on the `httpOnly` session cookie for web client authentication. Remove `localStorage.setItem("hms_auth_token")` from authentication handlers. In `site/hooks/use-hms-api.ts`, rely on `credentials: "same-origin"` rather than sending manual `Authorization: Bearer` headers.
* **Suggested Regression Test:**
  Assert in E2E tests that `localStorage.getItem("hms_auth_token")` is empty and API requests succeed via cookies alone.

---

### 🟠 RSK-DAT-01: Foreign Key Violation in Staff Onboarding
* **Category:** Database Schema and Integrity (7) / API Contract (4)
* **Severity:** 🟠 **HIGH** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `site/app/api/staff/route.ts:38-49`
* **Evidence:**
  In `POST /api/staff`:
  ```typescript
  const newStaff = await prisma.staff.create({
    data: {
      userId: `user-${Date.now()}`,
      staffId,
      name,
      role,
      departmentId: dept || "General",
      shift: shift || "Morning (7AM-3PM)",
      salaryMonthly: salary ? parseFloat(salary) : 5500,
      attendanceStatus: "Present",
    },
  });
  ```
  In `schema.prisma:167-168`:
  `user User @relation(fields: [userId], references: [id])`  
  `department Department @relation(fields: [departmentId], references: [id])`  
  No `User` record exists with ID `user-${Date.now()}`, and no `Department` record exists with ID `"General"`. On PostgreSQL or SQLite with enabled foreign keys, this operation crashes with a Prisma foreign key constraint violation.
* **Impact:** Creating new staff members via the Staff & HR module crashes with HTTP 500.
* **Reproduction Method:**
  Send `POST /api/staff` with `{ name: "Test Staff", role: "Nurse" }` under an `ADMIN` session.
* **Recommended Remediation:**
  First create a valid `User` account for the staff member, resolve the actual `Department` record from the database, and execute within a transaction:
  ```typescript
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ ... });
    const staff = await tx.staff.create({
      data: {
        userId: user.id,
        departmentId: resolvedDepartment.id,
        ...
      }
    });
    return staff;
  });
  ```
* **Suggested Regression Test:**
  `tests/integration/staff-creation.test.ts` asserting staff creation creates a linked user and resolves department ID.

---

### 🟠 RSK-SEC-03: Sensitive Financial & System Metrics Leak on Dashboard
* **Category:** Security and Authorization (1) / Patient Privacy (3)
* **Severity:** 🟠 **HIGH** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `site/app/api/dashboard/stats/route.ts:11-51`
* **Evidence:**
  `GET /api/dashboard/stats` only calls `authenticateRequest(request)`. Any logged-in user with role `PATIENT` receives:
  - Total hospital census
  - Admitted patient counts
  - Emergency room active cases
  - Total outstanding hospital debt (`outstandingPaymentsTotal`)
  - The last 5 system-wide audit logs (`latestAuditLogs`)
* **Impact:** Exposure of hospital financial metrics, administrative operational status, and staff audit entries to patients.
* **Reproduction Method:**
  Issue `GET /api/dashboard/stats` using an authenticated patient JWT. Verify that revenue figures and audit logs are returned.
* **Recommended Remediation:**
  Enforce role authorization:
  ```typescript
  const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "BILLING");
  if (auth.error) return auth.error;
  ```
* **Suggested Regression Test:**
  Assert that requests to `/api/dashboard/stats` with role `PATIENT` return HTTP 403 Forbidden.

---

### 🟠 RSK-CON-01: Concurrent Lost Updates in Blood Bank Inventory
* **Category:** Transaction Atomicity and Concurrency (8)
* **Severity:** 🟠 **HIGH** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `site/app/api/blood-bank/route.ts:40-52`
* **Evidence:**
  In `PATCH /api/blood-bank`:
  ```typescript
  const current = await prisma.bloodUnit.findUnique({ where: { bloodGroup } });
  const updatedUnits = Math.max(0, current.unitsAvailable + unitsChange);
  const updated = await prisma.bloodUnit.update({
    where: { bloodGroup },
    data: { unitsAvailable: updatedUnits },
  });
  ```
  If two staff members simultaneously dispense blood (e.g., in an emergency surgery), both read the same initial `unitsAvailable`. Both perform addition/subtraction in local memory and overwrite each other's updates.
* **Impact:** Blood bank inventory drift; blood units recorded in the database will not match actual physical units in blood bank refrigerators.
* **Reproduction Method:**
  Issue 10 concurrent requests to `/api/blood-bank` decrementing 1 unit each from a starting stock of 50. The resulting stock is ~45-48 instead of 40.
* **Recommended Remediation:**
  Use Prisma's atomic numeric update:
  ```typescript
  const updated = await prisma.bloodUnit.update({
    where: { bloodGroup },
    data: { unitsAvailable: { increment: unitsChange } },
  });
  ```
* **Suggested Regression Test:**
  `tests/concurrency/blood-bank-atomic.test.ts` firing concurrent requests using `Promise.all` and checking exact final unit count.

---

### 🟠 RSK-TST-01: False Confidence from Simulated Mock Unit Tests
* **Category:** Automated Test Coverage and Quality (9)
* **Severity:** 🟠 **HIGH** | **Confidence:** **CONFIRMED DEFECT**
* **File References:**
  - `site/__tests__/financial-transactions.test.ts:12-60`
  - `site/__tests__/state-rollback.test.ts:11-92`
* **Evidence:**
  `financial-transactions.test.ts` defines an inline function `processPayment` within the test file itself. It does **not** test `site/app/api/billing/[id]/pay/route.ts`. Similarly, `state-rollback.test.ts` defines a dummy `MockStateStore` class and does not test `site/hooks/use-hms-api.ts`.
* **Impact:** Tests pass 100% in CI while production code could be broken or failing. Gives architects and auditors false confidence.
* **Reproduction Method:**
  Introduce an intentional bug into `/api/billing/[id]/pay/route.ts`. Run `npm test`. All 29 tests continue to pass.
* **Recommended Remediation:**
  Import and test actual application code: test the route handler directly using Next.js `NextRequest` mocks and SQLite test database.
* **Suggested Regression Test:**
  Delete mock implementations and bind tests directly to `@/app/api/billing/[id]/pay/route` and `@/hooks/use-hms-api`.

---

### 🟠 RSK-UI-01: Optimistic Error Masking in OPD Consultations
* **Category:** Frontend State Management (10)
* **Severity:** 🟠 **HIGH** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `site/components/hms/opd-appointments.tsx:782-809`
* **Evidence:**
  In `handleCreateBooking`:
  ```typescript
  try {
    await fetch("/api/appointments", ...);
  } catch (err) {
    console.warn("Failed to persist appointment:", err);
  }
  const updated = [newT, ...tokens];
  setTokens(updated);
  setOpdSuccess(`Token #${newT.tokenNo} issued for ${newT.patientName}...`);
  ```
  `await fetch(...)` does not throw on HTTP 400, 401, 403, or 500. Even if network fails, the `catch` block continues to execute local state updates and sets a green success notification.
* **Impact:** Clinical staff believes an appointment or consultation was saved to the server and database, but upon page refresh or viewing from another terminal, the record is missing.
* **Reproduction Method:**
  1. Disconnect network or stop dev server.
  2. Click "Add Patient Token".
  3. Green success notification appears and token appears in queue.
  4. Reload page: token disappears.
* **Recommended Remediation:**
  Check `const res = await fetch(...)`; if `!res.ok`, throw error, abort state updates, and display red error alert.
* **Suggested Regression Test:**
  Unit test simulating failed API response and asserting state does not update.

---

### 🟠 RSK-DEP-01: Known Critical & High Dependency Vulnerabilities
* **Category:** Dependency and Configuration Security (13)
* **Severity:** 🟠 **HIGH** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `site/package.json`, `npm audit` log
* **Evidence:**
  `npm audit` reports 11 vulnerabilities (1 critical, 10 high):
  - Next.js 16.2.0 (GHSA-q4gf-8mx6-v5v3: DoS with Server Components, middleware bypasses).
  - deepmerge-ts / @prisma/config (GHSA-ggr8-5vv4-36mx: stack exhaustion).
  - postcss <=8.5.22 (GHSA-qx2v-qp2m-jg93: path traversal).
* **Impact:** Potential remote denial of service or perimeter authorization bypass via maliciously crafted HTTP requests.
* **Reproduction Method:** Run `npm audit` inside `/Users/srimannarayanadeevi/FSWD/site`.
* **Recommended Remediation:** Update Next.js to latest non-vulnerable patch release (`16.3.8+` or `16.4.2`).
* **Suggested Regression Test:** Run `npm audit` as part of CI pipeline, failing on high or critical vulnerabilities.

---

### 🟡 RSK-API-01: Unsanitized Mass-Assignment in Patient Updates
* **Category:** API Contract and Validation (4)
* **Severity:** 🟡 **MEDIUM** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `site/app/api/patients/[id]/route.ts:165-186`
* **Evidence:**
  `const data: Record<string, unknown> = { ...body };` directly updates Prisma without field whitelisting. A caller can send `userId`, `mrn`, or arbitrary keys.
* **Impact:** Accidental overwriting of internal identifiers or Prisma schema errors.
* **Recommended Remediation:** Use a Zod schema to parse and strip unexpected fields.

---

### 🟡 RSK-SEC-04: Broad Audit Log Read Permission Granted to Doctor Role
* **Category:** Security and Authorization (1)
* **Severity:** 🟡 **MEDIUM** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `site/app/api/audit-logs/route.ts:12`
* **Evidence:**
  `authorizeRole(request, "ADMIN", "DOCTOR")` allows attending doctors to inspect all system audit logs.
* **Impact:** Internal compliance exposure; doctors can monitor administrative activities and peer access logs.
* **Recommended Remediation:** Restrict `GET /api/audit-logs` strictly to `ADMIN` and dedicated compliance roles.

---

### 🟡 RSK-PERF-01: Monolithic Patient Dossier Query Performance Degradation
* **Category:** Performance and Scalability (14)
* **Severity:** 🟡 **MEDIUM** | **Confidence:** **HIGH RISK**
* **File References:** `site/app/api/patients/[id]/route.ts:21-109`
* **Evidence:**
  Fetches 9 related tables with nested objects in a single query.
* **Impact:** High latency (>1000ms) as longitudinal records accumulate over time.
* **Recommended Remediation:** Paginate historical collections (`visits`, `labOrders`, `invoices`) or fetch on-demand via sub-routes.

---

### 🟡 RSK-DEP-02: Single-Node SQLite File Locking in Production
* **Category:** Deployment Readiness (15)
* **Severity:** 🟡 **MEDIUM** | **Confidence:** **HIGH RISK**
* **File References:** `site/prisma/schema.prisma:9-11`
* **Evidence:** `provider = "sqlite"` with file `dev.db`.
* **Impact:** Inability to scale horizontally or deploy to serverless containers without data loss. `SQLITE_BUSY` errors during concurrent writes.
* **Recommended Remediation:** Migrate Prisma datasource to PostgreSQL (`provider = "postgresql"`) for staging and production.

---

### 🟡 RSK-BAK-01: Absence of Automated Database Backup & Recovery
* **Category:** Backup and Recovery (16)
* **Severity:** 🟡 **MEDIUM** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `site/prisma/`
* **Evidence:** No backup script exists; only an ad-hoc unversioned copy `dev.db.backup_1792044613`.
* **Impact:** High risk of unrecoverable data loss upon schema corruption or server failure.
* **Recommended Remediation:** Implement automated backup script `scripts/backup-db.sh` using SQLite `.backup` command with timestamping and retention policies.

---

### 🔵 RSK-A11Y-01: Non-Accessible Modal Dialogs and Raw Overlays
* **Category:** UI Consistency and Accessibility (11)
* **Severity:** 🔵 **LOW** | **Confidence:** **CONFIRMED DEFECT**
* **File References:**
  - `site/components/hms/opd-appointments.tsx:1330`
  - `site/components/hms/laboratory.tsx:190`
* **Evidence:** Raw `fixed inset-0` `div` containers without ARIA attributes or focus trap.
* **Impact:** Accessibility failure for screen readers and keyboard-only navigation.
* **Recommended Remediation:** Use Radix UI `Dialog.Root`, `Dialog.Content`, and `Dialog.Title`.

---

### 🔵 RSK-ARC-01: Monolithic Frontend Component Architectures
* **Category:** Architecture and Maintainability (12)
* **Severity:** 🔵 **LOW** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** `opd-appointments.tsx` (1,430 lines), `billing-insurance.tsx` (1,006 lines), `patients.tsx` (903 lines)
* **Evidence:** Excessively large components combining rendering, state, and networking.
* **Impact:** High cognitive overhead, difficult testing and maintenance.
* **Recommended Remediation:** Split each view into modular presentation and container components.

---

### ⚪ RSK-DEP-03: Next.js 16 Deprecated Middleware File Convention
* **Category:** Deployment Readiness (15)
* **Severity:** ⚪ **INFORMATIONAL** | **Confidence:** **CONFIRMED DEFECT**
* **File References:** Next.js build terminal warning
* **Evidence:** `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`
* **Impact:** Future compatibility warning in Next.js 16.
* **Recommended Remediation:** Migrate `middleware.ts` to the recommended `proxy` convention as Next.js 16 evolves.
