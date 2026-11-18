import { describe, it, expect } from "vitest";
import { isPatientOwner, AuthUser } from "@/lib/rbac";

describe("Patient Resource-Level Authorization & Ownership (Unit Tests)", () => {
  const patientSundar = {
    id: "pat-1001",
    mrn: "P-1001",
    userId: "usr-sundar-cuid",
    email: "sundar@dronagiri.health",
  };

  const patientSriman = {
    id: "pat-34872",
    mrn: "HMS34872",
    userId: "usr-sriman-cuid",
    email: "srimannarayana@dronagiri.health",
  };

  it("authorizes a patient accessing their own record via userId match", () => {
    const sundarUser: AuthUser = {
      id: "usr-sundar-cuid",
      email: "sundar@dronagiri.health",
      role: "PATIENT",
      name: "Sundar",
    };

    expect(isPatientOwner(sundarUser, patientSundar)).toBe(true);
  });

  it("authorizes a patient accessing their own record via case-insensitive email match", () => {
    const unlinkedSundarUser: AuthUser = {
      id: "usr-new-cuid",
      email: "SUNDAR@dronagiri.health", // case difference
      role: "PATIENT",
      name: "Sundar",
    };

    // Patient record with matching email
    expect(isPatientOwner(unlinkedSundarUser, patientSundar)).toBe(true);
  });

  it("strictly DENIES a patient attempting to read another patient's record (IDOR Prevention)", () => {
    const srimanUser: AuthUser = {
      id: "usr-sriman-cuid",
      email: "srimannarayana@dronagiri.health",
      role: "PATIENT",
      name: "Srimannarayana",
    };

    // Srimannarayana tries to access Sundar's record
    const isAllowed = isPatientOwner(srimanUser, patientSundar);
    expect(isAllowed).toBe(false);
  });

  it("authorizes clinical staff (DOCTOR) to access patient records regardless of owner ID", () => {
    const doctorUser: AuthUser = {
      id: "usr-doc-101",
      email: "dr.dhanvantari@dronagiri.health",
      role: "DOCTOR",
      name: "Dr. Dhanvantari",
    };

    expect(isPatientOwner(doctorUser, patientSundar)).toBe(true);
    expect(isPatientOwner(doctorUser, patientSriman)).toBe(true);
  });

  it("authorizes administrative staff (ADMIN) to access patient records", () => {
    const adminUser: AuthUser = {
      id: "usr-admin-01",
      email: "admin@dronagiri.health",
      role: "ADMIN",
      name: "Chief Administrator",
    };

    expect(isPatientOwner(adminUser, patientSundar)).toBe(true);
    expect(isPatientOwner(adminUser, patientSriman)).toBe(true);
  });

  it("authorizes nursing staff (NURSE) to access patient records for ward care", () => {
    const nurseUser: AuthUser = {
      id: "usr-nurse-01",
      email: "nurse.ananya@dronagiri.health",
      role: "NURSE",
      name: "Nurse Ananya",
    };

    expect(isPatientOwner(nurseUser, patientSundar)).toBe(true);
  });
});
