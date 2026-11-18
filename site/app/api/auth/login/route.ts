// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login — Authenticate and return JWT
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check direct email or doctor prefix alias (dr.dhanvantari <-> dhanvantari)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { email: cleanEmail.startsWith("dr.") ? cleanEmail.replace(/^dr\./, "") : `dr.${cleanEmail}` },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 403 }
      );
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        logId: `LOG-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: "user_login",
        resource: `User ${user.email}`,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        status: "Success",
      },
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });

    response.cookies.set("hms_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
