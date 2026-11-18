// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lab-orders/results — Atomic & Idempotent Result Verification & Billing Transaction
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LAB_TEST_CATALOG } from "@/lib/hms-data";
import { authorizeRole } from "@/lib/rbac";
import {
  evaluateSimulatedLabCriticalThreshold,
  generateNotificationIdempotencyKey,
  CriticalEvaluationResult,
} from "@/lib/clinical-accountability";

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "LAB_TECH");
    if (auth.error) return auth.error;
    const user = auth.user;

    const body = await request.json();
    const { labOrderId, results, technician, verifyingDoctor } = body;

    if (!labOrderId || !results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "labOrderId and at least one test result parameter are required" },
        { status: 400 }
      );
    }

    // Wrap entire verification + critical task + notification outbox + billing + audit log inside a single Prisma Transaction
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

      // 2. Insert LabResult records & evaluate simulated critical decision thresholds
      const createdResults = [];
      const criticalFindings: CriticalEvaluationResult[] = [];

      for (const resItem of results) {
        const criticalEval = evaluateSimulatedLabCriticalThreshold(resItem.parameter, resItem.value);
        if (criticalEval.isCritical) {
          criticalFindings.push(criticalEval);
        }

        const createdRes = await tx.labResult.create({
          data: {
            labOrderId: labOrder.id,
            parameter: resItem.parameter || "Measurement",
            value: String(resItem.value || ""),
            unit: resItem.unit || catalogEntry.unit || null,
            referenceRange: resItem.referenceRange || catalogEntry.referenceRange || null,
            isAbnormal: Boolean(resItem.isAbnormal) || criticalEval.isCritical,
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

      // 4. ATOMIC CLINICAL ALERT & OUTBOX DISPATCH (When simulated critical threshold breached)
      let taskTicket: any = null;
      let notificationJob: any = null;

      if (criticalFindings.length > 0) {
        const primaryCritical = criticalFindings[0];

        // Resolve designated recipient user ID (attending doctor user or fallback to authorized clinician)
        let recipientUserId = user.id;
        if (labOrder.doctor?.userId) {
          recipientUserId = labOrder.doctor.userId;
        } else {
          const fallbackDocUser = await tx.user.findFirst({
            where: { role: "DOCTOR", isActive: true },
          });
          if (fallbackDocUser) recipientUserId = fallbackDocUser.id;
        }

        // 4a. Create TaskTicket (Domain Responsibility)
        taskTicket = await tx.taskTicket.create({
          data: {
            ticketNo: `TASK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            patientId: labOrder.patientId,
            sourceType: "LAB_CRITICAL",
            sourceId: labOrder.id,
            title: `CRITICAL ALERT: ${primaryCritical.parameter} = ${primaryCritical.value} ${primaryCritical.unit}`,
            description: `Simulated critical threshold breached (${primaryCritical.parameter} ${primaryCritical.value} ${primaryCritical.unit}, limit: ${primaryCritical.thresholdLabel}). Requires immediate physician review.`,
            criticalValueJson: JSON.stringify(criticalFindings),
            severity: "CRITICAL",
            status: "OPEN",
            escalationLevel: 1,
            assignedDoctorId: labOrder.doctorId || null,
            assignedRole: "DOCTOR",
            escalationDeadline: new Date(Date.now() + 10 * 60 * 1000), // 10-minute SLA
          },
        });

        // 4b. Create NotificationJob in Outbox (Persistent Queue)
        notificationJob = await tx.notificationJob.create({
          data: {
            jobId: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            taskId: taskTicket.id,
            idempotencyKey: generateNotificationIdempotencyKey({
              taskId: taskTicket.id,
              escalationTier: 1,
              channel: "SIMULATED_SMS",
            }),
            recipientUserId,
            recipientPhone: labOrder.doctor?.phone || labOrder.patient?.phone || null,
            channel: "SIMULATED_SMS",
            payloadJson: JSON.stringify({
              ticketNo: taskTicket.ticketNo,
              patientName: labOrder.patient.name,
              mrn: labOrder.patient.mrn,
              parameter: primaryCritical.parameter,
              value: primaryCritical.value,
              unit: primaryCritical.unit,
              severity: "CRITICAL",
            }),
            status: "PENDING",
            attemptsCount: 0,
            maxRetries: 3,
          },
        });

        // 4c. Audit Log for Critical Alert Generation
        await tx.auditLog.create({
          data: {
            logId: `LOG-ALERT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            userId: user.id,
            userName: user.name || verifyingDoctor || "Pathologist",
            role: user.role || "LAB_TECH",
            action: "CRITICAL_ALERT_CREATED",
            resource: `TaskTicket/${taskTicket.id} (${taskTicket.ticketNo}) enqueued into NotificationJob/${notificationJob.id}`,
            ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
            status: "Success",
          },
        });
      }

      // 5. Idempotent Billing Charge Generation
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

      // 6. Audit Log Creation for verification
      await tx.auditLog.create({
        data: {
          logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          userId: user.id,
          userName: user.name || verifyingDoctor || "Dr. Charaka",
          role: user.role || "Pathologist",
          action: "VERIFY_LAB_RESULTS",
          resource: `Authorized Lab Order #${labOrder.orderId} (${labOrder.testName}) for ${labOrder.patient.name}. ₹${testPrice} billed to Invoice #${invoice.invoiceNo}.`,
          ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
          status: "Success",
        },
      });

      return {
        labOrder: updatedOrder,
        results: createdResults,
        billedAmount: testPrice,
        invoiceNo: invoice.invoiceNo,
        taskTicket: taskTicket ? { id: taskTicket.id, ticketNo: taskTicket.ticketNo, status: taskTicket.status } : null,
        outboxJob: notificationJob ? { id: notificationJob.id, jobId: notificationJob.jobId, status: notificationJob.status } : null,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Lab results successfully verified & authorized! Billed ₹${transactionResult.billedAmount} to Invoice #${transactionResult.invoiceNo}.`,
      ...transactionResult,
    });
  } catch (error: any) {
    console.error("POST /api/lab-orders/results transaction error:", error);
    return NextResponse.json({ error: error.message || "Transaction failed" }, { status: 400 });
  }
}
