// ─────────────────────────────────────────────────────────────────────────────
// GET   /api/pharmacy/[id] — Get medicine details
// PATCH /api/pharmacy/[id] — Dispense (decrement stock) or restock (increment)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { authorizeRole } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const medicine = await prisma.medicine.findFirst({
      where: { OR: [{ id }, { medicineId: id }] },
    });
    if (!medicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }
    return NextResponse.json({ medicine });
  } catch (error) {
    console.error("GET /api/pharmacy/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "PHARMACIST");
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    // Handle dispense action — decrement stock
    if (body.action === "dispense" && body.quantity) {
      const medicine = await prisma.medicine.findUnique({ where: { id } });
      if (!medicine) {
        return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
      }
      if (medicine.stockQty < body.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${medicine.stockQty}, Requested: ${body.quantity}` },
          { status: 400 }
        );
      }
      const updated = await prisma.medicine.update({
        where: { id },
        data: { stockQty: medicine.stockQty - body.quantity },
      });
      return NextResponse.json({ medicine: updated, action: "dispensed", quantityDispensed: body.quantity });
    }

    // Handle restock action — increment stock
    if (body.action === "restock" && body.quantity) {
      const medicine = await prisma.medicine.findUnique({ where: { id } });
      if (!medicine) {
        return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
      }
      const updated = await prisma.medicine.update({
        where: { id },
        data: { stockQty: medicine.stockQty + body.quantity },
      });
      return NextResponse.json({ medicine: updated, action: "restocked", quantityAdded: body.quantity });
    }

    // General update
    delete body.action;
    const medicine = await prisma.medicine.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ medicine });
  } catch (error) {
    console.error("PATCH /api/pharmacy/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
