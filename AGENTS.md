# AGENTS.md — Rashed

Full-stack educational platform for a math school. Next.js 16 (App Router), React 19, TypeScript, PostgreSQL via Prisma.

---

## Setup

```bash
docker-compose up -d          # PostgreSQL (port 5432) + app container
npm install
npx prisma migrate dev
npm run dev                   # dev server on port 3001
```

**`POSTGRES_PASSWORD`** must be set in `.env` (read by `docker-compose.yml`). Full `.env` (see `.env.example`):

```
POSTGRES_PASSWORD=<postgres password>
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/rashed_db"
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL="http://localhost:3001"
SMSIR_API_KEY=<sms api key>
SMSIR_TEMPLATE_ID=<sms template>
ADMIN_PHONE=<admin phone for seed>
ADMIN_PASSWORD=<admin password for seed>
ADMIN_NAME=فاطمه مقصودی
AQAYEPARDAKHT_PIN=<payment gateway>
```

---

## Prisma — Non-Standard Setup

- Uses **PrismaPg adapter** with raw `pg` pool (`src/lib/prisma.ts`). Import `prisma` from `@/lib/prisma`, never instantiate `PrismaClient` elsewhere.
- Schema: `prisma/schema.prisma`. New types/models go there.
- Workflow: edit schema → `npx prisma migrate dev --name <name>` → `npx prisma generate`.
- Seed script at `prisma/seed.ts` creates the initial admin user.
- DB browser: `npx prisma studio`.

---

## Auth & Middleware

- NextAuth 4, credentials provider (phone + bcrypt password) or OTP. Auth route: `src/app/api/auth/[...nextauth]/route.ts`.
- Middleware (`src/proxy.ts`) protects `/dashboard/*`. Matches on `withAuth`, redirects unauthenticated to `/auth/login`.
- JWT extended via `src/types/next-auth.d.ts`: user has `id`, `role`, `email`, `name`.
- OTP SMS is mocked during dev (logs to console).

---

## Key Conventions

### Data fetching
- API routes: `src/app/api/[resource]/route.ts` (collection) and `[resource]/[id]/route.ts` (item).
- API auth pattern: `getServerSession` → check `session.user.role` → return `NextResponse.json()`.
- Pages fetch inline with `useEffect` + `fetch` or as server components — match the surrounding page.

### Components
- Reusable UI in `src/components/ui/` — always check here before creating new components.
- Every component accepts `className` merged via `tailwind-merge`.
- Use `clsx` + `tailwind-merge` for conditional classes. No template literals, no `@apply`, no custom CSS.
- Dates: use `@/lib/jalali-utils` exclusively. Never display raw JavaScript dates.

### Routing
- Pages under `src/app/dashboard/[role]/` (admin, teacher, student).
- Public pages: `src/app/auth/`, `src/app/blogs/`, `src/app/classes/`.

### Styles
- Tailwind CSS 4 via `@tailwindcss/postcss`. All utility classes in JSX.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server (port 3001) |
| `npm run build` | Production build |
| `npm run lint` | TypeScript only (`tsc --noEmit`). No eslint script. |
| `npx prisma migrate dev --name X` | Create & apply migration |
| `npx prisma generate` | Regenerate client (after schema changes) |
| `npx prisma db seed` | Run seed (creates admin user) |

No test framework configured.

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

## VPS Deployment

SSH alias: `ssh vps-ir`. VPS at 194.60.230.210, project at `/var/www/rashed`.
**VPS has no internet** — use git bundle transfer.

```bash
# Local: create bundle
git add . && git commit -m "msg"
git bundle create /tmp/rashed-update.bundle HEAD
scp /tmp/rashed-update.bundle vps-ir:/tmp/

# VPS: apply bundle
ssh vps-ir "cd /var/www/rashed && git pull /tmp/rashed-update.bundle main"

# Copy source into container & rebuild
ssh vps-ir "docker cp /var/www/rashed/src rashed_app:/app/"
ssh vps-ir "docker exec rashed_app npm run build"
ssh vps-ir "cd /var/www/rashed && docker compose restart app"
```

If new dependencies added, also copy `package*.json` into container and run `npm install` (set Liara registry first).

- Logs: `ssh vps-ir "docker compose logs app --tail=50"`
- Rollback: `ssh vps-ir "cd /var/www/rashed && git reset --hard HEAD~1"` then rebuild
- `.env` is not in git — restore manually if re-cloning