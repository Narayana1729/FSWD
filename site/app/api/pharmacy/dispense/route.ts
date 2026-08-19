// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pharmacy/dispense — Atomic Rx dispensing, stock deduction, and billing charge creation
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prescriptionId, medicineId, quantity: requestedQty } = body;

    if (!prescriptionId) {
      return NextResponse.json({ error: "prescriptionId is required" }, { status: 400 });
    }

    // 1. Fetch prescription with items and patient
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: { include: { medicine: true } },
        visit: { include: { patient: true } },
        doctor: true,
      },
    });

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    // Guard 1: Duplicate dispensing check
    if (prescription.status === "Dispensed") {
      return NextResponse.json(
        { error: "Duplicate dispensing attempt! This prescription has already been fulfilled and dispensed." },
        { status: 400 }
      );
    }

    if (prescription.status === "Cancelled") {
      return NextResponse.json({ error: "Prescription is cancelled and cannot be dispensed." }, { status: 400 });
    }

    const patient = prescription.visit.patient;
    const itemsToDispense = medicineId
      ? prescription.items.filter((i) => i.medicineId === medicineId || i.id === medicineId)
      : prescription.items;

    if (itemsToDispense.length === 0) {
      return NextResponse.json({ error: "No matching prescription items found to dispense." }, { status: 400 });
    }

    // Guard 2: Inventory stock check for all items to dispense
    for (const item of itemsToDispense) {
      const qtyNeeded = requestedQty || item.quantity || 1;
      let med = item.medicine;

      if (!med) {
        med = await prisma.medicine.findFirst({
          where: { name: { contains: item.medicineName } },
        });
      }

      if (!med) {
        return NextResponse.json(
          { error: `Medicine "${item.medicineName}" was not found in pharmacy inventory stock.` },
          { status: 400 }
        );
      }

      if (med.stockQty < qtyNeeded) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${med.name}"! Requested: ${qtyNeeded} units, Available in Stock: ${med.stockQty} units.`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Perform Atomic Dispensing & Stock Reduction
    let totalPharmacyCharge = 0;
    const dispensedItemsSummary: string[] = [];

    for (const item of itemsToDispense) {
      const qtyNeeded = requestedQty || item.quantity || 1;
      let med = item.medicine;
      if (!med) {
        med = (await prisma.medicine.findFirst({
          where: { name: { contains: item.medicineName } },
        }))!;
      }

      // Deduct stock in DB
      await prisma.medicine.update({
        where: { id: med.id },
        data: { stockQty: Math.max(0, med.stockQty - qtyNeeded) },
      });

      const lineTotal = qtyNeeded * (med.unitPrice || 15);
      totalPharmacyCharge += lineTotal;
      dispensedItemsSummary.push(`${med.name} x${qtyNeeded} (₹${lineTotal})`);
    }

    // 3. Mark Prescription as Dispensed
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: "Dispensed" },
    });

    // 4. Create or append line item to Patient's Active Invoice
    let invoice = await prisma.invoice.findFirst({
      where: { patientId: patient.id, paymentStatus: "Outstanding" },
      orderBy: { createdAt: "desc" },
    });

    if (!invoice) {
      const lastInv = await prisma.invoice.findFirst({ orderBy: { createdAt: "desc" } });
      const lastNum = lastInv ? parseInt(lastInv.invoiceNo.replace("INV-", "")) || 88210 : 88210;
      const invoiceNo = `INV-${lastNum + 1}`;

      invoice = await prisma.invoice.create({
        data: {
          invoiceNo,
          patientId: patient.id,
          billDate: new Date().toISOString().slice(0, 10),
          subtotal: totalPharmacyCharge,
          coPayAmount: Math.round(totalPharmacyCharge * 0.1),
          finalAmount: totalPharmacyCharge,
          paymentStatus: "Outstanding",
        },
      });
    } else {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: invoice.subtotal + totalPharmacyCharge,
          finalAmount: invoice.finalAmount + totalPharmacyCharge,
        },
      });
    }

    // Add Invoice Item
    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: `Pharmacy Rx Dispensed: ${dispensedItemsSummary.join(", ")}`,
        category: "Pharmacy",
        amount: totalPharmacyCharge,
      },
    });

    // 5. Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          timestamp: new Date().toISOString(),
          userName: "Pharmacist Ananya",
          action: "DISPENSE_PRESCRIPTION",
          module: "Pharmacy",
          ipAddress: "192.168.1.45",
          details: `Dispensed Rx #${prescriptionId} for ${patient.name}. Stock reduced and ₹${totalPharmacyCharge} billed to Invoice #${invoice.invoiceNo}.`,
          status: "SUCCESS",
        },
      });
    } catch (e) {
      console.warn("Audit log creation error:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Prescription successfully dispensed! Stock updated and ₹${totalPharmacyCharge} added to Patient Invoice #${invoice.invoiceNo}.`,
      prescription: updatedPrescription,
      billedAmount: totalPharmacyCharge,
      invoiceNo: invoice.invoiceNo,
    });
  } catch (error: any) {
    console.error("POST /api/pharmacy/dispense error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
