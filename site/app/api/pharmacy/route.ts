// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/pharmacy — List medicines/pharmacy inventory
// POST /api/pharmacy — Add a new medicine to inventory
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { medicineId: { contains: search } },
      ];
    }

    let medicines = await prisma.medicine.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Filter for low stock if requested
    if (lowStock === "true") {
      medicines = medicines.filter((m) => m.stockQty <= m.reorderLevel);
    }

    return NextResponse.json({ medicines });
  } catch (error) {
    console.error("GET /api/pharmacy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, category, batchNo, stockQty, reorderLevel,
      supplier, expiryDate, unitPrice, prescriptionRequired,
    } = body;

    if (!name || !category || !batchNo) {
      return NextResponse.json(
        { error: "name, category, batchNo are required" },
        { status: 400 }
      );
    }

    const count = await prisma.medicine.count();
    const medicineId = `RX-${String(count + 1).padStart(2, "0")}`;

    const medicine = await prisma.medicine.create({
      data: {
        medicineId,
        name,
        category,
        batchNo,
        stockQty: stockQty || 0,
        reorderLevel: reorderLevel || 50,
        supplier: supplier || null,
        expiryDate: expiryDate || null,
        unitPrice: unitPrice || 0,
        prescriptionRequired: prescriptionRequired ?? true,
      },
    });

    return NextResponse.json({ medicine }, { status: 201 });
  } catch (error) {
    console.error("POST /api/pharmacy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
