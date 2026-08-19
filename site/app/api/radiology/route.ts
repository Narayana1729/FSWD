// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/radiology — List radiology scans
// POST /api/radiology — Order a new imaging scan
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scanType = searchParams.get("scanType");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (scanType) where.scanType = scanType;
    if (status) where.status = status;

    const scans = await prisma.radiologyOrder.findMany({
      where,
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        report: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ scans });
  } catch (error) {
    console.error("GET /api/radiology error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      doctorId,
      visitId,
      scanType,
      bodyPart,
      urgency,
      technician,
      radiologist,
      dcmImage,
    } = body;

    if (!patientId || !scanType) {
      return NextResponse.json(
        { error: "patientId and scanType are required" },
        { status: 400 }
      );
    }

    // Resolve targetDoctorId
    let doc = await prisma.doctor.findFirst({
      where: { OR: [{ id: doctorId || "" }, { staffId: doctorId || "" }] },
    });
    if (!doc) doc = (await prisma.doctor.findFirst())!;
    const targetDoctorId = doc ? doc.id : "DOC-101";

    const count = await prisma.radiologyOrder.count();
    const orderId = `RAD-${701 + count}`;

    const scan = await prisma.radiologyOrder.create({
      data: {
        orderId,
        patientId,
        doctorId: targetDoctorId,
        visitId: visitId || null,
        scanType,
        bodyPart: bodyPart || "Chest / General",
        urgency: urgency || "Routine",
        technician: technician || null,
        radiologist: radiologist || null,
        dcmImage: dcmImage || "/images/dicom/chest-xray-sample.png",
        status: "Scheduled",
      },
      include: { patient: true },
    });

    return NextResponse.json({ scan }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/radiology error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, orderId, status, technician, radiologist, dcmImage } = body;

    if (!id && !orderId) {
      return NextResponse.json({ error: "id or orderId is required" }, { status: 400 });
    }

    const where = id ? { id } : { orderId };
    const currentScan = await prisma.radiologyOrder.findUnique({ where });

    if (!currentScan) {
      return NextResponse.json({ error: "Radiology order not found" }, { status: 404 });
    }

    const updated = await prisma.radiologyOrder.update({
      where,
      data: {
        ...(status && { status }),
        ...(technician && { technician }),
        ...(radiologist && { radiologist }),
        ...(dcmImage && { dcmImage }),
        scanDate: new Date(),
      },
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        report: true,
      },
    });

    return NextResponse.json({ scan: updated });
  } catch (error: any) {
    console.error("PATCH /api/radiology error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
