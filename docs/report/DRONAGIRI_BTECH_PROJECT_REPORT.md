# DRONAGIRI: A CLOSED-LOOP CLINICAL ACCOUNTABILITY HOSPITAL MANAGEMENT SYSTEM (PROTOTYPE)

---

### A CAPSTONE PROJECT REPORT

*Submitted in partial fulfillment of the requirements for the degree of*  
**BACHELOR OF TECHNOLOGY**  
*in*  
**COMPUTER SCIENCE AND ENGINEERING**

*by*  
**[STUDENT NAME]**  
**(Roll No: [ROLL NUMBER])**

*Under the guidance of*  
**[PROJECT GUIDE NAME]**  
*[Designation, Department of Computer Science and Engineering]*

**DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING**  
**[COLLEGE / INSTITUTION NAME]**  
**[AFFILIATED UNIVERSITY NAME]**  
**[CITY, STATE, PIN CODE]**  
**ACADEMIC YEAR: [2025 – 2026]**

---

## CERTIFICATE

This is to certify that the project report entitled **"Dronagiri: A Closed-Loop Clinical Accountability Hospital Management System (Prototype)"**, submitted by **[STUDENT NAME]** (Roll No: **[ROLL NUMBER]**) in partial fulfillment of the requirements for the award of the degree of **Bachelor of Technology in Computer Science and Engineering** to **[COLLEGE / INSTITUTION NAME]**, affiliated with **[AFFILIATED UNIVERSITY NAME]**, is a bona fide record of the work carried out by them under my supervision and guidance during the academic year **[2025 – 2026]**.

The results embodied in this report have not been submitted to any other University or Institute for the award of any degree or diploma.

\
\
\
______________________________  
**[PROJECT GUIDE NAME]**  
Project Guide  
Department of Computer Science & Engineering  
[College Name]  

\
\
______________________________  
**[HEAD OF DEPARTMENT NAME]**  
Head of the Department  
Department of Computer Science & Engineering  
[College Name]  

\
\
**Internal Examiner:** _______________________  
**External Examiner:** _______________________  
**Date:** [DD/MM/YYYY]  
**Place:** [City Name]

---

## DECLARATION

I, **[STUDENT NAME]** (Roll No: **[ROLL NUMBER]**), student of Bachelor of Technology in the Department of Computer Science and Engineering at **[COLLEGE / INSTITUTION NAME]**, hereby declare that the capstone project work entitled **"Dronagiri: A Closed-Loop Clinical Accountability Hospital Management System (Prototype)"** is an authentic work carried out by me under the supervision and guidance of **[PROJECT GUIDE NAME]**, [Designation], Department of Computer Science and Engineering.

I affirm that the technical implementation, algorithmic state machines, distributed outbox architecture, database schemas, and empirical test suites presented in this report reflect the authentic code developed in the project repository. I have not submitted this work, either in whole or in part, to any other institution or university for the award of any other degree, diploma, or fellowship.

I have also adhered to ethical academic standards; all ideas, regulatory standards, scientific literature, and software frameworks drawn from external sources have been duly acknowledged and cited in the references section.

\
\
\
______________________________  
**[STUDENT NAME]**  
Roll No: [ROLL NUMBER]  
Department of Computer Science and Engineering  
[College / Institution Name]  
Date: [DD/MM/YYYY]

---

## ACKNOWLEDGEMENT

The completion of this capstone project and technical report has been made possible through the guidance, encouragement, and support of numerous individuals and institutions.

First and foremost, I express my deepest gratitude to my esteemed project guide, **[PROJECT GUIDE NAME]**, [Designation], Department of Computer Science and Engineering, for their invaluable mentorship, insightful technical suggestions, and patient review throughout the software development lifecycle. Their emphasis on architectural rigor, distributed consistency, and evidence-based software engineering pushed this project beyond superficial CRUD functionality to address authentic operational challenges.

I extend my sincere thanks to **[HEAD OF DEPARTMENT NAME]**, Head of the Department of Computer Science and Engineering, for providing the necessary computational infrastructure, development facilities, and academic encouragement to undertake an ambitious healthcare engineering project.

I am deeply thankful to the management and leadership of **[COLLEGE / INSTITUTION NAME]**, especially the Principal/Director, **[PRINCIPAL NAME]**, for fostering an academic environment that champions rigorous engineering research, full-stack systems engineering, and innovation.

I would also like to acknowledge the contributions of the open-source software community behind Next.js, React, TypeScript, Prisma ORM, and Vitest, whose robust tooling and documentation formed the foundation of our engineering platform.

Finally, I owe my profound gratitude to my parents and family for their unwavering moral support, patience, and sacrifices throughout my undergraduate studies, and to my friends and peers for their continuous feedback, constructive debates, and collaborative spirit.

\
\
\
**[STUDENT NAME]**

---

## ABSTRACT

In contemporary healthcare organizations, conventional Hospital Management Systems (HMS) suffer from an acute architectural limitation: **feature sprawl without operational accountability**. Standard hospital information platforms provide extensive Create-Read-Update-Delete (CRUD) forms for patient demographics, OPD queue ticketing, bed matrices, and pharmacy registers. However, they almost universally treat clinical diagnostic reporting as a passive, "fire-and-forget" database write. When a laboratory analyzer detects a life-threatening biochemical derangement (a *critical panic value*, such as serum potassium $K^+ > 6.0	ext{ mEq/L}$ or glucose $< 40	ext{ mg/dL}$), the result is merely saved to a relational table and marked verified. No active, tracked notification is guaranteed to reach the attending physician; hospital staff must rely on unmonitored WhatsApp chats, verbal phone calls, and paper notes. This creates severe patient safety hazards and exposes hospitals to vicarious liability for medical negligence under Indian legal precedents (*Savita Garg v. National Heart Institute*).

This project presents **Dronagiri (Gandhamadana)**, an evidence-informed full-stack prototype Hospital Management System designed to resolve this operational breakdown. The core engineering contribution of Dronagiri is a **Closed-Loop Clinical Task & Alert Accountability Engine** implemented on a modern modular monolith architecture. Dronagiri transforms passive laboratory findings into active, state-tracked clinical responsibilities using the **Transactional Outbox Pattern** coupled with a **Deterministic Finite State Machine (FSM)**.

When a laboratory technician enters a critical diagnostic result, the system executes an atomic database transaction (`prisma.$transaction`) that atomically commits the result record (`LabResult`), a trackable clinical task ticket (`TaskTicket`), a persistent outbox notification job (`NotificationJob`), an itemized billing entry (`InvoiceItem`), and a tamper-evident audit log (`AuditLog`). This eliminates the distributed dual-write dilemma without requiring heavyweight two-phase commit protocols. An asynchronous background outbox worker atomically claims eligible jobs, enforces exponential retry backoff ($2	ext{ s}, 4	ext{ s}, 8	ext{ s}$ up to $60	ext{ s}$), and evaluates strict Service Level Agreement (SLA) deadlines. If an alert remains unacknowledged beyond 10 minutes, the escalation engine automatically elevates the task to higher clinical tiers (Attending Physician $ightarrow$ Duty RMO $ightarrow$ Chief Medical Officer). The task state machine strictly prohibits premature resolution: moving from $OPEN$ directly to $RESOLVED$ is mathematically forbidden, requiring explicit clinician acknowledgment and documented clinical notes.

Dronagiri is built using Next.js 16.2.0 (App Router), React 19.0.0, TypeScript 5.x, Prisma ORM 6.19.3, and SQLite 3. The broader application incorporates 20 subsystem user interfaces spanning acute trauma triage, inpatient bed matrices, operating theatre schedules, and pharmacy dispensing, supported by 33 RESTful API route handlers and 36 relational models. System security is enforced via Next.js Edge Middleware for cryptographic HS256 JWT decoding, paired with Role-Based Access Control (RBAC) across 9 personas and resource-level ownership validation (`isPatientOwner`) to eliminate Insecure Direct Object Reference (IDOR) attacks on primary dossiers.

The system was evaluated through an automated verification suite consisting of **60 automated tests across 7 test suites** executing in 1.16 seconds under Vitest v5.0.4, including 7 real database integration tests validating transaction rollbacks, worker claiming, and unique idempotency constraints. The production build compiles in 1.585 seconds (Turbopack) with 0 ESLint errors. Finally, an honest forensic audit documents existing prototype limitations, including secondary collection authorization gaps, non-atomic pharmacy dispensing, and SQLite concurrency constraints, providing a structured engineering roadmap for production cloud deployment.

\
**Keywords:** Hospital Management Systems, Closed-Loop Communication, Clinical Accountability, Transactional Outbox Pattern, Finite State Machine, Distributed Systems, Next.js, Prisma ORM, Patient Safety, Healthcare Informatics.

---

## TABLE OF CONTENTS

- **Certificate**
- **Declaration**
- **Acknowledgement**
- **Abstract**
- **List of Figures**
- **List of Tables**
- **List of Abbreviations**
- **Chapter 1: Introduction**
  - 1.1 Background
  - 1.2 Healthcare Information Systems
  - 1.3 Hospital Management Systems
  - 1.4 Critical Diagnostic Result Communication
  - 1.5 Problem Statement
  - 1.6 Motivation
  - 1.7 Objectives
  - 1.8 Scope of the Project
  - 1.9 Proposed Contribution
  - 1.10 Organization of the Report
- **Chapter 2: Literature Review and Existing System**
  - 2.1 Existing Hospital Information Systems
  - 2.2 Traditional Critical Result Communication
  - 2.3 Manual and Verbal Communication Workflows
  - 2.4 Email and Messaging-Based Channels
  - 2.5 The Closed-Loop Communication Breakdown
  - 2.6 Existing Workflow Bottlenecks in Indian Hospitals
  - 2.7 Related Research and Legal Precedents
  - 2.8 Comparison of Existing Approaches
  - 2.9 Identified Research and Engineering Gap
  - 2.10 Chapter Summary
- **Chapter 3: Proposed System**
  - 3.1 Overview
  - 3.2 System Objectives
  - 3.3 Proposed High-Level Architecture
  - 3.4 The Closed-Loop Clinical Accountability Concept
  - 3.5 Critical Result Lifecycle and Event Sequencing
  - 3.6 Task Assignment and Role Tiers
  - 3.7 Clinician Acknowledgment Mechanics
  - 3.8 SLA Breach and Automated Escalation
  - 3.9 Documented Clinical Resolution
  - 3.10 The Transactional Outbox Solution
  - 3.11 Hospital Management Subsystems (The Broader Application Context)
  - 3.12 Advantages of the Proposed System
  - 3.13 Proposed System Limitations
  - 3.14 Chapter Summary
- **Chapter 4: System Requirements and Feasibility Analysis**
  - 4.1 Functional Requirements
  - 4.2 Non-Functional Requirements
  - 4.3 Hardware Requirements
  - 4.4 Software Requirements
  - 4.5 User Roles and Persona Profiles
  - 4.6 System Use Cases
  - 4.7 Feasibility Analysis (Technical, Economic, Operational, Schedule)
  - 4.8 Architectural and System Constraints
  - 4.9 Chapter Summary
- **Chapter 5: System Design and Architecture**
  - 5.1 Design Overview
  - 5.2 Modular Monolith Architectural Pattern
  - 5.3 Frontend Architecture (App Router & Component Boundaries)
  - 5.4 Edge Gateway and Middleware Architecture
  - 5.5 API Layer and Route Structure
  - 5.6 Business Logic and Domain Service Layer
  - 5.7 Persistence and ORM Layer
  - 5.8 Authentication Architecture
  - 5.9 Authorization and Resource Ownership Architecture
  - 5.10 Database Domain Classification
  - 5.11 Entity-Relationship (ER) Design
  - 5.12 Clinical Task and Alert Domain Design
  - 5.13 Notification Worker Architecture
  - 5.14 Audit Logging and Compliance Architecture
  - 5.15 Data Flow Analysis (DFD Level 0 and Level 1)
  - 5.16 Chapter Summary
- **Chapter 6: Technology Stack and Selection Justification**
  - 6.1 Next.js 16.2 (App Router & Turbopack)
  - 6.2 React 19.0 (Server/Client Components & Concurrent State)
  - 6.3 TypeScript 5.x
  - 6.4 Prisma ORM 6.19.3
  - 6.5 SQLite 3 Persistence Engine
  - 6.6 Cryptographic Token Engine (Jose HS256)
  - 6.7 Password Hashing (Bcryptjs)
  - 6.8 Tailwind CSS v4 and Modern CSS Tokens
  - 6.9 Headless UI Primitives (Radix UI)
  - 6.10 Recharts Data Visualization
  - 6.11 Three.js and React Three Fiber
  - 6.12 Vitest Testing Framework
  - 6.13 Development and Code Quality Tools
  - 6.14 Technology Selection Summary
  - 6.15 Chapter Summary
- **Chapter 7: Detailed System Implementation**
  - 7.1 Application Structure and Directory Layout
  - 7.2 Authentication Implementation
  - 7.3 Edge Middleware Request Interception
  - 7.4 Role-Based Access Control Implementation
  - 7.5 Patient Ownership Validation and IDOR Prevention
  - 7.6 Patient Registration and MRN Generation
  - 7.7 EMR Patient 360 Dossier
  - 7.8 Outpatient Department (OPD) and Consultation Queues
  - 7.9 Emergency Trauma Desk and Direct Inpatient Admission
  - 7.10 Inpatient (IPD) Bed Matrix and Discharge Settlement
  - 7.11 Diagnostic Laboratory Order Management
  - 7.12 Critical Result Threshold Evaluation
  - 7.13 Atomic Task and Notification Outbox Creation
  - 7.14 Task Acknowledgment API Implementation
  - 7.15 Clinical Resolution Documentation
  - 7.16 Asynchronous Outbox Worker Loop
  - 7.17 Escalation Engine Implementation
  - 7.18 Pharmacy Catalog and Medication Dispensing
  - 7.19 Radiology and 2D Canvas PACS Viewer
  - 7.20 Invoicing, Tariffs, and Payment Settlements
  - 7.21 Blood Bank Stock and Serology Compatibility
  - 7.22 Ambulance Dispatch Logistics
  - 7.23 Biomedical Equipment Maintenance Tracking
  - 7.24 Consumables Inventory (LocalStorage Fallback)
  - 7.25 Staff HR and Shift Rostering
  - 7.26 Audit Log Trail
  - 7.27 Executive Dashboard Metrics
  - 7.28 Patient Self-Service Portal
  - 7.29 Implementation Summary
- **Chapter 8: Algorithms and Core Logic Formulation**
  - 8.1 Clinical Task Finite State Machine (FSM)
  - 8.2 Critical Value Detection Heuristic
  - 8.3 Transactional Outbox Atomic Insertion Algorithm
  - 8.4 Notification Outbox Worker Algorithm
  - 8.5 Exponential Backoff and Jitter Formulation
  - 8.6 Deterministic Idempotency Key Algorithm
  - 8.7 Multi-Tier SLA Escalation Algorithm
  - 8.8 JWT Verification and Edge Decoding Algorithm
  - 8.9 RBAC Permission Checking Algorithm
  - 8.10 Patient Resource Ownership Resolution Algorithm
  - 8.11 Rule-Based Clinical Triage Algorithm
  - 8.12 Client-Side Optimistic Mutation and Rollback Algorithm
  - 8.13 Chapter Summary
- **Chapter 9: Testing, Verification, and Experimental Results**
  - 9.1 Testing Strategy and Test Architecture
  - 9.2 Real Database Integration Testing
  - 9.3 Cryptographic Token Security Testing
  - 9.4 Role-Based Access Control (RBAC) Testing
  - 9.5 Patient Ownership and IDOR Defense Testing
  - 9.6 Finite State Machine Invariant Testing
  - 9.7 Financial Transaction and Settlement Testing
  - 9.8 Frontend Optimistic Rollback Testing
  - 9.9 Production Compilation and Build Verification
  - 9.10 Static Code Quality and ESLint Verification
  - 9.11 Experimental Test Execution Summary
  - 9.12 Testing Limitations and Scope Boundaries
  - 9.13 Chapter Summary
- **Chapter 10: Limitations and Critical Engineering Evaluation**
  - 10.1 Security and Authorization Vulnerabilities (Secondary IDOR)
  - 10.2 Transactional Atomicity Gaps in Pharmacy Dispensing
  - 10.3 Relational Constraint Violations in Staff Creation
  - 10.4 Concurrency Bottlenecks in Blood Bank Inventory
  - 10.5 Authorization Scope Leakage on Dashboard Metrics
  - 10.6 Decoupled Persistence and LocalStorage Reliance
  - 10.7 Simulated External Integrations (Carrier, PACS, GPS)
  - 10.8 Single-Node SQLite File Locking Bottlenecks
  - 10.9 Absence of Real-World Clinical Validation
  - 10.10 Comprehensive Defect Register
  - 10.11 Chapter Summary
- **Chapter 11: Future Enhancements and Engineering Roadmap**
  - 11.1 Production Database Migration (PostgreSQL & PgBouncer)
  - 11.2 Security Remediation and Universal Route-Level Scoping
  - 11.3 Transactional Boundaries across All Ancillary Modules
  - 11.4 Physical Telecommunications Integration (SMS/WhatsApp Webhooks)
  - 11.5 Dedicated Clinical Task Console and Visual SLA Radar
  - 11.6 True Binary DICOM PACS Integration
  - 11.7 Server-Side Consumables Inventory and Stock Ledger
  - 11.8 Real-Time Fleet Telemetry via WebSocket and GPS
  - 11.9 Cloud Deployment Architecture and CI/CD Automation
  - 11.10 Phased Engineering Roadmap
  - 11.11 Chapter Summary
- **Chapter 12: Conclusion**
  - 12.1 Problem Solved
  - 12.2 System Delivered
  - 12.3 Summary of Technical Contributions
  - 12.4 Academic and Practical Significance
  - 12.5 Final Remarks
- **References**
- **Appendices**
  - Appendix A: Complete API Endpoint Inventory (33 Routes)
  - Appendix B: Database Model Inventory (36 Prisma Models)
  - Appendix C: Automated Test Suite Inventory (7 Suites, 60 Tests)
  - Appendix D: Selected Algorithm Pseudocode
  - Appendix E: User Interface Screen Captures
  - Appendix F: Installation, Configuration, and Execution Manual

---

## LIST OF FIGURES

* **Figure 1.1:** The Passive Reporting Trap in Conventional Hospital Management Systems.
* **Figure 3.1:** End-to-End Closed-Loop Critical Result Accountability Lifecycle.
* **Figure 5.1:** High-Level Five-Tier Modular Monolith Architecture.
* **Figure 5.2:** HTTP Request Lifecycle through Edge Perimeter Security.
* **Figure 5.3:** Five-Domain Relational Model Architecture.
* **Figure 5.4:** Transactional Outbox Pattern and Worker Dispatch Architecture.
* **Figure 5.5:** Domain ER Diagram: Core Clinical Care Models.
* **Figure 5.6:** Domain ER Diagram: Closed-Loop Accountability and Outbox Models.
* **Figure 5.7:** Data Flow Diagram (DFD Level 1) for Critical Result Processing.
* **Figure 8.1:** Deterministic Clinical Task Finite State Machine (FSM) State Transition Diagram.
* **Figure 8.2:** Asynchronous Outbox Worker Claiming, Execution, and Stale Recovery Flowchart.
* **Figure 8.3:** Exponential Backoff Retry Delay Progression.
* **Figure 9.1:** Vitest Automated Test Execution Output (60 Tests Passing).
* **Figure 9.2:** Next.js Production Build Output Log.

---

## LIST OF TABLES

* **Table 2.1:** Comparative Analysis: Conventional HMS vs. Commercial Enterprise HIS vs. Dronagiri Prototype.
* **Table 4.1:** Functional Requirements Specification (FR-01 to FR-12).
* **Table 4.2:** Non-Functional Requirements Specification (NFR-01 to NFR-08).
* **Table 4.3:** System Hardware Specifications (Development Host vs. Target Server).
* **Table 4.4:** Software Environment and Runtime Dependencies.
* **Table 4.5:** User Personas and Role-Based Privilege Profiles.
* **Table 4.6:** System Use Case Catalog (UC-01 to UC-10).
* **Table 6.1:** Core Technology Stack and Architectural Justification.
* **Table 7.1:** Subsystem Implementation and Data Persistence Mapping.
* **Table 8.1:** TaskTicket Finite State Machine Formal Transition Matrix.
* **Table 8.2:** Configurable Prototype Critical Laboratory Thresholds.
* **Table 8.3:** Exponential Backoff Retry Schedule Calculations.
* **Table 9.1:** Automated Test Suite Classification and Execution Results.
* **Table 9.2:** Next.js Production Build Performance Breakdown.
* **Table 10.1:** Master Defect Register: Verified Vulnerabilities, Architectural Gaps, and Proposed Fixes.
* **Table 11.1:** Phased Production Roadmap: Milestone Goals and Implementation Tiers.

---

## LIST OF ABBREVIATIONS

| Abbreviation | Expanded Form |
| :--- | :--- |
| **API** | Application Programming Interface |
| **Bcrypt** | Adaptive Hash Function for Passwords |
| **CRUD** | Create, Read, Update, Delete |
| **CUID** | Collision-Resistant Unique Identifier |
| **DFD** | Data Flow Diagram |
| **DICOM** | Digital Imaging and Communications in Medicine |
| **EMR** | Electronic Medical Record |
| **ER** | Entity-Relationship |
| **FFP** | Fresh Frozen Plasma |
| **FSM** | Finite State Machine |
| **FSWD** | Full Stack Web Development |
| **HIS** | Hospital Information System |
| **HMO** | Health Maintenance Organization |
| **HMS** | Hospital Management System |
| **HOD** | Head of the Department |
| **HTTP** | Hypertext Transfer Protocol |
| **HTTPS** | Hypertext Transfer Protocol Secure |
| **ICU** | Intensive Care Unit |
| **IDOR** | Insecure Direct Object Reference |
| **IPD** | Inpatient Department |
| **IRDAI** | Insurance Regulatory and Development Authority of India |
| **ISO** | International Organization for Standardization |
| **JSON** | JavaScript Object Notation |
| **JWT** | JSON Web Token |
| **MRN** | Medical Record Number |
| **NABH** | National Accreditation Board for Hospitals & Healthcare Providers |
| **NABL** | National Accreditation Board for Testing and Calibration Laboratories |
| **NCDRC** | National Consumer Disputes Redressal Commission |
| **OPD** | Outpatient Department |
| **ORM** | Object-Relational Mapping |
| **OT** | Operation Theatre |
| **PACS** | Picture Archiving and Communication System |
| **PRBC** | Packed Red Blood Cells |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **RMO** | Resident Medical Officer |
| **SBAR** | Situation, Background, Assessment, Recommendation |
| **SLA** | Service Level Agreement |
| **SSR** | Server-Side Rendering |
| **TAT** | Turnaround Time |
| **TPA** | Third-Party Administrator |
| **UI** | User Interface |
| **UX** | User Experience |
| **WHO** | World Health Organization |
| **WW/WL** | Window Width / Window Level |

---

# CHAPTER 1 — INTRODUCTION

## 1.1 Background
Healthcare delivery in acute clinical settings is an inherently multi-disciplinary, distributed undertaking. Within a hospital, successful diagnostic and therapeutic outcomes require continuous, precise coordination across physically and operationally partitioned departments: emergency triage bays, outpatient consultation suites, diagnostic biochemistry and pathology laboratories, radiology suites, operating theatres, inpatient medical-surgical wards, intensive care units (ICUs), and hospital pharmacies. 

Over the past three decades, hospitals worldwide have computerized their operational workflows, transitioning from physical paper records to electronic Hospital Management Systems (HMS) and Hospital Information Systems (HIS). In the Indian healthcare ecosystem, this digitization has been propelled by national healthcare policies, modern digital health initiatives, and statutory quality accreditation standards such as those established by the National Accreditation Board for Hospitals & Healthcare Providers (NABH, 6th Edition, effective January 2025) and the National Accreditation Board for Testing and Calibration Laboratories (NABL / ISO 15189:2022) [1, 2].

In standard clinical installations, hospital software is structured around departmental Create-Read-Update-Delete (CRUD) data models. These applications capture patient demographic registration, issue outpatient department (OPD) consultation queue tokens, log laboratory investigation orders, track pharmaceutical inventories, record ward bed occupancies, and calculate consolidated billing invoices. 

However, computerizing administrative records does not automatically ensure clinical communication reliability. The daily operational reality of secondary acute care hospitals (facilities operating between 50 and 200 inpatient beds) involves high patient turnover, rapid clinical task handovers across rotating nursing shifts, and heavy cognitive burdens on medical officers and attending specialists [3]. In these fast-paced acute environments, the primary threat to patient safety frequently shifts from an absence of diagnostic information to a failure in active, verifiable communication between the diagnostic source and the clinical decision-maker.

## 1.2 Healthcare Information Systems
Healthcare Information Systems represent complex socio-technical infrastructures designed to collect, store, process, and transmit administrative, clinical, and financial data. Historically, early hospital information systems operated as disconnected mainframes dedicated almost exclusively to patient billing and accounting. As clinical computing matured, software expanded into departmental specialized applications: Laboratory Information Systems (LIS), Radiology Information Systems (RIS), Pharmacy Management Systems (PMS), and Electronic Medical Records (EMR).

Modern web architectures have enabled hospitals to consolidate these disparate departmental silos into integrated modular monoliths or distributed microservices. A modern web-based healthcare platform must provide high availability, low-latency data access across wards, and rigorous perimeter security. Because healthcare platforms process sensitive Protected Health Information (PHI), systems must enforce strict cryptographic confidentiality, fine-grained access control, and comprehensive, tamper-evident audit trails.

## 1.3 Hospital Management Systems
A Hospital Management System (HMS) serves as the primary operational command center of a medical institution. Its primary purpose is the holistic orchestration of the patient journey from admission to discharge.

A comprehensive HMS encompasses:
1. **Front-Desk Administration:** Patient intake, unique Medical Record Number (MRN) assignment, demographic capture, and OPD queue token scheduling.
2. **Clinical Encounters:** Outpatient physician consultations, vital sign monitoring, EMR charting, and electronic prescription generation.
3. **Inpatient Ward Operations:** Bed occupancy matrix management, nurse round charting, ward transfers, and clinical handovers.
4. **Diagnostic Services:** Laboratory test order processing, specimen tracking, analyzer result entry, and radiology study reporting.
5. **Therapeutics & Interventions:** Operation theatre (OT) surgical team rosters, pre-operative safety checklists, and pharmacy medication dispensing.
6. **Financial Governance:** Charge capture, itemized patient billing, third-party insurance adjudication, and payment receipts.

While commercial HMS solutions manage these distinct functional modules with high administrative efficiency, an architectural disconnect persists between administrative data persistence and acute clinical communication.

## 1.4 Critical Diagnostic Result Communication
In clinical medicine, certain diagnostic findings indicate an immediate, life-threatening physiological decompensation requiring rapid therapeutic intervention. These laboratory abnormalities are formally defined as **critical panic values**. 

First conceptualized by Dr. George Lundberg in 1972, critical values encompass laboratory findings so significantly abnormal that they pose an immediate risk of permanent organ damage or mortality unless rapidly treated [4]. Typical examples include:
* **Severe Hyperkalemia ($K^+ > 6.0	ext{ mEq/L}$):** Disrupts cardiac resting membrane potentials, risking rapid progression to ventricular fibrillation or asystole within 30 to 60 minutes.
* **Profound Hypoglycemia ($Glucose < 40	ext{ mg/dL}$):** Risks acute neuroglycopenia, irreversible encephalopathy, seizures, and coma.
* **Critical Thrombocytopenia ($Platelets < 20,000/\mu	ext{L}$):** Creates severe risk of spontaneous intracranial hemorrhage.

Under modern international laboratory accreditation standards, including **ISO 15189:2022 / NABL 112 Clause 7.4.1.3** and **NABH 6th Edition Quality Indicators**, hospitals are mandated to establish documented policies requiring immediate notification of critical results to authorized clinical staff, verified read-back of communication accuracy, and defined escalation pathways when treating physicians are unreachable [1, 2].

## 1.5 Problem Statement
Despite the ubiquitous deployment of relational database software in hospitals, critical diagnostic communication remains an open, critical vulnerability. Standard hospital management software treats the entry of a critical lab result as a **passive, "fire-and-forget" database write**.

When a laboratory technician verifies a test containing a critical panic value, standard hospital software merely updates a database record:
```sql
UPDATE "LabOrder" SET "status" = 'Verified' WHERE "id" = 'order-123';
INSERT INTO "LabResult" ("labOrderId", "parameter", "value", "isAbnormal") 
VALUES ('order-123', 'Potassium', '6.8', true);
```
The system marks the order completed in the laboratory terminal and saves the row to disk. 

This workflow exhibits severe distributed communication failure modes:
1. **Absence of Active Clinician Alerting:** The database update is silent. The system does not actively notify the specific attending physician or duty Resident Medical Officer (RMO) responsible for that patient.
2. **Dependence on Informal Communication Side-Channels:** To fulfill accreditation rules, laboratory technicians must step outside the hospital software, attempting to alert clinical staff through informal phone calls to busy nursing stations, unmonitored WhatsApp messages, or scribbled scrap-paper notes.
3. **Absence of Verifiable Acknowledgment:** Neither phone calls nor passive database updates capture a verifiable, non-repudiable audit trail of *who* received the alert, *at what precise timestamp*, or *what* clinical corrective action was taken.
4. **Lack of Automated Escalation:** If the attending physician is scrubbing for surgery, conducting ward rounds, or in an area of poor mobile connectivity, the unacknowledged critical alert remains dormant. The conventional software has no background scheduler to detect overdue alerts and escalate them up the clinical hierarchy.

In acute clinical conditions such as severe hyperkalemia, delayed intervention directly increases preventable inpatient mortality [5]. Furthermore, Indian legal precedents have established vicarious institutional liability for medical negligence when diagnostic reporting collapses. In landmark rulings by the Supreme Court of India (*Savita Garg v. National Heart Institute (2004)* [6]), the court ruled that hospitals are vicariously liable for negligence when diagnostic departments fail to actively and demonstrably convey critical diagnostic findings to treating physicians. Merely recording abnormal results into a clinical file without verified clinician receipt does not discharge the legal duty of care.

## 1.6 Motivation
This project is driven by an engineering critique of standard academic and commercial hospital software. Many academic software engineering projects prioritize superficial breadth—implementing dozens of shallow CRUD screens—while completely neglecting core distributed systems problems of data consistency, auditability, and deterministic communication reliability.

The project, named **Dronagiri (Gandhamadana)**, is motivated by the conviction that software engineering in healthcare must resolve high-gravity operational bottlenecks rather than merely digitizing paper forms. 

The primary motivations are:
1. **Enforcing Deterministic Accountability:** To eliminate passive reporting by engineering a state machine that guarantees every critical diagnostic finding creates an active clinical task ticket requiring explicit, legally accountable physician acknowledgment.
2. **Solving the Distributed Dual-Write Problem:** To apply the **Transactional Outbox Pattern** to acute healthcare workflows, ensuring that critical medical records, accountability tickets, outbox notifications, billing adjustments, and compliance audit logs are committed within a single database transaction, preventing dual-write inconsistencies during network drops or carrier outages.
3. **Engineering Regulatory Modeling:** To translate the operational intent of **ISO 15189:2022 Clause 7.4.1.3** and **NABH 6th Edition** clinical continuity guidelines into deterministic software code [1, 2].
4. **Architectural Cohesion on a Modern Web Stack:** To demonstrate that production-grade web technologies—Next.js 16 (App Router), React 19, TypeScript, and Prisma ORM—can be architected into a resilient modular monolith that combines wide administrative hospital operations with high-reliability distributed communication patterns.

## 1.7 Objectives
The primary objective of this project is to develop and evaluate **Dronagiri**, an evidence-informed prototype Hospital Management System centered around an automated, closed-loop clinical task accountability engine.

### Primary Distributed Systems & Reliability Objectives:
1. **Implement the Transactional Outbox Pattern:** Design an atomic database persistence boundary where the verification of a critical lab result atomically commits the result record (`LabResult`), a trackable clinical task (`TaskTicket`), an outbox dispatch entry (`NotificationJob`), an itemized billing entry (`InvoiceItem`), and a compliance log (`AuditLog`) within a single database transaction (`prisma.$transaction`), eliminating distributed dual-write inconsistencies.
2. **Design a Deterministic Finite State Machine (FSM):** Model and enforce a strict clinical task lifecycle ($OPEN ightarrow ACKNOWLEDGED ightarrow IN\_PROGRESS ightarrow RESOLVED$) that mathematically forbids moving an alert directly from $OPEN$ to $RESOLVED$ without prior clinician acknowledgment.
3. **Build an Asynchronous Outbox Worker & Escalation Engine:** Implement a worker loop that atomically claims pending outbox notifications, handles transient carrier dispatch failures via exponential retry backoff, detects breached Service Level Agreement (SLA) deadlines (e.g., 10 minutes without acknowledgment), and automatically escalates accountability to higher clinical tiers (Tier 1 Attending Physician $ightarrow$ Tier 2 Duty RMO $ightarrow$ Tier 3 Chief Medical Officer / Admin).
4. **Guarantee Idempotency:** Formulate deterministic idempotency keys (`notif-{taskId}-tier{level}-{channel}`) enforced by relational database unique constraints to prevent duplicate alert delivery during retries or concurrent worker loops.

### Full-Stack Hospital Management Objectives:
5. **Develop a Multi-Tier Modular Monolith:** Implement a full-stack web application in Next.js 16 (App Router) and React 19, cleanly separating concerns across client presentation, edge middleware, REST API route handlers, and Prisma ORM data mapping.
6. **Enforce Zero-Trust Perimeter Security & RBAC:** Implement Next.js Edge Middleware for cryptographic HS256 JWT decoding, paired with in-handler Role-Based Access Control (RBAC) governing nine distinct hospital personas (`ADMIN`, `DOCTOR`, `NURSE`, `PHARMACIST`, `LAB_TECH`, `RAD_TECH`, `BILLING`, `RECEPTIONIST`, `PATIENT`).
7. **Eliminate Insecure Direct Object References (IDOR):** Implement surgical resource-level ownership validation (`isPatientOwner`) ensuring patient users can strictly query only their own personal medical dossier.
8. **Provide Subsystem Operational Views:** Construct responsive user interfaces for 20 clinical and logistical subsystem modules, establishing the broader hospital operational context within which the accountability engine functions.

### Verification and Evaluation Objectives:
9. **Execute an Evidence-Based Automated Test Suite:** Implement comprehensive unit and integration test suites using Vitest, validating state machine invariants, cryptographic token handling, patient access boundaries, and real SQLite database transaction rollbacks.
10. **Critically Audit and Report System Limitations:** Conduct an objective forensic assessment of the implementation, documenting verified vulnerabilities, concurrency bottlenecks, and the precise boundaries between implemented, verified, and simulated features.

## 1.8 Scope of the Project
To preserve academic integrity, the operational and architectural boundaries of this prototype project are explicitly qualified:

### In-Scope (Implemented and Verified):
* **Target Clinical Environment:** Modeled on the operational workflows of an Indian secondary or tertiary acute care hospital with an operational capacity of 50 to 200 inpatient beds.
* **Core Technological Boundary:** A full-stack TypeScript web application situated in the `site/` workspace, utilizing Next.js 16.2.0, React 19.0.0, Prisma ORM 6.19.3, and an embedded SQLite 3 relational database (`dev.db`).
* **Closed-Loop Engine Boundary:** Full implementation of the `TaskTicket`, `NotificationJob`, and `DeliveryAttempt` relational models, the deterministic FSM, atomic transaction boundaries upon critical lab result entry, and an asynchronous worker loop with simulated carrier dispatch.
* **Authentication & Authorization Boundary:** Stateless HS256 JWT token generation, salted password hashing using `bcryptjs` (12 rounds), Edge perimeter routing, and role-based route guards across all 33 API routes.
* **Clinical Subsystem Context:** Implementation of 20 subsystem views in the hospital command center (`site/app/hms/page.tsx`), spanning patient registration, EMR Patient 360 dossiers, doctor directories, outpatient appointment queues, emergency trauma triage, inpatient bed matrices, operating theatre schedules, laboratory investigation tracking, pharmacy catalogs, blood bank stock, and itemized billing invoices.

### Out-of-Scope (Simulated, Partial, or Planned):
* **Hardware & Physical Diagnostic Analyzers:** Direct serial (RS-232) or HL7/ASTM network integration with physical diagnostic analyzer hardware is out-of-scope; laboratory results are ingested via authenticated REST API payloads.
* **Physical Telecommunications Carriers:** Outbound cellular SMS, voice calls, or WhatsApp Business API webhooks requiring commercial telecommunications gateway accounts are simulated via an in-memory `SimulatedChannelAdapter` that models latency, delivery confirmation, and network failure injection.
* **Binary DICOM PACS Integration:** The radiology module simulates Picture Archiving and Communication System (PACS) capabilities using an HTML5 Canvas windowing engine (WW/WL) operating on 2D image assets; parsing binary DICOM Part 10 files and integrating with standard DICOM routers (C-STORE, C-FIND) is out-of-scope.
* **Enterprise Production Clustering:** Production database clustering (e.g., PostgreSQL with PgBouncer connection pooling), high-availability multi-region hosting, and formal regulatory compliance certification (e.g., official CDSCO, HIPAA, or ISO auditing) are outside the academic prototype scope.

## 1.9 Proposed Contribution
The principal contributions of this work are summarized as follows:
1. **The Closed-Loop Clinical Accountability Architecture:**
   We design, implement, and verify a closed-loop task management engine that bridges the gap between diagnostic result entry and clinical acknowledgment. By binding clinical responsibility to a verifiable finite state machine, the system eliminates the legal and operational hazards of unmonitored diagnostic reporting.
2. **Healthcare Application of the Transactional Outbox Pattern:**
   We demonstrate a practical, real-world application of the Transactional Outbox pattern within an acute healthcare context. By coupling critical lab result persistence, task creation, outbox queuing, billing generation, and compliance auditing in an atomic database transaction boundary, we prove that dual-write inconsistencies can be eliminated in hospital management software.
3. **Rigorous, Evidence-Based Verification Suite:**
   We provide an automated verification suite comprising 60 automated tests across 7 test suites, combining pure state machine validation, cryptographic security assertions, and real database integration tests that verify database constraints, rollbacks, and idempotency guarantees.
4. **Honest, Forensic Engineering Appraisal:**
   Unlike conventional academic reports that obscure system limitations under generalized success claims, this work presents a transparent, forensic technical audit detailing exact implementation metrics (20 UI views, 33 API routes, 36 database models), verified vulnerabilities (secondary collection IDOR, non-atomic pharmacy dispensing), and concrete architectural remediation pathways.

## 1.10 Organization of the Report
The remainder of this report is organized into the following eleven chapters:
* **Chapter 2 — Literature Review and Existing System:** Reviews existing literature on hospital diagnostic delays, examines conventional hospital information system architectures, and analyzes the root causes of clinical communication breakdowns.
* **Chapter 3 — Proposed System:** Details the high-level architecture of Dronagiri, introduces the conceptual model of the Closed-Loop Clinical Accountability Engine, and compares it against conventional systems.
* **Chapter 4 — System Requirements and Feasibility:** Details the functional and non-functional requirements, user personas, operational constraints, and economic/technical feasibility.
* **Chapter 5 — System Design and Architecture:** Presents the multi-tier architectural design, the 36-model relational Entity-Relationship (ER) diagram, subsystem interaction sequences, and data flow diagrams.
* **Chapter 6 — Technology Stack:** Provides an in-depth justification of the chosen technology stack, analyzing the roles of Next.js 16, React 19, TypeScript, Prisma ORM, SQLite, Jose, and Tailwind CSS v4.
* **Chapter 7 — Implementation:** Examines the concrete technical implementation of core system modules, focusing on Edge perimeter authentication, RBAC authorization, patient dossier shielding, and clinical subsystems.
* **Chapter 8 — Algorithms and Core Logic:** Formulates and analyzes the project's core algorithms: the Clinical Task Finite State Machine, the Transactional Outbox worker, exponential backoff retry scheduling, idempotency key construction, and triage heuristic matching.
* **Chapter 9 — Testing and Results:** Documents the test methodology, presents execution evidence for the 60 automated tests, reports build and static analysis metrics, and provides visual interface evidence from the running prototype.
* **Chapter 10 — Limitations and Critical Evaluation:** Conducts an honest, forensic review of system shortcomings, analyzing SQLite concurrency constraints, secondary collection IDOR leaks, non-atomic dispensing, and foreign key boundaries.
* **Chapter 11 — Future Enhancements:** Outlines concrete engineering pathways to transition the prototype to enterprise production, including PostgreSQL migration, real carrier webhooks, DICOM engine integration, and a dedicated alert task UI console.
* **Chapter 12 — Conclusion:** Concludes the report with a synthesis of project outcomes, summarizing key engineering achievements and reflections on distributed accountability in healthcare software.
