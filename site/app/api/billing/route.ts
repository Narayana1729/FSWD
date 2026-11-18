// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/billing — List invoices with payment statuses
// POST /api/billing — Generate a new hospital invoice
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { authorizeRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

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
    const auth = await authorizeRole(request, "ADMIN", "BILLING");
    if (auth.error) return auth.error;
    const user = auth.user;

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

    if (!patientId || typeof patientId !== "string") {
      return NextResponse.json(
        { error: "Valid patientId (MRN or ID) is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one valid line item is required" },
        { status: 400 }
      );
    }

    // Resolve patient by ID or MRN
    const patient = await prisma.patient.findFirst({
      where: { OR: [{ id: patientId }, { mrn: patientId }] },
    });

    if (!patient) {
      return NextResponse.json(
        { error: `Patient with ID/MRN '${patientId}' not found` },
        { status: 404 }
      );
    }

    // Validate line items
    const sanitizedItems: { description: string; category: string; amount: number }[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const desc = typeof it?.description === "string" ? it.description.trim() : "";
      const amt = Number(it?.amount);
      if (!desc) {
        return NextResponse.json(
          { error: `Line item #${i + 1} requires a valid description` },
          { status: 400 }
        );
      }
      if (isNaN(amt) || amt < 0) {
        return NextResponse.json(
          { error: `Line item #${i + 1} (${desc}) requires a valid non-negative amount` },
          { status: 400 }
        );
      }
      sanitizedItems.push({
        description: desc,
        category: (typeof it.category === "string" && it.category.trim()) || "General",
        amount: amt,
      });
    }

    const calculatedSubtotal = sanitizedItems.reduce((sum, it) => sum + it.amount, 0);
    const resolvedSubtotal = subtotal !== undefined ? Number(subtotal) : calculatedSubtotal;
    const resolvedInsCovered = Number(insuranceCovered) || 0;
    const resolvedCoPay = coPayAmount !== undefined ? Number(coPayAmount) : Math.max(0, resolvedSubtotal - resolvedInsCovered);
    const resolvedDiscount = Number(discount) || 0;
    const resolvedTax = Number(tax) || 0;
    const resolvedFinal = finalAmount !== undefined ? Number(finalAmount) : Math.max(0, resolvedCoPay - resolvedDiscount + resolvedTax);

    const count = await prisma.invoice.count();
    const invoiceNo = `INV-${88210 + count}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        patientId: patient.id,
        billDate: billDate || new Date().toISOString().slice(0, 10),
        subtotal: resolvedSubtotal,
        insuranceCovered: resolvedInsCovered,
        coPayAmount: resolvedCoPay,
        discount: resolvedDiscount,
        tax: resolvedTax,
        finalAmount: resolvedFinal,
        paymentStatus: paymentStatus || (resolvedFinal === 0 ? "Paid" : "Outstanding"),
        items: {
          create: sanitizedItems,
        },
      },
      include: {
        items: true,
        patient: true,
        payments: true,
      },
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        logId: `LOG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        userId: user.id,
        userName: user.name || user.email,
        role: user.role,
        action: "GENERATE_INVOICE",
        resource: `Invoice ${invoice.invoiceNo} for ${patient.name} (${patient.mrn}) - ₹${resolvedFinal}`,
        status: "Success",
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("POST /api/billing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

