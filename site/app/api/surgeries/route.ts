// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/surgeries — List Operation Theatre schedules
// POST /api/surgeries — Book OT surgery slot
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const surgeries = await prisma.surgery.findMany({
      include: {
        patient: { select: { id: true, mrn: true, name: true } },
        leadSurgeon: { select: { id: true, name: true, specialization: true } },
        ot: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ surgeries });
  } catch (error) {
    console.error("GET /api/surgeries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      procedure,
      otId,
      leadSurgeonId,
      anesthetist,
      scrubNurse,
      startTime,
      endTime,
      preOpChecklist,
    } = body;

    if (!patientId || !procedure || !otId || !leadSurgeonId) {
      return NextResponse.json(
        { error: "patientId, procedure, otId, leadSurgeonId are required" },
        { status: 400 }
      );
    }

    const count = await prisma.surgery.count();
    const surgeryId = `OT-${201 + count}`;

    const surgery = await prisma.surgery.create({
      data: {
        surgeryId,
        patientId,
        procedure,
        otId,
        leadSurgeonId,
        anesthetist: anesthetist || "Pending Assignment",
        scrubNurse: scrubNurse || "Pending Assignment",
        startTime: startTime || "09:00 AM",
        endTime: endTime || "12:00 PM",
        status: "Scheduled",
        preOpChecklistJson: preOpChecklist ? JSON.stringify(preOpChecklist) : null,
      },
      include: {
        patient: true,
        leadSurgeon: true,
        ot: true,
      },
    });

    return NextResponse.json({ surgery }, { status: 201 });
  } catch (error) {
    console.error("POST /api/surgeries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
