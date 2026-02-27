# Rashed Math School Platform

Full-stack educational platform for a math tutoring school in Tabriz, Iran. Roles: **Student, Teacher, Admin**.

## Core Objectives

1. **Class Management (Admin):** Recurring (weekly) and ad-hoc sessions. Public vs. Restricted visibility.
2. **Student Workflow:** Browse public/assigned courses → Reserve → Pay → Enroll → access materials.
3. **Admin Oversight:** Student rosters, attendance tracking, payment status and debt management.
4. **Teacher Access:** View class schedules, participant lists, and monitor student progress.

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

## Auth

- Phone + password (bcrypt) or OTP (6-digit, 5-min TTL)
- NextAuth JWT session contains: `id`, `role`, `name`, `phone`
- Middleware protects all `/dashboard/*` routes
- OTP SMS is currently **mocked** (logs to console only)
