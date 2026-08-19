// ─────────────────────────────────────────────────────────────────────────────
// POST /api/billing/[id]/pay — Record a payment against an invoice
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, method, reference } = body;

    if (!amount || amount <= 0 || !method) {
      return NextResponse.json(
        { error: "Valid amount and payment method are required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNo: id }] },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Record payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        method,
        reference: reference || null,
      },
    });

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
    const newStatus =
      totalPaid >= invoice.finalAmount ? "Paid" : "Partially Paid";

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paymentStatus: newStatus },
      include: { payments: true, items: true, patient: true },
    });

    return NextResponse.json({ invoice: updatedInvoice, payment });
  } catch (error) {
    console.error("POST /api/billing/[id]/pay error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
