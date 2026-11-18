// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/doctors — List all doctors
// POST /api/doctors — Register a new doctor
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
    const department = searchParams.get("department");
    const availability = searchParams.get("availability");

    const where: Record<string, unknown> = {};
    if (department) where.departmentId = department;
    if (availability) where.availability = availability;

    const doctors = await prisma.doctor.findMany({
      where,
      include: { department: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("GET /api/doctors error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN");
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      userId, staffId, name, specialization, experienceYears,
      phone, email, departmentId, avatar, shift, roomNo,
    } = body;

    if (!userId || !staffId || !name || !specialization || !departmentId) {
      return NextResponse.json(
        { error: "userId, staffId, name, specialization, departmentId are required" },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctor.create({
      data: {
        userId,
        staffId,
        name,
        avatar: avatar || null,
        specialization,
        experienceYears: experienceYears || 0,
        phone: phone || "",
        email: email || "",
        departmentId,
        shift: shift || null,
        roomNo: roomNo || null,
      },
      include: { department: true },
    });

    return NextResponse.json({ doctor }, { status: 201 });
  } catch (error) {
    console.error("POST /api/doctors error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
