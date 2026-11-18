// ─────────────────────────────────────────────────────────────────────────────
// POST /api/discharges — Atomic Inpatient Discharge & Final Bill Settlement Transaction
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { WARD_RATES_CATALOG } from "@/lib/hms-data";
import { authorizeRole } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "NURSE");
    if (auth.error) return auth.error;
    const user = auth.user;

    const body = await request.json();
    const { patientId, bedId, bedNo, dischargeNotes } = body;

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required for discharge" }, { status: 400 });
    }

    // Wrap entire discharge summary, bed release, room charge appending, and audit logging inside a single Prisma Transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch patient
      const patient = await tx.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        throw new Error("Patient record not found in database.");
      }

      // Guard 1: Double Discharge / Non-admitted Patient Protection
      if (patient.status === "Discharged") {
        throw new Error(`Duplicate discharge attempt! Patient "${patient.name}" has already been discharged.`);
      }

      // 2. Fetch occupied bed
      const bedWhere = bedId ? { id: bedId } : bedNo ? { bedNo } : { patientId };
      const bed = await tx.bed.findFirst({
        where: bedWhere,
        include: { room: { include: { ward: true } } },
      });

      if (!bed) {
        throw new Error(`Inpatient bed allocation record not found for patient ${patient.name}.`);
      }

      if (bed.status !== "Occupied") {
        throw new Error(`Bed #${bed.bedNo} is currently "${bed.status}". Cannot release an unallocated bed.`);
      }

      // 3. Compute billable stay days (Explicit Rule: Any partial calendar day counts as 1 full billable day)
      const admissionTime = bed.admittedDate ? new Date(bed.admittedDate).getTime() : Date.now() - 48 * 3600 * 1000;
      const stayHours = Math.max(1, (Date.now() - admissionTime) / (1000 * 3600));
      const billableDays = Math.max(1, Math.ceil(stayHours / 24));

      const wardName = bed.room.ward.name || bed.room.ward.type || "General";
      const wardCatalog = WARD_RATES_CATALOG[wardName] || WARD_RATES_CATALOG["ICU"] || { ratePerDay: 5000, name: "ICU Resuscitation Bed" };
      const dailyRate = wardCatalog.ratePerDay;
      const roomTotalCharge = billableDays * dailyRate;

      const roomChargeDescription = `${wardCatalog.name} Stay (${billableDays} Days @ ₹${dailyRate.toLocaleString('en-IN')}/day)`;

      // 4. Fetch or create patient invoice
      let invoice = await tx.invoice.findFirst({
        where: { patientId: patient.id, paymentStatus: "Outstanding" },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });

      if (!invoice) {
        const lastInv = await tx.invoice.findFirst({ orderBy: { createdAt: "desc" } });
        const lastNum = lastInv ? parseInt(lastInv.invoiceNo.replace("INV-", "")) || 88210 : 88210;
        const invoiceNo = `INV-${lastNum + 1}`;

        invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            patientId: patient.id,
            billDate: new Date().toISOString().slice(0, 10),
            subtotal: roomTotalCharge,
            coPayAmount: Math.round(roomTotalCharge * 0.1),
            finalAmount: roomTotalCharge,
            paymentStatus: "Outstanding",
          },
          include: { items: true },
        });
      }

      // 5. Append ONLY missing Room/Bed stay line item (Idempotency Guard: do NOT re-add Rx/Lab/Radiology)
      const existingRoomCharge = await tx.invoiceItem.findFirst({
        where: {
          invoiceId: invoice.id,
          category: "Room",
        },
      });

      let roomLineItem = existingRoomCharge;
      if (!existingRoomCharge) {
        roomLineItem = await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: roomChargeDescription,
            category: "Room",
            amount: roomTotalCharge,
          },
        });

        // Recalculate invoice final total with room charge added
        const updatedSubtotal = invoice.subtotal + roomTotalCharge;
        const coPayPct = patient.insuranceJson ? (JSON.parse(patient.insuranceJson as string).coPayPct || 10) : 10;
        const updatedCoPay = Math.round(updatedSubtotal * (coPayPct / 100));

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: updatedSubtotal,
            coPayAmount: updatedCoPay,
            finalAmount: updatedSubtotal,
          },
        });
      }

      // 6. Release bed (Occupied -> Available)
      const releasedBed = await tx.bed.update({
        where: { id: bed.id },
        data: {
          status: "Available",
          patientId: null,
          patientName: null,
          admittedDate: null,
        },
      });

      // 7. Update patient status to Discharged
      const dischargedPatient = await tx.patient.update({
        where: { id: patient.id },
        data: { status: "Discharged" },
      });

      // 8. Create Audit Log entry
      await tx.auditLog.create({
        data: {
          logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          userId: user.id,
          userName: user.name || "Attending Clinician",
          role: user.role || "Doctor",
          action: "FINAL_INPATIENT_DISCHARGE",
          resource: `Discharged patient ${patient.name} from Bed #${bed.bedNo}. Appended ₹${roomTotalCharge.toLocaleString('en-IN')} room charge (${billableDays} days). Final Invoice #${invoice.invoiceNo}.`,
          ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
          status: "Success",
        },
      });

      // Fetch final updated invoice
      const finalInvoice = await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { items: true },
      });

      return {
        patient: dischargedPatient,
        bed: releasedBed,
        stayDays: billableDays,
        roomCharge: roomTotalCharge,
        invoice: finalInvoice,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Inpatient discharge summary & final bill settlement complete for ${transactionResult.patient.name}. Bed #${transactionResult.bed.bedNo} released to Available.`,
      ...transactionResult,
    });
  } catch (error: any) {
    console.error("POST /api/discharges transaction error:", error);
    return NextResponse.json({ error: error.message || "Transaction failed" }, { status: 400 });
  }
}
