// ─────────────────────────────────────────────────────────────────────────────
// Role-Based Access Control (RBAC)
// Server-side enforcement — not just UI hiding
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import { requireAuth, getCurrentUser, type AuthUser } from "@/lib/auth";
export type { AuthUser };


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
  const normalizedRole = (role || "").toUpperCase() as Role;
  const perms = PERMISSIONS[normalizedRole];
  if (!perms) return false;

  // Admin wildcard
  if (perms.includes("*")) return true;

  // Exact match
  if (perms.includes(`${resource}.${action}`)) return true;

  // Wildcard for resource (e.g. "consultations.*")
  if (perms.includes(`${resource}.*`)) return true;

  return false;
}

// ── Non-throwing Role Authorization ──────────────────────────────────────────

export async function authorizeRole(
  request: NextRequest,
  ...allowedRoles: string[]
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: Response }> {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: "Unauthorized", message: "Authentication required to access this resource" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  const userRole = (user.role || "").toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  // Admin always passes
  if (userRole === "ADMIN") {
    return { user };
  }

  if (!normalizedAllowed.includes(userRole)) {
    return {
      error: new Response(
        JSON.stringify({
          error: "Forbidden",
          message: `Role '${user.role}' is not authorized for this action. Required: ${allowedRoles.join(", ")}`,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { user };
}

// ── Non-throwing Permission Authorization ────────────────────────────────────

export async function authorizePermission(
  request: NextRequest,
  resource: string,
  action: string
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: Response }> {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: "Unauthorized", message: "Authentication required to access this resource" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  if (!hasPermission(user.role, resource, action)) {
    return {
      error: new Response(
        JSON.stringify({
          error: "Forbidden",
          message: `Role '${user.role}' lacks permission '${resource}.${action}'`,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { user };
}

// ── Middleware: Require Role (Throws 401/403 Response) ────────────────────────

export async function requireRole(
  request: NextRequest,
  ...allowedRoles: (Role | string)[]
): Promise<AuthUser> {
  const auth = await authorizeRole(request, ...allowedRoles);
  if (auth.error) {
    throw auth.error;
  }
  return auth.user;
}

// ── Middleware: Require Permission (Throws 401/403 Response) ──────────────────

export async function requirePermission(
  request: NextRequest,
  resource: string,
  action: string
): Promise<AuthUser> {
  const auth = await authorizePermission(request, resource, action);
  if (auth.error) {
    throw auth.error;
  }
  return auth.user;
}

// ── Resource-Level Authorization: Patient Ownership ──────────────────────────

/**
 * Look up the Patient record associated with the authenticated user.
 * Matches by userId, or falls back to case-insensitive email match.
 * Resolves the persistent link if userId was previously unassigned.
 */
export async function getPatientForUser(
  user: AuthUser,
  dbClient?: any
): Promise<{ id: string; mrn: string; userId: string | null; email: string | null } | null> {
  const client = dbClient || (await import("@/lib/db")).prisma;
  const patient = await client.patient.findFirst({
    where: {
      OR: [
        { userId: user.id },
        ...(user.email ? [{ email: user.email }] : []),
      ],
    },
    select: { id: true, mrn: true, userId: true, email: true },
  });

  if (patient && !patient.userId && user.id) {
    // Automatically bind the userId to establish permanent relational foreign key
    try {
      await client.patient.update({
        where: { id: patient.id },
        data: { userId: user.id },
      });
      patient.userId = user.id;
    } catch {
      // Ignored if concurrent update occurs
    }
  }

  return patient;
}

/**
 * Validates whether an authenticated user is authorized to access a given patient record.
 * - Non-PATIENT roles (ADMIN, DOCTOR, NURSE, etc.) have role-based authorization.
 * - PATIENT role can ONLY access their own patient record (matched by userId or email).
 */
export function isPatientOwner(
  user: AuthUser,
  patient: { id: string; mrn?: string | null; userId?: string | null; email?: string | null }
): boolean {
  if (user.role.toUpperCase() !== "PATIENT") {
    return true; // Staff access is handled by role permissions
  }
  const idMatches = Boolean(patient.userId) && patient.userId === user.id;
  const emailMatches =
    Boolean(patient.email) &&
    Boolean(user.email) &&
    patient.email!.trim().toLowerCase() === user.email.trim().toLowerCase();

  return idMatches || emailMatches;
}


