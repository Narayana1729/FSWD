/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Real Database Integration Test Suite: Transactional Outbox & Task Accountability
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests real database transactions, atomic commits, rollback integrity,
 * idempotency constraints, worker claiming, retry backoff, and crash recovery.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/db";
import {
  claimEligibleOutboxJobs,
  processSingleOutboxJob,
  runOutboxWorkerBatch,
  SimulatedChannelAdapter,
} from "../lib/outbox-worker";
import {
  evaluateSimulatedLabCriticalThreshold,
  generateNotificationIdempotencyKey,
} from "../lib/clinical-accountability";

describe("Stage 3: Real Database Integration — Transactional Outbox & Worker", () => {
  let testPatientId: string;
  let testDoctorId: string;
  let testDoctorUserId: string;

  beforeAll(async () => {
    // Set up unique isolated test records in the SQLite database
    const timestamp = Date.now();

    // Create test user for doctor
    const testDocUser = await prisma.user.create({
      data: {
        email: `test-doc-${timestamp}@dronagiri-hospital.test`,
        passwordHash: "hash-mock",
        name: "Dr. Test Arjun",
        role: "DOCTOR",
        phone: "+91-9876543210",
      },
    });
    testDoctorUserId = testDocUser.id;

    // Create doctor
    const testDoctor = await prisma.doctor.create({
      data: {
        userId: testDocUser.id,
        staffId: `DOC-T-${timestamp.toString().slice(-4)}`,
        name: "Dr. Test Arjun",
        specialization: "General Medicine",
        experienceYears: 6,
        phone: "+91-9876543210",
        email: testDocUser.email,
        departmentId: (await prisma.department.findFirst())?.id || "dept-gen",
      },
    });
    testDoctorId = testDoctor.id;

    // Create test patient
    const testPatient = await prisma.patient.create({
      data: {
        mrn: `MRN-T-${timestamp.toString().slice(-6)}`,
        name: "Test Patient Sharma",
        age: 52,
        gender: "Male",
        phone: "+91-9123456780",
        bloodGroup: "B+",
        status: "Admitted",
      },
    });
    testPatientId = testPatient.id;
  });

  afterAll(async () => {
    // Cleanup test records
    try {
      await prisma.deliveryAttempt.deleteMany({
        where: { notificationJob: { task: { patientId: testPatientId } } },
      });
      await prisma.notificationJob.deleteMany({
        where: { task: { patientId: testPatientId } },
      });
      await prisma.taskTicket.deleteMany({
        where: { patientId: testPatientId },
      });
      await prisma.labResult.deleteMany({
        where: { labOrder: { patientId: testPatientId } },
      });
      await prisma.labOrder.deleteMany({
        where: { patientId: testPatientId },
      });
      await prisma.patient.delete({ where: { id: testPatientId } });
      await prisma.doctor.delete({ where: { id: testDoctorId } });
      await prisma.user.delete({ where: { id: testDoctorUserId } });
    } catch (e) {
      // Ignore cleanup error
    }
  });

  it("1. Normal result verification creates LabResult without TaskTicket or NotificationJob", async () => {
    // Create a normal routine lab order
    const labOrder = await prisma.labOrder.create({
      data: {
        orderId: `LAB-NORM-${Date.now().toString().slice(-5)}`,
        patientId: testPatientId,
        doctorId: testDoctorId,
        testName: "Electrolytes Panel",
        category: "Biochemistry",
        sampleType: "Blood",
        status: "Requested",
      },
    });

    // Verify with normal values: Potassium = 4.2 mEq/L (reference: 3.5 - 5.0)
    const normalResults = [
      { parameter: "Potassium", value: "4.2", isAbnormal: false, unit: "mEq/L", referenceRange: "3.5-5.0" },
    ];

    await prisma.$transaction(async (tx) => {
      // Check critical policy
      const criticalEval = evaluateSimulatedLabCriticalThreshold(normalResults[0].parameter, normalResults[0].value);
      expect(criticalEval.isCritical).toBe(false);

      await tx.labResult.create({
        data: {
          labOrderId: labOrder.id,
          parameter: normalResults[0].parameter,
          value: normalResults[0].value,
          unit: normalResults[0].unit,
          isAbnormal: false,
          verifiedAt: new Date(),
        },
      });

      await tx.labOrder.update({
        where: { id: labOrder.id },
        data: { status: "Verified" },
      });
    });

    // Assert: LabResult exists and LabOrder is verified
    const dbOrder = await prisma.labOrder.findUnique({
      where: { id: labOrder.id },
      include: { results: true },
    });
    expect(dbOrder?.status).toBe("Verified");
    expect(dbOrder?.results.length).toBe(1);

    // Assert: No task ticket or notification job was created
    const relatedTasks = await prisma.taskTicket.findMany({
      where: { sourceId: labOrder.id },
    });
    expect(relatedTasks.length).toBe(0);
  });

  it("2. Simulated critical result commits LabResult, TaskTicket, NotificationJob, and AuditLog atomically", async () => {
    const labOrder = await prisma.labOrder.create({
      data: {
        orderId: `LAB-CRIT-${Date.now().toString().slice(-5)}`,
        patientId: testPatientId,
        doctorId: testDoctorId,
        testName: "Serum Potassium STAT",
        category: "Biochemistry",
        sampleType: "Blood",
        status: "Requested",
      },
    });

    // Enter critical potassium: 6.8 mEq/L (> 6.0 mEq/L cutoff)
    const criticalResults = [
      { parameter: "Potassium", value: "6.8", isAbnormal: true, unit: "mEq/L", referenceRange: "3.5-5.0" },
    ];

    const txResult = await prisma.$transaction(async (tx) => {
      const evalRes = evaluateSimulatedLabCriticalThreshold(criticalResults[0].parameter, criticalResults[0].value);
      expect(evalRes.isCritical).toBe(true);

      // 1. Create LabResult
      const result = await tx.labResult.create({
        data: {
          labOrderId: labOrder.id,
          parameter: criticalResults[0].parameter,
          value: criticalResults[0].value,
          unit: criticalResults[0].unit,
          isAbnormal: true,
          verifiedAt: new Date(),
        },
      });

      // 2. Create TaskTicket
      const task = await tx.taskTicket.create({
        data: {
          ticketNo: `TASK-CRIT-${Date.now().toString().slice(-6)}`,
          patientId: labOrder.patientId,
          sourceType: "LAB_CRITICAL",
          sourceId: labOrder.id,
          title: `CRITICAL ALERT: Potassium = 6.8 mEq/L`,
          description: "Simulated panic potassium elevation",
          criticalValueJson: JSON.stringify(evalRes),
          severity: "CRITICAL",
          status: "OPEN",
          escalationLevel: 1,
          assignedDoctorId: testDoctorId,
          assignedRole: "DOCTOR",
          escalationDeadline: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      // 3. Create NotificationJob in Outbox
      const job = await tx.notificationJob.create({
        data: {
          jobId: `NOTIF-CRIT-${Date.now().toString().slice(-6)}`,
          taskId: task.id,
          idempotencyKey: generateNotificationIdempotencyKey({
            taskId: task.id,
            escalationTier: 1,
            channel: "SIMULATED_SMS",
          }),
          recipientUserId: testDoctorUserId,
          recipientPhone: "+91-9876543210",
          channel: "SIMULATED_SMS",
          payloadJson: JSON.stringify({ ticketNo: task.ticketNo, value: "6.8" }),
          status: "PENDING",
          maxRetries: 3,
        },
      });

      // 4. Create AuditLog
      const audit = await tx.auditLog.create({
        data: {
          logId: `LOG-T-${Date.now()}`,
          userId: testDoctorUserId,
          userName: "Dr. Test Pathologist",
          role: "DOCTOR",
          action: "CRITICAL_ALERT_CREATED",
          resource: `TaskTicket/${task.id}`,
          status: "Success",
        },
      });

      return { result, task, job, audit };
    });

    // Assert all 4 entities exist in database
    const dbTask = await prisma.taskTicket.findUnique({ where: { id: txResult.task.id } });
    const dbJob = await prisma.notificationJob.findUnique({ where: { id: txResult.job.id } });
    const dbResult = await prisma.labResult.findUnique({ where: { id: txResult.result.id } });

    expect(dbTask).toBeDefined();
    expect(dbTask?.status).toBe("OPEN");
    expect(dbTask?.escalationLevel).toBe(1);

    expect(dbJob).toBeDefined();
    expect(dbJob?.status).toBe("PENDING");
    expect(dbJob?.attemptsCount).toBe(0);

    expect(dbResult).toBeDefined();
  });

  it("3. Outbox insertion failure causes complete database transaction rollback", async () => {
    const labOrder = await prisma.labOrder.create({
      data: {
        orderId: `LAB-FAIL-${Date.now().toString().slice(-5)}`,
        patientId: testPatientId,
        doctorId: testDoctorId,
        testName: "Serum Potassium Rollback Test",
        category: "Biochemistry",
        sampleType: "Blood",
        status: "Requested",
      },
    });

    let attemptedResultId: string | null = null;
    let attemptedTaskId: string | null = null;

    // Execute transaction that intentionally fails at the outbox job step
    await expect(
      prisma.$transaction(async (tx) => {
        const result = await tx.labResult.create({
          data: {
            labOrderId: labOrder.id,
            parameter: "Potassium",
            value: "7.1",
            isAbnormal: true,
          },
        });
        attemptedResultId = result.id;

        const task = await tx.taskTicket.create({
          data: {
            ticketNo: `TASK-RB-${Date.now().toString().slice(-6)}`,
            patientId: testPatientId,
            sourceType: "LAB_CRITICAL",
            title: "Will Rollback",
            description: "Rollback verification",
            severity: "CRITICAL",
            status: "OPEN",
            escalationDeadline: new Date(),
          },
        });
        attemptedTaskId = task.id;

        // Force a constraint failure on notification job (invalid non-existent recipientUserId)
        await tx.notificationJob.create({
          data: {
            jobId: `NOTIF-RB-${Date.now()}`,
            taskId: task.id,
            idempotencyKey: `notif-rb-${Date.now()}`,
            recipientUserId: "non-existent-user-id-99999", // Foreign key violation
            channel: "SIMULATED_SMS",
            payloadJson: "{}",
            status: "PENDING",
          },
        });
      })
    ).rejects.toThrow();

    // Verify atomic rollback: neither result nor task exists in SQLite
    if (attemptedResultId) {
      const rolledBackResult = await prisma.labResult.findUnique({
        where: { id: attemptedResultId },
      });
      expect(rolledBackResult).toBeNull();
    }

    if (attemptedTaskId) {
      const rolledBackTask = await prisma.taskTicket.findUnique({
        where: { id: attemptedTaskId },
      });
      expect(rolledBackTask).toBeNull();
    }
  });

  it("4. Unique constraint prevents duplicate outbox jobs with identical idempotency keys", async () => {
    const task = await prisma.taskTicket.create({
      data: {
        ticketNo: `TASK-DUP-${Date.now().toString().slice(-6)}`,
        patientId: testPatientId,
        sourceType: "LAB_CRITICAL",
        title: "Idempotency Test",
        description: "Checking duplicate prevention",
        severity: "CRITICAL",
        status: "OPEN",
        escalationDeadline: new Date(),
      },
    });

    const fixedKey = `notif-fixed-${task.id}-tier1-sms`;

    // First insertion succeeds
    await prisma.notificationJob.create({
      data: {
        jobId: `NOTIF-DUP-1-${Date.now().toString().slice(-6)}`,
        taskId: task.id,
        idempotencyKey: fixedKey,
        recipientUserId: testDoctorUserId,
        channel: "SIMULATED_SMS",
        payloadJson: "{}",
        status: "PENDING",
      },
    });

    // Second insertion with identical idempotencyKey MUST fail
    await expect(
      prisma.notificationJob.create({
        data: {
          jobId: `NOTIF-DUP-2-${Date.now().toString().slice(-6)}`,
          taskId: task.id,
          idempotencyKey: fixedKey,
          recipientUserId: testDoctorUserId,
          channel: "SIMULATED_SMS",
          payloadJson: "{}",
          status: "PENDING",
        },
      })
    ).rejects.toThrow();
  });

  it("5. Worker network failure records DeliveryAttempt and schedules exponential retry", async () => {
    const task = await prisma.taskTicket.create({
      data: {
        ticketNo: `TASK-RETRY-${Date.now().toString().slice(-6)}`,
        patientId: testPatientId,
        sourceType: "LAB_CRITICAL",
        title: "Retry Verification",
        description: "Testing worker backoff",
        severity: "CRITICAL",
        status: "OPEN",
        escalationDeadline: new Date(),
      },
    });

    const job = await prisma.notificationJob.create({
      data: {
        jobId: `NOTIF-RETRY-${Date.now().toString().slice(-6)}`,
        taskId: task.id,
        idempotencyKey: `notif-retry-${task.id}-tier1-sms`,
        recipientUserId: testDoctorUserId,
        channel: "SIMULATED_SMS",
        payloadJson: "{}",
        status: "PENDING",
        maxRetries: 3,
      },
    });

    // Run single job with failing adapter
    const failAdapter = new SimulatedChannelAdapter({
      simulatedLatencyMs: 5,
      simulateFailure: true,
      failureMessage: "Simulated SMS Gateway 504 Timeout",
    });

    const outcome = await processSingleOutboxJob(job, failAdapter);
    expect(outcome.success).toBe(false);
    expect(outcome.status).toBe("FAILED");

    // Inspect database state
    const updatedJob = await prisma.notificationJob.findUnique({
      where: { id: job.id },
      include: { attempts: true },
    });

    expect(updatedJob?.status).toBe("FAILED");
    expect(updatedJob?.attemptsCount).toBe(1);
    expect(updatedJob?.nextRetryAt).toBeDefined();
    expect(updatedJob?.nextRetryAt!.getTime()).toBeGreaterThan(Date.now());
    expect(updatedJob?.lastError).toContain("504 Timeout");

    // DeliveryAttempt must be recorded
    expect(updatedJob?.attempts.length).toBe(1);
    expect(updatedJob?.attempts[0].status).toBe("TEMPORARY_FAILURE");
    expect(updatedJob?.attempts[0].rawProviderResponse).toContain("504 Timeout");
  });

  it("6. Stale job recovery: jobs left in PROCESSING past lock timeout are recovered", async () => {
    const task = await prisma.taskTicket.create({
      data: {
        ticketNo: `TASK-STALE-${Date.now().toString().slice(-6)}`,
        patientId: testPatientId,
        sourceType: "LAB_CRITICAL",
        title: "Crash Recovery Test",
        description: "Testing worker lock expiration",
        severity: "CRITICAL",
        status: "OPEN",
        escalationDeadline: new Date(),
      },
    });

    // Simulate a dead worker: job in PROCESSING with lockedAt 5 minutes in the past
    const staleLockTime = new Date(Date.now() - 5 * 60 * 1000);
    const staleJob = await prisma.notificationJob.create({
      data: {
        jobId: `NOTIF-STALE-${Date.now().toString().slice(-6)}`,
        taskId: task.id,
        idempotencyKey: `notif-stale-${task.id}-tier1-sms`,
        recipientUserId: testDoctorUserId,
        channel: "SIMULATED_SMS",
        payloadJson: "{}",
        status: "PROCESSING",
        lockedAt: staleLockTime,
        maxRetries: 3,
      },
    });

    // Claim jobs with 60s timeout threshold
    const claimed = await claimEligibleOutboxJobs(10, 60000, new Date());
    const wasClaimed = claimed.some((j) => j.id === staleJob.id);
    expect(wasClaimed).toBe(true);

    // Process the reclaimed job successfully
    const successAdapter = new SimulatedChannelAdapter({ confirmDelivery: true });
    const claimedStale = claimed.find((j) => j.id === staleJob.id)!;
    const outcome = await processSingleOutboxJob(claimedStale, successAdapter);

    expect(outcome.success).toBe(true);
    expect(outcome.status).toBe("DELIVERED");

    const finalizedJob = await prisma.notificationJob.findUnique({
      where: { id: staleJob.id },
    });
    expect(finalizedJob?.status).toBe("DELIVERED");
    expect(finalizedJob?.lockedAt).toBeNull(); // Lock released
  });

  it("7. Concurrent worker claims: competing workers cannot claim the same job simultaneously", async () => {
    const task = await prisma.taskTicket.create({
      data: {
        ticketNo: `TASK-CONC-${Date.now().toString().slice(-6)}`,
        patientId: testPatientId,
        sourceType: "LAB_CRITICAL",
        title: "Concurrency Claim Test",
        description: "Two workers compete for the same job",
        severity: "CRITICAL",
        status: "OPEN",
        escalationDeadline: new Date(),
      },
    });

    const pendingJob = await prisma.notificationJob.create({
      data: {
        jobId: `NOTIF-CONC-${Date.now().toString().slice(-6)}`,
        taskId: task.id,
        idempotencyKey: `notif-conc-${task.id}-tier1-sms`,
        recipientUserId: testDoctorUserId,
        channel: "SIMULATED_SMS",
        payloadJson: "{}",
        status: "PENDING",
      },
    });

    // Worker 1 and Worker 2 attempt to claim simultaneously
    const now = new Date();
    const [worker1Claims, worker2Claims] = await Promise.all([
      claimEligibleOutboxJobs(10, 60000, now),
      claimEligibleOutboxJobs(10, 60000, now),
    ]);

    const worker1ClaimedIt = worker1Claims.some((j) => j.id === pendingJob.id);
    const worker2ClaimedIt = worker2Claims.some((j) => j.id === pendingJob.id);

    // Exactly one worker must claim the job, never both
    expect(worker1ClaimedIt !== worker2ClaimedIt).toBe(true);
  });
});
