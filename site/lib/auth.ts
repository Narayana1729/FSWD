// ─────────────────────────────────────────────────────────────────────────────
// Authentication Utilities
// JWT creation/verification + password hashing
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "hms-fallback-secret-DO-NOT-USE-IN-PROD"
);
const JWT_ISSUER = "hms-enterprise";
const JWT_EXPIRY = "24h";

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
    .sign(JWT_SECRET);
}

// ── JWT Verification ─────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
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
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
}

// ── Require Auth (throws 401 Response if not authenticated) ──────────────────

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
