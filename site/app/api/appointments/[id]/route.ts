// ─────────────────────────────────────────────────────────────────────────────
// GET   /api/appointments/[id] — Get single appointment
// PATCH /api/appointments/[id] — Update status (Serving → Completed, etc.)
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
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { department: true } },
        visit: true,
      },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("GET /api/appointments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE");
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const appointment = await prisma.appointment.update({
      where: { id },
      data: body,
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("PATCH /api/appointments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
