// ─────────────────────────────────────────────────────────────────────────────
// GET   /api/emergency/[id] — Get emergency case details
// PATCH /api/emergency/[id] — Update status/triage
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { authorizeRole } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const emergencyCase = await prisma.emergencyCase.findFirst({
      where: { OR: [{ id }, { caseId: id }] },
      include: { patient: true },
    });
    if (!emergencyCase) {
      return NextResponse.json({ error: "Emergency case not found" }, { status: 404 });
    }
    return NextResponse.json({ emergencyCase });
  } catch (error) {
    console.error("GET /api/emergency/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "NURSE");
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    if (body.vitals) {
      body.vitalsJson = JSON.stringify(body.vitals);
      delete body.vitals;
    }

    const emergencyCase = await prisma.emergencyCase.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ emergencyCase });
  } catch (error) {
    console.error("PATCH /api/emergency/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
