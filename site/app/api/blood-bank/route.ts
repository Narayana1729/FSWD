// ─────────────────────────────────────────────────────────────────────────────
// GET   /api/blood-bank — List blood group stock levels
// PATCH /api/blood-bank — Update blood units (donation / transfusion)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const stock = await prisma.bloodUnit.findMany({
      orderBy: { bloodGroup: "asc" },
    });
    return NextResponse.json({ stock });
  } catch (error) {
    console.error("GET /api/blood-bank error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bloodGroup, unitsChange } = body;

    if (!bloodGroup || unitsChange === undefined) {
      return NextResponse.json(
        { error: "bloodGroup and unitsChange (positive or negative) are required" },
        { status: 400 }
      );
    }

    const current = await prisma.bloodUnit.findUnique({
      where: { bloodGroup },
    });

    if (!current) {
      return NextResponse.json({ error: "Blood group not found" }, { status: 404 });
    }

    const updatedUnits = Math.max(0, current.unitsAvailable + unitsChange);
    const updated = await prisma.bloodUnit.update({
      where: { bloodGroup },
      data: { unitsAvailable: updatedUnits },
    });

    return NextResponse.json({ bloodStock: updated });
  } catch (error) {
    console.error("PATCH /api/blood-bank error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
