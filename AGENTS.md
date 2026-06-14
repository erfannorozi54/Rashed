# AGENTS.md — Rashed

Full-stack educational platform (math school). Next.js 16 App Router, React 19, TypeScript, PostgreSQL via Prisma with PrismaPg adapter + raw `pg` pool.

---

## Setup

```bash
docker-compose up -d db       # PostgreSQL on port 5432
npm install
npx prisma migrate dev
npm run dev                   # dev server on port 3001
```

`.env` — see `.env.example`. `POSTGRES_PASSWORD` is required by `docker-compose.yml`.

---

## Prisma — Non-Standard

Uses **PrismaPg adapter** with raw `pg` Pool (`src/lib/prisma.ts`). Import `prisma` from `@/lib/prisma` — never instantiate `PrismaClient` elsewhere. Workflow: edit schema → `npx prisma migrate dev --name X` → `npx prisma generate`. Seed: `tsx prisma/seed.ts`. Browser: `npx prisma studio`.

---

## Auth & Middleware

- NextAuth 4 (credentials: phone+bcrypt or OTP). Route: `src/app/api/auth/[...nextauth]/route.ts`.
- Middleware at `src/proxy.ts` protects `/dashboard/*` via `withAuth`, redirects to `/auth/login`.
- JWT extended (`src/types/next-auth.d.ts`): `id`, `role`, `email`, `name`.
- OTP SMS mocked in dev (logs to console).

---

## Key Conventions

### Data fetching
- API: `src/app/api/[resource]/route.ts` (collection) and `[resource]/[id]/route.ts` (item).
- Auth pattern: `getServerSession` → check `session.user.role` → `NextResponse.json()`.
- Client pages: `useEffect` + `fetch` or server components — match surrounding page.

### Components
- Shared UI in `src/components/ui/` — check here first.
- Accept `className` prop merged via `tailwind-merge`. Conditional classes: `clsx` + `tailwind-merge`. No template literals, no `@apply`, no custom CSS.
- Dates: `@/lib/jalali-utils` only. Never raw `Date` display.

### Routing
- Dashboards: `src/app/dashboard/[role]/` (admin, teacher, student).
- Public: `src/app/auth/`, `src/app/blogs/`, `src/app/classes/`.

### Styles
- Tailwind CSS 4 via `@tailwindcss/postcss`. Utility classes only in JSX.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server (port 3001) |
| `npm run build` | Production build |
| `npm run lint` | TypeScript check only (`tsc --noEmit` — no ESLint) |
| `npx prisma migrate dev --name X` | Create & apply migration |
| `npx prisma generate` | Regenerate client |
| `npx prisma db seed` | Run seed (creates admin user) |

No test framework configured.

---

## Schema

See `prisma/schema.prisma` — 17 models, 11 enums. Notable models beyond core CRUD: `TeacherAvailability`, `AvailabilityException`, `RefundRequest`, `SessionReschedule`, `TeacherSpecialization`, `PrivateBooking`.

Path alias: `@/*` → `src/*`.

---

## VPS Deployment

SSH alias: `ssh vps-ir` (194.60.230.210). App at `/var/www/rashed`.
**VPS has no internet** — use git bundle transfer.

```bash
# Local
git bundle create /tmp/rashed-update.bundle HEAD
scp /tmp/rashed-update.bundle vps-ir:/tmp/

# VPS
ssh vps-ir "cd /var/www/rashed && git pull /tmp/rashed-update.bundle main"
ssh vps-ir "docker cp /var/www/rashed/src rashed_app:/app/"
ssh vps-ir "docker exec rashed_app npm run build"
ssh vps-ir "cd /var/www/rashed && docker compose restart app"
```

If new deps added, also copy `package*.json` and run `npm install` in container (set Liara registry first). Logs: `docker compose logs app --tail=50`. Rollback: `git reset --hard HEAD~1` then rebuild. `.env` not in git — restore manually if re-cloning.
