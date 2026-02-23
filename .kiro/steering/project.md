---
trigger: always_on
---

# Rashed Math School Platform

Full-stack educational platform for a math tutoring school in Tabriz, Iran. Roles: Student, Teacher, Admin.

## Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Database:** PostgreSQL 15 via Prisma 7 (Docker)
- **Auth:** NextAuth 4 + bcryptjs + OTP (mocked SMS)
- **Styling:** Tailwind CSS 4 + clsx + tailwind-merge
- **Icons:** Lucide React
- **Dates:** moment-jalaali (Persian/Jalali)
- **Math:** KaTeX + remark-math + rehype-katex

## Structure
```
src/
├── app/api/          # REST routes: auth, users, classes, sessions, assignments, attendance, blogs
├── app/dashboard/    # admin/, teacher/, student/ pages
├── app/auth/         # login, register
├── components/ui/    # shared UI components
└── lib/              # prisma.ts, jalali-utils.ts, utils.ts, services/otp.service.ts
```
Path alias: `@/*` → `src/*`

## Auth
- JWT session contains: `id`, `role`, `name`, `phone`
- `middleware.ts` protects all `/dashboard/*` routes
