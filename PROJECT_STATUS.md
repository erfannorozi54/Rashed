# Rashed Platform — Project Status

> Last updated: 2026-02-20

---

## Summary

| Feature Area | Status | Notes |
|---|---|---|
| Authentication | ✅ Substantial | SMS is mocked; minor OTP-login session bug |
| User Management | 🟡 Partial | No delete, no profile edit, no admin-created users |
| Class Management | 🟡 Partial | No edit/delete, no enrollment API, no visibility toggle |
| Session Scheduling | ✅ Complete | Manual + auto-generation, compensatory, edit/delete |
| Student Enrollment Flow | ❌ Not Implemented | DB schema exists; no API, no UI, no payment flow |
| Assignment Management | 🔴 Skeletal | Students can view only; no create/submit/grade |
| Attendance Tracking | ✅ Complete | Teacher mark UI, admin view, student view |
| Blog Publishing | ✅ Mostly Complete | Math/LaTeX works; no edit/delete, no drafts |
| Payment / Financial | ❌ Not Implemented | No model, no API, no UI |
| Admin Dashboard | ✅ Mostly Complete | Read-only for classes/enrollments |
| Teacher Dashboard | ✅ Mostly Complete | No assignment creation; blog count hardcoded |
| Student Dashboard | ✅ Mostly Complete | No submission UI, no grade/feedback view |
| Persian/Jalali Calendar | ✅ Complete | Full calendar component, date picker, utility library |
| Public Course Discovery | ❌ Not Implemented | Home page is static marketing only |
| Notifications / SMS OTP | 🟡 Partial | Logic complete; no real SMS provider connected |

---

## Feature Details

### ✅ Authentication
**Complete — with caveats**

- Password login: NextAuth CredentialsProvider + bcrypt. ✅
- OTP login: send OTP → validate → NextAuth signIn. ✅
- OTP registration: 2-step flow (phone verify → set password). ✅
- JWT session embeds `id` and `role`. ✅
- Middleware protects all `/dashboard/*` routes. ✅
- **Bug:** OTP-only login calls `signIn` with `password: "OTP_LOGIN"` which fails bcrypt check. Works in practice because the code redirects regardless, but is architecturally fragile. Users without a password cannot reliably create a session.
- **Missing:** `OTPService.sendSMS()` is mocked — only logs to server console. No real SMS provider (Kavenegar, Melipayamak, etc.) is integrated.

---

### 🟡 User Management
**Partial**

- List all users (with role filter): ✅ Admin/Teacher
- View per-user detail with stats: ✅ Admin
- Change user role: ✅ Admin (inline dropdown)
- Create user: ❌ No admin-side create UI; only via registration flow
- Delete user: ❌ No endpoint or UI
- Edit profile (name, phone, email, password): ❌ No endpoint

---

### 🟡 Class Management
**Partial**

- Create class: ✅ Teacher (with optional bulk session scheduling)
- List classes (role-aware): ✅
- View class detail: ✅ Teachers, enrolled students, admins
- Edit class (name, description): ❌ No `PATCH /api/classes/[id]` endpoint
- Delete class: ❌ No endpoint
- Visibility toggle (Public/Restricted): ❌ No `isPublic` field on `Class` model; all classes are effectively private
- Enroll/unenroll a student via API: ❌ No enrollment management endpoint; records must be created directly in the DB

---

### ✅ Session Scheduling
**Complete**

- Create scheduled session (manual): ✅
- Auto-generate sessions by weekday + count + start date: ✅ (Persian calendar aware)
- Create compensatory session: ✅ Separate endpoint + COMPENSATORY badge
- Edit session (title, description, date): ✅
- Delete session: ✅
- Session content/materials: ✅ Attached at creation; visible to students

---

### ❌ Student Enrollment Flow
**Not Implemented**

The `ClassEnrollment` table exists in the DB schema, but:
- No `POST /api/classes/[id]/enroll` or equivalent endpoint
- No reservation or payment concept anywhere in the codebase
- No public course catalog to browse and enroll from
- Student classes page tells users to "contact the school admin"
- Enrollment records can only be created via Prisma Studio or raw SQL

**What needs to be built:**
1. Public course discovery page (list public classes with details)
2. Reserve → Pay → Enroll API flow
3. Admin UI to manage enrollments manually
4. Payment model and endpoints

---

### 🔴 Assignment Management
**Skeletal**

- DB schema: `Assignment` and `Submission` models with grade/feedback fields ✅
- Student can view assignments with due dates: ✅
- `GET /api/assignments` for students (with `?status=pending`): ✅
- Create assignment (teacher): ❌ No `POST /api/assignments`
- Submit assignment (student): ❌ No submission endpoint or UI
- Grade/feedback (teacher): ❌ No endpoint
- View submission (teacher): ❌ No endpoint

**What needs to be built:**
1. `POST /api/assignments` — teacher creates assignment for a session
2. `POST /api/assignments/[id]/submit` — student submits (text + optional file)
3. `PATCH /api/assignments/[id]/submissions/[sid]` — teacher grades and adds feedback
4. Teacher UI: assignment creation form on class detail page
5. Student UI: submission form on class detail page
6. Teacher/student UI: grade and feedback display

---

### ✅ Attendance Tracking
**Complete**

- Teacher marks attendance inline on class detail page (PRESENT / ABSENT / clear): ✅
- Bulk upsert via `POST /api/attendance`: ✅
- Admin user detail shows per-class attendance stats (present/absent/unmarked/rate): ✅
- Admin class detail shows per-student attendance rates: ✅
- Student class detail shows own attendance status per past session: ✅
- **Minor gap:** LATE and EXCUSED statuses exist in DB enum but the teacher UI only exposes PRESENT/ABSENT.

---

### ✅ Blog Publishing
**Mostly Complete**

- Teacher Markdown editor with live preview: ✅
- LaTeX math via `remark-math` + `rehype-katex` (`$...$` and `$$...$$`): ✅
- Public blog listing at `/blogs`: ✅
- Public blog detail at `/blogs/[id]`: ✅
- Edit blog: ❌ No `PATCH /api/blogs`
- Delete blog: ❌ No `DELETE /api/blogs`
- Draft/publish status: ❌ All posts are immediately public

---

### ❌ Payment / Financial Tracking
**Not Implemented**

- No `Payment` or `Debt` model in `prisma/schema.prisma`
- No payment-related API endpoints
- No UI for fees, payments, or outstanding balances
- Entirely absent from the codebase

**What needs to be built:**
1. `Payment` model (student, class, amount, status, date, notes)
2. Admin endpoints: record payment, view payment history, calculate debt
3. Admin UI: financial overview, per-student payment status
4. Integration with enrollment flow (pay to enroll)

---

### ✅ Admin Dashboard
**Mostly Complete**

- Overview stats (user counts by role, class count): ✅
- Full user table with inline role-change: ✅
- Filtered user lists (students, teachers, admins) with links to detail: ✅
- Per-user detail: personal info, class stats, attendance breakdown, recent activity: ✅
- Class grid: ✅
- Class detail: student roster with attendance rates, sessions with attendance counts: ✅
- **Missing:** No enrollment management UI (add/remove student from class)
- **Missing:** No ability to create, edit, or delete classes/sessions from the admin panel

---

### ✅ Teacher Dashboard
**Mostly Complete**

- Overview with links to classes and blog: ✅
- Class list (taught classes): ✅
- Class creation with manual and auto-scheduled sessions: ✅
- Class detail: student roster, sessions, inline attendance marking, session edit/delete, compensatory session creation: ✅
- Blog creation with Markdown + live math preview: ✅
- **Missing:** No assignment creation form
- **Missing:** No view of student submissions or progress
- **Bug:** Main teacher page shows blog count as hardcoded `"0"` — not fetched from API
- **Bug:** "ایجاد کلاس" button on main teacher page has no `href`

---

### ✅ Student Dashboard
**Mostly Complete**

- Overview stats: active classes, pending assignments, upcoming sessions (next 7 days): ✅
- Enrolled class list: ✅
- Class detail: upcoming sessions, past sessions with own attendance, downloadable materials, assignment list with due dates: ✅
- Persian calendar schedule view with per-day session detail panel: ✅
- **Missing:** Assignment submission form
- **Missing:** Grade and feedback view
- **Missing:** Profile management (edit name, phone, password)

---

### ✅ Persian/Jalali Calendar
**Complete**

- `moment-jalaali` integrated throughout: ✅
- `src/lib/jalali-utils.ts`: 15+ utility functions (format, parse, compare, relative time): ✅
- `PersianCalendar.tsx`: full calendar grid, month navigation, Saturday-first week, session indicators by type: ✅
- `PersianDatePicker.tsx`: inline dropdown Jalali date picker for forms: ✅
- Root layout: `dir="rtl"`, `lang="fa"`, Vazirmatn font: ✅

---

### ❌ Public Course Discovery
**Not Implemented**

- Home page (`/`) is a static marketing page with hardcoded course-type cards
- No dynamic class listing fetched from the database
- No public page showing real classes, schedules, teacher info, or enrollment option
- Only public content pages: `/`, `/blogs`, `/blogs/[id]`

---

### 🟡 Notifications / SMS OTP
**Partial**

- OTP generation (6-digit, secure random): ✅
- OTP stored on `User` with 5-minute TTL and attempt counter: ✅
- OTP validation (expiry check, attempt tracking): ✅
- SMS delivery: ❌ `OTPService.sendSMS()` is a mock that only logs to console. The code has a commented-out placeholder for a real HTTP SMS API call.
- No other notification system (email, push, in-app): ❌

---

## Known Bugs

| Location | Description |
|---|---|
| `src/app/api/auth/login-otp` + login page | OTP login calls `signIn("credentials", {password: "OTP_LOGIN"})` which fails bcrypt. Works by ignoring the error and redirecting, but breaks for users with no password set. |
| `src/app/dashboard/teacher/page.tsx` | Blog count displayed as hardcoded `"0"`, not fetched from API. |
| `src/app/dashboard/teacher/page.tsx` | "ایجاد کلاس" button is missing its `href` link. |
| `src/app/api/auth/verify-otp` | Admin role is granted by hardcoded phone number (`"REDACTED"`). All other users become STUDENT. There is no way to register as TEACHER via the normal flow. |
| `src/app/api/assignments/route.ts` | `GET` for TEACHER returns an empty array with a comment "for now". Teachers cannot see assignments through the API. |

---

## What Needs to Be Built (Priority Order)

1. **Student Enrollment API + UI** — core workflow is entirely missing
2. **Payment / Financial model** — needed for enrollment flow and admin oversight
3. **Assignment create/submit/grade** — DB schema is ready; all endpoints and UI missing
4. **Public course discovery page** — static home page shows no real data
5. **Class edit/delete endpoints** — teachers cannot modify classes after creation
6. **Real SMS integration** — OTP codes are invisible to end users
7. **Blog edit/delete** — teachers cannot correct published posts
8. **LATE/EXCUSED attendance** — enum values exist but not exposed in UI
9. **User profile edit** — students/teachers cannot update their own info
10. **Fix OTP login session bug** — fragile architecture for passwordless users
