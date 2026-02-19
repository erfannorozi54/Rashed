# CLAUDE.md — Rashed Math School Platform

## Project Overview

**Rashed** (آموزشگاه ریاضی راشد تبریز) is a full-stack educational platform for a math tutoring school in Tabriz, Iran. It supports:

- Private math and YOS (Turkish university entrance exam) tutoring
- Multi-role system: Student, Teacher, Admin
- Attendance tracking, assignment submission, scheduling
- Blog publishing with LaTeX/math support
- Persian (Jalali) calendar integration
- OTP-based and password-based authentication

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
| Markdown | react-markdown |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env  # or set variables manually (see below)

# 4. Run Prisma migrations
npx prisma migrate dev

# 5. Start dev server
npm run dev
```

### Required Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rashed_db"
NEXTAUTH_SECRET="supersecretkeychangeinproduction"
NEXTAUTH_URL="http://localhost:3000"
```

### NPM Scripts

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Project Structure

```
src/
├── app/
│   ├── api/                  # API routes (REST endpoints)
│   │   ├── auth/             # Authentication (NextAuth, OTP)
│   │   ├── users/            # User management
│   │   ├── classes/          # Class CRUD
│   │   ├── sessions/         # Scheduled & compensatory sessions
│   │   ├── assignments/      # Assignments
│   │   ├── attendance/       # Attendance tracking
│   │   └── blogs/            # Blog posts
│   ├── auth/                 # Login & register pages
│   ├── dashboard/
│   │   ├── admin/            # Admin dashboard (users, classes, etc.)
│   │   ├── teacher/          # Teacher dashboard (classes, blog)
│   │   └── student/          # Student dashboard (schedule, assignments)
│   ├── blogs/                # Public blog pages
│   ├── page.tsx              # Home page (landing)
│   └── layout.tsx            # Root layout (RTL, Persian font)
├── components/
│   ├── ui/                   # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Label.tsx
│   │   ├── Textarea.tsx
│   │   ├── PersianDatePicker.tsx
│   │   └── PersianCalendar.tsx
│   ├── layout/
│   │   └── DashboardHeader.tsx
│   ├── MarkdownRenderer.tsx  # Markdown + KaTeX math rendering
│   ├── Providers.tsx         # NextAuth session provider
│   ├── AnimatedBackground.tsx
│   └── SessionTypeBadge.tsx
├── lib/
│   ├── services/
│   │   └── otp.service.ts    # OTP generation & validation
│   ├── jalali-utils.ts       # Persian/Jalali date helpers
│   ├── prisma.ts             # Prisma client singleton
│   └── utils.ts              # General utilities (cn, etc.)
├── config/
│   └── site.ts               # Site metadata & SEO config
├── types/
│   └── next-auth.d.ts        # NextAuth type extensions
└── middleware.ts             # Auth middleware (protects /dashboard/*)
```

---

## Database Schema

**Enums:** `Role` (STUDENT, TEACHER, ADMIN), `AttendanceStatus` (PRESENT, ABSENT, LATE, EXCUSED), `SessionType` (SCHEDULED, COMPENSATORY)

**Models:**

| Model | Purpose |
|-------|---------|
| `User` | All users with role, phone, email, password, OTP fields |
| `Class` | Subject/course definitions |
| `ClassTeacher` | Many-to-many: teachers ↔ classes |
| `ClassEnrollment` | Many-to-many: students ↔ classes |
| `Session` | Individual class meetings (scheduled or compensatory) |
| `SessionContent` | Files/materials attached to sessions |
| `Assignment` | Tasks assigned per session |
| `Submission` | Student submissions for assignments (with grade/feedback) |
| `Attendance` | Per-session attendance records |
| `Blog` | Teacher-authored blog posts |

Schema file: `prisma/schema.prisma`

---

## Authentication

- **Credentials:** Phone + password (hashed with bcryptjs)
- **OTP:** 6-digit, 5-minute expiry, SMS-based
- **Provider:** NextAuth (`[...nextauth]/route.ts`)
- **Middleware:** `src/middleware.ts` — protects `/dashboard/*`, redirects unauthenticated users
- **Roles:** STUDENT, TEACHER, ADMIN — stored in JWT and session

**Auth API endpoints:**
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/login-otp`
- NextAuth handles `/api/auth/[...nextauth]`

---

## API Endpoints

| Resource | Methods | Path |
|----------|---------|------|
| Users | GET, POST | `/api/users` |
| User | GET, PUT | `/api/users/[id]` |
| Classes | GET, POST | `/api/classes` |
| Class | GET, PUT | `/api/classes/[id]` |
| Sessions | GET, POST | `/api/sessions` |
| Session | GET, PUT | `/api/sessions/[sessionId]` |
| Compensatory | POST | `/api/sessions/compensatory` |
| Assignments | GET, POST | `/api/assignments` |
| Attendance | GET, POST | `/api/attendance` |
| Blogs | GET, POST | `/api/blogs` |

---

## Path Aliases

- `@/*` → `src/*`

---

## Persian / RTL Support

- Root layout sets `dir="rtl"` and `lang="fa"`
- Font: **Vazirmatn** (woff2 files in `public/fonts/`)
- Calendar: `moment-jalaali` + `src/lib/jalali-utils.ts`
- Components: `PersianCalendar.tsx`, `PersianDatePicker.tsx`

---

## Math / Markdown Rendering

`MarkdownRenderer.tsx` renders markdown with LaTeX math support via:
- `remark-math` → parses `$...$` and `$$...$$`
- `rehype-katex` + KaTeX CSS → renders math expressions

---

## SEO

- Site config: `src/config/site.ts`
- Sitemap: `src/app/sitemap.ts`
- Robots: `public/robots.txt`
- Manifest: `src/app/manifest.ts`
- Full SEO guide: `SEO_GUIDE.md`

---

## Docker

PostgreSQL container:
```yaml
image: postgres:15-alpine
container: rashed_postgres
database: rashed_db
user/pass: postgres/postgres
port: 5432
```

```bash
docker-compose up -d    # Start
docker-compose down     # Stop
```

---

## Styling & Architecture Rules

> Source: `.agent/rules/site-stle.md` (always-on rule)

### Tailwind CSS
- **Utility-first only** — do not write custom `.css` or `.scss` files unless absolutely necessary for complex animations Tailwind cannot handle
- **No `@apply`** — extract repeated patterns into reusable components instead
- **Mobile-first responsiveness** — write base styles for mobile, then use `sm:`, `md:`, `lg:`, `xl:` breakpoints for larger screens
- **Class ordering:** Layout → Box Model → Typography → Visuals → Misc
- **Conditional classes:** use `clsx` / `tailwind-merge`, avoid template literal interpolation for class names
- **Colors:** use Tailwind config variables (e.g., `bg-primary-500`), never hardcode hex values (e.g., `bg-[#3b82f6]`)

### Component Architecture
- **Atomic design** — break UI into the smallest reusable units
- **Location:** all reusable UI elements live in `src/components/ui/`
- **Flexibility:** components must accept a `className` prop (merged via `tailwind-merge`) for extension
- **No duplication:** if a pattern appears 3+ times, extract it into a component; always check `src/components/ui/` before creating new elements
- **Composition:** use children props or slot patterns for composable components

### Accessibility
- All interactive elements must have visible `focus-visible:ring-*` states
- Use semantic HTML (`<nav>`, `<main>`, `<aside>`, `<button>`) combined with Tailwind classes

---

## Development Notes

- Use `npx prisma studio` to browse the database visually
- Use `npx prisma migrate dev --name <name>` to create new migrations
- Use `npx prisma generate` after schema changes
- NextAuth session contains: `id`, `role`, `name`, `phone`
- All dashboard routes require authentication (enforced by middleware)
- Admin can manage all users, teachers, students, classes
- Teachers can create sessions, assignments, and blog posts
- Students can view schedule, submit assignments, and track attendance
