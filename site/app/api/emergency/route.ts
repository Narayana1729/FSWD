// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/emergency — List active emergency cases
// POST /api/emergency — Register a new emergency case
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
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const emergencyCases = await prisma.emergencyCase.findMany({
      where,
      include: { patient: { select: { id: true, mrn: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ emergencyCases });
  } catch (error) {
    console.error("GET /api/emergency error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST");
    if (auth.error) return auth.error;

    const body = await request.json();

    const {
      patientId, patientName, age, gender, arrivalTime,
      severity, chiefComplaint, assignedDoctor, traumaBay, bedNo, vitals,
    } = body;

    if (!patientName || !severity || !chiefComplaint) {
      return NextResponse.json(
        { error: "patientName, severity, chiefComplaint are required" },
        { status: 400 }
      );
    }

    const count = await prisma.emergencyCase.count();
    const caseId = `EMG-${901 + count}`;

    const emergencyCase = await prisma.emergencyCase.create({
      data: {
        caseId,
        patientId: patientId || null,
        patientName,
        age: age || 0,
        gender: gender || "Unknown",
        arrivalTime: arrivalTime || new Date().toLocaleTimeString(),
        severity,
        chiefComplaint,
        assignedDoctor: assignedDoctor || "Unassigned",
        traumaBay: traumaBay || "Triage Desk",
        bedNo: bedNo || "ER-Pending",
        vitalsJson: vitals ? JSON.stringify(vitals) : null,
        status: "Triaged",
      },
    });

    return NextResponse.json({ emergencyCase }, { status: 201 });
  } catch (error) {
    console.error("POST /api/emergency error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
