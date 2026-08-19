// ─────────────────────────────────────────────────────────────────────────────
// GET   /api/lab-orders/[id] — Get lab order with results
// PATCH /api/lab-orders/[id] — Update status (pipeline: Requested→Collected→Processing→Ready→Verified)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const labOrder = await prisma.labOrder.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
      include: {
        patient: true,
        results: true,
      },
    });
    if (!labOrder) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
    }
    return NextResponse.json({ labOrder });
  } catch (error) {
    console.error("GET /api/lab-orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // If results are included, create LabResult entries
    if (body.results && Array.isArray(body.results)) {
      for (const result of body.results) {
        await prisma.labResult.create({
          data: {
            labOrderId: id,
            parameter: result.parameter,
            value: result.value,
            unit: result.unit || null,
            referenceRange: result.referenceRange || null,
            isAbnormal: result.isAbnormal || false,
            remarks: result.remarks || null,
          },
        });
      }
      delete body.results;
    }

    const labOrder = await prisma.labOrder.update({
      where: { id },
      data: body,
      include: { patient: true, results: true },
    });

    return NextResponse.json({ labOrder });
  } catch (error) {
    console.error("PATCH /api/lab-orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
