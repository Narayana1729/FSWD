# 📜 Development & Engineering Rules
## Dronagiri (Gandhamadana) — Enterprise Hospital Operating System

**Document Version:** 1.0.0  
**Scope:** Engineering Standards, Code Quality, Security, and Contribution Guidelines  

---

## 1. General Principles

1. **Patient Safety & Data Integrity First:** In healthcare informatics, silent data corruption or race conditions can endanger lives. Always favor explicit validation, transactional atomicity, and strict type verification over expedient shortcuts.
2. **Zero Client Trust:** Never trust data supplied by the browser or client application. User identities, role permissions, and financial tariffs must be derived and verified exclusively on the server.
3. **No Dead Code or Placeholders:** Do not commit empty stubs or placeholder mocks where concrete database queries or typed structures are expected.

---

## 2. TypeScript & Code Style Rules

### 2.1 Typing Discipline
- **Strict Mode Enabled:** `tsconfig.json` must enforce `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true`.
- **Prohibition of `any`:** The use of `any` is strictly banned. Use `unknown` with type narrowing, generics, or defined interfaces from `prisma/client` or `lib/hms-data.ts`.
- **Shared Types:** API response types and client hook return types must share single-source-of-truth TypeScript definitions.

### 2.2 File & Directory Naming Conventions
- React Components: Kebab-case filenames (e.g., `emergency-bay.tsx`, `auth-switch.tsx`, `radiology-pacs.tsx`).
- Utility Libraries & Hooks: Kebab-case prefixed by category (e.g., `use-hms-api.ts`, `hms-data.ts`, `rbac.ts`).
- API Routes: Standard Next.js route directory naming (`app/api/<resource>/route.ts`).

---

## 3. Next.js 16 & React 19 Architecture Rules

### 3.1 Client vs. Server Component Boundaries
- **Default to Server Components:** Keep pages and static wrappers as React Server Components (RSC) to minimize client bundle overhead.
- **Explicit `'use client'` Directive:** Add `'use client'` exclusively to components requiring:
  - React state hooks (`useState`, `useReducer`).
  - Lifecycle effects (`useEffect`, `useCallback`).
  - Browser APIs (HTML5 Canvas in PACS, window listeners, WebSockets).
- **No Hydration Mismatches:** Ensure time-dependent displays (e.g., "elapsed triage time" or real-time clocks) initialize consistently between server render and client mount.

### 3.2 Error Handling & User Feedback
- All asynchronous UI actions must display deterministic loading and error states via Radix UI spinners, skeletons, or Sonner toasts.
- Catch blocks must never fail silently. They must log structured errors to the browser console or server log and present human-readable error banners to clinical staff.

---

## 4. API Route & Security Enforcement Rules

### 4.1 Server-Side Authorization Checks
Every endpoint under `/api/*` performing mutating operations (`POST`, `PATCH`, `PUT`, `DELETE`) or retrieving protected PHI (Protected Health Information) MUST invoke server-side RBAC guards:

```typescript
// MANDATORY Pattern for every protected route handler
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  // 1. Enforce authentication and role permissions
  const auth = await requireRole(req, "DOCTOR");
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.message || "Unauthorized" }, 
      { status: auth.status }
    );
  }

  // 2. Safely access authenticated session claims
  const { user } = auth;
  
  // 3. Process business logic inside try/catch
  try {
    // ...
  } catch (error: unknown) {
    console.error("[API Error /api/resource]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

### 4.2 Mandatory Audit Trail Logging
Any mutation affecting clinical dossiers, bed assignments, prescriptions, or financial invoices MUST emit an immutable audit log entry:
- Derive `actorId` strictly from the decoded JWT session (never from client-supplied request bodies).
- Capture client IP (`req.headers.get("x-forwarded-for")`).
- Record affected entity and action type in standard uppercase format (e.g., `EMERGENCY_TRIAGE_ESCALATE`, `BED_OCCUPANCY_CHANGE`).

### 4.3 Input Validation
- Parse and validate JSON request bodies before passing values to Prisma queries.
- Reject unwhitelisted parameters to protect against mass-assignment vulnerabilities.

---

## 5. Database & Prisma ORM Guidelines

### 5.1 Relational Integrity & Transactions
- When a business workflow updates multiple models (e.g., admitting an ER patient requires updating `EmergencyCase.status`, `Bed.status`, and creating an `Admission` record), wrap the operations in a `prisma.$transaction`:

```typescript
const result = await prisma.$transaction(async (tx) => {
  const admission = await tx.admission.create({ data: admissionData });
  await tx.bed.update({
    where: { id: bedId },
    data: { status: "Occupied" },
  });
  await tx.emergencyCase.update({
    where: { id: caseId },
    data: { status: "Admitted" },
  });
  return admission;
});
```

### 5.2 Schema Migrations
- Never manually edit the local SQLite file (`dev.db`) using external GUI tools without running Prisma commands.
- Apply schema updates using `npx prisma db push` during development, or `npx prisma migrate dev` when generating versioned migration scripts.

---

## 6. UI/UX Design System Rules

### 6.1 Color Palette & Acuity Semantics
- Strictly respect clinical triage colors:
  - **RED (`#EF4444` / `bg-red-500`):** Reserved exclusively for Level-1 Resuscitation, critical abnormal lab values, and active trauma emergencies.
  - **YELLOW / AMBER (`#F59E0B` / `bg-amber-500`):** Urgent observation, pending verifications, or warning thresholds.
  - **GREEN (`#10B981` / `bg-emerald-500`):** Stable vitals, discharged status, normal lab results, available beds.
- Do not use arbitrary custom colors; always leverage Tailwind CSS semantic tokens defined in `styles/globals.css`.

### 6.2 Accessibility & Information Density
- Clinical monitors require high legibility: ensure minimum contrast ratios conforming to WCAG 2.1 AA standards.
- Tabular data must support keyboard navigation, clear row hovering, and explicit unit measurements (e.g., `mmHg`, `mg/dL`, `bpm`, `°C`).

---

## 7. Version Control & Git Workflow

- **Branching Model:** Feature branches created from `main` using naming convention `feature/<subsystem>-<description>` or `fix/<subsystem>-<issue>`.
- **Commit Messages:** Follow the Conventional Commits specification:
  - `feat(emergency): add rapid triage acuity recalculation`
  - `fix(pharmacy): prevent negative stock levels on bulk dispense`
  - `refactor(auth): enforce server-side requireRole in billing endpoints`
  - `docs(api): update swagger and architecture specifications`
- **Pre-Merge Validation:** Every pull request must pass TypeScript compile checks (`npm run build` or `npx tsc --noEmit`) with zero errors.
