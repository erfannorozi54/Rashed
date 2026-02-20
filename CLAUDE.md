# CLAUDE.md — Rashed Math School Platform

## Overview

Full-stack educational platform for a math tutoring school in Tabriz, Iran. Roles: **Student, Teacher, Admin**.

## Core Objectives

1. **Class Management (Admin):** Recurring (weekly) and ad-hoc sessions. Public vs. Restricted visibility.
2. **Student Workflow:** Browse public/assigned courses → Reserve → Pay → Enroll → access materials.
3. **Admin Oversight:** Student rosters, attendance tracking, payment status and debt management.
4. **Teacher Access:** View class schedules, participant lists, and monitor student progress.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| Database | PostgreSQL 15 (Docker) via Prisma 7 ORM |
| Auth | NextAuth 4 + bcryptjs + OTP via SMS |
| Styling | Tailwind CSS 4 + clsx + tailwind-merge |
| Icons | Lucide React |
| Math | KaTeX + remark-math + rehype-katex |
| Calendar | moment-jalaali (Persian/Jalali dates) |

---

## Setup

```bash
docker-compose up -d          # Start PostgreSQL
npm install
npx prisma migrate dev
npm run dev                   # localhost:3000
```

**Required `.env`:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rashed_db"
NEXTAUTH_SECRET="supersecretkeychangeinproduction"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Project Structure

```
src/
├── app/
│   ├── api/              # auth/, users/, classes/, sessions/, assignments/, attendance/, blogs/
│   ├── auth/             # login, register pages
│   ├── dashboard/        # admin/, teacher/, student/
│   └── blogs/            # public blog pages
├── components/
│   ├── ui/               # Button, Card, Input, Label, Textarea, PersianDatePicker, PersianCalendar
│   └── MarkdownRenderer.tsx, DashboardHeader.tsx, Providers.tsx
├── lib/                  # prisma.ts, jalali-utils.ts, utils.ts, services/otp.service.ts
└── middleware.ts         # protects /dashboard/*
```

Path alias: `@/*` → `src/*`

---

## Database Models

| Model | Purpose |
|-------|---------|
| `User` | All users — role, phone, email, password, OTP |
| `Class` | Course definitions |
| `ClassTeacher` / `ClassEnrollment` | Many-to-many joins |
| `Session` | Class meetings (SCHEDULED or COMPENSATORY) |
| `SessionContent` | Files/materials per session |
| `Assignment` + `Submission` | Tasks with grade/feedback |
| `Attendance` | Per-session records (PRESENT/ABSENT/LATE/EXCUSED) |
| `Blog` | Teacher-authored posts |

---

## Auth

- Phone + password (bcrypt) or OTP (6-digit, 5-min TTL)
- NextAuth JWT session contains: `id`, `role`, `name`, `phone`
- Middleware protects all `/dashboard/*` routes
- OTP SMS is currently **mocked** (logs to console only)

---

## Styling & Architecture Rules

- **Tailwind utility-first only** — no custom CSS/SCSS, no `@apply`
- **Mobile-first** — base styles for mobile, scale up with `sm:` / `md:` / `lg:`
- **Conditional classes** — use `clsx` + `tailwind-merge`, never template literal interpolation
- **No hardcoded colors** — use Tailwind config variables, never `bg-[#hex]`
- **Components live in `src/components/ui/`** — always check before creating new ones; extract if a pattern repeats 3+ times
- **All components accept a `className` prop** merged via `tailwind-merge`
- **Accessibility** — `focus-visible:ring-*` on all interactive elements; use semantic HTML

---

## Dev Notes

```bash
npx prisma studio                        # Browse DB
npx prisma migrate dev --name <name>     # New migration
npx prisma generate                      # After schema changes
```
