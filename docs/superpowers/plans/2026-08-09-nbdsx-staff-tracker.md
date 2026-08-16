# NBDSxStaffTracker Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Production-ready Next.js staff tracker shell with setup wizard, Discord admin auth, and mock dashboard.

**Architecture:** File-based setup config until MySQL is connected; Auth.js with runtime Discord credentials; Prisma AppSettings; App Router pages with shared shell.

**Tech Stack:** Next.js, Radix UI, Tailwind, Auth.js, Prisma, MySQL, next-themes

---

### Task 1: Core libs & Prisma
- [x] Config store, crypto, db, mock data, auth, schema

### Task 2: Setup wizard + API
- [x] 3-step wizard UI and routes

### Task 3: Shell UI
- [x] Navbar, theme, dashboard, placeholders

### Task 4: Guards
- [x] Middleware / layout redirects for setup & auth
