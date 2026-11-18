// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/audit-logs — Retrieve immutable audit trail (Admin & Compliance)
// POST /api/audit-logs — Record new audit event
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR");
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { action: { contains: search } },
        { resource: { contains: search } },
        { role: { contains: search } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    const formattedLogs = logs.map((l) => ({
      id: l.logId || l.id,
      timestamp: l.timestamp.toISOString(),
      user: l.userName,
      userName: l.userName,
      role: l.role,
      action: l.action,
      resource: l.resource,
      ip: l.ip || "127.0.0.1",
      status: l.status,
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN");
    if (auth.error) return auth.error;
    const user = auth.user;

    const body = await request.json();
    const { action, resource, status, details } = body;

    if (!action || !resource) {
      return NextResponse.json(
        { error: "action and resource are required" },
        { status: 400 }
      );
    }

    const logId = `LOG-${Date.now()}`;
    const log = await prisma.auditLog.create({
      data: {
        logId,
        // Strictly derive actor identity from the authenticated server-side context
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: String(action),
        resource: String(resource),
        ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
        status: status || "Success",
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("POST /api/audit-logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
