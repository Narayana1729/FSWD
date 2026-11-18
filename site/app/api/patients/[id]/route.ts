// ─────────────────────────────────────────────────────────────────────────────
// GET    /api/patients/[id] — Retrieve a single patient
// PATCH  /api/patients/[id] — Update a patient
// DELETE /api/patients/[id] — Soft-delete (set inactive)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { authorizeRole, isPatientOwner, hasPermission } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const patient = await prisma.patient.findFirst({
      where: { OR: [{ id }, { mrn: id }] },
      include: {
        department: true,
        appointments: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { appointmentDate: "desc" },
          take: 20,
        },
        admissions: {
          include: {
            bed: {
              include: {
                room: {
                  include: {
                    ward: true,
                  },
                },
              },
            },
          },
          orderBy: { admittedAt: "desc" },
          take: 10,
        },
        visits: {
          include: {
            doctor: { select: { id: true, name: true, specialization: true } },
            vitals: { orderBy: { recordedAt: "desc" } },
            consultations: {
              include: { doctor: { select: { id: true, name: true, specialization: true } } },
              orderBy: { createdAt: "desc" },
            },
            prescriptions: {
              include: {
                doctor: { select: { id: true, name: true, specialization: true } },
                items: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { startTime: "desc" },
          take: 20,
        },
        labOrders: {
          include: {
            doctor: { select: { id: true, name: true } },
            results: true,
          },
          orderBy: { orderedAt: "desc" },
          take: 20,
        },
        radiologyOrders: {
          include: {
            doctor: { select: { id: true, name: true } },
            report: true,
          },
          orderBy: { createdAt: "desc" },
          take: 15,
        },
        surgeries: {
          include: {
            leadSurgeon: { select: { id: true, name: true, specialization: true } },
            ot: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        emergencyCases: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        invoices: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { createdAt: "desc" },
          take: 15,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Role and resource-level authorization
    if (auth.user.role.toUpperCase() === "PATIENT") {
      if (!isPatientOwner(auth.user, patient)) {
        return NextResponse.json(
          { error: "Forbidden", message: "Patients may only access their own clinical records" },
          { status: 403 }
        );
      }
    } else if (!hasPermission(auth.user.role, "patients", "read")) {
      return NextResponse.json(
        { error: "Forbidden", message: `Role '${auth.user.role}' lacks permission to read patient records` },
        { status: 403 }
      );
    }

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

    return NextResponse.json({ patient: parsedPatient });
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
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST");
    if (auth.error) return auth.error;

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
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR");
    if (auth.error) return auth.error;

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
