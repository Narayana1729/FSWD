// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/billing — List invoices with payment statuses
// POST /api/billing — Generate a new hospital invoice
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const paymentStatus = searchParams.get("paymentStatus");

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: { select: { id: true, mrn: true, name: true, phone: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalOutstanding = invoices
      .filter((i) => i.paymentStatus !== "Paid")
      .reduce((sum, i) => sum + i.finalAmount, 0);

    const totalCollected = invoices.reduce(
      (sum, i) => sum + i.payments.reduce((pSum, p) => pSum + p.amount, 0),
      0
    );

    return NextResponse.json({ invoices, totalOutstanding, totalCollected });
  } catch (error) {
    console.error("GET /api/billing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      billDate,
      items,
      subtotal,
      insuranceCovered,
      coPayAmount,
      discount,
      tax,
      finalAmount,
      paymentStatus,
    } = body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "patientId and valid line items are required" },
        { status: 400 }
      );
    }

    const count = await prisma.invoice.count();
    const invoiceNo = `INV-${88210 + count}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        patientId,
        billDate: billDate || new Date().toISOString().slice(0, 10),
        subtotal: subtotal || 0,
        insuranceCovered: insuranceCovered || 0,
        coPayAmount: coPayAmount || 0,
        discount: discount || 0,
        tax: tax || 0,
        finalAmount: finalAmount || 0,
        paymentStatus: paymentStatus || "Pending Insurance",
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            category: item.category || "General",
            amount: item.amount,
          })),
        },
      },
      include: {
        items: true,
        patient: true,
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("POST /api/billing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
