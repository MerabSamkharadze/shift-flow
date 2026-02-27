# ShiftFlow Dashboard Redesign — Technical Documentation

> **Branch:** `redesign`
> **Status:** Build passes (`npx next build` — zero errors)
> **Route:** `/dashboard` (design-dashboard route group)

---

## Overview

ძველი dashboard (`/manager`, `/owner`) ცალ-ცალკე გვერდებს იყენებდა. ახალი redesign ერთ `/dashboard` route-ში აერთიანებს ყველაფერს — 14 view URL-ის `?view=` პარამეტრით იცვლება. დიზაინი ახალია (dark theme, `#0A1628` background), მაგრამ real Supabase data-სთან არის დაკავშირებული.

---

## Architecture

```
Browser → /dashboard?view=employees
                ↓
  ┌─────────────────────────────────────────────┐
  │  page.tsx (Server Component)                │
  │  1. Auth check (redirect if not logged in)  │
  │  2. Read ?view= from URL                    │
  │  3. Fetch ONLY that view's data             │
  │  4. Pass user + viewData as props           │
  └─────────────────────┬───────────────────────┘
                        ↓
  ┌─────────────────────────────────────────────┐
  │  DashboardClient.tsx (Client Component)     │
  │  - URL-driven navigation (useSearchParams)  │
  │  - Sidebar + active view rendering          │
  │  - Passes data to correct view component    │
  └─────────────────────────────────────────────┘
```

**Key Decisions:**
- `useState('dashboard')` → `useSearchParams().get('view')` — enables server-side data fetching, bookmarks, browser back
- `viewData` is typed as `unknown` at the DashboardClient level; each view component casts to its specific type
- `export const dynamic = "force-dynamic"` — no static caching, always fresh data
- **Hybrid navigation** — server views use `router.push`, client-only views use `history.pushState` (see Performance section below)

---

## File Map

### New Files (untracked, `??` in git)

| File | Description |
|---|---|
| `lib/types/dashboard.ts` | TypeScript types for all view data |
| `app/(design-dashboard)/dashboard/page.tsx` | Async server component — auth + data fetching |
| `components/dashboard/DashboardClient.tsx` | Client shell — sidebar + view routing |
| `components/dashboard/Sidebar.tsx` | Navigation sidebar with real user info + logout |
| `components/dashboard/DashboardView.tsx` | Main dashboard — stats, shifts, activity |
| `components/dashboard/Employees.tsx` | Employee list + invite/deactivate |
| `components/dashboard/Managers.tsx` | Manager list + invite/deactivate (owner only) |
| `components/dashboard/Notifications.tsx` | Real-time notifications via Supabase Realtime |
| `components/dashboard/Marketplace.tsx` | Shift swap marketplace |
| `components/dashboard/MonthlyReport.tsx` | Monthly hours report + Excel export |
| `components/dashboard/HoursSummary.tsx` | Per-employee hours summary |
| `components/dashboard/ScheduleBuilder.tsx` | Schedule builder (mock fallback — not fully wired) |
| `components/dashboard/ShiftTemplates.tsx` | Shift templates (mock fallback — not fully wired) |
| `components/dashboard/Branches.tsx` | Branches management (mock — future feature) |
| `components/dashboard/Settings.tsx` | Settings (mock — future feature) |
| `components/dashboard/Billing.tsx` | Billing (mock — future feature) |

### Modified Files (`M` in git)

| File | What Changed |
|---|---|
| `lib/cache.ts` | +3 new cache functions + extended `getManagerDashboardData` |
| `app/api/export-monthly-report/route.ts` | Role check: `owner`-only → `owner \|\| manager` |
| `app/globals.css` | New design system styles |
| `app/layout.tsx` | Font/theme updates |
| `app/(dashboard)/layout.tsx` | Layout adjustments |
| `app/(dashboard)/employee/page.tsx` | Minor updates |
| `app/(dashboard)/manager/page.tsx` | Minor updates |
| `app/(dashboard)/owner/page.tsx` | Minor updates |
| `components/layout/*` | Sidebar, nav-links, mobile-nav, logout-button updates |
| `components/employee/my-schedule-client.tsx` | Minor updates |

---

## Data Flow Per View

### Fully Wired (Real Supabase Data)

| View (`?view=`) | Cache Function | Data Type | Server Actions Used |
|---|---|---|---|
| `dashboard` | `getManagerDashboardData(managerId)` | `DashboardViewData` | — |
| `employees` | `getManagerEmployeesData(managerId)` | `EmployeesViewData` | `inviteEmployee`, `deactivateEmployee` |
| `managers` | `getOwnerManagersData(companyId)` | `ManagersViewData` | `inviteManager`, `deactivateManager` |
| `notifications` | Client-side Supabase Realtime | N/A (client fetch) | `approveSwap`, `rejectSwap` |
| `marketplace` | `getManagerSwapsData(managerId)` | `MarketplaceViewData` | — |
| `monthly-report` | `getMonthlyReportData(companyId, month)` | `MonthlyReportViewData` | Excel export via `/api/export-monthly-report` |
| `hours-summary` | `getHoursSummaryData(managerId, month)` | `HoursSummaryViewData` | — |

### Partially Wired (Accept Data Prop but Use Mock Fallback)

| View | Status | Why |
|---|---|---|
| `schedule-builder` | Data prop accepted, mock fallback | 2,642 lines — too complex for first pass |
| `shift-templates` | Data prop accepted, mock fallback | 717 lines — needs group selector wiring |

### Not Wired (Mock/Static — Future Features)

| View | Status |
|---|---|
| `branches` | Needs new `branches` table + server actions |
| `settings` | Needs new `company_settings` table |
| `billing` | Needs Stripe integration |

---

## New Cache Functions in `lib/cache.ts`

### `getManagerEmployeesData(managerId: string)`
```typescript
// Returns: EmployeesViewData
// Tag: ["manager-employees"], 30s revalidation
// Query: users where created_by = managerId AND role = 'employee'
// Orders by created_at DESC
```

### `getMonthlyReportData(companyId: string, month: string)`
```typescript
// Returns: MonthlyReportViewData
// Tag: ["monthly-report"], 30s revalidation
// Input: month as "YYYY-MM"
// Process:
//   1. Find schedules overlapping the month for this company
//   2. Fetch all shifts in those schedules within the month date range
//   3. Aggregate per-employee: regularHours (from shift duration) + extraHours
//   4. Sort alphabetically by employee name
```

### `getHoursSummaryData(managerId: string, month: string)`
```typescript
// Returns: HoursSummaryViewData
// Tag: ["hours-summary"], 30s revalidation
// Input: month as "YYYY-MM"
// Process:
//   1. Get manager's groups → find schedules within month
//   2. Fetch shifts, aggregate per-employee: totalHours, extraHours, shiftCount
//   3. Fetch user names for display
```

### Extended: `getManagerDashboardData(managerId: string)`
```typescript
// NEW fields added to return:
//   shiftsThisWeek: number  — count of shifts Mon-Sun current week
//   monthlyHours: number    — sum of shift durations for current month
```

---

## Type System (`lib/types/dashboard.ts`)

```typescript
export type DashboardUser = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  role: UserRole         // "owner" | "manager" | "employee"
  company_id: string
}

export type ViewName = keyof ViewDataMap
// = "dashboard" | "employees" | "schedule-builder" | "shift-templates"
//   | "marketplace" | "monthly-report" | "hours-summary" | "managers"
//   | "notifications" | "settings" | "billing" | "branches"

export type ViewDataMap = {
  dashboard: DashboardViewData
  employees: EmployeesViewData
  "schedule-builder": ScheduleViewData
  "shift-templates": ShiftTemplatesViewData
  marketplace: MarketplaceViewData
  "monthly-report": MonthlyReportViewData
  "hours-summary": HoursSummaryViewData
  managers: ManagersViewData
  notifications: null      // client-side fetching
  settings: null            // future
  billing: null             // future
  branches: null            // future
}
```

---

## Server Actions Used

### From `app/actions/manager.ts`:
- `inviteEmployee(formData)` — Employees view: creates user + sends invite email
- `deactivateEmployee(employeeId)` — Employees view: sets is_active=false
- `approveSwap(swapId)` — Notifications: approves shift swap
- `rejectSwap(swapId)` — Notifications: rejects shift swap

### From `app/actions/owner.ts`:
- `inviteManager(formData)` — Managers view: creates manager user + sends invite
- `deactivateManager(managerId)` — Managers view: sets is_active=false

All actions are called via `useTransition` → `startTransition(async () => { ... })` for non-blocking UI.

---

## Auth & Role Guard

```
page.tsx:
  1. supabase.auth.getUser() → no user? redirect("/auth/login")
  2. Query users table for profile → no profile? redirect("/auth/signout")
  3. role === "employee"? redirect("/employee")
  4. Pass user with role to DashboardClient

Sidebar.tsx:
  - "Managers" nav item only visible when user.role === "owner"

Managers.tsx:
  - Shows "Only available for owners" message if userRole !== "owner"

page.tsx (managers view):
  - Only calls getOwnerManagersData if role === "owner"
```

---

## Notifications (Special Case)

Notifications does NOT use server-side data fetching. Instead:

1. **Initial load:** Client-side `supabase.from('notifications').select('*').eq('user_id', userId).limit(50)`
2. **Real-time:** Supabase Realtime subscription on `postgres_changes` (INSERT on notifications table)
3. **DB Schema:** notifications table has columns: `id, user_id, type, title, message, read, related_shift_id, related_swap_id, action_url, created_at`
4. **Type mapping:** DB types (`swap_request_received`, `swap_approved`, etc.) → display types (`swap-request`, `swap-approved`, etc.)

---

## URL Parameters

| Param | Used By | Example |
|---|---|---|
| `view` | All views | `?view=employees` |
| `group` | schedule-builder, shift-templates | `?view=schedule-builder&group=uuid` |
| `week` | schedule-builder | `?view=schedule-builder&week=2025-03-10` |
| `month` | monthly-report, hours-summary | `?view=monthly-report&month=2025-03` |

---

## Performance Optimizations

### Problem: Double Requests & Slow Navigation

ყოველი sidebar click-ი `router.push('/dashboard?view=X')` იძახებდა, რაც იწვევდა:
1. **Middleware** — `getUser()` Supabase API call (session refresh)
2. **page.tsx** — `getUser()` + profile query + view data fetch
3. **150ms artificial delay** — transition animation `setTimeout`-ებით

შედეგი: 3-4 Supabase request ყოველ click-ზე, თუნდაც Notifications-ზე გადასვლისას, სადაც server data საერთოდ არ სჭირდება.

### Solution: Hybrid Client/Server Navigation

View-ები 2 კატეგორიადაა გაყოფილი `DashboardClient.tsx`-ში:

```typescript
// Server views — need data from page.tsx, use router.push()
const SERVER_VIEWS = new Set([
  'dashboard', 'employees', 'schedule-builder', 'shift-templates',
  'marketplace', 'monthly-report', 'hours-summary', 'managers',
]);

// Client-only views — no server data needed, instant switch
// notifications, settings, billing, branches
```

**Server views** (`router.push`): ნავიგაცია გადის სერვერზე, იტვირთება ახალი data.
**Client-only views** (`setClientView` + `history.pushState`): მყისიერი გადართვა, ნულოვანი server call. URL იცვლება browser history API-ით.

### Other Fixes Applied

| Fix | Details |
|---|---|
| `<Suspense>` wrapper | page.tsx-ში `DashboardClient` `<Suspense fallback={null}>`-ში — fixes `useSearchParams()` double render in Next.js 14 |
| Removed artificial delay | 150ms `setTimeout` transition animation წაშლილია |
| `useMemo` for view content | view component მხოლოდ `activeView`/`viewData` ცვლილებაზე re-creates |
| `popstate` listener | Browser back/forward მუშაობს client-only view-ებზეც |
| `fetchViewData` extracted | page.tsx-ში data fetching ცალკე ფუნქციაშია, readability-სთვის |

### Result

| Scenario | Before | After |
|---|---|---|
| Notifications click | ~300-500ms (3-4 API calls) | **Instant** (0 API calls) |
| Settings/Billing/Branches click | ~300-500ms (3-4 API calls) | **Instant** (0 API calls) |
| Employees click | ~300-500ms + 150ms delay | ~200-300ms (no artificial delay) |
| `useSearchParams` hydration | Double render | Single render (Suspense) |

---

## What's Left To Do

### Priority 1 — Full Wiring
- [ ] **ScheduleBuilder** — Wire real data + server actions (create schedule, add/remove shifts, publish, copy last week). Currently accepts `data` prop but falls back to mock.
- [ ] **ShiftTemplates** — Wire real data + CRUD (create/delete template, group selector). Currently accepts `data` prop but falls back to mock.

### Priority 2 — New Features
- [ ] **Branches** — Create `branches` DB table, server actions, wire to component
- [ ] **Settings** — Create `company_settings` table, wire to component
- [ ] **Billing** — Stripe integration

### Priority 3 — Polish
- [ ] DashboardView activity feed — add real activity logs (currently shows today's shifts as activity)
- [ ] ScheduleBuilder auto-schedule and conflict detection wiring
- [ ] Notifications — handle UPDATE events (mark as read sync across tabs)

---

## Build Verification

```bash
npx next build
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Generating static pages (31/31)
# Route: /dashboard — 36.5 kB, First Load JS 179 kB
```

---

## How To Test

1. `npm run dev` → visit `/dashboard`
2. Should redirect to `/auth/login` if not authenticated
3. Login as **manager** → see real employee count, shifts, swaps in dashboard
4. Click sidebar items → URL changes to `?view=X`, real data loads
5. **Employees:** Add employee → check email sent, new user appears
6. **Managers (owner only):** Add manager → check email sent
7. **Notifications:** Should show real unread notifications, real-time updates
8. **Monthly Report:** Click "Download Excel" → downloads real report
9. **Hours Summary:** Change month → data updates via URL navigation
