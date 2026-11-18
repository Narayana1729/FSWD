# Dronagiri — Application Package (`site`)

[![Next.js](https://img.shields.io/badge/Next.js-16.2.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Vitest](https://img.shields.io/badge/Tests-60_Passed-brightgreen?logo=vitest)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-0_Errors-4B32C3?logo=eslint)](https://eslint.org/)

This directory (`site/`) contains the complete application source code, API routes, database schemas, and automated test suites for **Dronagiri: A Closed-Loop Clinical Accountability Hospital Management System (Prototype)**.

> For comprehensive system documentation, architecture diagrams, research context, and audit findings, please refer to the primary repository documentation:  
> 🔗 **[Root README.md](../README.md)**  
> 📖 **[Academic Project Report](../docs/report/DRONAGIRI_BTECH_PROJECT_REPORT.md)**

---

## Quick Reference Commands

All commands below must be executed from within this directory (`/Users/srimannarayanadeevi/FSWD/site`):

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma ORM bindings
npx prisma generate

# 3. Synchronize database schema with SQLite (dev.db)
npx prisma db push

# 4. Seed test accounts & clinical catalog data
npx tsx prisma/seed.ts

# 5. Run automated tests (Vitest: 60 tests across 7 test suites)
npm test

# 6. Run static linter (ESLint: 0 errors, 0 warnings)
npx eslint .

# 7. Start local development server
npm run dev

# 8. Compile production build (verifies static page generation)
npm run build
```

---

## Key Subsystems & File Layout

- **`lib/closed-loop.ts`**: Core atomic transaction orchestrator for critical laboratory results.
- **`lib/task-fsm.ts`**: Deterministic Finite State Machine governing clinical acknowledgment workflows.
- **`lib/outbox-worker.ts`**: Transactional outbox polling engine with exponential backoff and tier escalation.
- **`app/api/`**: 33 Next.js Route Handlers implementing hospital REST services.
- **`components/`**: 20 modular React 19 subsystem views mounted dynamically in `app/hms/page.tsx`.
- **`prisma/schema.prisma`**: 36 relational models representing clinical, operational, and financial entities.
- **`tests/`**: Automated verification suite covering FSM logic, real SQLite transactions, JWT security, and domain services.
