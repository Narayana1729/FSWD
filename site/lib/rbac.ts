// ─────────────────────────────────────────────────────────────────────────────
// Role-Based Access Control (RBAC)
// Server-side enforcement — not just UI hiding
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import { requireAuth, type AuthUser } from "@/lib/auth";

// ── Role Definitions ─────────────────────────────────────────────────────────

export type Role =
  | "ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "PHARMACIST"
  | "LAB_TECH"
  | "RAD_TECH"
  | "BILLING"
  | "RECEPTIONIST"
  | "PATIENT";

// ── Permission Matrix ────────────────────────────────────────────────────────
// Each role maps to a set of resource.action permissions.
// ADMIN has wildcard access (*).

const PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ["*"],

  DOCTOR: [
    "patients.read",
    "patients.update",
    "appointments.read",
    "appointments.update",
    "visits.read",
    "visits.create",
    "visits.update",
    "vitals.read",
    "consultations.*",
    "prescriptions.*",
    "lab-orders.read",
    "lab-orders.create",
    "radiology.read",
    "radiology.create",
    "beds.read",
    "admissions.read",
    "admissions.create",
    "admissions.update",
    "emergency.read",
    "emergency.update",
    "surgeries.*",
    "billing.read",
    "audit-logs.read",
    "dashboard.read",
  ],

  NURSE: [
    "patients.read",
    "appointments.read",
    "visits.read",
    "vitals.*",
    "beds.read",
    "beds.update",
    "admissions.read",
    "admissions.update",
    "emergency.read",
    "emergency.update",
    "blood-bank.read",
    "equipment.read",
    "dashboard.read",
  ],

  PHARMACIST: [
    "pharmacy.*",
    "prescriptions.read",
    "patients.read",
    "dashboard.read",
  ],

  LAB_TECH: [
    "lab-orders.*",
    "patients.read",
    "dashboard.read",
  ],

  RAD_TECH: [
    "radiology.*",
    "patients.read",
    "dashboard.read",
  ],

  BILLING: [
    "billing.*",
    "invoices.*",
    "payments.*",
    "patients.read",
    "admissions.read",
    "dashboard.read",
  ],

  RECEPTIONIST: [
    "patients.read",
    "patients.create",
    "appointments.*",
    "visits.create",
    "beds.read",
    "dashboard.read",
  ],

  PATIENT: [
    "own.read", // Can only read their own data
  ],
};

// ── Permission Check ─────────────────────────────────────────────────────────

export function hasPermission(
  role: string,
  resource: string,
  action: string
): boolean {
  const perms = PERMISSIONS[role as Role];
  if (!perms) return false;

  // Admin wildcard
  if (perms.includes("*")) return true;

  // Exact match
  if (perms.includes(`${resource}.${action}`)) return true;

  // Wildcard for resource (e.g. "consultations.*")
  if (perms.includes(`${resource}.*`)) return true;

  return false;
}

// ── Middleware: Require Role ─────────────────────────────────────────────────
// Use this in API routes: const user = await requireRole(request, "ADMIN", "DOCTOR");
// Throws 401 if not authenticated, 403 if role not allowed.

export async function requireRole(
  request: NextRequest,
  ...allowedRoles: Role[]
): Promise<AuthUser> {
  const user = await requireAuth(request);

  // Admin always passes
  if (user.role === "ADMIN") return user;

  if (!allowedRoles.includes(user.role as Role)) {
    throw new Response(
      JSON.stringify({
        error: "Forbidden",
        message: `Role '${user.role}' is not authorized for this action. Required: ${allowedRoles.join(", ")}`,
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return user;
}

// ── Middleware: Require Permission ───────────────────────────────────────────
// Fine-grained: const user = await requirePermission(request, "patients", "create");

export async function requirePermission(
  request: NextRequest,
  resource: string,
  action: string
): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, resource, action)) {
    throw new Response(
      JSON.stringify({
        error: "Forbidden",
        message: `Role '${user.role}' lacks permission '${resource}.${action}'`,
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return user;
}
