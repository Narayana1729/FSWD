// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/prescriptions — List all patient prescriptions
// POST /api/prescriptions — Create a new doctor prescription with items
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { authorizeRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (patientId) {
      where.visit = { patientId };
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        visit: {
          include: {
            patient: { select: { id: true, mrn: true, name: true, age: true, gender: true } },
          },
        },
        doctor: { select: { id: true, name: true, department: true } },
        items: {
          include: {
            medicine: { select: { id: true, name: true, stockQty: true, unitPrice: true, batchNo: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error("GET /api/prescriptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR");
    if (auth.error) return auth.error;

    const body = await request.json();
    const { patientId, doctorId, visitId, items, notes } = body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "patientId and at least one item (medicineName, quantity) are required" },
        { status: 400 }
      );
    }

    // Resolve targetDoctorId (either CUID or staffId like DOC-101)
    let targetDoctorId = doctorId;
    let doc = await prisma.doctor.findFirst({
      where: {
        OR: [{ id: doctorId || "" }, { staffId: doctorId || "" }],
      },
    });

    if (!doc) {
      doc = (await prisma.doctor.findFirst())!;
    }
    targetDoctorId = doc.id;

    // Ensure or find a active visit for patient
    let targetVisitId = visitId;
    if (!targetVisitId) {
      const activeVisit = await prisma.visit.findFirst({
        where: { patientId },
        orderBy: { createdAt: "desc" },
      });

      if (activeVisit) {
        targetVisitId = activeVisit.id;
      } else {
        // Create visit record
        const newVisit = await prisma.visit.create({
          data: {
            patientId,
            doctorId: targetDoctorId,
            type: "OPD",
            status: "In Progress",
            chiefComplaint: notes || "OPD Consultation",
          },
        });
        targetVisitId = newVisit.id;
      }
    }

    const prescription = await prisma.prescription.create({
      data: {
        visitId: targetVisitId,
        doctorId: targetDoctorId,
        status: "Active",
        notes: notes || "Standard OPD Consultation Prescription",
        items: {
          create: items.map((item: any) => ({
            medicineId: item.medicineId || null,
            medicineName: item.medicineName,
            dosage: item.dosage || "500mg",
            frequency: item.frequency || "1-0-1",
            duration: item.duration || "5 days",
            quantity: parseInt(item.quantity) || 1,
            instructions: item.instructions || "After meals",
          })),
        },
      },
      include: {
        visit: {
          include: {
            patient: { select: { id: true, mrn: true, name: true } },
          },
        },
        doctor: { select: { id: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/prescriptions error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
