// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/patients — List all patients (filtered by query params)
// POST /api/patients — Create a new patient
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { authorizeRole, hasPermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};

    // Patient role can ONLY query their own patient record
    if (auth.user.role.toUpperCase() === "PATIENT") {
      where.OR = [
        { userId: auth.user.id },
        ...(auth.user.email ? [{ email: auth.user.email }] : []),
      ];
    } else if (!hasPermission(auth.user.role, "patients", "read")) {
      return NextResponse.json(
        { error: "Forbidden", message: `Role '${auth.user.role}' lacks permission to read patient records` },
        { status: 403 }
      );
    } else {
      if (status) where.status = status;
      if (department) where.departmentId = department;
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { mrn: { contains: search } },
          { phone: { contains: search } },
        ];
      }
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

    const safeParse = (str: string | null) => {
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    };

    const parsedPatients = patients.map((p) => ({
      ...p,
      emergencyContact: safeParse(p.emergencyContactJson),
      medicalHistory: safeParse(p.medicalHistoryJson) || [],
      allergies: safeParse(p.allergiesJson) || [],
      currentConditions: safeParse(p.currentConditionsJson) || [],
      insurance: safeParse(p.insuranceJson),
    }));

    return NextResponse.json({ patients: parsedPatients, total, limit, offset });
  } catch (error) {
    console.error("GET /api/patients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE");
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      name, age, gender, phone, email, address, bloodGroup,
      status, departmentId, department, emergencyContact, medicalHistory,
      allergies, currentConditions, insurance,
    } = body;

    const parsedAge = parseInt(String(age), 10);
    if (!name || isNaN(parsedAge) || parsedAge < 0 || !gender || !phone) {
      return NextResponse.json(
        { error: "name, valid positive age, gender, and phone are required" },
        { status: 400 }
      );
    }

    // Resolve department if name was provided
    let resolvedDeptId = departmentId || null;
    if (!resolvedDeptId && department) {
      const deptRecord = await prisma.department.findFirst({
        where: {
          OR: [
            { id: typeof department === "string" ? department : department.id },
            { name: typeof department === "string" ? department : department.name },
          ],
        },
      });
      if (deptRecord) resolvedDeptId = deptRecord.id;
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
        name: name.trim(),
        age: parsedAge,
        gender,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        bloodGroup: bloodGroup || null,
        status: status || "OPD Queue",
        departmentId: resolvedDeptId,
        emergencyContactJson: emergencyContact ? JSON.stringify(emergencyContact) : null,
        medicalHistoryJson: medicalHistory
          ? JSON.stringify(Array.isArray(medicalHistory) ? medicalHistory : [medicalHistory])
          : null,
        allergiesJson: allergies
          ? JSON.stringify(Array.isArray(allergies) ? allergies : [allergies])
          : null,
        currentConditionsJson: currentConditions
          ? JSON.stringify(Array.isArray(currentConditions) ? currentConditions : [currentConditions])
          : null,
        insuranceJson: insurance ? JSON.stringify(insurance) : null,
      },
      include: { department: true },
    });

    const safeParse = (str: string | null) => {
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    };

    const parsedPatient = {
      ...patient,
      emergencyContact: safeParse(patient.emergencyContactJson),
      medicalHistory: safeParse(patient.medicalHistoryJson) || [],
      allergies: safeParse(patient.allergiesJson) || [],
      currentConditions: safeParse(patient.currentConditionsJson) || [],
      insurance: safeParse(patient.insuranceJson),
    };

    return NextResponse.json({ patient: parsedPatient }, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
