// ─────────────────────────────────────────────────────────────────────────────
// POST /api/billing/[id]/pay — Record a payment against an invoice
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeRole } from "@/lib/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "BILLING");
    if (auth.error) return auth.error;
    const user = auth.user;

    const { id } = await params;
    const body = await request.json();
    const { amount, method, reference } = body;

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Valid positive payment amount is required" },
        { status: 400 }
      );
    }

    if (!method || typeof method !== "string" || method.trim() === "") {
      return NextResponse.json(
        { error: "Valid payment method is required (e.g. Cash, Card, UPI, Insurance, Bank Transfer)" },
        { status: 400 }
      );
    }

    // Execute payment and invoice status update atomically
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { OR: [{ id }, { invoiceNo: id }] },
        include: { payments: true },
      });

      if (!invoice) {
        return { notFound: true };
      }

      const totalPaidAlready = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = Math.round((invoice.finalAmount - totalPaidAlready) * 100) / 100;

      if (remainingBalance <= 0) {
        return {
          validationError: "Invoice is already fully paid",
          remainingBalance: 0,
        };
      }

      // Financial rule: reject overpayments
      if (paymentAmount > remainingBalance + 0.001) {
        return {
          validationError: `Payment amount (₹${paymentAmount.toFixed(2)}) exceeds outstanding balance (₹${remainingBalance.toFixed(2)})`,
          remainingBalance,
        };
      }

      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paymentAmount,
          method: method.trim(),
          reference: reference?.trim() || null,
        },
      });

      const newTotalPaid = Math.round((totalPaidAlready + paymentAmount) * 100) / 100;
      const newStatus =
        newTotalPaid >= invoice.finalAmount - 0.001 ? "Paid" : "Partially Paid";

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { paymentStatus: newStatus },
        include: { payments: true, items: true, patient: true },
      });

      // Record immutable audit trail retaining the authenticated actor's identity
      await tx.auditLog.create({
        data: {
          logId: `LOG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
          userId: user.id,
          userName: user.name || user.email,
          role: user.role,
          action: "RECORD_PAYMENT",
          resource: `Invoice ${invoice.invoiceNo} (₹${paymentAmount.toFixed(2)} via ${method.trim()}${reference ? ` Ref: ${reference.trim()}` : ""})`,
          status: "Success",
        },
      });

      return {
        invoice: updatedInvoice,
        payment,
        remainingBalance: Math.max(0, Math.round((updatedInvoice.finalAmount - newTotalPaid) * 100) / 100),
      };
    });

    if ("notFound" in result && result.notFound) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if ("validationError" in result && result.validationError) {
      return NextResponse.json(
        {
          error: result.validationError,
          remainingBalance: result.remainingBalance,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/billing/[id]/pay error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
