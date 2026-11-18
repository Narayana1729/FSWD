/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Dronagiri Hospital Management System (Gandhamadana)
 * Clinical Task & Alert Accountability Engine — Core State Machine (Stage 1)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * DESIGN PRINCIPLE:
 * Strict separation between the clinical task (ownership, acknowledgment, resolution)
 * and the notification delivery channel (outbox job, carrier attempt, delivery receipt).
 * 
 * SCOPE & SAFETY NOTE:
 * All clinical thresholds and rules in this module represent configurable simulation
 * parameters for an academic software engineering capstone. They do not constitute
 * medical device software, automated clinical triage, or prescriptive treatment guidance.
 */

export type TaskStatus = "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type TaskSeverity = "CRITICAL" | "URGENT" | "ROUTINE";
export type SourceType = "LAB_CRITICAL" | "NURSE_HANDOVER" | "CODE_BLUE" | "MED_RECONCILIATION";
export type NotificationStatus = "PENDING" | "PROCESSING" | "SENT" | "DELIVERED" | "FAILED" | "PERMANENTLY_FAILED";
export type DeliveryChannel = "IN_APP_PUSH" | "SIMULATED_SMS" | "WARD_CONSOLE";

export interface CriticalValueDetails {
  parameter: string;
  value: string | number;
  unit?: string;
  thresholdLabel?: string;
}

export interface TaskTicketState {
  id: string;
  ticketNo: string;
  patientId: string;
  sourceType: SourceType;
  sourceId?: string;
  title: string;
  description: string;
  criticalValue?: CriticalValueDetails;
  severity: TaskSeverity;
  status: TaskStatus;
  escalationLevel: number; // Tier 1: Attending Doctor, Tier 2: Duty RMO, Tier 3: HOD / Admin
  assignedDoctorId?: string;
  assignedRole: string; // e.g. "DOCTOR", "RMO", "NURSE"
  escalationDeadline: Date;
  acknowledgedAt?: Date;
  acknowledgedById?: string;
  resolvedAt?: Date;
  resolvedById?: string;
  resolutionNotes?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransitionContext {
  actorUserId: string;
  actorRole: string;
  resolutionNotes?: string;
  cancellationReason?: string;
  now?: Date;
}

export interface EscalationResult {
  eligible: boolean;
  newLevel?: number;
  newAssignedRole?: string;
  nextDeadline?: Date;
  reason?: string;
}

export interface BackoffConfig {
  baseDelayMs?: number; // Default: 2000ms
  multiplier?: number;  // Default: 2
  maxDelayMs?: number;  // Default: 60000ms
}

export interface SimulationThresholdRule {
  parameter: string;
  unit: string;
  isCritical: (numVal: number) => boolean;
  thresholdLabel: string;
}

export interface CriticalEvaluationResult {
  isCritical: boolean;
  parameter: string;
  value: string | number;
  unit: string;
  thresholdLabel: string;
  severity: TaskSeverity;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM DOMAIN ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class InvalidTaskTransitionError extends Error {
  constructor(public currentStatus: TaskStatus, public targetStatus: TaskStatus, customMessage?: string) {
    super(customMessage || `Invalid task transition: Cannot move from status '${currentStatus}' to '${targetStatus}'.`);
    this.name = "InvalidTaskTransitionError";
  }
}

export class UnauthorizedTaskActionError extends Error {
  constructor(public role: string, public action: string) {
    super(`Unauthorized action: Role '${role}' is not permitted to perform '${action}'.`);
    this.name = "UnauthorizedTaskActionError";
  }
}

export class MissingResolutionNotesError extends Error {
  constructor() {
    super("Resolution requires clinical follow-up notes detailing the action taken.");
    this.name = "MissingResolutionNotesError";
  }
}

export class TaskAlreadyAcknowledgedError extends Error {
  constructor(public ticketNo: string, public acknowledgedById?: string) {
    super(`Task ${ticketNo} has already been acknowledged${acknowledgedById ? ` by user ${acknowledgedById}` : ""}.`);
    this.name = "TaskAlreadyAcknowledgedError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TASK STATE MACHINE RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates whether a requested status transition is mathematically allowed by the FSM.
 * 
 * ALLOWED TRANSITIONS:
 * - OPEN         -> ACKNOWLEDGED, CANCELLED
 * - ACKNOWLEDGED -> IN_PROGRESS, RESOLVED, CANCELLED
 * - IN_PROGRESS  -> RESOLVED, CANCELLED
 * - RESOLVED     -> [TERMINAL - No transitions allowed]
 * - CANCELLED    -> [TERMINAL - No transitions allowed]
 * 
 * Specifically:
 * - OPEN -> RESOLVED is strictly ILLEGAL (cannot resolve without taking responsibility via ACK).
 */
export function canTransitionTask(current: TaskStatus, target: TaskStatus): boolean {
  if (current === target) return false;

  switch (current) {
    case "OPEN":
      return target === "ACKNOWLEDGED" || target === "CANCELLED";
    case "ACKNOWLEDGED":
      return target === "IN_PROGRESS" || target === "RESOLVED" || target === "CANCELLED";
    case "IN_PROGRESS":
      return target === "RESOLVED" || target === "CANCELLED";
    case "RESOLVED":
    case "CANCELLED":
      // Terminal states cannot be reopened through ordinary transitions
      return false;
    default:
      return false;
  }
}

/**
 * Authorizes whether an actor has legal standing to acknowledge a task.
 * Permitted roles: DOCTOR, NURSE, ADMIN, or the specific assigned clinician.
 */
export function isAuthorizedToAcknowledge(task: TaskTicketState, actorRole: string, actorUserId: string): boolean {
  const normalizedRole = actorRole.toUpperCase();
  if (normalizedRole === "ADMIN" || normalizedRole === "DOCTOR" || normalizedRole === "NURSE") {
    return true;
  }
  if (task.assignedDoctorId && task.assignedDoctorId === actorUserId) {
    return true;
  }
  return false;
}

/**
 * Authorizes whether an actor can document resolution of a clinical task.
 * Permitted roles: DOCTOR, ADMIN.
 */
export function isAuthorizedToResolve(actorRole: string): boolean {
  const normalizedRole = actorRole.toUpperCase();
  return normalizedRole === "DOCTOR" || normalizedRole === "ADMIN";
}

/**
 * Executes a state transition on a TaskTicket with invariant validation.
 * Pure function: returns a new TaskTicketState without side effects.
 */
export function transitionTask(
  task: TaskTicketState,
  target: TaskStatus,
  context: TransitionContext,
  options: { allowDuplicateAck?: boolean } = { allowDuplicateAck: false }
): TaskTicketState {
  const now = context.now || new Date();

  // Handle duplicate acknowledgment guard
  if (task.status === "ACKNOWLEDGED" && target === "ACKNOWLEDGED") {
    if (options.allowDuplicateAck) {
      return { ...task }; // Idempotent return
    }
    throw new TaskAlreadyAcknowledgedError(task.ticketNo, task.acknowledgedById);
  }

  // Check state machine validity
  if (!canTransitionTask(task.status, target)) {
    throw new InvalidTaskTransitionError(task.status, target);
  }

  // Branch by target transition
  switch (target) {
    case "ACKNOWLEDGED": {
      if (!isAuthorizedToAcknowledge(task, context.actorRole, context.actorUserId)) {
        throw new UnauthorizedTaskActionError(context.actorRole, "ACKNOWLEDGE_TASK");
      }
      return {
        ...task,
        status: "ACKNOWLEDGED",
        acknowledgedAt: now,
        acknowledgedById: context.actorUserId,
        updatedAt: now,
      };
    }

    case "IN_PROGRESS": {
      if (!isAuthorizedToAcknowledge(task, context.actorRole, context.actorUserId)) {
        throw new UnauthorizedTaskActionError(context.actorRole, "UPDATE_IN_PROGRESS");
      }
      return {
        ...task,
        status: "IN_PROGRESS",
        updatedAt: now,
      };
    }

    case "RESOLVED": {
      if (!isAuthorizedToResolve(context.actorRole)) {
        throw new UnauthorizedTaskActionError(context.actorRole, "RESOLVE_TASK");
      }
      const notes = (context.resolutionNotes || "").trim();
      if (notes.length < 5) {
        throw new MissingResolutionNotesError();
      }
      return {
        ...task,
        status: "RESOLVED",
        resolvedAt: now,
        resolvedById: context.actorUserId,
        resolutionNotes: formatSimulatedResolution(notes),
        updatedAt: now,
      };
    }

    case "CANCELLED": {
      const normalizedRole = context.actorRole.toUpperCase();
      if (normalizedRole !== "ADMIN" && normalizedRole !== "DOCTOR") {
        throw new UnauthorizedTaskActionError(context.actorRole, "CANCEL_TASK");
      }
      const reason = (context.cancellationReason || "").trim();
      if (reason.length < 5) {
        throw new Error("Cancellation requires a documented operational reason.");
      }
      return {
        ...task,
        status: "CANCELLED",
        cancellationReason: reason,
        updatedAt: now,
      };
    }

    default:
      throw new InvalidTaskTransitionError(task.status, target);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ESCALATION ENGINE (DETERMINISTIC SLA RULES)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates whether a task is overdue and eligible for multi-tier escalation.
 * 
 * ESCALATION RULES:
 * 1. Task must be uncompleted: status === "OPEN" or status === "ACKNOWLEDGED".
 * 2. now >= escalationDeadline.
 * 3. escalationLevel < 3 (Max tier: HOD / Admin).
 * 
 * CRITICAL INVARIANT:
 * Escalation NEVER marks the underlying task resolved. It escalates accountability
 * while keeping the operational task actionable.
 */
export function evaluateEscalation(task: TaskTicketState, now: Date = new Date()): EscalationResult {
  // Resolved or Cancelled tasks are never escalated
  if (task.status === "RESOLVED" || task.status === "CANCELLED") {
    return { eligible: false, reason: "Task is already finalized." };
  }

  // If already at maximum tier
  if (task.escalationLevel >= 3) {
    return { eligible: false, reason: "Task has already reached highest escalation tier (Tier 3)." };
  }

  // Check SLA deadline
  if (now.getTime() < task.escalationDeadline.getTime()) {
    const remainingSecs = Math.round((task.escalationDeadline.getTime() - now.getTime()) / 1000);
    return { eligible: false, reason: `SLA deadline not yet breached (${remainingSecs}s remaining).` };
  }

  // Determine next tier
  const newLevel = task.escalationLevel + 1;
  const newAssignedRole = newLevel === 2 ? "RMO" : "ADMIN";
  
  // Configure secondary deadline: Tier 2 gets 5 minutes (prod) or 15s (demo)
  const secondaryIntervalMs = 5 * 60 * 1000;
  const nextDeadline = new Date(now.getTime() + secondaryIntervalMs);

  return {
    eligible: true,
    newLevel,
    newAssignedRole,
    nextDeadline,
    reason: `SLA breached at Tier ${task.escalationLevel}. Escalating to Tier ${newLevel} (${newAssignedRole}).`,
  };
}

/**
 * Applies an escalation to a task, advancing the tier while maintaining task state.
 */
export function applyEscalation(task: TaskTicketState, now: Date = new Date()): TaskTicketState {
  const evalResult = evaluateEscalation(task, now);
  if (!evalResult.eligible || !evalResult.newLevel || !evalResult.newAssignedRole || !evalResult.nextDeadline) {
    return task;
  }

  return {
    ...task,
    escalationLevel: evalResult.newLevel,
    assignedRole: evalResult.newAssignedRole,
    escalationDeadline: evalResult.nextDeadline,
    updatedAt: now,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RETRY & EXPONENTIAL BACKOFF CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates exponential retry delay for notification outbox dispatch.
 * 
 * Formula: delay = min(baseDelayMs * (multiplier ^ (attempt - 1)), maxDelayMs)
 * 
 * Default:
 * Attempt 1: 2,000 ms (2s)
 * Attempt 2: 4,000 ms (4s)
 * Attempt 3: 8,000 ms (8s)
 * Attempt 4: 16,000 ms (16s)
 */
export function calculateExponentialBackoff(attempt: number, config: BackoffConfig = {}): number {
  const baseDelayMs = config.baseDelayMs ?? 2000;
  const multiplier = config.multiplier ?? 2;
  const maxDelayMs = config.maxDelayMs ?? 60000;

  if (attempt <= 1) return baseDelayMs;

  const rawDelay = baseDelayMs * Math.pow(multiplier, attempt - 1);
  return Math.min(rawDelay, maxDelayMs);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. IDEMPOTENCY KEY GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministically constructs an idempotency key for notification outbox jobs.
 * Ensures retried worker loops or network dispatches never duplicate identical alerts.
 */
export function generateNotificationIdempotencyKey(params: {
  taskId: string;
  escalationTier: number;
  channel: string;
}): string {
  const { taskId, escalationTier, channel } = params;
  return `notif-${taskId}-tier${escalationTier}-${channel.toLowerCase()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CONFIGURABLE SIMULATION CRITICAL THRESHOLDS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default simulation reference parameters.
 * EXPLICIT SAFETY DISCLAIMER:
 * These are synthetic test limits for demonstrating software state machines and outbox mechanics.
 * They are not medical decision rules.
 */
export const DEFAULT_SIMULATION_THRESHOLDS: Record<string, SimulationThresholdRule> = {
  potassium: {
    parameter: "Potassium",
    unit: "mEq/L",
    isCritical: (val: number) => val < 2.8 || val > 6.0,
    thresholdLabel: "< 2.8 or > 6.0 mEq/L",
  },
  glucose: {
    parameter: "Glucose",
    unit: "mg/dL",
    isCritical: (val: number) => val < 40 || val > 400,
    thresholdLabel: "< 40 or > 400 mg/dL",
  },
  platelets: {
    parameter: "Platelets",
    unit: "/µL",
    isCritical: (val: number) => val < 50000,
    thresholdLabel: "< 50,000 /µL",
  },
  hemoglobin: {
    parameter: "Hemoglobin",
    unit: "g/dL",
    isCritical: (val: number) => val < 7.0,
    thresholdLabel: "< 7.0 g/dL",
  },
};

/**
 * Evaluates whether a test parameter breaches simulated critical decision thresholds.
 */
export function evaluateSimulatedLabCriticalThreshold(
  parameterName: string,
  value: string | number,
  customRules: Record<string, SimulationThresholdRule> = DEFAULT_SIMULATION_THRESHOLDS
): CriticalEvaluationResult {
  const key = parameterName.toLowerCase().trim();
  const rule = customRules[key] || Object.values(customRules).find((r) => key.includes(r.parameter.toLowerCase()));

  const numVal = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));

  if (!rule || isNaN(numVal)) {
    return {
      isCritical: false,
      parameter: parameterName,
      value,
      unit: rule?.unit || "",
      thresholdLabel: rule?.thresholdLabel || "Standard Reference Range",
      severity: "ROUTINE",
    };
  }

  const critical = rule.isCritical(numVal);
  return {
    isCritical: critical,
    parameter: rule.parameter,
    value,
    unit: rule.unit,
    thresholdLabel: rule.thresholdLabel,
    severity: critical ? "CRITICAL" : "ROUTINE",
  };
}

/**
 * Formats clinical resolution notes in neutral simulation language,
 * avoiding unauthorized clinical prescription claims.
 */
export function formatSimulatedResolution(notes: string): string {
  const trimmed = notes.trim();
  if (trimmed.startsWith("Test clinician reviewed the simulated critical-result alert")) {
    return trimmed;
  }
  return `Test clinician reviewed the simulated critical-result alert and recorded the required follow-up: ${trimmed}`;
}
