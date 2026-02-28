# ShiftFlow — რედიზაინის გეგმა

## მიზანი
Figma დიზაინის კომპონენტებიდან (`components/figma/`) ახალი UI-ს აწყობა, როლებზე დაყოფილი (Owner / Manager / Employee), არსებული ლოგიკის შენარჩუნებით.

---

## როლების განაწილება

### Owner only
| View ID | Figma კომპონენტი | აღწერა |
|---------|-------------------|---------|
| `billing` | `Billing.tsx` | გადახდის გეგმა, countdown ტაიმერი, BOG placeholder |
| `branches` | `Branches.tsx` | ფილიალების მართვა (CRUD, სტატისტიკა) |
| `managers` | `Managers.tsx` | მენეჯერების მართვა (invite, deactivate) |
| `settings` | `Settings.tsx` | კომპანიის პარამეტრები |

### Manager only
| View ID | Figma კომპონენტი | აღწერა |
|---------|-------------------|---------|
| `employees` | `Employees.tsx` | თანამშრომლების მართვა |
| `marketplace` | `Marketplace.tsx` | ღია ცვლების მარკეტპლეისი (Coming Soon) |
| `notifications` | `Notifications.tsx` | შეტყობინებების ცენტრი (placeholder) |
| `schedule-builder` | `ScheduleBuilder.tsx` | განრიგის შემქმნელი |
| `shift-templates` | `ShiftTemplates.tsx` | ცვლის შაბლონები |

### ორივე (Owner + Manager)
| View ID | Figma კომპონენტი | აღწერა |
|---------|-------------------|---------|
| `dashboard` | `DashboardView.tsx` | მთავარი dashboard (სტატისტიკა, აქტივობა) |
| `hours-summary` | `HoursSummary.tsx` | საათების შეჯამება |
| `monthly-report` | `MonthlyReport.tsx` | თვიური რეპორტი |

### საერთო
| კომპონენტი | აღწერა |
|------------|---------|
| `Sidebar.tsx` | სანავიგაციო პანელი — ორივე როლისთვის, სხვადასხვა menu item-ებით |

---

## დიზაინ სისტემა (Figma-დან)

### ფერები
| ფერი | HEX | გამოყენება |
|------|-----|-----------|
| Background (dark) | `#0A1628` | მთავარი ფონი |
| Sidebar bg | `#0D1B2A` | sidebar ფონი |
| Card bg | `#142236` | ბარათების ფონი |
| Card hover | `#1A2E45` | hover state |
| Text primary | `#F0EDE8` | მთავარი ტექსტი |
| Text secondary | `#7A94AD` | მეორეხარისხოვანი ტექსტი |
| Orange (primary accent) | `#F5A623` | ძირითადი აქცენტი, active state |
| Green (success) | `#4ECBA0` | წარმატება, აქტიური სტატუსი |
| Teal (secondary) | `#14B8A6` | მეორეხარისხოვანი აქცენტი |
| Red (danger) | `#E8604C` | გაფრთხილება, წაშლა |
| Border | `rgba(255,255,255,0.07)` | ბორდერები |

### ფონტები
| ფონტი | გამოყენება | ჩატვირთვა |
|-------|-----------|-----------|
| `Syne` | სათაურები (h1, h2) | `next/font/google` → CSS var `--font-syne` |
| `DM Sans` | ტექსტი, ნავიგაცია | `next/font/google` → CSS var `--font-dm-sans` |
| `JetBrains Mono` | ციფრები, დროის ფორმატი | `next/font/google` → CSS var `--font-jetbrains-mono` |

### Icons
- Remixicon CDN (`cdn.jsdelivr.net/npm/remixicon@4.6.0`) + `preconnect` hint

### UI პატერნები
- Dark theme ყველგან (hardcoded hex ფერები server pages-ზე, Tailwind tokens client components-ზე)
- Card-ები: `bg-[#142236] border border-white/[0.07] rounded-xl`
- Hover: `hover:bg-[#1A2E45]`
- Responsive: Tailwind breakpoints (sm/md/lg/xl)

---

## ეტაპობრივი გეგმა + სტატუსი

---

### ეტაპი 0 — ინფრასტრუქტურა ✅ დასრულებული

**რა გაკეთდა:**
- ახალი Sidebar კომპონენტი (`components/layout/sidebar.tsx`) — Figma დიზაინით, role-based nav items
- MobileNav (`components/layout/mobile-nav.tsx`) — hamburger menu, sheet drawer
- NavLinks (`components/layout/nav-links.tsx`) — active state highlighting
- Dashboard layout (`app/(dashboard)/layout.tsx`) — dark theme `#0A1628` background
- Remixicon CDN + Google Fonts (Syne, DM Sans, JetBrains Mono) in root layout

---

### ეტაპი 1 — Owner გვერდები ✅ დასრულებული + რევიუ + ფიქსები

#### 1.1 Owner Dashboard (`/owner`) ✅
- Figma dark theme stat cards, swap requests, activity timeline
- რეალური data: `getOwnerDashboardData()`
- **ფაილი:** `app/(dashboard)/owner/page.tsx`

#### 1.2 Owner Managers (`/owner/managers`) ✅
- Figma managers table + invite dialog + deactivate
- რეალური data: `getOwnerManagersData()`, `inviteManager()`, `deactivateManager()`
- **ფაილები:** `app/(dashboard)/owner/managers/page.tsx`, `components/owner/managers-table.tsx`, `components/owner/invite-manager-dialog.tsx`

#### 1.3 Owner Branches (`/owner/branches`) ✅
- Manager-ების groups-ის დაჯგუფება ფილიალებად
- **ფაილები:** `app/(dashboard)/owner/branches/page.tsx`, `components/owner/branches-client.tsx`
- Cache: `getOwnerBranchesData()`

#### 1.4 Owner Reports (`/owner/reports`) ✅
- Monthly report client (reusable)  + MonthSelector (reusable, `basePath` prop)
- **ფაილები:** `app/(dashboard)/owner/reports/page.tsx`, `components/owner/monthly-report-client.tsx`, `components/owner/month-selector.tsx`
- Cache: `getOwnerMonthlyReportData()`

#### 1.5 Owner Hours Summary (`/owner/hours`) ✅
- Weekly/monthly toggle, week selector, summary cards, sortable table, trend mini-charts
- **ფაილები:** `app/(dashboard)/owner/hours/page.tsx`, `components/owner/hours-summary-client.tsx`
- Cache: `getOwnerHoursSummaryData()`

#### 1.6 Owner Settings (`/owner/settings`) ✅
- Company name, owner profile, notification toggles
- **ფაილები:** `app/(dashboard)/owner/settings/page.tsx`, `components/owner/settings-client.tsx`
- Cache: `getOwnerSettingsData()` / Actions: `updateCompanyName()`, `updateOwnerProfile()`

#### 1.7 Owner Billing (`/owner/billing`) ✅
- Live countdown timer (days:hours:minutes:seconds), subscription status, BOG placeholder
- Bank of Georgia გადახდის ინტეგრაცია მოგვიანებით
- **ფაილები:** `app/(dashboard)/owner/billing/page.tsx`, `components/owner/billing-client.tsx`

#### Owner Code Review + Fixes ✅
**აღმოჩენილი და გასწორებული:**
- searchParams: `Promise` → plain object (Next.js 14, არა 15)
- `deactivateManager` error handling
- setTimeout cleanup (useRef + useEffect) — settings, invite dialog
- Billing countdown stops on expiry
- `shiftHours` overnight shift fix (`endMinutes < startMinutes` → `+= 24*60`)
- Invite toast blank name fix (toastName state)
- `useMemo` — managersWithStatus, counts, filtered in managers-table
- `useMemo` — billing date formatting
- Figma ScheduleBuilder `selectedCell` optional chaining (build fix)

---

### ეტაპი 2 — Manager გვერდები ✅ დასრულებული + რევიუ + ფიქსები

#### 2.1 არსებული გვერდების რედიზაინი ✅
ყველა არსებულ manager გვერდს მიეცა Figma dark theme header-ები (Syne font, `#F0EDE8` text, `#7A94AD` subtitle):
- `/manager` — Dashboard (stat cards, today's shifts, pending swaps)
- `/manager/employees` — Employees table
- `/manager/groups` — Groups grid (color accent bars)
- `/manager/groups/[id]` — Group detail (back link, templates/members tabs)
- `/manager/schedule` — Schedule builder
- `/manager/swaps` — Swap requests

#### 2.2 ახალი გვერდები ✅
- `/manager/reports` — **reuses** `MonthlyReportClient` + `MonthSelector` (owner-ის კომპონენტები)
- `/manager/hours` — **reuses** `HoursSummaryClient` (owner-ის კომპონენტი)
- `/manager/templates` — Shift templates overview across all groups
- `/manager/notifications` — Placeholder page
- `/manager/marketplace` — Coming Soon placeholder

#### 2.3 ახალი cache functions ✅
- `getManagerTemplatesData(managerId)` — templates across all manager's groups
- `getManagerMonthlyReportData(managerId, monthParam)` — manager-scoped monthly report
- `getManagerHoursSummaryData(managerId, monthParam)` — manager-scoped hours summary

#### Manager Code Review + Fixes ✅
**კრიტიკული (4):**
1. Dashboard swap section — `swap.shift_id` lookup in `userNameMap` → შეცვლილია `swap.requested_at` date display-ით
2. `deleteShiftTemplate` — ✅ ახლა ამოწმებს group ownership (`manager_id` + `group_id` filter)
3. `removeGroupMember` — ✅ ახლა ამოწმებს group ownership (`manager_id` + `group_id` filter)
4. ყველა sub-page redirect — `redirect("/manager")` → `redirect(`/${profile.role}`)` (9 ფაილი)

**საშუალო (3):**
5. `deactivateEmployee` — error handling + UI error display
6. `deleteShiftTemplate` — error handling + UI error display
7. `removeGroupMember` — error handling + UI error display

---

### პერფორმანს ოპტიმიზაცია ✅ დასრულებული

**ფონტები (100-200ms დაზოგვა):**
- Syne ფონტი CDN link → `next/font/google` (self-hosted, no external request)
- ყველა `fontFamily: "Syne, sans-serif"` → `fontFamily: "var(--font-syne), sans-serif"` (29 ადგილი, 24 ფაილი)
- Remixicon CDN-ისთვის `<link rel="preconnect">` დამატებული

**DB Query ოპტიმიზაცია (200-400ms დაზოგვა):**
- `getManagerSwapsData` — N+1 query fix: `.find()` ლუპში → Map lookup (O(n*m) → O(n))
- `getOwnerHoursSummaryData` — schedules + groups queries გაპარალელებული `Promise.all()`-ით

**Client-side მემოიზაცია:**
- `BranchesClient` — `totalGroups`, `totalEmployees`, `filtered` → `useMemo`
- `MonthlyReportClient` — `maxHours`, `avgHours` → `useMemo`

---

### ეტაპი 3 — Employee გვერდები ❌ არ დაწყებულა

**საჭირო Figma დიზაინი:** Employee-ის გვერდების დიზაინი ჯერ არ არის მზად.

**არსებული employee გვერდები (გადასაკეთებელი):**
- `/employee` — My Schedule (weekly calendar)
- `/employee/team` — Team Schedule
- `/employee/swaps` — My Swap Requests
- `/employee/account` — Account/Profile

**არსებული კომპონენტები:**
- `components/employee/my-schedule-client.tsx`
- `components/employee/team-schedule-client.tsx`
- `components/employee/swaps-client.tsx`
- `components/employee/bottom-nav.tsx`

**საჭირო ნაბიჯები (Figma დიზაინის მიღების შემდეგ):**
1. Employee Dashboard-ის რედიზაინი dark theme-ით
2. My Schedule — Figma calendar view
3. Team Schedule — Figma team view
4. Swaps — Figma swap request UI
5. Account — profile/settings
6. Code review + fixes (როგორც Owner/Manager-ზე)

---

## ცნობილი ტექნიკური ვალი

### შემდეგ სესიაში გასაკეთებელი
1. **Theme inconsistency** — server pages იყენებს hardcoded hex ფერებს (`#142236`, `#F0EDE8`), client components იყენებს Tailwind theme tokens (`bg-muted`, `text-foreground`). ერთ სისტემაზე გადასაყვანი
2. **ShiftCell render-ში** — `schedule-client.tsx`-ში `ShiftCell` ფუნქცია `ScheduleClient`-ის შიგნით არის (closure dependency). Refactoring საჭირო
3. **Middleware performance** — ყოველ request-ზე `getUser()` call Supabase-ზე (~50-100ms). Session caching შესაძლებელია
4. **Owner dashboard sequential chain** — groups → schedules → shifts → swaps — dependency chain, პარალელიზაცია შეუძლებელი მიმდინარე DB schema-ით

### მოგვიანებით
5. **Bank of Georgia** გადახდის ინტეგრაცია (`/owner/billing`)
6. **Marketplace** ფუნქციონალი (`/manager/marketplace`)
7. **Notifications** ფუნქციონალი (`/manager/notifications`)

---

## არსებული კოდი რომელიც გამოვიყენეთ
- `lib/cache.ts` — 20+ cached data fetchers (unstable_cache, 30-60s revalidation)
- `app/actions/owner.ts` — owner server actions
- `app/actions/manager.ts` — manager server actions (groups, templates, members, employees, swaps)
- `app/actions/schedule.ts` — schedule server actions
- `lib/auth.ts` — authentication helpers (`getSessionProfile()`)
- `middleware.ts` — route protection (role-based redirects)

## Reusable კომპონენტები (Owner + Manager share)
- `components/owner/monthly-report-client.tsx` — Monthly Report UI
- `components/owner/hours-summary-client.tsx` — Hours Summary UI
- `components/owner/month-selector.tsx` — Month dropdown (`basePath` prop)

---

## Build & Deploy
- **Vercel** — auto-deploy from git
- `npx next build` must pass before every push
- **Branch:** `start-redesign`
- **Next.js 14** (NOT 15) — searchParams is plain object, not Promise
