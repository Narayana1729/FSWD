import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { authorizeRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    const where: Record<string, unknown> = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.appointmentDate = { gte: d, lt: next };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, mrn: true, name: true, age: true, gender: true } },
        doctor: { select: { id: true, staffId: true, name: true, department: true } },
      },
      orderBy: { appointmentDate: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE");
    if (auth.error) return auth.error;

    const body = await request.json();
    const { patientId, doctorId, appointmentDate, appointmentTime, type, notes } = body;

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: "patientId, doctorId, appointmentDate, appointmentTime are required" },
        { status: 400 }
      );
    }

    // Generate token number (today's sequence)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.appointment.count({
      where: { appointmentDate: { gte: today } },
    });
    const tokenNo = todayCount + 1;

    const appointment = await prisma.appointment.create({
      data: {
        tokenNo,
        patientId,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        type: type || "Walk-in",
        notes: notes || null,
        status: "Waiting",
        avgWaitMins: Math.floor(Math.random() * 20) + 5,
      },
      include: {
        patient: { select: { id: true, mrn: true, name: true, age: true, gender: true } },
        doctor: { select: { id: true, name: true, department: true } },
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/appointments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE");
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id, tokenNo, status } = body;

    if (!id && tokenNo === undefined) {
      return NextResponse.json({ error: "id or tokenNo is required" }, { status: 400 });
    }

    let appointmentId = id;
    if (!appointmentId && tokenNo !== undefined) {
      const found = await prisma.appointment.findFirst({
        where: { tokenNo: parseInt(tokenNo) },
        orderBy: { appointmentDate: "desc" },
      });
      if (found) appointmentId = found.id;
    }

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { ...(status && { status }) },
    });

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error("PATCH /api/appointments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

