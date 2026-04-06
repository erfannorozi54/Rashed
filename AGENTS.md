# AGENTS.md — Rashed Math School Platform

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

## Project Consistency

**Before writing any code, read the existing similar files to understand and match the established patterns.**

### Structure & Files
- New API routes follow `src/app/api/[resource]/route.ts` and `src/app/api/[resource]/[id]/route.ts`
- New pages go under `src/app/dashboard/[role]/` matching the admin/teacher/student structure
- New shared components go in `src/components/ui/`; feature-specific components go in `src/components/`

### API & Data Fetching
- API handlers use the same auth pattern: get session via `getServerSession`, check role, return `NextResponse.json()`
- Client pages fetch data directly in the component using `useEffect` + `fetch`, or as a server component — match what the surrounding pages do
- Error and loading states must be handled consistently with existing pages

### UI Components
- **Always reuse existing components** from `src/components/ui/` (Button, Card, Input, Label, Textarea, PersianDatePicker, PersianCalendar)
- **If a needed component doesn't exist**, build it as a reusable component in `src/components/ui/` and use it everywhere — never write one-off inline UI for something that will appear more than once
- Match the visual style, spacing, and layout of existing dashboard pages for the same role
- Use `SessionTypeBadge` for session types, `DashboardHeader` for page headers, `MarkdownRenderer` for any markdown content
- Use `jalali-utils.ts` for all date formatting and logic — never use raw `Date` methods for display

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

## VPS Deployment

- VPS SSH alias: `ssh vps-ir` (194.60.230.210)
- Project path on VPS: `/var/www/rashed`
- Repo cloned via HTTPS: `https://github.com/erfannorozi54/Rashed.git`
- `.env` file must exist at `/var/www/rashed/.env` (not in git — restore manually if re-cloning)

### VPS Constraints

- No internet access (use Liara mirror: `https://package-mirror.liara.ir/repository/npm/`)
- Existing Docker image with dependencies installed
- Updates are temporary (lost on container rebuild)

### Update Process

**1. Commit Local Changes**
```bash
cd /home/erfan/Projects/Rashed
git add .
git commit -m "Description"
```

**2. Create & Transfer Git Bundle**
```bash
git bundle create /tmp/rashed-update.bundle HEAD
scp /tmp/rashed-update.bundle vps-ir:/tmp/
```

**3. Update VPS Code**
```bash
ssh vps-ir "cd /var/www/rashed && git pull /tmp/rashed-update.bundle main"
```

**4. Copy to Container & Rebuild**
```bash
ssh vps-ir "docker cp /var/www/rashed/src rashed_app:/app/"
ssh vps-ir "docker exec rashed_app npm run build"
ssh vps-ir "cd /var/www/rashed && docker compose restart app"
```

**5. If New Dependencies Added**
```bash
ssh vps-ir "docker cp /var/www/rashed/package*.json rashed_app:/app/"
ssh vps-ir "docker exec rashed_app npm config set registry https://package-mirror.liara.ir/repository/npm/ --global"
ssh vps-ir "docker exec rashed_app npm install"
# Then repeat step 4
```

**Troubleshooting:**
- Check logs: `ssh vps-ir "docker compose logs app --tail=50"`
- Rollback: `ssh vps-ir "cd /var/www/rashed && git reset --hard HEAD~1"` then repeat step 4

---

## Dev Notes

```bash
npx prisma studio                        # Browse DB
npx prisma migrate dev --name <name>     # New migration
npx prisma generate                      # After schema changes
```
