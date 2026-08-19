// ─────────────────────────────────────────────────────────────────────────────
// GET    /api/patients/[id] — Retrieve a single patient
// PATCH  /api/patients/[id] — Update a patient
// DELETE /api/patients/[id] — Soft-delete (set inactive)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patient = await prisma.patient.findFirst({
      where: { OR: [{ id }, { mrn: id }] },
      include: {
        department: true,
        appointments: { orderBy: { appointmentDate: "desc" }, take: 10 },
        admissions: { orderBy: { admittedAt: "desc" }, take: 5 },
        invoices: { orderBy: { createdAt: "desc" }, take: 5 },
        labOrders: { orderBy: { orderedAt: "desc" }, take: 10 },
        radiologyOrders: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("GET /api/patients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Convert nested objects to JSON strings for SQLite
    const data: Record<string, unknown> = { ...body };
    if (body.emergencyContact) data.emergencyContactJson = JSON.stringify(body.emergencyContact);
    if (body.medicalHistory) data.medicalHistoryJson = JSON.stringify(body.medicalHistory);
    if (body.allergies) data.allergiesJson = JSON.stringify(body.allergies);
    if (body.currentConditions) data.currentConditionsJson = JSON.stringify(body.currentConditions);
    if (body.insurance) data.insuranceJson = JSON.stringify(body.insurance);

    // Remove the original nested keys
    delete data.emergencyContact;
    delete data.medicalHistory;
    delete data.allergies;
    delete data.currentConditions;
    delete data.insurance;

    const patient = await prisma.patient.update({
      where: { id },
      data,
      include: { department: true },
    });

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("PATCH /api/patients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.patient.update({
      where: { id },
      data: { status: "Discharged" },
    });
    return NextResponse.json({ message: "Patient record archived" });
  } catch (error) {
    console.error("DELETE /api/patients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
