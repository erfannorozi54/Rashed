---
trigger: always_on
---

# Code Conventions

## Before Writing Code
Read existing similar files first to match established patterns.

## API Routes
- Follow `src/app/api/[resource]/route.ts` and `.../[id]/route.ts`
- Auth pattern: `getServerSession` → check role → `NextResponse.json()`

## Pages
- New pages go under `src/app/dashboard/[role]/`
- Match data-fetching style of surrounding pages (`useEffect`+`fetch` or server component)
- Always handle loading and error states

## Components
- Always reuse from `src/components/ui/` before creating anything new
- Extract into `src/components/ui/` if a pattern repeats 3+ times
- Use `DashboardHeader` for page headers, `SessionTypeBadge` for session types, `MarkdownRenderer` for markdown
- All components accept a `className` prop merged via `tailwind-merge`

## Dates
- Use `jalali-utils.ts` for all date formatting — never raw `Date` methods for display

## Styling
- Tailwind utility-first only — no custom CSS, no `@apply`
- Mobile-first: base styles for mobile, scale up with `sm:` / `md:` / `lg:`
- Conditional classes via `clsx` + `tailwind-merge` — no template literal interpolation
- No hardcoded colors — use Tailwind config variables, never `bg-[#hex]`
- Semantic HTML + `focus-visible:ring-*` on all interactive elements
