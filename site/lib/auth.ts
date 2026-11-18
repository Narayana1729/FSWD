// ─────────────────────────────────────────────────────────────────────────────
// Authentication Utilities
// JWT creation/verification + password hashing
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export const JWT_ISSUER = "hms-enterprise";
export const JWT_EXPIRY = "24h";

/**
 * Retrieves the cryptographic secret key for JWT signing and verification.
 * In production, fails safely with an explicit Error if JWT_SECRET is unset.
 * In development or test, uses an explicit, safe fallback secret.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: JWT_SECRET environment variable is missing or empty in production. Authentication cannot initialize safely."
      );
    }
    // Explicit, deterministic development secret (never permitted in production)
    return new TextEncoder().encode("dronagiri-dev-jwt-secret-do-not-use-in-production-min32bytes!");
  }
  return new TextEncoder().encode(secret.trim());
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

// ── Password Hashing ─────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT Creation ─────────────────────────────────────────────────────────────

export async function createToken(user: {
  id: string;
  email: string;
  role: string;
  name: string;
}): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

// ── JWT Verification ─────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      algorithms: ["HS256"],
    });
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// ── Extract User from Request ────────────────────────────────────────────────

export async function getCurrentUser(
  request: NextRequest
): Promise<AuthUser | null> {
  let token: string | undefined;

  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  } else {
    token = request.cookies.get("hms_token")?.value;
  }

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
}

// ── Authenticate Request (returns { user } or { error: NextResponse }) ────────

export async function authenticateRequest(
  request: NextRequest
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
  return { user };
}

// ── Require Auth (throws 401 Response if not authenticated) ──────────────────

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const auth = await authenticateRequest(request);
  if (auth.error) {
    throw auth.error;
  }
  return auth.user;
}

