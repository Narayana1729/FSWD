import { describe, it, expect } from "vitest";
import {
  TaskTicketState,
  transitionTask,
  canTransitionTask,
  isAuthorizedToAcknowledge,
  isAuthorizedToResolve,
  evaluateEscalation,
  applyEscalation,
  calculateExponentialBackoff,
  generateNotificationIdempotencyKey,
  evaluateSimulatedLabCriticalThreshold,
  formatSimulatedResolution,
  InvalidTaskTransitionError,
  UnauthorizedTaskActionError,
  MissingResolutionNotesError,
  TaskAlreadyAcknowledgedError,
} from "../lib/clinical-accountability";

describe("Stage 1: Clinical Accountability & Task State Machine", () => {
  const mockBaseTask: TaskTicketState = {
    id: "task-001",
    ticketNo: "TASK-8801",
    patientId: "patient-101",
    sourceType: "LAB_CRITICAL",
    sourceId: "lab-result-505",
    title: "CRITICAL ALERT: Potassium = 6.8 mEq/L",
    description: "Simulated critical potassium elevation requiring review",
    criticalValue: {
      parameter: "Potassium",
      value: 6.8,
      unit: "mEq/L",
      thresholdLabel: "< 2.8 or > 6.0 mEq/L",
    },
    severity: "CRITICAL",
    status: "OPEN",
    escalationLevel: 1,
    assignedDoctorId: "doc-dr-arjun",
    assignedRole: "DOCTOR",
    escalationDeadline: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("1. Valid and Invalid State Transitions", () => {
    it("allows valid forward transition from OPEN to ACKNOWLEDGED", () => {
      expect(canTransitionTask("OPEN", "ACKNOWLEDGED")).toBe(true);
      const ackTask = transitionTask(mockBaseTask, "ACKNOWLEDGED", {
        actorUserId: "doc-dr-arjun",
        actorRole: "DOCTOR",
      });

      expect(ackTask.status).toBe("ACKNOWLEDGED");
      expect(ackTask.acknowledgedById).toBe("doc-dr-arjun");
      expect(ackTask.acknowledgedAt).toBeDefined();
    });

    it("strictly rejects direct transition from OPEN to RESOLVED without prior acknowledgment", () => {
      expect(canTransitionTask("OPEN", "RESOLVED")).toBe(false);
      expect(() => {
        transitionTask(mockBaseTask, "RESOLVED", {
          actorUserId: "doc-dr-arjun",
          actorRole: "DOCTOR",
          resolutionNotes: "Follow-up completed",
        });
      }).toThrowError(InvalidTaskTransitionError);
    });

    it("allows valid transition from ACKNOWLEDGED to IN_PROGRESS", () => {
      expect(canTransitionTask("ACKNOWLEDGED", "IN_PROGRESS")).toBe(true);
      const ackTask: TaskTicketState = {
        ...mockBaseTask,
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedById: "doc-dr-arjun",
      };

      const inProgressTask = transitionTask(ackTask, "IN_PROGRESS", {
        actorUserId: "doc-dr-arjun",
        actorRole: "DOCTOR",
      });

      expect(inProgressTask.status).toBe("IN_PROGRESS");
    });

    it("allows valid transition from ACKNOWLEDGED or IN_PROGRESS to RESOLVED with required notes", () => {
      const ackTask: TaskTicketState = {
        ...mockBaseTask,
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedById: "doc-dr-arjun",
      };

      const resolvedTask = transitionTask(ackTask, "RESOLVED", {
        actorUserId: "doc-dr-arjun",
        actorRole: "DOCTOR",
        resolutionNotes: "Simulated corrective protocol ordered and repeat sample scheduled",
      });

      expect(resolvedTask.status).toBe("RESOLVED");
      expect(resolvedTask.resolvedById).toBe("doc-dr-arjun");
      expect(resolvedTask.resolvedAt).toBeDefined();
      expect(resolvedTask.resolutionNotes).toContain("Simulated corrective protocol");
    });

    it("rejects resolution if clinical follow-up notes are missing or too short", () => {
      const ackTask: TaskTicketState = {
        ...mockBaseTask,
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedById: "doc-dr-arjun",
      };

      expect(() => {
        transitionTask(ackTask, "RESOLVED", {
          actorUserId: "doc-dr-arjun",
          actorRole: "DOCTOR",
          resolutionNotes: "   ",
        });
      }).toThrowError(MissingResolutionNotesError);
    });

    it("rejects ordinary transitions attempting to reopen terminal tasks (RESOLVED, CANCELLED)", () => {
      const resolvedTask: TaskTicketState = {
        ...mockBaseTask,
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedById: "doc-dr-arjun",
        resolutionNotes: "Completed",
      };

      expect(canTransitionTask("RESOLVED", "OPEN")).toBe(false);
      expect(canTransitionTask("RESOLVED", "ACKNOWLEDGED")).toBe(false);
      expect(canTransitionTask("RESOLVED", "IN_PROGRESS")).toBe(false);

      expect(() => {
        transitionTask(resolvedTask, "OPEN", {
          actorUserId: "doc-dr-arjun",
          actorRole: "DOCTOR",
        });
      }).toThrowError(InvalidTaskTransitionError);

      const cancelledTask: TaskTicketState = {
        ...mockBaseTask,
        status: "CANCELLED",
        cancellationReason: "Test specimen hemolyzed; re-collection ordered",
      };

      expect(canTransitionTask("CANCELLED", "OPEN")).toBe(false);
      expect(() => {
        transitionTask(cancelledTask, "ACKNOWLEDGED", {
          actorUserId: "doc-dr-arjun",
          actorRole: "DOCTOR",
        });
      }).toThrowError(InvalidTaskTransitionError);
    });
  });

  describe("2. Role-Based Authorization for Task Actions", () => {
    it("allows DOCTOR, NURSE, and ADMIN to acknowledge a task", () => {
      expect(isAuthorizedToAcknowledge(mockBaseTask, "DOCTOR", "user-doc")).toBe(true);
      expect(isAuthorizedToAcknowledge(mockBaseTask, "NURSE", "user-nurse")).toBe(true);
      expect(isAuthorizedToAcknowledge(mockBaseTask, "ADMIN", "user-admin")).toBe(true);
    });

    it("allows the specific assignedDoctorId to acknowledge regardless of role string case", () => {
      expect(isAuthorizedToAcknowledge(mockBaseTask, "doctor", "doc-dr-arjun")).toBe(true);
    });

    it("rejects unauthorized roles (PATIENT, BILLING, PHARMACIST) from acknowledging", () => {
      expect(isAuthorizedToAcknowledge(mockBaseTask, "PATIENT", "user-patient")).toBe(false);
      expect(isAuthorizedToAcknowledge(mockBaseTask, "BILLING", "user-billing")).toBe(false);
      expect(isAuthorizedToAcknowledge(mockBaseTask, "PHARMACIST", "user-pharm")).toBe(false);

      expect(() => {
        transitionTask(mockBaseTask, "ACKNOWLEDGED", {
          actorUserId: "user-patient",
          actorRole: "PATIENT",
        });
      }).toThrowError(UnauthorizedTaskActionError);
    });

    it("allows only DOCTOR or ADMIN to resolve a task, rejecting NURSE or other roles", () => {
      expect(isAuthorizedToResolve("DOCTOR")).toBe(true);
      expect(isAuthorizedToResolve("ADMIN")).toBe(true);
      expect(isAuthorizedToResolve("NURSE")).toBe(false);
      expect(isAuthorizedToResolve("PATIENT")).toBe(false);

      const ackTask: TaskTicketState = {
        ...mockBaseTask,
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedById: "nurse-priya",
      };

      expect(() => {
        transitionTask(ackTask, "RESOLVED", {
          actorUserId: "nurse-priya",
          actorRole: "NURSE",
          resolutionNotes: "Nurse documented bed monitoring",
        });
      }).toThrowError(UnauthorizedTaskActionError);
    });
  });

  describe("3. Concurrency & Duplicate Acknowledgment Safety", () => {
    it("throws TaskAlreadyAcknowledgedError when duplicate acknowledgment is attempted in strict mode", () => {
      const ackTask: TaskTicketState = {
        ...mockBaseTask,
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedById: "doc-dr-arjun",
      };

      expect(() => {
        transitionTask(
          ackTask,
          "ACKNOWLEDGED",
          {
            actorUserId: "doc-dr-sharma",
            actorRole: "DOCTOR",
          },
          { allowDuplicateAck: false }
        );
      }).toThrowError(TaskAlreadyAcknowledgedError);
    });

    it("returns task idempotently without state mutation when allowDuplicateAck is true", () => {
      const originalTime = new Date("2026-10-19T10:00:00Z");
      const ackTask: TaskTicketState = {
        ...mockBaseTask,
        status: "ACKNOWLEDGED",
        acknowledgedAt: originalTime,
        acknowledgedById: "doc-dr-arjun",
      };

      const result = transitionTask(
        ackTask,
        "ACKNOWLEDGED",
        {
          actorUserId: "doc-dr-arjun",
          actorRole: "DOCTOR",
        },
        { allowDuplicateAck: true }
      );

      expect(result.status).toBe("ACKNOWLEDGED");
      expect(result.acknowledgedAt).toEqual(originalTime);
      expect(result.acknowledgedById).toBe("doc-dr-arjun");
    });
  });

  describe("4. Multi-Tier Escalation Engine & Invariants", () => {
    it("marks task as not eligible for escalation when SLA deadline has not passed", () => {
      const futureTask: TaskTicketState = {
        ...mockBaseTask,
        escalationDeadline: new Date(Date.now() + 60000), // 1 minute in the future
      };

      const result = evaluateEscalation(futureTask, new Date());
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("SLA deadline not yet breached");
    });

    it("escalates Tier 1 to Tier 2 (Duty RMO) when deadline is exceeded", () => {
      const pastTime = new Date(Date.now() - 5000); // 5 seconds ago
      const expiredTask: TaskTicketState = {
        ...mockBaseTask,
        escalationLevel: 1,
        escalationDeadline: pastTime,
      };

      const evalResult = evaluateEscalation(expiredTask, new Date());
      expect(evalResult.eligible).toBe(true);
      expect(evalResult.newLevel).toBe(2);
      expect(evalResult.newAssignedRole).toBe("RMO");

      const escalatedTask = applyEscalation(expiredTask, new Date());
      expect(escalatedTask.escalationLevel).toBe(2);
      expect(escalatedTask.assignedRole).toBe("RMO");
      expect(escalatedTask.escalationDeadline.getTime()).toBeGreaterThan(Date.now());
      // Crucial invariant: Escalation does NOT mark the task resolved!
      expect(escalatedTask.status).toBe("OPEN");
    });

    it("escalates Tier 2 to Tier 3 (HOD / Admin) when secondary deadline is exceeded", () => {
      const expiredTier2Task: TaskTicketState = {
        ...mockBaseTask,
        escalationLevel: 2,
        assignedRole: "RMO",
        escalationDeadline: new Date(Date.now() - 10000),
      };

      const evalResult = evaluateEscalation(expiredTier2Task, new Date());
      expect(evalResult.eligible).toBe(true);
      expect(evalResult.newLevel).toBe(3);
      expect(evalResult.newAssignedRole).toBe("ADMIN");

      const escalated = applyEscalation(expiredTier2Task, new Date());
      expect(escalated.escalationLevel).toBe(3);
      expect(escalated.assignedRole).toBe("ADMIN");
      expect(escalated.status).toBe("OPEN");
    });

    it("halts escalation once task is RESOLVED or CANCELLED", () => {
      const resolvedTask: TaskTicketState = {
        ...mockBaseTask,
        status: "RESOLVED",
        escalationDeadline: new Date(Date.now() - 10000),
      };

      const evalResult = evaluateEscalation(resolvedTask, new Date());
      expect(evalResult.eligible).toBe(false);
      expect(evalResult.reason).toContain("Task is already finalized");

      const unchanged = applyEscalation(resolvedTask, new Date());
      expect(unchanged.escalationLevel).toBe(1);
    });

    it("caps escalation at Tier 3", () => {
      const maxTierTask: TaskTicketState = {
        ...mockBaseTask,
        escalationLevel: 3,
        assignedRole: "ADMIN",
        escalationDeadline: new Date(Date.now() - 10000),
      };

      const evalResult = evaluateEscalation(maxTierTask, new Date());
      expect(evalResult.eligible).toBe(false);
      expect(evalResult.reason).toContain("highest escalation tier");
    });
  });

  describe("5. Exponential Backoff & Retry Delay Calculations", () => {
    it("calculates exponential delays correctly according to policy", () => {
      const config = { baseDelayMs: 2000, multiplier: 2, maxDelayMs: 60000 };

      expect(calculateExponentialBackoff(1, config)).toBe(2000); // 2s
      expect(calculateExponentialBackoff(2, config)).toBe(4000); // 4s
      expect(calculateExponentialBackoff(3, config)).toBe(8000); // 8s
      expect(calculateExponentialBackoff(4, config)).toBe(16000); // 16s
      expect(calculateExponentialBackoff(5, config)).toBe(32000); // 32s
    });

    it("enforces maximum delay ceiling (cap)", () => {
      const config = { baseDelayMs: 2000, multiplier: 2, maxDelayMs: 30000 };
      expect(calculateExponentialBackoff(6, config)).toBe(30000); // capped at 30s instead of 64s
    });
  });

  describe("6. Idempotency Key Generation", () => {
    it("generates deterministic idempotency keys for identical events", () => {
      const key1 = generateNotificationIdempotencyKey({
        taskId: "task-001",
        escalationTier: 1,
        channel: "SIMULATED_SMS",
      });

      const key2 = generateNotificationIdempotencyKey({
        taskId: "task-001",
        escalationTier: 1,
        channel: "simulated_sms",
      });

      expect(key1).toBe("notif-task-001-tier1-simulated_sms");
      expect(key1).toBe(key2);
    });

    it("generates distinct keys across different escalation tiers and channels", () => {
      const keyTier1 = generateNotificationIdempotencyKey({
        taskId: "task-001",
        escalationTier: 1,
        channel: "SIMULATED_SMS",
      });

      const keyTier2 = generateNotificationIdempotencyKey({
        taskId: "task-001",
        escalationTier: 2,
        channel: "SIMULATED_SMS",
      });

      const keyPush = generateNotificationIdempotencyKey({
        taskId: "task-001",
        escalationTier: 1,
        channel: "IN_APP_PUSH",
      });

      expect(keyTier1).not.toBe(keyTier2);
      expect(keyTier1).not.toBe(keyPush);
    });
  });

  describe("7. Configurable Simulation Critical Thresholds & Neutral Resolution", () => {
    it("identifies critical potassium elevation under simulation rule", () => {
      const evalHigh = evaluateSimulatedLabCriticalThreshold("Potassium", "6.8");
      expect(evalHigh.isCritical).toBe(true);
      expect(evalHigh.severity).toBe("CRITICAL");

      const evalLow = evaluateSimulatedLabCriticalThreshold("Potassium", 2.4);
      expect(evalLow.isCritical).toBe(true);

      const evalNormal = evaluateSimulatedLabCriticalThreshold("Potassium", "4.2");
      expect(evalNormal.isCritical).toBe(false);
      expect(evalNormal.severity).toBe("ROUTINE");
    });

    it("identifies critical glucose abnormalities under simulation rule", () => {
      const severeHypo = evaluateSimulatedLabCriticalThreshold("Glucose", 32);
      expect(severeHypo.isCritical).toBe(true);

      const severeHyper = evaluateSimulatedLabCriticalThreshold("Glucose", 450);
      expect(severeHyper.isCritical).toBe(true);

      const normal = evaluateSimulatedLabCriticalThreshold("Glucose", 110);
      expect(normal.isCritical).toBe(false);
    });

    it("formats simulated resolution in neutral non-prescriptive language", () => {
      const formatted = formatSimulatedResolution("Simulated corrective protocol initiated and repeat test ordered");
      expect(formatted).toContain("Test clinician reviewed the simulated critical-result alert and recorded the required follow-up");
      expect(formatted).toContain("Simulated corrective protocol initiated");
    });
  });
});
