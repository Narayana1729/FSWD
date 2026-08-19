// ─────────────────────────────────────────────────────────────────────────────
// POST /api/radiology/reports — Atomic & Idempotent Diagnostic Report Authorization Transaction
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RADIOLOGY_TEST_CATALOG } from "@/lib/hms-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { radiologyOrderId, reportText, findings, impression, reportedBy } = body;

    if (!radiologyOrderId || !reportText) {
      return NextResponse.json(
        { error: "radiologyOrderId and reportText (diagnostic report body) are required" },
        { status: 400 }
      );
    }

    // Wrap entire report creation + billing + audit log inside a single Prisma Transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch current radiology order
      const radOrder = await tx.radiologyOrder.findFirst({
        where: {
          OR: [{ id: radiologyOrderId }, { orderId: radiologyOrderId }],
        },
        include: { patient: true, doctor: true, report: true },
      });

      if (!radOrder) {
        throw new Error("Radiology order not found in database.");
      }

      // Guard 1: Duplicate Report Authorization Protection
      if (radOrder.report || radOrder.status === "Finalized" || radOrder.status === "Reported" || radOrder.status === "Completed") {
        throw new Error(`Duplicate report authorization attempt! Radiology scan #${radOrder.orderId} has already been reported and finalized.`);
      }

      // Look up price and test catalog details
      const catalogEntry =
        RADIOLOGY_TEST_CATALOG[radOrder.scanType] ||
        Object.values(RADIOLOGY_TEST_CATALOG).find((c) => c.name.toLowerCase().includes(radOrder.scanType.toLowerCase())) ||
        { price: 1200, name: radOrder.scanType };

      const scanPrice = catalogEntry.price;

      // 2. Create RadiologyReport record
      const report = await tx.radiologyReport.create({
        data: {
          radiologyOrderId: radOrder.id,
          reportText,
          findings: findings || "No acute bony abnormality or focal alveolar consolidation observed.",
          impression: impression || "Unremarkable imaging scan findings.",
          reportedBy: reportedBy || "Dr. Jivaka",
          reportedAt: new Date(),
        },
      });

      // 3. Mark RadiologyOrder as Finalized
      const updatedOrder = await tx.radiologyOrder.update({
        where: { id: radOrder.id },
        data: {
          status: "Finalized",
          radiologist: reportedBy || "Dr. Jivaka",
          scanDate: new Date(),
        },
      });

      // 4. Idempotent Billing Charge Generation
      let invoice = await tx.invoice.findFirst({
        where: { patientId: radOrder.patientId, paymentStatus: "Outstanding" },
        orderBy: { createdAt: "desc" },
      });

      const chargeDescription = `Radiology: ${catalogEntry.name} (${radOrder.orderId})`;

      if (!invoice) {
        const lastInv = await tx.invoice.findFirst({ orderBy: { createdAt: "desc" } });
        const lastNum = lastInv ? parseInt(lastInv.invoiceNo.replace("INV-", "")) || 88210 : 88210;
        const invoiceNo = `INV-${lastNum + 1}`;

        invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            patientId: radOrder.patientId,
            billDate: new Date().toISOString().slice(0, 10),
            subtotal: scanPrice,
            coPayAmount: Math.round(scanPrice * 0.1),
            finalAmount: scanPrice,
            paymentStatus: "Outstanding",
          },
        });
      }

      // Check if InvoiceItem for this radiology order already exists (Idempotency Guard)
      const existingLineItem = await tx.invoiceItem.findFirst({
        where: {
          invoiceId: invoice.id,
          description: { contains: radOrder.orderId },
        },
      });

      let lineItem = existingLineItem;
      if (!existingLineItem) {
        lineItem = await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: chargeDescription,
            category: "Imaging",
            amount: scanPrice,
          },
        });

        // Update invoice total
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: invoice.subtotal + scanPrice,
            finalAmount: invoice.finalAmount + scanPrice,
          },
        });
      }

      // 5. Audit Log Creation inside transaction
      await tx.auditLog.create({
        data: {
          logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          userName: reportedBy || "Dr. Jivaka",
          role: "Radiologist",
          action: "AUTHORIZE_RADIOLOGY_REPORT",
          resource: `Authorized Radiology Scan #${radOrder.orderId} (${radOrder.scanType}) for ${radOrder.patient.name}. ₹${scanPrice} billed to Invoice #${invoice.invoiceNo}.`,
          ip: "192.168.1.53",
          status: "Success",
        },
      });

      return {
        scan: updatedOrder,
        report,
        billedAmount: scanPrice,
        invoiceNo: invoice.invoiceNo,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Radiology report successfully authorized & signed off by Dr. Jivaka! Billed ₹${transactionResult.billedAmount} to Invoice #${transactionResult.invoiceNo}.`,
      ...transactionResult,
    });
  } catch (error: any) {
    console.error("POST /api/radiology/reports transaction error:", error);
    return NextResponse.json({ error: error.message || "Transaction failed" }, { status: 400 });
  }
}
