// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/beds/[id] — Update bed status (assign patient, clean, maintain)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const bed = await prisma.bed.update({
      where: { id },
      data: body,
      include: {
        room: { include: { ward: true } },
        attendingDoctor: { select: { name: true } },
        nurseAssigned: { select: { name: true } },
      },
    });

    return NextResponse.json({ bed });
  } catch (error) {
    console.error("PATCH /api/beds/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
