// ─────────────────────────────────────────────────────────────────────────────
// POST /api/nursing/vitals — Record patient nursing vitals to SQLite database
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, visitId, bp, pulse, temperature, spo2, weight, height, recordedBy } = body;

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }

    // Ensure active visit
    let targetVisitId = visitId;
    if (!targetVisitId) {
      const activeVisit = await prisma.visit.findFirst({
        where: { patientId },
        orderBy: { createdAt: "desc" },
      });
      if (activeVisit) {
        targetVisitId = activeVisit.id;
      } else {
        const doc = await prisma.doctor.findFirst();
        const newVisit = await prisma.visit.create({
          data: {
            patientId,
            doctorId: doc ? doc.id : "DOC-101",
            type: "IPD",
            status: "In Progress",
            chiefComplaint: "Inpatient Nursing Vitals Observation",
          },
        });
        targetVisitId = newVisit.id;
      }
    }

    const vitals = await prisma.vitals.create({
      data: {
        visitId: targetVisitId,
        bp: bp || "120/80",
        pulse: pulse ? parseInt(String(pulse)) : 74,
        temperature: temperature || "98.6°F",
        spo2: spo2 ? parseInt(String(spo2)) : 99,
        weight: weight ? parseFloat(String(weight)) : 70,
        height: height ? parseFloat(String(height)) : 172,
        recordedBy: recordedBy || "Nurse Sister Anitha",
      },
      include: {
        visit: {
          include: { patient: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userName: recordedBy || "Nurse Sister Anitha",
        role: "Nurse",
        action: "RECORD_NURSING_VITALS",
        resource: `Recorded vitals (BP: ${vitals.bp}, Pulse: ${vitals.pulse}, SpO2: ${vitals.spo2}%) for patient #${patientId}`,
        ip: "192.168.1.58",
        status: "Success",
      },
    });

    return NextResponse.json({ success: true, vitals }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/nursing/vitals error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
