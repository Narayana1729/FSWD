// ─────────────────────────────────────────────────────────────────────────────
// POST /api/emergency/admit — Atomic Emergency Admission & Triage Settlement Transaction
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EMERGENCY_RATES_CATALOG } from "@/lib/hms-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emergencyCaseId, bedNo, targetWard } = body;

    if (!emergencyCaseId) {
      return NextResponse.json({ error: "emergencyCaseId is required" }, { status: 400 });
    }

    // Wrap emergency stabilization, bed allocation, billing charge, and audit log in a single transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch emergency case
      const emgCase = await tx.emergencyCase.findFirst({
        where: {
          OR: [{ id: emergencyCaseId }, { caseId: emergencyCaseId }],
        },
        include: { patient: true },
      });

      if (!emgCase) {
        throw new Error("Emergency case record not found in database.");
      }

      // Guard 1: Double Admission Protection
      if (emgCase.status === "Admitted") {
        throw new Error(`Duplicate admission attempt! Emergency Case #${emgCase.caseId} has already been admitted to inpatient care.`);
      }

      // Ensure patient record
      let patient = emgCase.patient;
      if (!patient && emgCase.patientId) {
        patient = await tx.patient.findUnique({ where: { id: emgCase.patientId } });
      }

      if (!patient) {
        patient = await tx.patient.findFirst({ where: { name: emgCase.patientName } });
      }

      if (!patient) {
        const count = await tx.patient.count();
        patient = await tx.patient.create({
          data: {
            mrn: `P-${1010 + count}`,
            name: emgCase.patientName,
            age: emgCase.age || 30,
            gender: emgCase.gender || "Male",
            phone: "+91 98765 00000",
            email: "emergency@dronagiri.health",
            address: "Emergency Triage Intake",
            bloodGroup: "O+",
            status: "Admitted",
            emergencyContactJson: JSON.stringify({ name: "ER Contact", relation: "Relative", phone: "+91 98765 00001" }),
            medicalHistoryJson: JSON.stringify(["Emergency Intake"]),
            allergiesJson: JSON.stringify(["None Reported"]),
            currentConditionsJson: JSON.stringify([emgCase.chiefComplaint]),
            insuranceJson: JSON.stringify({ provider: "Ayush Care Plus", policyNo: "AYU-EMG-99", coverageLimit: 100000, coPayPct: 10 }),
          },
        });
      }

      // 2. Look up Emergency Triage Fee Catalog
      const triageCatalog = EMERGENCY_RATES_CATALOG[emgCase.severity] || EMERGENCY_RATES_CATALOG["RED"];
      const triageFee = triageCatalog.rate;
      const chargeDescription = `Emergency: ${triageCatalog.name} (${emgCase.caseId})`;

      // 3. Find available bed (prefer ICU for RED, else General/Semi)
      const targetBedNo = bedNo || (emgCase.severity === "RED" ? "ICU-03" : "GEN-302");
      let bed = await tx.bed.findFirst({
        where: { bedNo: targetBedNo },
        include: { room: { include: { ward: true } } },
      });

      if (!bed || bed.status !== "Available") {
        bed = await tx.bed.findFirst({
          where: { status: "Available" },
          include: { room: { include: { ward: true } } },
        });
      }

      if (!bed) {
        throw new Error("No available inpatient bed found in hospital inventory for emergency admission.");
      }

      // 4. Update Bed to Occupied & Patient to Admitted
      const allocatedBed = await tx.bed.update({
        where: { id: bed.id },
        data: {
          status: "Occupied",
          patientId: patient.id,
          patientName: patient.name,
          admittedDate: new Date().toISOString().slice(0, 10),
        },
      });

      const admittedPatient = await tx.patient.update({
        where: { id: patient.id },
        data: { status: "Admitted" },
      });

      // 5. Mark EmergencyCase as Admitted
      const updatedCase = await tx.emergencyCase.update({
        where: { id: emgCase.id },
        data: {
          status: "Admitted",
          patientId: patient.id,
          bedNo: allocatedBed.bedNo,
        },
      });

      // 6. Idempotent Billing Charge Generation
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
            subtotal: triageFee,
            coPayAmount: Math.round(triageFee * 0.1),
            finalAmount: triageFee,
            paymentStatus: "Outstanding",
          },
          include: { items: true },
        });
      }

      const existingCharge = await tx.invoiceItem.findFirst({
        where: {
          invoiceId: invoice.id,
          description: { contains: emgCase.caseId },
        },
      });

      let triageLineItem = existingCharge;
      if (!existingCharge) {
        triageLineItem = await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: chargeDescription,
            category: "Procedure",
            amount: triageFee,
          },
        });

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: invoice.subtotal + triageFee,
            finalAmount: invoice.finalAmount + triageFee,
          },
        });
      }

      // 7. Audit Log Entry
      await tx.auditLog.create({
        data: {
          logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          userName: "Dr. Ashwini Kumaras",
          role: "Emergency Chief",
          action: "EMERGENCY_ADMISSION",
          resource: `Admitted Emergency Case #${emgCase.caseId} (${emgCase.severity} Triage) to Bed #${allocatedBed.bedNo}. Billed ₹${triageFee.toLocaleString('en-IN')}. Invoice #${invoice.invoiceNo}.`,
          ip: "192.168.1.72",
          status: "Success",
        },
      });

      // 8. Auto-Release Dispatched Ambulances — return all "On Dispatch" ambulances back to "Available"
      const dispatchedAmbulances = await tx.ambulance.findMany({ where: { availability: "On Dispatch" } });
      for (const amb of dispatchedAmbulances) {
        await tx.ambulance.update({
          where: { id: amb.id },
          data: { availability: "Available" },
        });
        await tx.ambulanceTrip.updateMany({
          where: { ambulanceId: amb.id, status: "In Progress" },
          data: { status: "Completed", completedAt: new Date() },
        });
      }

      const finalInvoice = await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { items: true },
      });

      return {
        emergencyCase: updatedCase,
        patient: admittedPatient,
        bed: allocatedBed,
        triageFee,
        invoice: finalInvoice,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Emergency case #${transactionResult.emergencyCase.caseId} admitted successfully to Bed #${transactionResult.bed.bedNo}! Billed ₹${transactionResult.triageFee} triage fee.`,
      ...transactionResult,
    });
  } catch (error: any) {
    console.error("POST /api/emergency/admit transaction error:", error);
    return NextResponse.json({ error: error.message || "Transaction failed" }, { status: 400 });
  }
}
