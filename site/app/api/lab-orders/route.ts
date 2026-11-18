// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/lab-orders — List lab orders (filter by status, patient)
// POST /api/lab-orders — Create a new lab order
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
    if (patientId) where.patientId = patientId;

    const labOrders = await prisma.labOrder.findMany({
      where,
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        results: true,
      },
      orderBy: { orderedAt: "desc" },
    });

    return NextResponse.json({ labOrders });
  } catch (error) {
    console.error("GET /api/lab-orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "LAB_TECH");
    if (auth.error) return auth.error;

    const body = await request.json();

    const { patientId, doctorId, visitId, testName, category, sampleType } = body;

    if (!patientId || !testName) {
      return NextResponse.json(
        { error: "patientId and testName are required" },
        { status: 400 }
      );
    }

    // Resolve targetDoctorId
    let doc = await prisma.doctor.findFirst({
      where: { OR: [{ id: doctorId || "" }, { staffId: doctorId || "" }] },
    });
    if (!doc) doc = (await prisma.doctor.findFirst())!;
    const targetDoctorId = doc ? doc.id : "DOC-101";

    // Generate order ID
    const count = await prisma.labOrder.count();
    const orderId = `LAB-${401 + count}`;

    const labOrder = await prisma.labOrder.create({
      data: {
        orderId,
        patientId,
        doctorId: targetDoctorId,
        visitId: visitId || null,
        testName,
        category: category || "Hematology",
        sampleType: sampleType || "Blood",
        status: "Requested",
      },
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
      },
    });

    return NextResponse.json({ labOrder }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/lab-orders error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "LAB_TECH");
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id, orderId, status, technician } = body;

    if (!id && !orderId) {
      return NextResponse.json({ error: "id or orderId is required" }, { status: 400 });
    }

    const where = id ? { id } : { orderId };
    const currentOrder = await prisma.labOrder.findUnique({ where });

    if (!currentOrder) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
    }

    if (currentOrder.status === "Verified") {
      return NextResponse.json(
        { error: "Lab order has already been verified and finalized. Status cannot be changed." },
        { status: 400 }
      );
    }

    const updated = await prisma.labOrder.update({
      where,
      data: {
        ...(status && { status }),
        ...(technician && { technician }),
      },
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        results: true,
      },
    });

    return NextResponse.json({ labOrder: updated });
  } catch (error: any) {
    console.error("PATCH /api/lab-orders error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
