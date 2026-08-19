// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/beds — List all beds (filter by ward, status)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const ward = searchParams.get("ward");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const beds = await prisma.bed.findMany({
      where,
      include: {
        room: { include: { ward: true } },
        attendingDoctor: { select: { id: true, name: true } },
        nurseAssigned: { select: { id: true, name: true } },
      },
      orderBy: { bedNo: "asc" },
    });

    // Filter by ward name if specified
    const filtered = ward
      ? beds.filter((b) => b.room.ward.type === ward || b.room.ward.name === ward)
      : beds;

    // Summary stats
    const summary = {
      total: filtered.length,
      available: filtered.filter((b) => b.status === "Available").length,
      occupied: filtered.filter((b) => b.status === "Occupied").length,
      cleaning: filtered.filter((b) => b.status === "Cleaning").length,
      maintenance: filtered.filter((b) => b.status === "Maintenance").length,
      reserved: filtered.filter((b) => b.status === "Reserved").length,
    };

    return NextResponse.json({ beds: filtered, summary });
  } catch (error) {
    console.error("GET /api/beds error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bedId, bedNo, patientId } = body;

    if (!patientId || (!bedId && !bedNo)) {
      return NextResponse.json({ error: "patientId and bedId/bedNo are required" }, { status: 400 });
    }

    const where = bedId ? { id: bedId } : { bedNo };
    const bed = await prisma.bed.findUnique({ where, include: { room: { include: { ward: true } } } });

    if (!bed) {
      return NextResponse.json({ error: "Specified bed was not found in hospital inventory." }, { status: 404 });
    }

    if (bed.status !== "Available") {
      return NextResponse.json(
        { error: `Cannot allocate Bed ${bed.bedNo}. Status is currently "${bed.status}".` },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient record not found." }, { status: 404 });
    }

    if (patient.status === "Admitted") {
      return NextResponse.json(
        { error: `Patient "${patient.name}" is already admitted in an inpatient ward.` },
        { status: 400 }
      );
    }

    // Allocate bed & admit patient atomically
    const [updatedBed, updatedPatient] = await prisma.$transaction([
      prisma.bed.update({
        where: { id: bed.id },
        data: {
          status: "Occupied",
          patientId: patient.id,
          patientName: patient.name,
          admittedDate: new Date().toISOString().slice(0, 10),
        },
        include: { room: { include: { ward: true } } },
      }),
      prisma.patient.update({
        where: { id: patient.id },
        data: { status: "Admitted" },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userName: "Admissions Officer",
        role: "Admissions",
        action: "ALLOCATE_BED_ADMIT_PATIENT",
        resource: `Allocated ${updatedBed.room.ward.name} Bed #${updatedBed.bedNo} for patient ${patient.name}.`,
        ip: "192.168.1.60",
        status: "Success",
      },
    });

    return NextResponse.json({ success: true, bed: updatedBed, patient: updatedPatient }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/beds error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, bedNo, status, patientName, patientId } = body;

    if (!id && !bedNo) {
      return NextResponse.json({ error: "id or bedNo is required" }, { status: 400 });
    }

    const where = id ? { id } : { bedNo };
    const updated = await prisma.bed.update({
      where,
      data: {
        ...(status && { status }),
        ...(patientName !== undefined && { patientName }),
        ...(patientId !== undefined && { patientId }),
      },
    });

    return NextResponse.json({ bed: updated });
  } catch (error: any) {
    console.error("PATCH /api/beds error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
