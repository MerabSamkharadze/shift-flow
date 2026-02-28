# ShiftFlow — რედიზაინის გეგმა

## მიზანი
Figma დიზაინის კომპონენტებიდან (`components/figma/`) ახალი UI-ს აწყობა, როლებზე დაყოფილი (Owner / Manager), არსებული ლოგიკის შენარჩუნებით.

---

## როლების განაწილება

### Owner only
| View ID | Figma კომპონენტი | აღწერა |
|---------|-------------------|---------|
| `billing` | `Billing.tsx` | გადახდის გეგმა, ინვოისები, გადახდის მეთოდი |
| `branches` | `Branches.tsx` | ფილიალების მართვა (CRUD, სტატისტიკა) |
| `managers` | `Managers.tsx` | მენეჯერების მართვა (invite, deactivate) |
| `settings` | `Settings.tsx` | კომპანიის პარამეტრები |

### Manager only
| View ID | Figma კომპონენტი | აღწერა |
|---------|-------------------|---------|
| `employees` | `Employees.tsx` | თანამშრომლების მართვა |
| `marketplace` | `Marketplace.tsx` | ღია ცვლების მარკეტპლეისი |
| `notifications` | `Notifications.tsx` | შეტყობინებების ცენტრი |
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
| `Sidebar.tsx` | სანავიგაციო პანელი — ორივე როლისთვის, მაგრამ სხვადასხვა menu item-ებით |

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
| ფონტი | გამოყენება |
|-------|-----------|
| `Syne` | სათაურები (h1, h2) |
| `DM Sans` | ტექსტი, ნავიგაცია |
| `JetBrains Mono` | ციფრები, დროის ფორმატი |

### UI პატერნები
- Dark theme ყველგან
- Card-ები: `bg-[#142236] border border-white/[0.07] rounded-xl`
- Hover: `hover:bg-[#1A2E45] hover:scale-[1.02]`
- Modal-ები: backdrop blur, ანიმაციები
- Toast-ები: ქვედა-მარჯვენა კუთხიდან, 3 წამი auto-dismiss
- Badge-ები: `px-2 py-0.5 rounded-full text-xs font-semibold`
- Responsive: Tailwind breakpoints (sm/md/lg/xl)

---

## ეტაპობრივი გეგმა

### ეტაპი 0 — ინფრასტრუქტურა
**ფაილები:** `app/(dashboard)/layout.tsx`, ახალი sidebar, nav-links

1. **ახალი Sidebar კომპონენტი** — Figma-ს `Sidebar.tsx`-ზე დაფუძნებული
   - როლის მიხედვით სხვადასხვა navItems ჩვენება
   - Owner ხედავს: Dashboard, Managers, Branches, Reports, Hours Summary, Settings, Billing
   - Manager ხედავს: Dashboard, Notifications, Schedule Builder, Shift Templates, Marketplace, Employees, Reports, Hours Summary
   - რეალური user info (სახელი, როლი) sidebar-ში
   - Logout ფუნქციონალი
   - Mobile responsive (hamburger menu)

2. **Layout განახლება** — `app/(dashboard)/layout.tsx`
   - ახალი sidebar-ის ინტეგრაცია
   - Figma-ს dark theme background (`#0A1628`)
   - Remixicon CDN ლინკი (Figma-ს icon-ებისთვის)
   - Google Fonts: Syne, DM Sans, JetBrains Mono

---

### ეტაპი 1 — Owner გვერდები

#### 1.1 Owner Routing
**ფაილები:** რაუთების რესტრუქტურიზაცია

- `/owner` — Dashboard (shared DashboardView)
- `/owner/managers` — Managers
- `/owner/branches` — Branches (ახალი)
- `/owner/reports` — Monthly Report
- `/owner/hours` — Hours Summary
- `/owner/settings` — Settings (ახალი)
- `/owner/billing` — Billing (ახალი)

#### 1.2 თითოეული გვერდის აწყობა (თანმიმდევრობით)

**ნაბიჯი 1: Dashboard** (`/owner`)
- Figma `DashboardVkiew.tsx`-ს გადატანა
- Mock data → რეალური data (არსებული `getOwnerDashboardData()`)
- Stats ბარათები რეალური ციფრებით

**ნაბიჯი 2: Managers** (`/owner/managers`)
- Figma `Managers.tsx`-ს გადატანა
- არსებული `inviteManager`, `deactivateManager` server actions-ის მიბმა
- არსებული `getOwnerManagersData()` data-ს მიბმა

**ნაბიჯი 3: Branches** (`/owner/branches`)
- Figma `Branches.tsx`-ს გადატანა
- ახალი server actions: `createBranch`, `updateBranch`, `deleteBranch`
- ახალი cache function: `getOwnerBranchesData()`

**ნაბიჯი 4: Monthly Report** (`/owner/reports`)
- Figma `MonthlyReport.tsx`-ს გადატანა
- არსებული Excel export API-ს მიბმა
- რეალური data

**ნაბიჯი 5: Hours Summary** (`/owner/hours`)
- Figma `HoursSummary.tsx`-ს გადატანა
- რეალური data

**ნაბიჯი 6: Settings** (`/owner/settings`)
- Figma `Settings.tsx`-ს გადატანა
- ახალი server actions: `updateCompanySettings`
- არსებული company data

**ნაბიჯი 7: Billing** (`/owner/billing`)
- Figma `Billing.tsx`-ს გადატანა
- ლოგიკა მოგვიანებით (Stripe/payment integration)

---

### ეტაპი 2 — Manager გვერდები

#### 2.1 Manager Routing
- `/manager` — Dashboard (shared DashboardView)
- `/manager/employees` — Employees
- `/manager/schedule` — Schedule Builder
- `/manager/templates` — Shift Templates
- `/manager/marketplace` — Marketplace (ახალი)
- `/manager/notifications` — Notifications
- `/manager/reports` — Monthly Report
- `/manager/hours` — Hours Summary

#### 2.2 თითოეული გვერდის აწყობა
- Dashboard, Reports, Hours Summary — Owner-ის მსგავსი, manager-ის data-ით
- Employees — Figma `Employees.tsx` + არსებული ლოგიკა
- Schedule Builder — Figma `ScheduleBuilder.tsx` + არსებული ლოგიკა (ყველაზე რთული)
- Shift Templates — Figma `ShiftTemplates.tsx` + არსებული ლოგიკა
- Marketplace — Figma `Marketplace.tsx` + ახალი ლოგიკა
- Notifications — Figma `Notifications.tsx` + ახალი ლოგიკა

---

### ეტაპი 3 — Employee გვერდები (მოგვიანებით)
- ცალკე დაიგეგმება

---

## მუშაობის წესი

1. **თითო ფაილი/კომპონენტი ცალ-ცალკე** — ერთ ნაბიჯში ერთი კომპონენტი
2. **ჯერ დიზაინი** — Figma კომპონენტის გადმოტანა და ადაპტაცია
3. **მერე ლოგიკა** — რეალური data-ს მიბმა, server actions
4. **ტესტირება** — ყოველი ნაბიჯის შემდეგ
5. **კოდის წერა მხოლოდ დადასტურების შემდეგ**

---

## არსებული კოდი რომელიც გამოვიყენებთ
- `lib/cache.ts` — cached data fetchers
- `app/actions/owner.ts` — owner server actions (inviteManager, deactivateManager)
- `app/actions/schedule.ts` — schedule server actions
- `lib/auth.ts` — authentication helpers
- `middleware.ts` — route protection
- `components/layout/sidebar.tsx` — reference for current sidebar patterns
