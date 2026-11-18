import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createToken,
  verifyToken,
  getJwtSecret,
  hashPassword,
  verifyPassword,
  JWT_ISSUER,
} from "@/lib/auth";
import { SignJWT } from "jose";

describe("Authentication & JWT Management (Unit Tests)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("creates a signed JWT with expected claims and issuer", async () => {
    process.env.JWT_SECRET = "test-secret-key-for-unit-testing-minimum-length-32";
    const user = {
      id: "usr-101",
      email: "doctor@dronagiri.health",
      role: "DOCTOR",
      name: "Dr. Dhanvantari",
    };

    const token = await createToken(user);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("usr-101");
    expect(verified?.email).toBe("doctor@dronagiri.health");
    expect(verified?.role).toBe("DOCTOR");
    expect(verified?.name).toBe("Dr. Dhanvantari");
  });

  it("rejects an invalid or tampered JWT token", async () => {
    process.env.JWT_SECRET = "test-secret-key-for-unit-testing-minimum-length-32";
    const user = {
      id: "usr-102",
      email: "nurse@dronagiri.health",
      role: "NURSE",
      name: "Head Nurse Ananya",
    };

    const token = await createToken(user);
    const tampered = token.slice(0, -6) + "xxxxxx";
    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });

  it("rejects an expired JWT token", async () => {
    process.env.JWT_SECRET = "test-secret-key-for-unit-testing-minimum-length-32";
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    // Mint token that expired 10 minutes ago
    const expiredToken = await new SignJWT({
      sub: "usr-103",
      email: "patient@dronagiri.health",
      role: "PATIENT",
      name: "Srimannarayana",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(JWT_ISSUER)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 1200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 600)
      .sign(secret);

    const result = await verifyToken(expiredToken);
    expect(result).toBeNull();
  });

  it("rejects a token signed with an unauthorized external secret", async () => {
    process.env.JWT_SECRET = "valid-hospital-secret-key-32-chars-long";
    const foreignSecret = new TextEncoder().encode("attacker-forged-secret-key-32-chars-long");

    const forgedToken = await new SignJWT({
      sub: "attacker-id",
      email: "attacker@malicious.com",
      role: "ADMIN",
      name: "Attacker",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(JWT_ISSUER)
      .setExpirationTime("24h")
      .sign(foreignSecret);

    const result = await verifyToken(forgedToken);
    expect(result).toBeNull();
  });

  it("fails safely and throws when JWT_SECRET is missing in production", () => {
    (process.env as any).NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    expect(() => getJwtSecret()).toThrow(
      /FATAL: JWT_SECRET environment variable is missing or empty in production/
    );
  });

  it("provides deterministic development secret when running in non-production", () => {
    (process.env as any).NODE_ENV = "development";
    delete process.env.JWT_SECRET;

    const secret = getJwtSecret();
    expect(secret).toBeInstanceOf(Uint8Array);
    expect(secret.length).toBeGreaterThan(30);
  });

  it("hashes passwords securely with bcrypt and verifies matches correctly", async () => {
    const raw = "SuperSecretPassword123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword!", hash);
    expect(isWrongMatch).toBe(false);
  });
});
