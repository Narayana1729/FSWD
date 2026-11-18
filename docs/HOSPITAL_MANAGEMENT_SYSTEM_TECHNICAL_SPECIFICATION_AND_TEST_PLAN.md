# ⚙️ Technical Specification & Test Plan
## Closed-Loop Clinical Task & Alert Accountability Engine (Contender C)
**Dronagiri (Gandhamadana) Hospital Management System**

---

### Document Metadata
- **Project:** Dronagiri Hospital Management System
- **Focus:** Technical Specification & Verification Suite for Closed-Loop Alert Management
- **Status:** **Specification Complete — Ready for Review Before Migration**
- **Architecture Paradigm:** Transactional Outbox Pattern, Finite State Machines, Asynchronous Worker Dispatch
- **Target Platform:** Next.js 16 (App Router), React 19, TypeScript 5, Prisma ORM 6.19, SQLite (`dev.db`) / PostgreSQL

---

## 1. System Architecture & Core Principles

### 1.1 Architectural Separation of Concerns
To guarantee reliability and prevent distributed dual-write inconsistencies, the system strictly separates three distinct operational concepts:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. TaskTicket (Domain Responsibility)                                      │
│    Represents the clinical or operational task, its designated owner,       │
│    SLA deadline, clinician acknowledgment, and ultimate clinical resolution.│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 1 : N
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 2. NotificationJob (Outbox Intent)                                         │
│    Represents the intent to communicate a task to an authorized actor via a  │
│    configured channel. Manages processing status, retry count, and backoff. │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 1 : N
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 3. DeliveryAttempt (Channel Evidence)                                      │
│    Captures individual physical transmission attempts, carrier responses,   │
│    network latency, and cryptographically logged provider evidence.         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 End-to-End Event Sequence
```
          LAB RESULT VERIFIED
                  │
                  ▼
       CRITICAL VALUE EVALUATION
                  │
           Critical result?
             /         \
           No           Yes
           │             │
       Normal flow       ▼
                 DATABASE TRANSACTION (Atomic Boundary)
                  ├── 1. Persist LabResult (isCritical = true)
                  ├── 2. Create TaskTicket (status = 'OPEN', escalationDeadline)
                  ├── 3. Create NotificationJob (status = 'PENDING', outbox)
                  └── 4. Append AuditLog (action = 'CRITICAL_ALERT_CREATED')
                            │
                            ▼ (Transaction Committed)
                   OUTBOX WORKER (Asynchronous Loop)
                            │
                            ▼
                   NOTIFICATION CHANNEL (Simulated / Test Adapter)
                     /           \
                Delivered        Transient Failure
                    │                    │
                    ▼                    ▼
             Update Job to        Log DeliveryAttempt
             'SENT' / 'DELIVERED' Schedule Exponential Retry (PENDING)
                    │
                    ▼
           CLINICIAN ACKNOWLEDGMENT (POST /api/tasks/[id]/acknowledge)
                    │
           ┌────────┴────────┐
           ▼                 ▼
   Clinician Documents      No Action Taken (SLA Expired)
   Action & Resolves                 │
   (status = 'RESOLVED')             ▼
                            ESCALATION WORKER
                             ├── Increment escalationLevel (Tier 2: RMO)
                             ├── Spawn Tier-2 NotificationJob (Outbox)
                             └── Append AuditLog (action = 'TASK_ESCALATED')
```

---

## 2. State Machines & Transition Invariants

### 2.1 TaskTicket State Machine

```
              ┌──────────────┐
              │     OPEN     │
              └──────┬───────┘
                     │
          [ Clinician Acknowledges ]
          (Role: DOCTOR or NURSE)
                     │
                     ▼
            ┌──────────────────┐
            │   ACKNOWLEDGED   │
            └────────┬─────────┘
                     │
          [ Action Initiated ]
                     │
                     ▼
            ┌──────────────────┐
            │   IN_PROGRESS    │
            └────────┬─────────┘
                     │
          [ Clinical Notes Documented ]
          (resolutionNotes != null)
                     │
                     ▼
            ┌──────────────────┐
            │     RESOLVED     │ (Terminal)
            └──────────────────┘

Auxiliary Transitions:
- OPEN / ACKNOWLEDGED / IN_PROGRESS ──[ SLA Exceeded ]──> ESCALATED (Assignment update & escalation event; task remains active)
- OPEN ──[ Spurious / Invalid Test Override ]──> CANCELLED (Requires written justification & supervisor auth)
```

#### Task Transition Invariants & Guard Rules
1. **`OPEN -> ACKNOWLEDGED`**:
   - Authorized roles: `DOCTOR`, `NURSE`, or the designated `assignedDoctorId`.
   - Mutates: `acknowledgedAt = now()`, `acknowledgedById = auth.user.id`.
   - Guard: A task cannot be acknowledged twice (prevents race conditions).
2. **`ACKNOWLEDGED -> IN_PROGRESS`**:
   - Optional operational state when immediate bedside diagnostic or therapeutic action begins.
3. **`ACKNOWLEDGED / IN_PROGRESS -> RESOLVED`**:
   - Authorized roles: `DOCTOR`.
   - Requires: Non-empty `resolutionNotes` detailing the clinical action taken (e.g., *"10% Calcium Gluconate IV administered, repeat serum potassium ordered in 2 hours"*).
   - Mutates: `resolvedAt = now()`, `resolvedById = auth.user.id`.
4. **`ACKNOWLEDGED != RESOLVED`**:
   - Acknowledgment confirms receipt and assumes legal responsibility; resolution proves the intervention was executed.
5. **Illegal Transitions**:
   - `OPEN -> RESOLVED` without acknowledgment is strictly rejected (`400 Bad Request`).
   - Mutations on terminal states (`RESOLVED`, `CANCELLED`) throw `InvalidStateTransitionError`.

---

### 2.2 NotificationJob State Machine

```
             ┌──────────────┐
             │   PENDING    │◄──────────────┐
             └──────┬───────┘               │
                    │                       │
             [ Worker Claims ]              │
                    │                       │
                    ▼                       │
           ┌──────────────────┐             │
           │    PROCESSING    │             │
           └────┬────────┬────┘             │
                │        │                  │
     [ Channel Success ] [ Channel Error ]  │
                │        │                  │
                ▼        ▼                  │
           ┌────────┐  ┌────────┐           │
           │  SENT  │  │ FAILED │───────────┘
           └───┬────┘  └────────┘ [ If attempts < maxRetries ]
               │                  [ nextRetryAt = now + backoff ]
     [ Provider Confirms ]
     [ Delivery Evidence ]
               │
               ▼
         ┌───────────┐
         │ DELIVERED │ (Terminal)
         └───────────┘
```

#### Notification Transition Invariants & Guard Rules
1. **`SENT != DELIVERED`**:
   - Dispatching to an SMS gateway or WebPush worker transitions state to `SENT`.
   - The state only transitions to `DELIVERED` if the provider provides signed/webhook confirmation of receipt on the user's handset or browser. If the provider lacks delivery receipts, the job remains permanently `SENT`. **The system preserves uncertainty rather than claiming false certainty.**
2. **Failure & Exponential Backoff**:
   - When a delivery attempt encounters a network timeout or provider error:
     $$\text{attemptsCount} \leftarrow \text{attemptsCount} + 1$$
   - If $\text{attemptsCount} < \text{maxRetries}$:
     $$\text{nextRetryAt} \leftarrow \text{now}() + \text{baseDelay} \times 2^{\text{attemptsCount}}$$
     State resets to `PENDING` once $\text{now}() \ge \text{nextRetryAt}$.
   - If $\text{attemptsCount} \ge \text{maxRetries}$:
     State transitions to `PERMANENTLY_FAILED`, and the system logs an audit escalation to trigger an alternate communication channel.

---

## 3. Schema Design & Relational Constraints

To avoid breaking existing capabilities, the schema additions build upon existing models (`Patient`, `Doctor`, `Staff`, `User`, `LabResult`, `AuditLog`).

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CLINICAL ACCOUNTABILITY & CLOSED-LOOP TASK ENGINE
// ─────────────────────────────────────────────────────────────────────────────

model TaskTicket {
  id                 String    @id @default(cuid())
  ticketNo           String    @unique // e.g. TASK-8801
  patientId          String
  sourceType         String    // LAB_CRITICAL, NURSE_HANDOVER, CODE_BLUE, MED_RECONCILIATION
  sourceId           String?   // e.g. LabResult.id or LabOrder.id
  title              String
  description        String
  criticalValueJson  String?   // JSON: { parameter: "Potassium", value: "6.8", unit: "mEq/L", threshold: "> 6.0" }
  severity           String    @default("CRITICAL") // CRITICAL, URGENT, ROUTINE
  status             String    @default("OPEN")     // OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, CANCELLED
  
  escalationLevel    Int       @default(1)          // 1: Attending Doctor, 2: Duty RMO, 3: HOD/Nursing Supervisor
  assignedDoctorId   String?
  assignedRole       String    @default("DOCTOR")   // Role authorized to claim
  
  // Timestamps and Accountability
  escalationDeadline DateTime  // When SLA expires if unacknowledged
  acknowledgedAt     DateTime?
  acknowledgedById   String?
  resolvedAt         DateTime?
  resolvedById       String?
  resolutionNotes    String?
  
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Relational Integrity
  patient            Patient   @relation(fields: [patientId], references: [id], onDelete: Restrict)
  assignedDoctor     Doctor?   @relation(fields: [assignedDoctorId], references: [id])
  acknowledgedBy     User?     @relation("TaskAcknowledgedBy", fields: [acknowledgedById], references: [id])
  resolvedBy         User?     @relation("TaskResolvedBy", fields: [resolvedById], references: [id])
  notifications      NotificationJob[]

  @@index([status, escalationDeadline])
  @@index([patientId, status])
}

model NotificationJob {
  id                 String    @id @default(cuid())
  jobId              String    @unique // e.g. NOTIF-2041
  taskId             String
  idempotencyKey     String    @unique // e.g. notif-${taskId}-${escalationLevel}-${channel}
  recipientUserId    String
  recipientPhone     String?
  channel            String    // IN_APP_PUSH, SIMULATED_SMS, WARD_CONSOLE
  payloadJson        String    // Serialized alert payload
  status             String    @default("PENDING") // PENDING, PROCESSING, SENT, DELIVERED, FAILED, PERMANENTLY_FAILED
  
  attemptsCount      Int       @default(0)
  maxRetries         Int       @default(3)
  nextRetryAt        DateTime?
  sentAt             DateTime?
  deliveredAt        DateTime?
  lastError          String?
  
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Relational Integrity
  task               TaskTicket @relation(fields: [taskId], references: [id], onDelete: Cascade)
  recipient          User       @relation(fields: [recipientUserId], references: [id])
  attempts           DeliveryAttempt[]

  @@index([status, nextRetryAt])
  @@index([taskId, status])
}

model DeliveryAttempt {
  id                   String    @id @default(cuid())
  jobId                String
  attemptNumber        Int
  channel              String
  status               String    // SUCCESS, TEMPORARY_FAILURE, PERMANENT_FAILURE
  providerMessageId    String?   // Carrier/Gateway Reference ID
  providerResponseCode String?
  rawProviderResponse  String?
  latencyMs            Int?
  attemptedAt          DateTime  @default(now())

  notificationJob      NotificationJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([jobId, attemptNumber])
}
```

### Relational Constraints & Indexes
1. **Uniqueness on `idempotencyKey`**:
   Guarantees that retried API requests or duplicate worker triggers cannot generate duplicate notifications for the same task and escalation tier.
2. **Compound Index `[status, nextRetryAt]`**:
   Allows the outbox polling worker to query pending work with sub-millisecond execution (`WHERE status = 'PENDING' OR (status = 'FAILED' AND nextRetryAt <= :now)`).
3. **Compound Index `[status, escalationDeadline]`**:
   Allows the escalation monitor to rapidly detect breached SLAs without full table scans.

---

## 4. Transactional Outbox Processing Specification

### 4.1 Atomic Outbox Write (Inside Business Transaction)
When laboratory results are validated in `POST /api/lab-orders/results`:

```typescript
// Inside prisma.$transaction(async (tx) => { ... })
// 1. Evaluate critical cutoff
const isCritical = evaluateCriticalThreshold(parameter, value);

if (isCritical) {
  // 2. Create TaskTicket
  const task = await tx.taskTicket.create({
    data: {
      ticketNo: generateTicketNo(),
      patientId: labOrder.patientId,
      sourceType: "LAB_CRITICAL",
      sourceId: labResult.id,
      title: `CRITICAL ALERT: ${parameter} = ${value} ${unit}`,
      description: `Critical threshold breached (${parameter} ${value}). Requires immediate physician review.`,
      criticalValueJson: JSON.stringify({ parameter, value, unit, threshold }),
      severity: "CRITICAL",
      status: "OPEN",
      escalationLevel: 1,
      assignedDoctorId: labOrder.doctorId,
      escalationDeadline: new Date(Date.now() + SLA_INTERVAL_MS), // 10 min in prod; 30s in demo
    },
  });

  // 3. Create NotificationJob in Outbox
  await tx.notificationJob.create({
    data: {
      jobId: generateJobId(),
      taskId: task.id,
      idempotencyKey: `notif-${task.id}-tier1-sms`,
      recipientUserId: targetDoctor.userId,
      recipientPhone: targetDoctor.phone,
      channel: "SIMULATED_SMS",
      payloadJson: JSON.stringify({
        ticketNo: task.ticketNo,
        patientName: labOrder.patient.name,
        mrn: labOrder.patient.mrn,
        parameter,
        value,
        unit,
      }),
      status: "PENDING",
      maxRetries: 3,
    },
  });

  // 4. Log Audit Event
  await tx.auditLog.create({
    data: {
      logId: generateLogId(),
      userId: auth.user.id,
      userName: auth.user.name,
      role: auth.user.role,
      action: "CRITICAL_ALERT_CREATED",
      resource: `TaskTicket/${task.id}`,
      status: "Success",
    },
  });
}
```

### 4.2 Asynchronous Worker Loop & Job Claiming
The outbox worker operates independently of HTTP request handlers:

```typescript
export async function processOutboxJobs(batchSize = 10): Promise<ProcessResult> {
  const now = new Date();

  // 1. Claim eligible jobs atomically
  const eligibleJobs = await prisma.notificationJob.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        { status: "FAILED", nextRetryAt: { lte: now } },
      ],
    },
    take: batchSize,
    orderBy: { createdAt: "asc" },
  });

  for (const job of eligibleJobs) {
    // 2. Transition to PROCESSING
    await prisma.notificationJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING" },
    });

    const startTime = Date.now();
    try {
      // 3. Dispatch to Channel Adapter (Outside any DB transaction)
      const providerResult = await channelAdapter.dispatch(job);
      const latencyMs = Date.now() - startTime;

      // 4. Record Success & DeliveryAttempt
      await prisma.$transaction([
        prisma.deliveryAttempt.create({
          data: {
            jobId: job.id,
            attemptNumber: job.attemptsCount + 1,
            channel: job.channel,
            status: "SUCCESS",
            providerMessageId: providerResult.messageId,
            rawProviderResponse: JSON.stringify(providerResult),
            latencyMs,
          },
        }),
        prisma.notificationJob.update({
          where: { id: job.id },
          data: {
            status: providerResult.delivered ? "DELIVERED" : "SENT",
            attemptsCount: job.attemptsCount + 1,
            sentAt: new Date(),
            deliveredAt: providerResult.delivered ? new Date() : null,
          },
        }),
      ]);
    } catch (err: any) {
      // 5. Record Failure & Schedule Exponential Retry
      const latencyMs = Date.now() - startTime;
      const nextAttempt = job.attemptsCount + 1;
      const isExhausted = nextAttempt >= job.maxRetries;
      const backoffMs = Math.min(1000 * Math.pow(2, nextAttempt), 60000);

      await prisma.$transaction([
        prisma.deliveryAttempt.create({
          data: {
            jobId: job.id,
            attemptNumber: nextAttempt,
            channel: job.channel,
            status: isExhausted ? "PERMANENT_FAILURE" : "TEMPORARY_FAILURE",
            rawProviderResponse: err.message,
            latencyMs,
          },
        }),
        prisma.notificationJob.update({
          where: { id: job.id },
          data: {
            status: isExhausted ? "PERMANENTLY_FAILED" : "FAILED",
            attemptsCount: nextAttempt,
            nextRetryAt: isExhausted ? null : new Date(Date.now() + backoffMs),
            lastError: err.message,
          },
        }),
      ]);
    }
  }
}
```

---

## 5. Notification Provider Integration & Simulation Boundary

### 5.1 Provider Interface
```typescript
export interface NotificationPayload {
  ticketNo: string;
  recipientPhone?: string;
  recipientEmail?: string;
  patientName: string;
  mrn: string;
  parameter: string;
  value: string;
  unit?: string;
}

export interface ProviderDeliveryResult {
  messageId: string;
  delivered: boolean; // true ONLY if delivery confirmation receipt received
  timestamp: string;
}

export interface NotificationChannelAdapter {
  dispatch(job: NotificationJob): Promise<ProviderDeliveryResult>;
}
```

### 5.2 Deterministic Simulation Adapter
For testing and offline demonstration, the system implements a **`SimulatedChannelAdapter`**:
- **Configurable Network Latency:** 20ms to 150ms synthetic latency.
- **Controlled Error Injection:** Can simulate:
  - `SUCCESS_CONFIRMED`: Returns `delivered = true`.
  - `SUCCESS_UNCONFIRMED`: Returns `delivered = false` (job remains `SENT`).
  - `TRANSIENT_NETWORK_DROP`: Throws a retryable network timeout.
  - `CARRIER_REJECTION`: Throws an invalid phone number error.

---

## 6. Authorization & Multi-Tier Escalation Engine

### 6.1 Role-Based Access Control (RBAC) Specification
- **`POST /api/tasks/[id]/acknowledge`**:
  - Authorized Roles: `ADMIN`, `DOCTOR`, `NURSE`.
  - Action: Verifies caller's session, transitions task from `OPEN -> ACKNOWLEDGED`, records `acknowledgedById` and `acknowledgedAt`.
- **`POST /api/tasks/[id]/resolve`**:
  - Authorized Roles: `ADMIN`, `DOCTOR`.
  - Action: Requires string payload `resolutionNotes`. Transitions task from `ACKNOWLEDGED / IN_PROGRESS -> RESOLVED`.
- **`GET /api/tasks`**:
  - Role-filtered: Doctors view tasks assigned to them or their wards; Nurses view ward-specific tasks; Admins view all active hospital tasks.

### 6.2 Deterministic Escalation Policy
A background escalation evaluator inspects overdue tasks:

$$\text{Task SLA Condition: } \text{status} = \text{'OPEN'} \land \text{now}() \ge \text{escalationDeadline}$$

When breached:
1. **Tier 1 (Attending Doctor) $\rightarrow$ Tier 2 (Duty RMO):**
   - Mutates `escalationLevel = 2`.
   - Reassigns `assignedRole = 'RMO'`.
   - Enqueues Tier-2 `NotificationJob` to the on-duty RMO.
   - Sets secondary deadline ($t + 5\text{ mins}$ in prod; $15\text{s}$ in demo).
2. **Tier 2 (Duty RMO) $\rightarrow$ Tier 3 (HOD / Medical Superintendent):**
   - Mutates `escalationLevel = 3`.
   - Reassigns `assignedRole = 'ADMIN'`.
   - Enqueues high-priority broadcast notification.
3. Every escalation event is permanently appended to `AuditLog`.

---

## 7. Comprehensive Test Strategy & Verification Plan

### 7.1 Unit Tests (Vitest — Pure Business Logic)
- **`state-machine.test.ts`**:
  - Verifies valid transitions (`OPEN -> ACKNOWLEDGED -> RESOLVED`).
  - Asserts invalid transitions throw errors (`OPEN -> RESOLVED` rejected).
  - Asserts transition from terminal `RESOLVED` throws exception.
- **`backoff-calculator.test.ts`**:
  - Asserts exponential delay progression: Attempt 1 = 2s, Attempt 2 = 4s, Attempt 3 = 8s.
- **`idempotency.test.ts`**:
  - Validates that identical task and tier attributes produce identical idempotency keys.

### 7.2 Integration Tests (Vitest — Real Database & Outbox Processing)
- **`outbox-transaction.test.ts`**:
  - Executes result verification inside `prisma.$transaction`.
  - Asserts that if outbox job insertion fails, lab result creation rolls back completely.
- **`worker-retry-loop.test.ts`**:
  - Injects simulated temporary network error on attempt 1.
  - Verifies job state transitions to `FAILED` with future `nextRetryAt`.
  - Advances time; verifies worker picks up job on attempt 2 and transitions to `SENT`.
  - Asserts exactly 2 `DeliveryAttempt` records exist.
- **`concurrency-acknowledgment.test.ts`**:
  - Fires two concurrent `POST /api/tasks/[id]/acknowledge` requests simultaneously.
  - Verifies database constraint prevents double-acknowledgment; one receives `200 OK`, second receives `409 Conflict`.
- **`sla-escalation.test.ts`**:
  - Creates a critical alert task.
  - Manually advances simulated clock past `escalationDeadline`.
  - Runs escalation worker.
  - Asserts task `escalationLevel == 2`, `assignedRole == 'RMO'`, and a new outbox job exists.

### 7.3 Crash & Recovery Tests
- **`worker-crash-recovery.test.ts`**:
  - Marks an active job as `PROCESSING` with stale `updatedAt` (> 5 minutes ago) to simulate a dead worker process.
  - Re-runs outbox processor.
  - Verifies worker reclaims stale job and dispatches it without manual intervention.

---

## 8. Complete 5-Minute Demonstration Acceptance Criteria

| Step | Live Action in Command Center | Expected Observable Behavior | System Verification |
| :--- | :--- | :--- | :--- |
| **1. Trigger Alert** | Lab tech enters critical potassium ($K^+ = 6.8$) on Lab Portal. | Lab order shows "Verified"; immediate visual confirmation of panic alert generation. | `TaskTicket` (`OPEN`) and `NotificationJob` (`PENDING`) committed atomically in SQLite. |
| **2. Outbox Dispatch** | Outbox worker executes background polling. | Command Center Outbox feed updates: Job changes from `PENDING` to `PROCESSING` to `SENT`. | `DeliveryAttempt` record logged with network latency ($< 100\text{ ms}$). |
| **3. Realistic Retry** | Simulator toggles channel disconnect for test scenario. | Worker logs attempt failure; job shows `FAILED (Retry 1/3 in 5s)`; retries and recovers to `SENT`. | Idempotency key prevents duplicate messages; audit trail captures retry. |
| **4. SLA Escalation** | Evaluator pauses without acknowledging alert for 30 seconds. | Live escalation countdown reaches 0; task badge changes to 🔴 **ESCALATED TO RMO (Tier 2)**; Tier-2 notification fires. | `escalationLevel = 2`; Tier-2 notification job logged in outbox. |
| **5. Clinician ACK** | Doctor logs in, clicks "Acknowledge Responsibility". | Task badge changes from 🔴 `OPEN` to 🟡 `ACKNOWLEDGED`; assigned to Dr. Arjun. | `acknowledgedAt` timestamp and doctor ID recorded; escalation countdown halts. |
| **6. Resolution** | Doctor enters treatment notes: *"IV Calcium Gluconate administered; repeat K+ ordered."* | Task badge changes to 🟢 `RESOLVED`; disappears from active critical queue into completed archive. | `resolvedAt`, `resolvedById`, and `resolutionNotes` stored permanently. |
| **7. Audit Timeline** | Open Audit Log view for Patient Dossier. | Full 8-stage chronological timeline displayed showing every actor, timestamp, latency, and action. | Zero missing links in the audit chain. |
