# 🏥 Product Requirements Document (PRD)
## Dronagiri (Gandhamadana) — Enterprise Hospital Operating System

**Document Version:** 1.0.0  
**Status:** Active Prototype / Specification  
**Target Platform:** Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, SQLite / PostgreSQL  

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
**Dronagiri (Gandhamadana)** is an enterprise-grade Hospital Operating System and Clinical Command Center designed for acute-care hospitals, trauma centers, and multi-specialty healthcare networks. Drawing conceptual inspiration from ancient traditions of healing (Dhanvantari, Sushruta, Charaka, Ashwini Kumaras, Jivaka, and Nagarjuna), Dronagiri fuses modern clinical informatics with an intuitive, unified command interface to eliminate data silos, reduce administrative overhead, and safeguard patient outcomes.

### 1.2 Core Problem Statement
Modern hospital networks suffer from fragmented operational software:
1. **Disconnected Clinical & Diagnostic Workflows:** Patient vitals, lab orders, and radiology scans exist in separate third-party silos.
2. **Emergency Triage Inefficiencies:** Trauma bays struggle with manual bed allocation and delayed physician dispatch during the critical "Golden Hour".
3. **Administrative & Billing Disconnect:** Tariffs, pharmacy dispensing, surgical consumable usage, and insurance claims are recorded in ad-hoc ledgers, creating revenue leakage and delayed discharges.
4. **Weak Auditability & Role Confusion:** Lack of centralized, cryptographically verifiable audit trails compromises clinical compliance (DISHA, HIPAA, NABH).

### 1.3 Solution Overview
Dronagiri provides a **unified 20-subsystem clinical command hub** backed by 35 relational schema entities. From outpatient token queuing to inpatient bed matrices, trauma triage, WHO-compliant surgical checkboards, DICOM-inspired browser PACS, and closed-loop pharmacy dispensing, Dronagiri serves as the single source of operational truth.

---

## 2. Target Personas & User Roles

| Persona | Role Key | Primary Responsibilities & Needs |
| :--- | :--- | :--- |
| **Hospital Administrator** | `ADMIN` | Full-spectrum access; monitors hospital census, bed occupancy, department revenues, and system audit trails. |
| **Attending Doctor / Specialist** | `DOCTOR` | Accesses Patient 360 dossiers; writes clinical notes, diagnoses, prescriptions, and orders labs/radiology scans. |
| **Head / Ward Nurse** | `NURSE` | Manages inpatient bed assignments, logs patient vital signs, records nurse rounds, and monitors active IV/infusions. |
| **Emergency Triage Officer** | `DOCTOR` / `NURSE` | Categorizes incoming trauma patients via acuity scales (RED, YELLOW, GREEN); assigns resuscitation bays. |
| **Pharmacist** | `PHARMACIST` | Manages drug dispensary inventory, verifies doctor prescription orders, tracks batch expiry, and dispenses medication. |
| **Laboratory Technician** | `LAB_TECH` | Collects specimens, logs diagnostic analyzers, inputs clinical lab values, and flags abnormal test parameters. |
| **Radiology Technician** | `RAD_TECH` | Schedules diagnostic modalities (X-Ray, CT, MRI, Ultrasound), uploads scan imagery, and logs radiologist impressions. |
| **Billing & Cashier Specialist**| `BILLING` | Generates invoices, applies insurance co-pay tariffs, records payments, and issues financial clearance for discharge. |
| **Front Desk / Receptionist** | `RECEPTIONIST`| Registers new patients (MRN assignment), schedules OPD visits, and directs patient flow. |
| **Patient / Family** | `PATIENT` | Reviews historical medical records, active prescriptions, lab reports, and tracks ambulance requests via self-service portal. |

---

## 3. Subsystems & Functional Requirements

### 3.1 Patient 360 & Master Patient Index (MPI)
- **FR-1.1 Unique Identification:** Every patient must possess a globally unique Medical Record Number (`MRN`, e.g., `P-1001`).
- **FR-1.2 Demographics Intake:** Multi-step registration capturing demographic data, blood group, emergency contacts, allergy history, and insurance policies.
- **FR-1.3 Longitudinal Dossier:** Unified Patient 360 view aggregating:
  - Vital signs history with temporal trending charts.
  - Active and historical clinical consultations with ICD-10 diagnostic coding.
  - Diagnostic test orders (Lab + PACS Radiology).
  - Medication history and active prescriptions.
  - Inpatient admissions, bed transfers, and surgical encounter summaries.

### 3.2 Outpatient Department (OPD) & Scheduling
- **FR-2.1 Appointment Scheduling:** Time-slot booking linked to doctor availability schedules and departmental consultation rooms.
- **FR-2.2 Token Management:** Real-time queue tracker categorizing visits as *Scheduled*, *Waiting*, *In Consultation*, or *Completed*.
- **FR-2.3 Wait-Time Estimation:** Dynamic queue estimation based on average doctor consultation duration.

### 3.3 Emergency Department & Trauma Bay
- **FR-3.1 Acuity Triage:** Color-coded triage classification:
  - 🔴 **RED (Resuscitation / Immediate):** Acute hemodynamic compromise, respiratory arrest, severe trauma.
  - 🟡 **YELLOW (Emergent / Urgent):** High pain index, suspected fractures, stable vitals under observation.
  - 🟢 **GREEN (Non-Urgent / Ambulatory):** Minor lacerations, stable ambulatory walk-ins.
- **FR-3.2 Resuscitation Bed Allocation:** Direct one-click allocation of trauma bay beds (`ER-01` to `ER-12`).
- **FR-3.3 Rapid Intake:** Fast-track registration allowing temporary unidentified patient records ("John/Jane Doe") with automatic MRN generation.

### 3.4 Inpatient Department (IPD) & Bed Matrix
- **FR-4.1 Ward Hierarchies:** Real-time visual matrix across General, Semi-Private, Deluxe, and Intensive Care Units (ICU).
- **FR-4.2 Bed Lifecycle:** Color-coded states: *Available*, *Occupied*, *Maintenance*, *Cleaning/Sanitization*.
- **FR-4.3 Admission & Transfer Workflow:** Bed assignment with automated ward tariff calculation and assigned primary nurse tracking.

### 3.5 Operation Theatre (OT) & Surgical Suite
- **FR-5.1 Theatre Scheduling:** OT room allocation (`OT-1`, `OT-2`, `OT-3`) with scheduled start/end windows and surgical procedure classifications.
- **FR-5.2 Surgical Team Allocation:** Assignment of Lead Surgeon, Anesthetist, Scrub Nurse, and Circulating Nurse.
- **FR-5.3 WHO Surgical Safety Checklist:** Mandatory multi-stage safety verification:
  - *Sign In* (Before induction of anesthesia)
  - *Time Out* (Before skin incision)
  - *Sign Out* (Before patient leaves operating room)

### 3.6 Diagnostic Laboratory Pipeline
- **FR-6.1 Order Lifecycle:** Multi-stage status progression: `ORDERED` ➔ `SAMPLE_COLLECTED` ➔ `PROCESSING` ➔ `RESULT_ENTERED` ➔ `VERIFIED`.
- **FR-6.2 Parameter Reporting:** Numeric and textual lab values with predefined reference ranges, automatic flagging of high/low critical values.

### 3.7 Radiology & Simulated PACS Viewer
- **FR-7.1 Modality Management:** Scheduling across X-Ray, CT, MRI, and Ultrasound.
- **FR-7.2 In-Browser PACS Viewer:** Interactive image rendering canvas supporting:
  - Windowing / Contrast adjustment (Window Width / Window Level).
  - Zoom, Pan, Invert, and Reset controls.
  - Integrated radiologist impression and report sign-off.

### 3.8 Pharmacy & Medication Dispensary
- **FR-8.1 Drug Catalog:** Pharmaceutical inventory with generic and brand names, ATC classifications, dosage forms, and batch tracking.
- **FR-8.2 Stock & Reorder Controls:** Real-time stock levels with automatic minimum-threshold reorder alerts.
- **FR-8.3 Prescription Dispensing:** Closed-loop verification of physician prescriptions, dosage frequency checks, and batch deduction upon dispensing.

### 3.9 Blood Bank & Serology
- **FR-9.1 Component Inventory:** Real-time blood units tracked across Whole Blood, Packed Red Blood Cells (PRBC), Platelets, and Fresh Frozen Plasma (FFP).
- **FR-9.2 Serological Matrix:** ABO/Rh compatibility validation before unit reservation or cross-matching.
- **FR-9.3 Expiry Tracking:** Strict refrigeration date tracking and critical shortage alerts.

### 3.10 Biomedical Equipment & Facilities
- **FR-10.1 Asset Registry:** Maintenance lifecycle tracking for diagnostic equipment, ventilators, defibrillators, and monitors.
- **FR-10.2 Preventative Maintenance:** Inspection logs, breakdown incident tracking, and operational status indicators (*Operational*, *Under Service*, *Decommissioned*).

### 3.11 Emergency Fleet & Ambulance Logistics
- **FR-11.1 Fleet Telemetry:** Fleet tracking with fuel percentage, onboard life support level (BLS / ALS), and current driver/paramedic crew.
- **FR-11.2 Dispatch Command:** Active call response mapping, patient pick-up location, estimated time of arrival (ETA), and hospital intake coordination.

### 3.12 Financial Management & Billing
- **FR-12.1 Itemized Invoice Generation:** Automated aggregation of room charges, doctor consultation fees, diagnostic test fees, surgical procedure charges, and pharmacy bills.
- **FR-12.2 Insurance & Co-Pay Processing:** Policy coverage deduction, co-pay calculation, and remaining patient balance calculation.
- **FR-12.3 Payment Recording:** Multi-mode receipting (Cash, Card, UPI, Insurance settlement) with automatic receipt generation.

### 3.13 Governance, HR & Audit Trails
- **FR-13.1 Staff Rostering:** Shift assignments (Morning, Evening, Night) and daily attendance monitoring.
- **FR-13.2 Regulatory Audit Logging:** Non-repudiation audit trail recording every read, create, update, and delete action with actor ID, timestamp, client IP, and target resource.

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 Security & Compliance
- **NFR-1.1 Authentication:** Secure JWT-based session tokens with HTTP-only cookie transport or Authorization headers. Password hashing using `bcryptjs` (salt rounds $\ge 10$).
- **NFR-1.2 Role-Based Access Control (RBAC):** Server-side authorization gate on all `/api/*` endpoints validating granular `resource.action` permissions.
- **NFR-1.3 Data Privacy Standards:** Architecture aligned with HIPAA, DISHA (India), and HL7/FHIR entity mapping principles.

### 4.2 Performance & Responsiveness
- **NFR-2.1 Page Load Speed:** Next.js Server Components and tree-shaken client bundles ensuring First Contentful Paint (FCP) $< 1.2\text{s}$ on broadband.
- **NFR-2.2 API Latency:** Core database queries resolving in $< 50\text{ms}$ under normal SQLite/PostgreSQL operation.
- **NFR-2.3 Real-Time Feedback:** Optimistic UI state updates for emergency admissions, bed toggles, and lab status progressions.

### 4.3 Reliability & Availability
- **NFR-3.1 Data Integrity:** Foreign key constraints, atomic transactions via Prisma `$transaction`, and schema-level cascades.
- **NFR-3.2 Resilience:** Graceful client-side degradation with offline fallbacks (`site/lib/hms-data.ts`) in demo/academic mode.

---

## 5. Success Metrics & Key Performance Indicators (KPIs)

1. **Triage-to-Bed Duration:** $< 5$ minutes average allocation in emergency triage.
2. **Medication Dispense Accuracy:** $100\%$ validation against physician prescription ID with zero unverified dispenses.
3. **Bed Occupancy Visibility:** Real-time accuracy of occupied vs available beds across all 4 ward tiers.
4. **Audit Trail Coverage:** $100\%$ of mutating requests (`POST`, `PATCH`, `DELETE`) captured in `AuditLog`.
