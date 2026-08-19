// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/audit-logs — Retrieve immutable audit trail (Admin & Compliance)
// POST /api/audit-logs — Record new audit event
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, role, action, resource, ip, status } = body;

    const logId = `LOG-${Date.now()}`;
    const log = await prisma.auditLog.create({
      data: {
        logId,
        userId: userId || null,
        userName: userName || "System Agent",
        role: role || "System",
        action,
        resource,
        ip: ip || request.headers.get("x-forwarded-for") || "127.0.0.1",
        status: status || "Success",
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("POST /api/audit-logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
