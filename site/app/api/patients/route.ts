// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/patients — List all patients (filtered by query params)
// POST /api/patients — Create a new patient
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (department) where.departmentId = department;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { mrn: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: { department: true },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({ patients, total, limit, offset });
  } catch (error) {
    console.error("GET /api/patients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, age, gender, phone, email, address, bloodGroup,
      status, departmentId, emergencyContact, medicalHistory,
      allergies, currentConditions, insurance,
    } = body;

    if (!name || !age || !gender || !phone) {
      return NextResponse.json(
        { error: "name, age, gender, and phone are required" },
        { status: 400 }
      );
    }

    // Generate MRN
    const lastPatient = await prisma.patient.findFirst({
      orderBy: { createdAt: "desc" },
      select: { mrn: true },
    });
    const lastNum = lastPatient
      ? parseInt(lastPatient.mrn.replace("P-", "")) || 1000
      : 1000;
    const mrn = `P-${lastNum + 1}`;

    const patient = await prisma.patient.create({
      data: {
        mrn,
        name,
        age,
        gender,
        phone,
        email: email || null,
        address: address || null,
        bloodGroup: bloodGroup || null,
        status: status || "OPD Queue",
        departmentId: departmentId || null,
        emergencyContactJson: emergencyContact ? JSON.stringify(emergencyContact) : null,
        medicalHistoryJson: medicalHistory ? JSON.stringify(medicalHistory) : null,
        allergiesJson: allergies ? JSON.stringify(allergies) : null,
        currentConditionsJson: currentConditions ? JSON.stringify(currentConditions) : null,
        insuranceJson: insurance ? JSON.stringify(insurance) : null,
      },
      include: { department: true },
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
