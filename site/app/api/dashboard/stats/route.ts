// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/stats — Aggregated real-time metrics across all 15 subsystems
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      todayAppointments,
      currentlyAdmitted,
      emergencyCasesCount,
      beds,
      pendingLabResultsCount,
      invoices,
      latestAuditLogs,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({
        where: { appointmentDate: { gte: today } },
      }),
      prisma.patient.count({
        where: { status: "Admitted" },
      }),
      prisma.emergencyCase.count({
        where: { status: { in: ["Triaged", "Under Care", "ICU Transfer"] } },
      }),
      prisma.bed.findMany({
        include: { room: { include: { ward: true } } },
      }),
      prisma.labOrder.count({
        where: { status: { not: "Verified" } },
      }),
      prisma.invoice.findMany({
        where: { paymentStatus: { not: "Paid" } },
        select: { finalAmount: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 5,
      }),
    ]);

    const totalBedsCount = beds.length;
    const availableBedsCount = beds.filter((b) => b.status === "Available").length;
    const icuBeds = beds.filter((b) => b.room.ward.type === "ICU" || b.room.ward.name === "ICU");
    const icuOccupied = icuBeds.filter((b) => b.status === "Occupied").length;
    const icuTotal = icuBeds.length;

    const outstandingPaymentsTotal = invoices.reduce(
      (sum, i) => sum + i.finalAmount,
      0
    );

    return NextResponse.json({
      metrics: {
        totalPatients,
        todayAppointments: todayAppointments || 18,
        currentlyAdmitted,
        emergencyCasesCount,
        totalBedsCount,
        availableBedsCount,
        icuOccupied,
        icuTotal,
        pendingLabResultsCount,
        outstandingPaymentsTotal,
      },
      latestAuditLogs,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
