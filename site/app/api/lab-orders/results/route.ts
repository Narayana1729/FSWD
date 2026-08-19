// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lab-orders/results — Atomic & Idempotent Result Verification & Billing Transaction
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LAB_TEST_CATALOG } from "@/lib/hms-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { labOrderId, results, technician, verifyingDoctor } = body;

    if (!labOrderId || !results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "labOrderId and at least one test result parameter are required" },
        { status: 400 }
      );
    }

    // Wrap entire verification + billing + audit log inside a single Prisma Transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch current order
      const labOrder = await tx.labOrder.findFirst({
        where: {
          OR: [{ id: labOrderId }, { orderId: labOrderId }],
        },
        include: { patient: true, doctor: true },
      });

      if (!labOrder) {
        throw new Error("Lab order not found in database.");
      }

      // Guard 1: Duplicate Verification Protection
      if (labOrder.status === "Verified") {
        throw new Error(`Duplicate verification attempt! Lab order #${labOrder.orderId} is already authorized & finalized.`);
      }

      // Look up price and test catalog details
      const catalogEntry =
        LAB_TEST_CATALOG[labOrder.testName] ||
        Object.values(LAB_TEST_CATALOG).find((c) => c.name.toLowerCase().includes(labOrder.testName.toLowerCase())) ||
        { price: 280, name: labOrder.testName };

      const testPrice = catalogEntry.price;

      // 2. Insert LabResult records
      const createdResults = [];
      for (const resItem of results) {
        const createdRes = await tx.labResult.create({
          data: {
            labOrderId: labOrder.id,
            parameter: resItem.parameter || "Measurement",
            value: String(resItem.value || ""),
            unit: resItem.unit || catalogEntry.unit || null,
            referenceRange: resItem.referenceRange || catalogEntry.referenceRange || null,
            isAbnormal: Boolean(resItem.isAbnormal),
            remarks: resItem.remarks || null,
            verifiedAt: new Date(),
          },
        });
        createdResults.push(createdRes);
      }

      // 3. Mark LabOrder as Verified
      const updatedOrder = await tx.labOrder.update({
        where: { id: labOrder.id },
        data: {
          status: "Verified",
          technician: technician || "Tech Alok Verma",
          verifyingDoctor: verifyingDoctor || "Dr. Charaka",
        },
      });

      // 4. Idempotent Billing Charge Generation
      let invoice = await tx.invoice.findFirst({
        where: { patientId: labOrder.patientId, paymentStatus: "Outstanding" },
        orderBy: { createdAt: "desc" },
      });

      const chargeDescription = `Laboratory: ${catalogEntry.name} (${labOrder.orderId})`;

      if (!invoice) {
        const lastInv = await tx.invoice.findFirst({ orderBy: { createdAt: "desc" } });
        const lastNum = lastInv ? parseInt(lastInv.invoiceNo.replace("INV-", "")) || 88210 : 88210;
        const invoiceNo = `INV-${lastNum + 1}`;

        invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            patientId: labOrder.patientId,
            billDate: new Date().toISOString().slice(0, 10),
            subtotal: testPrice,
            coPayAmount: Math.round(testPrice * 0.1),
            finalAmount: testPrice,
            paymentStatus: "Outstanding",
          },
        });
      }

      // Check if InvoiceItem for this lab order already exists (Idempotency Guard)
      const existingLineItem = await tx.invoiceItem.findFirst({
        where: {
          invoiceId: invoice.id,
          description: { contains: labOrder.orderId },
        },
      });

      let lineItem = existingLineItem;
      if (!existingLineItem) {
        lineItem = await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: chargeDescription,
            category: "Laboratory",
            amount: testPrice,
          },
        });

        // Update invoice total
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: invoice.subtotal + testPrice,
            finalAmount: invoice.finalAmount + testPrice,
          },
        });
      }

      // 5. Audit Log Creation inside transaction
      await tx.auditLog.create({
        data: {
          logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          userName: verifyingDoctor || "Dr. Charaka",
          role: "Pathologist",
          action: "VERIFY_LAB_RESULTS",
          resource: `Authorized Lab Order #${labOrder.orderId} (${labOrder.testName}) for ${labOrder.patient.name}. ₹${testPrice} billed to Invoice #${invoice.invoiceNo}.`,
          ip: "192.168.1.52",
          status: "Success",
        },
      });

      return {
        labOrder: updatedOrder,
        results: createdResults,
        billedAmount: testPrice,
        invoiceNo: invoice.invoiceNo,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Lab results successfully verified & authorized by Dr. Charaka! Billed ₹${transactionResult.billedAmount} to Invoice #${transactionResult.invoiceNo}.`,
      ...transactionResult,
    });
  } catch (error: any) {
    console.error("POST /api/lab-orders/results transaction error:", error);
    return NextResponse.json({ error: error.message || "Transaction failed" }, { status: 400 });
  }
}
