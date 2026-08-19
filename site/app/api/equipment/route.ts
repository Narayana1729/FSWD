// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/equipment — List hospital biomedical equipment
// POST /api/equipment — Register or report equipment status/maintenance
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const equipment = await prisma.equipment.findMany({
      where,
      include: { department: true },
      orderBy: { equipmentId: "asc" },
    });

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error("GET /api/equipment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, location, departmentId, serialNo, lastCalibrated, nextCalibration } = body;

    const count = await prisma.equipment.count();
    const equipmentId = `EQ-${101 + count}`;

    const item = await prisma.equipment.create({
      data: {
        equipmentId,
        name,
        type,
        location,
        departmentId: departmentId || null,
        serialNo: serialNo || null,
        status: "Operational",
        lastCalibrated: lastCalibrated || null,
        nextCalibration: nextCalibration || null,
      },
    });

    return NextResponse.json({ equipment: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/equipment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
