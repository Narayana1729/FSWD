// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/staff — List all hospital staff members
// POST /api/staff — Onboard new staff member
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ staff });
  } catch (error) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, dept, shift, salary } = body;

    if (!name || !role) {
      return NextResponse.json({ error: "name and role are required" }, { status: 400 });
    }

    const staffId = `STF-${Math.floor(105 + Math.random() * 900)}`;

    const newStaff = await prisma.staff.create({
      data: {
        userId: `user-${Date.now()}`,
        staffId,
        name,
        role,
        departmentId: dept || "General",
        shift: shift || "Morning (7AM-3PM)",
        salaryMonthly: salary ? parseFloat(salary) : 5500,
        attendanceStatus: "Present",
      },
    });

    return NextResponse.json({ staff: newStaff }, { status: 201 });
  } catch (error) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
