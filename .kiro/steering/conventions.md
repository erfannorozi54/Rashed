# Code Conventions

## Before Writing Code

**Read existing similar files first to understand and match the established patterns.**

## API Routes

- Follow `src/app/api/[resource]/route.ts` and `src/app/api/[resource]/[id]/route.ts`
- Auth pattern: `getServerSession` → check role → `NextResponse.json()`
- Client pages fetch data with `useEffect` + `fetch`, or as server components — match surrounding pages
- Always handle loading and error states consistently with existing pages

## Pages

- New pages go under `src/app/dashboard/[role]/` matching the admin/teacher/student structure
- New shared components go in `src/components/ui/`; feature-specific in `src/components/`

## Components

- **Always reuse from `src/components/ui/`** (Button, Card, Input, Label, Textarea, PersianDatePicker, PersianCalendar)
- **If a needed component doesn't exist**, build it as a reusable component in `src/components/ui/` — never write one-off inline UI for something that appears more than once
- Extract into `src/components/ui/` if a pattern repeats 3+ times
- Use `DashboardHeader` for page headers, `SessionTypeBadge` for session types, `MarkdownRenderer` for markdown content
- All components accept a `className` prop merged via `tailwind-merge`
- Match the visual style, spacing, and layout of existing dashboard pages for the same role

## Dates

- Use `jalali-utils.ts` for **all** date formatting and logic — never use raw `Date` methods for display

## Styling

- **Tailwind utility-first only** — no custom CSS/SCSS, no `@apply`
- **Mobile-first** — base styles for mobile, scale up with `sm:` / `md:` / `lg:`
- **Conditional classes** — use `clsx` + `tailwind-merge`, never template literal interpolation
- **No hardcoded colors** — use Tailwind config variables, never `bg-[#hex]`
- Semantic HTML + `focus-visible:ring-*` on all interactive elements
