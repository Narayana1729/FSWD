import { describe, it, expect } from "vitest";
import { hasPermission, Role } from "@/lib/rbac";

describe("Role-Based Access Control (RBAC) Permissions (Unit Tests)", () => {
  it("grants wildcard permissions to ADMIN across all resources and actions", () => {
    expect(hasPermission("ADMIN", "patients", "read")).toBe(true);
    expect(hasPermission("ADMIN", "patients", "delete")).toBe(true);
    expect(hasPermission("ADMIN", "billing", "settle")).toBe(true);
    expect(hasPermission("ADMIN", "surgeries", "schedule")).toBe(true);
    expect(hasPermission("ADMIN", "audit-logs", "purge")).toBe(true);
  });

  it("grants clinical permissions to DOCTOR but restricts administrative/pharmacy actions", () => {
    expect(hasPermission("DOCTOR", "patients", "read")).toBe(true);
    expect(hasPermission("DOCTOR", "patients", "update")).toBe(true);
    expect(hasPermission("DOCTOR", "prescriptions", "create")).toBe(true);
    expect(hasPermission("DOCTOR", "lab-orders", "create")).toBe(true);
    expect(hasPermission("DOCTOR", "surgeries", "schedule")).toBe(true);

    // Doctors cannot dispense pharmacy stock or perform billing invoicing
    expect(hasPermission("DOCTOR", "pharmacy", "dispense")).toBe(false);
    expect(hasPermission("DOCTOR", "invoices", "create")).toBe(false);
  });

  it("grants patient care permissions to NURSE while denying prescription authoring", () => {
    expect(hasPermission("NURSE", "patients", "read")).toBe(true);
    expect(hasPermission("NURSE", "vitals", "create")).toBe(true);
    expect(hasPermission("NURSE", "beds", "update")).toBe(true);

    // Nurses cannot write clinical prescriptions or settle invoices
    expect(hasPermission("NURSE", "prescriptions", "create")).toBe(false);
    expect(hasPermission("NURSE", "billing", "process")).toBe(false);
  });

  it("grants dispensing authority to PHARMACIST while denying clinical interventions", () => {
    expect(hasPermission("PHARMACIST", "pharmacy", "dispense")).toBe(true);
    expect(hasPermission("PHARMACIST", "prescriptions", "read")).toBe(true);

    expect(hasPermission("PHARMACIST", "surgeries", "create")).toBe(false);
    expect(hasPermission("PHARMACIST", "patients", "update")).toBe(false);
  });

  it("strictly confines PATIENT to own resource reading and denies staff privileges", () => {
    expect(hasPermission("PATIENT", "own", "read")).toBe(true);

    // Patient cannot read general patient list, edit beds, or access staff dashboards
    expect(hasPermission("PATIENT", "patients", "read")).toBe(false);
    expect(hasPermission("PATIENT", "patients", "update")).toBe(false);
    expect(hasPermission("PATIENT", "beds", "read")).toBe(false);
    expect(hasPermission("PATIENT", "billing", "create")).toBe(false);
    expect(hasPermission("PATIENT", "audit-logs", "read")).toBe(false);
  });

  it("rejects unknown or invalid role claims safely", () => {
    expect(hasPermission("GUEST", "patients", "read")).toBe(false);
    expect(hasPermission("", "patients", "read")).toBe(false);
    expect(hasPermission("HACKER", "patients", "read")).toBe(false);
    expect(hasPermission("null" as any, "patients", "read")).toBe(false);
  });
});
