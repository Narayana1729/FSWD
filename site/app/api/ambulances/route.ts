// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/ambulances — List ambulance fleet
// POST /api/ambulances — Dispatch or register ambulance
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { authorizeRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const ambulances = await prisma.ambulance.findMany({
      include: {
        trips: {
          where: { status: "In Progress" },
          take: 1,
        },
      },
      orderBy: { ambulanceId: "asc" },
    });
    return NextResponse.json({ ambulances });
  } catch (error) {
    console.error("GET /api/ambulances error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST");
    if (auth.error) return auth.error;

    const body = await request.json();
    const { action, ambulanceId, patientName, pickupAddress, destination, etaMins } = body;

    // Dispatch trip
    if (action === "dispatch") {
      if (!ambulanceId || !pickupAddress || !destination) {
        return NextResponse.json(
          { error: "ambulanceId, pickupAddress, destination are required" },
          { status: 400 }
        );
      }

      const amb = await prisma.ambulance.findFirst({
        where: { OR: [{ id: ambulanceId }, { ambulanceId }] },
      });

      if (!amb) {
        return NextResponse.json({ error: "Ambulance vehicle not found" }, { status: 404 });
      }

      const trip = await prisma.ambulanceTrip.create({
        data: {
          ambulanceId: amb.id,
          patientName: patientName || null,
          pickupAddress,
          destination,
          etaMins: etaMins || 10,
          status: "In Progress",
        },
      });

      await prisma.ambulance.update({
        where: { id: amb.id },
        data: { availability: "On Dispatch" },
      });

      return NextResponse.json({ trip, message: "Ambulance dispatched successfully" });
    }

    // Register new vehicle
    const { vehicleNo, driverName, driverPhone, location, fuelLevelPct, equipmentType } = body;
    const count = await prisma.ambulance.count();
    const ambId = `AMB-${String(count + 1).padStart(2, "0")}`;

    const ambulance = await prisma.ambulance.create({
      data: {
        ambulanceId: ambId,
        vehicleNo,
        driverName,
        driverPhone,
        location: location || "Hospital Main Gate Station",
        availability: "Available",
        fuelLevelPct: fuelLevelPct || 100,
        equipmentType: equipmentType || "Basic Life Support (BLS)",
      },
    });

    return NextResponse.json({ ambulance }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ambulances error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeRole(request, "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST");
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id, ambulanceId, availability, location, fuelLevelPct, driverName, etaMins, emergencyCaseId, patientName, pickupAddress, destination } = body;

    if (!id && !ambulanceId) {
      return NextResponse.json({ error: "id or ambulanceId is required" }, { status: 400 });
    }

    const amb = await prisma.ambulance.findFirst({
      where: id ? { id } : { ambulanceId },
    });

    if (!amb) {
      return NextResponse.json({ error: "Ambulance not found" }, { status: 404 });
    }

    // Build update payload
    const updateData: Record<string, unknown> = {};
    if (availability) updateData.availability = availability;
    if (location) updateData.location = location;
    if (fuelLevelPct !== undefined) updateData.fuelLevelPct = fuelLevelPct;
    if (driverName) updateData.driverName = driverName;

    const updated = await prisma.ambulance.update({
      where: { id: amb.id },
      data: updateData,
    });

    // If dispatching to emergency, create an ambulance trip record
    let trip = null;
    if (availability === "On Dispatch" && (pickupAddress || emergencyCaseId)) {
      trip = await prisma.ambulanceTrip.create({
        data: {
          ambulanceId: amb.id,
          patientName: patientName || null,
          pickupAddress: pickupAddress || "Emergency Scene",
          destination: destination || "Dronagiri Emergency Bay 1",
          etaMins: etaMins || 8,
          status: "In Progress",
        },
      });
    }

    // If releasing ambulance back to Available, complete active trips
    if (availability === "Available") {
      await prisma.ambulanceTrip.updateMany({
        where: { ambulanceId: amb.id, status: "In Progress" },
        data: { status: "Completed", completedAt: new Date() },
      });
    }

    return NextResponse.json({
      ambulance: updated,
      trip,
      message: availability === "On Dispatch"
        ? `Ambulance ${amb.ambulanceId} dispatched! ETA: ${etaMins || 8} mins.`
        : availability === "Available"
        ? `Ambulance ${amb.ambulanceId} released and available for next dispatch.`
        : `Ambulance ${amb.ambulanceId} updated.`,
    });
  } catch (error: any) {
    console.error("PATCH /api/ambulances error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
