/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Dronagiri Hospital Management System (Gandhamadana)
 * Transactional Outbox Worker Engine (Stage 3)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * CORE RESPONSIBILITIES:
 * 1. Atomic job claiming to prevent concurrent worker race conditions.
 * 2. Stale-lock recovery for workers that crash mid-processing.
 * 3. Asynchronous physical dispatch outside any database transaction.
 * 4. Exponential retry scheduling with delivery attempt auditing.
 * 5. Preservation of uncertainty: SENT vs DELIVERED evidence distinction.
 */

import { prisma } from "@/lib/db";
import { calculateExponentialBackoff } from "./clinical-accountability";
import type { NotificationJob, DeliveryAttempt } from "@prisma/client";

export interface ProviderDeliveryResult {
  messageId: string;
  delivered: boolean; // True ONLY if provider confirms recipient handset delivery
  providerResponseCode?: string;
  rawResponse?: string;
  simulated?: boolean;
}

export interface NotificationChannelAdapter {
  dispatch(job: NotificationJob): Promise<ProviderDeliveryResult>;
}

/**
 * Default Simulated Notification Channel Adapter for testing and demonstrations.
 * Simulates network latency, delivery confirmation, and configurable error injection.
 */
export class SimulatedChannelAdapter implements NotificationChannelAdapter {
  constructor(
    public options: {
      simulatedLatencyMs?: number;
      simulateFailure?: boolean;
      failureMessage?: string;
      confirmDelivery?: boolean;
    } = {}
  ) {}

  async dispatch(job: NotificationJob): Promise<ProviderDeliveryResult> {
    const latency = this.options.simulatedLatencyMs ?? 25;
    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }

    if (this.options.simulateFailure) {
      throw new Error(this.options.failureMessage || "Simulated carrier gateway timeout (HTTP 504)");
    }

    return {
      messageId: `MSG-SIM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      delivered: Boolean(this.options.confirmDelivery),
      providerResponseCode: "200_OK",
      rawResponse: JSON.stringify({ carrier: "SimulatedGateway", status: "ACK_RECEIVED" }),
      simulated: true,
    };
  }
}

export interface OutboxWorkerOptions {
  batchSize?: number;
  staleLockTimeoutMs?: number; // Default 60,000ms (1 minute)
  adapter?: NotificationChannelAdapter;
}

export interface WorkerBatchResult {
  claimedCount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  recoveredStaleCount: number;
  jobResults: Array<{
    jobId: string;
    status: string;
    attemptsCount: number;
    error?: string;
  }>;
}

/**
 * Atomically claims eligible jobs from the NotificationJob outbox queue.
 * 
 * ATOMIC CONCURRENCY STRATEGY:
 * Candidate jobs are identified, and each is claimed via a conditional update:
 * `WHERE id = candidate.id AND (status = 'PENDING' OR ...)`
 * Exactly one competing worker will receive updated count === 1.
 */
export async function claimEligibleOutboxJobs(
  limit = 10,
  staleLockTimeoutMs = 60000,
  now: Date = new Date()
): Promise<NotificationJob[]> {
  const staleThreshold = new Date(now.getTime() - staleLockTimeoutMs);

  // 1. Identify candidate jobs
  const candidates = await prisma.notificationJob.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        { status: "FAILED", nextRetryAt: { lte: now } },
        { status: "PROCESSING", lockedAt: { lte: staleThreshold } },
      ],
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  const claimedJobs: NotificationJob[] = [];

  // 2. Conditionally claim each candidate
  for (const candidate of candidates) {
    const updateResult = await prisma.notificationJob.updateMany({
      where: {
        id: candidate.id,
        OR: [
          { status: "PENDING" },
          { status: "FAILED", nextRetryAt: { lte: now } },
          { status: "PROCESSING", lockedAt: { lte: staleThreshold } },
        ],
      },
      data: {
        status: "PROCESSING",
        lockedAt: now,
      },
    });

    if (updateResult.count === 1) {
      // Refresh claimed job record
      const refreshed = await prisma.notificationJob.findUnique({
        where: { id: candidate.id },
      });
      if (refreshed) {
        claimedJobs.push(refreshed);
      }
    }
  }

  return claimedJobs;
}

/**
 * Processes a single claimed outbox notification job:
 * 1. Dispatches message via the channel adapter outside any DB transaction.
 * 2. Records a DeliveryAttempt audit entry.
 * 3. Updates NotificationJob status (SENT, DELIVERED, or FAILED with backoff).
 */
export async function processSingleOutboxJob(
  job: NotificationJob,
  adapter: NotificationChannelAdapter = new SimulatedChannelAdapter()
): Promise<{ success: boolean; status: string; error?: string }> {
  const startTime = Date.now();
  const attemptNumber = job.attemptsCount + 1;

  try {
    // PHYSICAL DISPATCH: Strictly outside of any database transaction
    const deliveryResult = await adapter.dispatch(job);
    const latencyMs = Date.now() - startTime;
    const now = new Date();

    const targetStatus = deliveryResult.delivered ? "DELIVERED" : "SENT";

    await prisma.$transaction([
      prisma.deliveryAttempt.create({
        data: {
          jobId: job.id,
          attemptNumber,
          channel: job.channel,
          status: "SUCCESS",
          providerMessageId: deliveryResult.messageId,
          providerResponseCode: deliveryResult.providerResponseCode || "200",
          rawProviderResponse: deliveryResult.rawResponse || null,
          latencyMs,
          attemptedAt: now,
        },
      }),
      prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: targetStatus,
          attemptsCount: attemptNumber,
          sentAt: now,
          deliveredAt: deliveryResult.delivered ? now : null,
          lockedAt: null, // Release lock
          lastError: null,
        },
      }),
    ]);

    return { success: true, status: targetStatus };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const now = new Date();
    const isExhausted = attemptNumber >= job.maxRetries;
    const backoffMs = calculateExponentialBackoff(attemptNumber, { baseDelayMs: 2000, maxDelayMs: 60000 });
    const nextRetryAt = isExhausted ? null : new Date(now.getTime() + backoffMs);
    const targetStatus = isExhausted ? "PERMANENTLY_FAILED" : "FAILED";

    await prisma.$transaction([
      prisma.deliveryAttempt.create({
        data: {
          jobId: job.id,
          attemptNumber,
          channel: job.channel,
          status: isExhausted ? "PERMANENT_FAILURE" : "TEMPORARY_FAILURE",
          rawProviderResponse: err.message || "Unknown dispatch failure",
          latencyMs,
          attemptedAt: now,
        },
      }),
      prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: targetStatus,
          attemptsCount: attemptNumber,
          failedAt: now,
          nextRetryAt,
          lockedAt: null, // Release lock
          lastError: err.message || "Unknown error",
        },
      }),
    ]);

    return { success: false, status: targetStatus, error: err.message };
  }
}

/**
 * Runs a complete execution batch of the Outbox Worker.
 */
export async function runOutboxWorkerBatch(options: OutboxWorkerOptions = {}): Promise<WorkerBatchResult> {
  const batchSize = options.batchSize ?? 10;
  const staleLockTimeoutMs = options.staleLockTimeoutMs ?? 60000;
  const adapter = options.adapter ?? new SimulatedChannelAdapter();
  const now = new Date();

  const claimed = await claimEligibleOutboxJobs(batchSize, staleLockTimeoutMs, now);

  const result: WorkerBatchResult = {
    claimedCount: claimed.length,
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    recoveredStaleCount: claimed.filter((j) => j.status === "PROCESSING").length,
    jobResults: [],
  };

  for (const job of claimed) {
    const outcome = await processSingleOutboxJob(job, adapter);
    result.processedCount++;
    if (outcome.success) {
      result.successCount++;
    } else {
      result.failedCount++;
    }
    result.jobResults.push({
      jobId: job.jobId,
      status: outcome.status,
      attemptsCount: job.attemptsCount + 1,
      error: outcome.error,
    });
  }

  return result;
}
