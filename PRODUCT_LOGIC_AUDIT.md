# Product Logic & Business Audit Report

**Application:** `shift-flow` — multi-tenant employee shift-scheduling (Next.js 14 App Router + Supabase)
**Audit type:** Business-logic / edge-case + Product & market viability. **Read-only — no code was modified.**
**Date:** 2026-07-22
**Scope note:** The *security* posture (RLS, authz, tenant isolation) was audited and fixed separately —
see `SECURITY_AUDIT_REPORT.md`. This report deliberately does **not** re-litigate authorization holes; it
covers what remains once the app is *secure but not yet correct or complete*: business rules, state
machines, payroll math, race conditions, timezone handling, cache coherence, orphaned data, UX dead-ends,
and the gap to a sellable Workforce-Management (WFM) SaaS.

> **Methodology & confidence.** Findings were produced by a multi-agent sweep that traced seven domains
> end-to-end, then ran adversarial (code-reality + operational-materiality) verifiers on each candidate.
> The verification pass was truncated by a session limit, so its automated "confirmed" filter was **not**
> trusted. Instead, every **Critical/High** finding and the top **Medium** findings were **manually
> re-read against the cited source** before inclusion, and the sweep was corrected where it erred (e.g. it
> mislabeled the DB-backed invite limiter as "in-memory," and wrongly flagged a `00:00→08:00` shift as
> broken when only `end ≤ start` shifts break). Line numbers reflect the code as read on the audit date.

---

## 1. Executive Summary & Product Readiness Score

### Product maturity verdict: **3.5 / 10** — *functional prototype, not yet a chargeable product.*

`shift-flow` executes its happy path cleanly: a manager creates a group, defines shift templates, builds a
weekly schedule, publishes it, and employees can swap shifts through a genuinely nice direct/public swap
board. The code is tidy and the security remediation is solid.

But three classes of problem keep it below launch quality:

1. **A silent payroll-correctness bug.** Any shift that crosses midnight or ends exactly at `00:00`
   (i.e. every night shift and every closing shift) is computed as **zero paid hours**, on three separate
   surfaces including the owner's monthly payroll spreadsheet. Nothing warns anyone. For a scheduling tool
   whose headline output is an hours report, this is disqualifying until fixed.

2. **The product promises a workflow it doesn't deliver.** There's a notification bell, eight notification
   types, an activity-log panel, and schedule "publish" semantics — and **none of them actually do
   anything**: zero notifications are ever written, zero audit rows are ever written, and "published" is
   invisible to the very employees it's supposed to gate.

3. **Table-stakes WFM capabilities are absent.** No time tracking, no time-off/PTO, no availability
   capture, no billing, no self-serve signup, no real notification delivery (email/SMS/push), no
   overtime/labor-law rules. These are the features buyers in this category expect on day one.

### Key operational risks to resolve *before* any launch

| # | Risk | Finding |
|---|------|---------|
| 1 | Night/closing-shift staff reported as working **0 hours** → underpaid or false compliance records | LOGIC-001 |
| 2 | An employee can be **double-booked** on overlapping shifts (no check exists anywhere) | LOGIC-002 |
| 3 | A **published** schedule can be silently rewritten with no re-notification | LOGIC-003 / LOGIC-004 |
| 4 | Deactivating a **manager** permanently **bricks** their groups, schedules and pending swaps | LOGIC-005 |
| 5 | **Draft** (unpublished) shifts are counted in payroll *and* shown to employees as real | LOGIC-007 / LOGIC-008 |
| 6 | Swap approval is **non-atomic** and can reassign a shift (with its extra hours) to a removed employee | LOGIC-009 |

---

## 2. Business Logic Flaws & Edge-Case Vulnerabilities

| ID | Severity | Category | Description | Affected File / Workflow | Impact |
|----|----------|----------|-------------|--------------------------|--------|
| LOGIC-001 | **Critical** | Payroll / Midnight math | Overnight shifts and shifts ending at `00:00` compute as **0 paid hours** | `app/api/export-monthly-report/route.ts`, `app/api/export-schedule/route.ts`, `components/employee/team-schedule-client.tsx` | Silent underpayment / false hour records |
| LOGIC-002 | High | Shift Overlap | No double-booking / overlap check on any write path (create, update, copy, swap-approve) | `app/actions/schedule.ts`, `app/actions/manager.ts` | One person booked two places at once |
| LOGIC-003 | High | State Machine | Shifts can be added/edited/deleted on **published/locked/archived** schedules; no status guard, no re-notify | `app/actions/schedule.ts` | "Published" roster changes under employees' feet |
| LOGIC-004 | High | Notifications | Entire notification system is **dead code** — 0 inserts; all 8 `NotificationType` unused; no delivery channel | app-wide (no writer) | Users are never told anything |
| LOGIC-005 | High | Lifecycle / Orphaning | Deactivating a **manager** permanently orphans their groups/schedules/shifts/swaps | `app/actions/owner.ts`, `app/actions/manager.ts` | Whole teams become uneditable forever |
| LOGIC-006 | High | Lifecycle / Orphaning | Removing/deactivating an **employee** leaves future shifts orphaned (hidden but **still paid**) and swaps stranded | `app/actions/manager.ts`, `export-monthly-report` | Ghost hours in payroll; unfillable shifts |
| LOGIC-007 | High | Payroll filtering | Monthly payroll report includes **DRAFT** (unpublished) schedules | `app/api/export-monthly-report/route.ts` | Draft/planning data paid as real |
| LOGIC-008 | High | Consistency | Employees see **DRAFT** shifts on "My Schedule" (no status filter) while Team view hides them | `lib/cache.ts` | "Publish" is meaningless to the shift owner |
| LOGIC-009 | High | Swap / Payroll | `approveSwap` is non-atomic, never re-validates the recipient, and transfers the shift's `extra_hours` to them | `app/actions/manager.ts` | Shift assigned to removed user; wrong pay |
| LOGIC-010 | Medium | Swap state machine | `expired`/`expires_at`/`deadline` never enforced on direct-accept or manager-approve; no expiry job | `app/actions/employee.ts`, `app/actions/manager.ts` | Stale swaps live forever |
| LOGIC-011 | Medium | Copy / Lifecycle | `copyFromLastWeek` copies assignees without re-validating membership/active and swallows insert errors | `app/actions/schedule.ts` | Silently empty or wrongly-assigned week |
| LOGIC-012 | Medium | State signal | `shifts.status='pending_swap'` never set/reset; `completed`/`cancelled` unreachable | `app/actions/*` | No mid-swap signal; dead shift states |
| LOGIC-013 | Medium | Cache staleness | Several mutations omit tags they change (`manager-swaps`, `employee-schedule`, `employee-*`) | `app/actions/employee.ts`, `manager.ts` | Users see stale queues for up to 30s |
| LOGIC-014 | Medium | Week boundaries | `weekStart` not validated to a week start; shift `date` not validated inside `week_start..week_end` | `app/actions/schedule.ts` | Invisible-but-paid shifts; overlapping weeks |
| LOGIC-015 | Medium | Timezone | Deadlines + "today"/week boundaries use the **server process timezone**, not the company's | `app/actions/employee.ts`, exports | Cutoffs & month attribution drift |
| LOGIC-016 | Medium | Orphaned data | Deleting a shift leaves swaps dangling; pre-delete audit write unchecked; swap tag not revalidated | `app/actions/schedule.ts` | Blank swap rows; stale manager queue |
| LOGIC-017 | Medium | Duplicates | No app-level guard against duplicate schedules for one `(group, week)`; none in tracked migration | `app/actions/schedule.ts` | Split/duplicated rosters for a week |
| LOGIC-018 | Medium | Payroll rounding | Monthly TOTAL summed from **unrounded** values while rows are rounded → total ≠ sum of visible rows | `app/api/export-monthly-report/route.ts` | Report fails its own arithmetic check |
| LOGIC-019 | Low-Med | Error swallowing | ~9 actions use bare `catch → "Something went wrong"` (no log); every cache read discards its DB error and caches empty | `app/actions/*`, `lib/cache.ts` | Silent data loss; undebuggable failures |
| LOGIC-020 | Low-Med | Audit | `activity_logs` read + rendered but **never written** | `lib/cache.ts` | The compliance surface is permanently empty |
| LOGIC-021 | Low-Med | Onboarding | Re-invite of an existing email is a silent success no-op; public sign-up creates an orphan account that poisons future invites | `owner.ts`, `manager.ts`, `sign-up-form.tsx` | Invited users silently never provisioned |
| LOGIC-022 | Low | Rate limit | Invite limiter fails **open** on a count error and counts *created users*, not attempts | `lib/rate-limit.ts` | Limit under-counts; bypassable |
| LOGIC-023 | Low | Scale | Unbounded reads (all public swaps scanned; ever-growing shift-id fan-out; PostgREST row cap) | `lib/cache.ts` | Silent data drop + slowdown at scale |
| LOGIC-024 | Low | Lifecycle | No reactivation path anywhere; only the *creating* manager (not the owner) can deactivate an employee | `app/actions/manager.ts` | Irreversible deactivation; admin dead-ends |

### Detailed Findings

---

#### LOGIC-001 — Overnight & `→00:00` shifts are paid as **zero hours** (Critical)

**What's wrong.** Worked hours are derived from the clock times with no day-rollover handling, then the
negative result is clamped to zero:

```ts
// app/api/export-monthly-report/route.ts:12-16  (identical at export-schedule/route.ts:19-23)
function shiftDurationHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}
```

For a `22:00 → 06:00` night shift: `(360 − 1320)/60 = −16 → Math.max(0, −16) = 0`. For a `16:00 → 00:00`
closing shift: `(0 − 960)/60 = −16 → 0`. The `Math.max(0, …)` **hides** the bug rather than surfacing it —
the comment at `export-monthly-report/route.ts:9-11` shows the negative case was seen and swallowed, not
rejected. Nothing upstream prevents such shifts: `createShiftTemplate` (`app/actions/manager.ts:118-123`)
validates only the *format* of the times via `isTime()` (`lib/validation.ts:20-22`), never that
`end > start`; there is no `CHECK` constraint in the tracked migration; and `addShift`/`updateShift`
(`app/actions/schedule.ts:269,317`) copy the template times verbatim into every shift.

**Three surfaces, not two.** The same clamped function is copied into
`components/employee/team-schedule-client.tsx:59-63` and consumed at `:167` (employee weekly total) and
`:435` (per-shift display) — so the affected employee *also* sees `0h` in their own in-app view.

**Reproduction.**
1. Manager creates template "Night", start `22:00`, end `06:00` — accepted (only format is checked).
2. Manager assigns it to employee *Nino* for all 20 working days of March.
3. Owner opens `/owner` and exports the report for `?month=2026-03`.
4. `shiftDurationHours("22:00:00","06:00:00")` returns `0`; Nino's "Regular Hours" cell reads `0h`.
5. The company-wide TOTAL is silently short by 160 hours — with a real day-staff total also present, the
   sheet looks entirely normal (the `—` dash appears *only* if the whole company nets zero hours,
   `route.ts:295`), so nothing signals the loss.

**Impact.** Night-shift and closing-shift staff are reported as working zero hours. Fed to payroll →
they're unpaid for the month; fed to labor/compliance reporting → the company files materially false hour
records. The failure is silent.

**Fix.**
- Replace the clamp with explicit rollover math in **all three** files:
  ```ts
  const s = sh*60+sm, e = eh*60+em;
  const dur = e > s ? e - s : e + 1440 - s;   // end<=start ⇒ crosses midnight
  return dur / 60;
  ```
- Add a server guard in `createShiftTemplate` rejecting `duration === 0` (start === end), the one genuinely
  invalid case; ideally add a DB `CHECK`.
- Decide and document which calendar date an overnight shift belongs to (the shift's `date` = its start
  date) and apply it consistently in the month-boundary filter (`export-monthly-report/route.ts:105-106`)
  so a shift starting 31 Mar 22:00 isn't split from the following day.

---

#### LOGIC-002 — No double-booking / overlap check anywhere (High)

**What's wrong.** No write path queries the assignee's existing shifts before inserting or reassigning.
`addShift` (`app/actions/schedule.ts:213-286`) verifies template↔group and group membership but never
checks whether the employee already has a shift at that time. `updateShift`, `copyFromLastWeek`, and the
swap approval (`app/actions/manager.ts:411-414`) are equally blind. Because an employee can belong to
multiple groups under different managers (`group_members` has no exclusivity), overlaps can occur **within
a group and across groups**, and no single manager can even see the other group's shift.

**Reproduction.**
1. Employee *Kai* is a member of Group A (manager M1) and Group B (manager M2).
2. M1 assigns Kai a `09:00–17:00` shift Tuesday. M2 assigns Kai a `13:00–21:00` shift the same Tuesday.
3. Both inserts succeed. Kai is now booked in two places for four overlapping hours; both count in payroll.

**Impact.** Impossible rosters, inflated hours, and no warning to either manager — a core scheduling
guarantee is missing.

**Fix.** Before insert/reassign, query the assignee's shifts for that date (across all their groups) and
reject/warn on time overlap: `newStart < existingEnd && existingStart < newEnd` (with the LOGIC-001
rollover applied so overnight shifts compare correctly). Apply in `addShift`, `updateShift`,
`copyFromLastWeek`, and `approveSwap`.

---

#### LOGIC-003 — Published/locked/archived schedules are silently mutable (High)

**What's wrong.** `addShift`, `updateShift`, `removeShift`, `addShiftNote`, `saveExtraHours`
(`app/actions/schedule.ts:213-446`) verify **group ownership** but never read `schedule.status`. A manager
(or a stale open tab) can therefore add, move, or delete shifts on a schedule that employees already treat
as final. The UI marks published as read-only only *client-side* (`schedule-client.tsx:197`), which the
server does not enforce. Combined with LOGIC-004, employees are **never re-notified** of the change.

**Reproduction.**
1. Manager publishes week 2026-03-02; employees see their shifts.
2. Manager reopens the builder (or replays the server action), deletes an employee's Saturday shift.
3. The delete succeeds server-side; the employee is never told and may show up (or not) to a shift that
   changed.

**Impact.** "Publish" carries no integrity guarantee; last-minute silent edits are the #1 trust-killer in
scheduling tools.

**Fix.** In each shift-mutating action, fetch the schedule status and reject writes when
`status !== 'draft'` (or require an explicit "edit published schedule" path that emits a
`schedule_changed` notification — see LOGIC-004).

---

#### LOGIC-004 — The entire notification system is dead code (High)

**What's wrong.** The schema defines a `notifications` table and eight `NotificationType` values; the UI
ships a realtime notification bell (`components/layout/notification-bell.tsx`) that subscribes, reads, and
marks-read. But **nothing ever inserts a notification row** — a repository-wide search finds only reads and
an `update` (mark-read) in the bell, and no `.from("notifications").insert(...)` anywhere. Every swap
transition (request, accept, reject, approve, public-available), every publish, and every schedule change
therefore produces **no** notification. All eight `NotificationType` values are unused. There is also no
out-of-band channel at all — no email, SMS, or push — so even a logged-out employee learns nothing.

**Reproduction.**
1. Employee A sends employee B a direct swap request.
2. B is expected to be notified. No row is written; B's bell stays empty; B only discovers the request by
   manually opening the Swaps page.

**Impact.** The product's core coordination loop (swaps, publishing) silently depends on users
polling pages. In a mobile-first hourly workforce, this is a functional gap, not a polish item.

**Fix.** Emit notification rows at each transition (co-located with the state change, ideally in the same
DB transaction — see LOGIC-009), then add a delivery worker for email/push. Populate `related_shift_id` /
`related_swap_id` / `action_url` so the bell deep-links.

---

#### LOGIC-005 — Deactivating a manager permanently orphans their groups (High)

**What's wrong.** Every manager write path is scoped by `manager_id = self`
(`groups`, `schedules`, `shifts` via `groups!inner(manager_id)`). `deactivateManager`
(`app/actions/owner.ts:111-146`) flips `is_active=false` and bans the auth user, but does **not** reassign
their groups, warn about impact, or offer a successor. There is no co-manager, delegation, or vacation-
coverage concept, and no reactivation path (LOGIC-024). Result: once a manager is deactivated, **nobody**
can edit that manager's groups, publish their schedules, or approve/reject their teams' pending swaps —
the owner cannot, because the owner has no schedule-editing role (see §4).

**Reproduction.**
1. Owner deactivates manager M (who owns Group A with 12 employees and 3 pending swaps).
2. Group A's schedules are now frozen; the 3 swaps sit in `pending_manager`/`accepted_by_employee` with no
   one able to approve them; employees' future shifts cannot be changed.

**Impact.** A routine admin action silently bricks an entire team. High operational and trust cost.

**Fix.** On manager deactivation, require reassignment of their groups to another manager (or the owner),
show an impact preview ("N groups, N schedules, N pending swaps will be affected"), and give the owner a
group-reassignment action. Add reactivation.

---

#### LOGIC-006 — Deactivating/removing an employee orphans their shifts (still paid) (High)

**What's wrong.** `removeGroupMember` (`app/actions/manager.ts:215-243`) and `deactivateEmployee`
(`:315-351`) delete the membership / flip `is_active`, but leave the employee's **existing future shifts
untouched**. Those shifts vanish from the manager's grid and the weekly export (both key off current group
membership) yet are **still counted in the monthly payroll report**, which filters only by schedule and
date (`export-monthly-report/route.ts:98-108`), not by membership or `is_active`. Pending swaps involving
that user are likewise stranded.

**Reproduction.**
1. Employee *Lee* has 8 future shifts. Manager removes Lee from the group.
2. Manager's grid no longer shows Lee's shifts (no one is visibly assigned); the shifts still exist.
3. Month-end: the payroll report still lists Lee with 64 hours for shifts nobody can see or cover.

**Impact.** Ghost hours in payroll, unfillable coverage gaps the manager can't see, and stranded swaps.

**Fix.** On member removal / deactivation, surface an impact count and require an explicit choice for
existing future shifts (reassign, cancel, or convert to open/unassigned — see §3). Exclude shifts of
inactive users, or of users no longer in the group, from the payroll report (product decision required).

---

#### LOGIC-007 — Monthly payroll report includes DRAFT schedules (High)

**What's wrong.** The report collects **all** company schedules overlapping the month with no status
filter:

```ts
// app/api/export-monthly-report/route.ts:79-84
const { data: companySchedules } = await service
  .from("schedules")
  .select("id")
  .eq("company_id", profile.company_id)
  .lte("week_start_date", monthEnd)
  .gte("week_end_date", monthStart);   // ← no .eq("status", "published")
```

Every shift on a **draft** (unpublished, still-being-planned) schedule is therefore aggregated into paid
hours.

**Reproduction.**
1. Manager starts drafting April while March is being reported, dragging in speculative shifts.
2. Owner exports March; a draft week that overlaps the month boundary contributes hours that were never
   finalized.

**Impact.** Payroll includes planning data. Overstated hours and cost.

**Fix.** Add `.in("status", ["published", "locked", "archived"])` (or whatever the definition of
"payable" is) to the schedule query.

---

#### LOGIC-008 — Employees see DRAFT shifts on "My Schedule" (High, consistency)

**What's wrong.** `getEmployeeScheduleData` (`lib/cache.ts:700-733`) fetches the employee's shifts by
`assigned_to` + date range and their schedules by id with **no status filter**, so an employee sees shifts
from a **draft** schedule as if real. The team view `getTeamScheduleData` (`lib/cache.ts:1075-1078`) *does*
filter `["published","locked"]`. The two employee-facing views disagree, and "publish" — the manager's
signal that a schedule is final — is invisible to the shift's own owner.

**Reproduction.**
1. Manager drafts next week (not published), tentatively pencils *Ana* in for Monday.
2. Ana opens "My Schedule" and sees the Monday shift as real; her teammates' Team view shows nothing.
3. Manager deletes the tentative shift before publishing; Ana was misled.

**Impact.** Employees plan around speculative shifts; erodes trust in the schedule.

**Fix.** Apply the same `["published","locked","archived"]` status filter in `getEmployeeScheduleData` that
the team view uses.

---

#### LOGIC-009 — `approveSwap` is non-atomic, un-revalidated, and mis-attributes extra hours (High)

**What's wrong.** `approveSwap` (`app/actions/manager.ts:355-427`):
- **Not atomic.** It marks the swap `approved` (`:393-402`) and *then* reassigns the shift (`:411-414`) in
  a separate statement with no transaction and no rollback. If the shift update fails, the swap is
  permanently `approved` but the shift never moved — an unrecoverable inconsistency with no repair path.
- **No recipient re-validation.** Between request and approval the recipient may have been removed from the
  group or deactivated. Approval reassigns the shift to `to_user_id` / `accepted_by` regardless
  (`:386-388`), with no re-check of membership or `is_active`.
- **Extra hours travel with the shift.** The reassign updates only `assigned_to` + `modified_by`, so any
  `extra_hours` the original assignee earned are silently inherited by the new person (`:411-414`).

**Reproduction.**
1. Ana requests a swap; Ben accepts. Manager is slow to approve.
2. Ben is removed from the group (or deactivated). Manager clicks Approve.
3. The shift — including Ana's recorded 2 extra hours — is reassigned to Ben, who is no longer a member
   and whose payroll now shows hours he didn't work.

**Impact.** Wrong person assigned, wrong pay, and a possible permanently-stuck swap on partial failure.

**Fix.** Wrap approve+reassign in a single DB transaction / RPC; re-validate that the recipient is an
active member of the shift's group at approval time; reset `extra_hours` to null on reassignment (or
explicitly carry them only when intended).

---

#### LOGIC-010 — Swap expiry & deadlines are half-implemented (Medium)

**What's wrong.** `deadline` is computed at creation (`app/actions/employee.ts:34-41`) and checked on
create and on public-claim (`takePublicShift`, `:275`), but is **never** checked on **direct accept**
(`acceptSwap`, `:178-203`) or on **manager approve** (`app/actions/manager.ts:355`). The `expired` status
and `expires_at` column are never written by anything, and no cron/job exists to expire stale swaps.

**Reproduction.**
1. Ana sends Ben a direct swap for a shift; the 8-hour deadline passes with no response.
2. Ben opens the app hours later and accepts; the manager approves. The swap goes through **after** the
   deadline that was supposed to protect the shift.

**Impact.** The deadline is advisory theatre on the paths that matter; swaps never auto-expire and clutter
queues indefinitely.

**Fix.** Enforce `deadline > now()` in `acceptSwap` and `approveSwap`; add a scheduled job (or lazy check
on read) that transitions past-deadline pending swaps to `expired` and resets shift state.

---

#### LOGIC-011 — `copyFromLastWeek` copies blindly and swallows failures (Medium)

**What's wrong.** `copyFromLastWeek` (`app/actions/schedule.ts:84-176`) reads last week's shifts and
re-inserts them +7 days, but (a) does **not** re-validate that each `assigned_to` is still an active member
of the group, and (b) fires the batch insert without checking its result:

```ts
// app/actions/schedule.ts:165
await supabase.from("shifts").insert(newShifts);   // ← error ignored
```

It then reports success even if zero rows were inserted, and does not skip when a schedule already exists
for the target week (relates to LOGIC-017).

**Reproduction.**
1. Last week Ana worked 5 shifts; she has since left the group.
2. Manager clicks "Copy last week." The new week is created with 5 shifts assigned to a non-member (or the
   insert fails a constraint and the week is silently empty), and the action still says "success."

**Impact.** Wrongly-assigned or silently-empty weeks; the manager believes the copy worked.

**Fix.** Filter copied shifts to current active members; check and surface the insert error; guard against
copying into a week that already has a schedule.

---

#### LOGIC-012 — `shifts.status='pending_swap'` is never set/reset; dead shift states (Medium)

**What's wrong.** The `shifts.status` enum includes `pending_swap`, `completed`, and `cancelled`, but no
code path ever writes them — a search finds no writer of `pending_swap`. So while a swap is in flight, the
shift shows as normal in the manager grid (no "swap pending" indicator), and shift lifecycle states
(`completed`/`cancelled`) are unreachable.

**Impact.** Managers get no visual signal that a shift is mid-swap; downstream logic that could rely on
`pending_swap` (e.g. blocking edits) can't.

**Fix.** Set `pending_swap` when a swap is created and **reset to `scheduled`** on reject/cancel/expire/
approve; decide whether `completed`/`cancelled` are needed and wire them, or drop them from the enum.

---

#### LOGIC-013 — Stale-cache set: mutations that don't revalidate what they change (Medium)

**What's wrong.** `lib/cache.ts` tags each surface (`manager-swaps`, `employee-schedule`, `employee-team`,
…) but several mutations forget to revalidate a surface they altered:
- `cancelSwap` (`app/actions/employee.ts:250-251`) revalidates `employee-swaps` + `employee-schedule` but
  **not** `manager-swaps` → a cancelled request stays live on the manager's queue for up to 30s.
- Employee `acceptSwap`/`rejectSwap` and manager `rejectSwap` omit `employee-schedule` → the requester's
  shift card keeps a stale swap badge.
- `deleteGroup` (`app/actions/manager.ts:78-79`) revalidates only `manager-groups` + `manager-dashboard`,
  not `employee-team`/`employee-schedule`/`employee-swaps`, though it cascades those away.
- Membership changes and user deactivation don't bust the schedule caches that still present the user.

**Impact.** Users act on stale queues (approve an already-cancelled swap, see a phantom badge) within the
30-second `revalidate` window.

**Fix.** Audit each action's write-set against the tags it touches; add the missing `revalidateTag` calls.

---

#### LOGIC-014 — Week/shift-date boundaries are unvalidated (Medium)

**What's wrong.** `createSchedule` (`app/actions/schedule.ts:36-81`) validates only that `weekStart` is a
`YYYY-MM-DD` string (`isDate`), never that it's the canonical start-of-week — so a manager can create a
schedule anchored to an arbitrary mid-week date, producing week ranges that overlap other schedules.
`addShift` (`:213-286`) validates the shift `date` format but never checks it falls within the schedule's
`week_start_date..week_end_date`, so a shift can be attached to a schedule but dated outside its week —
**invisible** in the manager grid and weekly export (which query by week) yet **counted** in the monthly
payroll report (which queries by date across the company).

**Reproduction.**
1. Via a replayed/edited action, a shift dated 2026-04-15 is inserted under a schedule for the week of
   2026-03-02.
2. It never appears in any weekly view, but the April monthly report counts its hours.

**Impact.** Off-books shifts that are hidden from operators but paid; overlapping week ranges confuse reads.

**Fix.** Normalize/validate `weekStart` to the configured week start (e.g. Monday); reject shift `date`
outside `[week_start_date, week_end_date]` in `addShift`/`updateShift`.

---

#### LOGIC-015 — Time math runs in the server's timezone, not the company's (Medium)

**What's wrong.** The swap deadline is built with a local `Date` constructor
(`app/actions/employee.ts:35-41`: `new Date(year, month-1, day, hours, …)` then `- 8h` then
`toISOString()`), which interprets the wall-clock time in the **server process** timezone. "Today" and
week boundaries in dashboard/export math are similarly server-local. There is no per-company timezone
setting. On a UTC server (typical for Vercel/serverless), an `09:00` shift for a company in UTC+4 has its
8-hour cutoff computed against the wrong wall clock, and a shift near midnight can be attributed to the
wrong day/month.

**Impact.** Deadlines land at the wrong real-world moment; month/week attribution can slip by a day across
timezones/DST. Subtle but real for any non-UTC customer.

**Fix.** Introduce a company timezone; compute deadlines and day/week/month boundaries in that zone (store
timestamps in UTC). Avoid the ambient-timezone `Date` constructor for business math.

---

#### LOGIC-016 — Shift deletion leaves swaps dangling (Medium)

**What's wrong.** `removeShift` (`app/actions/schedule.ts:338-372`) deletes the shift after an **unchecked**
pre-delete "audit" write (`await …update({modified_by}).eq("id", shiftId)` with no error handling), and does
**not** revalidate swap tags or cancel in-flight swaps that reference the shift. Depending on FK behavior,
swaps are either destroyed silently or left pointing at a deleted shift; the read layer already renders the
dangling case as blank rows in swap lists.

**Impact.** Blank/ghost swap rows; stale manager swap queue; lost swap history.

**Fix.** Before deleting, cancel any in-flight swaps for the shift (with notification), check the audit
write's result, and revalidate `manager-swaps`/`employee-swaps`.

---

#### LOGIC-017 — No guard against duplicate schedules for a `(group, week)` (Medium)

**What's wrong.** `createSchedule` (`app/actions/schedule.ts:58-69`) inserts a schedule with no check for
an existing one for the same `(group_id, week_start_date)`, and the tracked migration adds no unique
constraint (the base schema is not in the repo, so a constraint cannot be confirmed present). Duplicate
schedules for one week split that week's shifts across two rows; several read paths pick one arbitrarily.

**Impact.** A week's roster can silently fork; exports and views may show only half of it.

**Fix.** Add a DB unique constraint on `(group_id, week_start_date)` and/or check-before-insert; make
`copyFromLastWeek` and `createSchedule` fail cleanly when a schedule already exists.

---

#### LOGIC-018 — Monthly totals don't equal the sum of the visible rows (Medium)

**What's wrong.** Data rows are rounded to 2 dp for display (`export-monthly-report/route.ts:235-237`) but
the grand totals are summed from the **unrounded** accumulators (`:156-158`). With many fractional-hour
shifts, the printed TOTAL can differ from the sum of the printed rows by a few hundredths.

**Impact.** The report visibly fails its own arithmetic — a credibility problem for a payroll document.

**Fix.** Sum the already-rounded per-row values (round each row first, then total), or state a single
rounding policy applied consistently.

---

#### LOGIC-019 — Errors are swallowed on writes and cached on reads (Low-Med)

**What's wrong.** Roughly nine manager/owner/schedule actions wrap their body in a bare
`catch { return { error: "Something went wrong" } }` with no logging (e.g. `app/actions/manager.ts`,
`schedule.ts`, `owner.ts`) — unlike the employee actions, which log via `safeError`. Separately, most reads
in `lib/cache.ts` destructure `{ data }` and **discard the Supabase error**, then cache the resulting empty
payload for 30s — so a transient DB error becomes "you have no shifts" for half a minute.

**Impact.** Silent partial failures; undebuggable production issues; users shown empty state on transient
errors.

**Fix.** Log the real error server-side in every catch; check errors in cache reads and avoid caching an
error state (or shorten TTL / return a distinguishable error).

---

#### LOGIC-020 — The audit log has no writer (Low-Med)

**What's wrong.** `activity_logs` is queried and rendered on the owner dashboard (`lib/cache.ts:122`) but
**nothing ever inserts** into it. The panel is permanently empty; the schema's `old_value`/`new_value`/
`ip_address` audit fields are never populated.

**Impact.** No audit trail — a compliance and forensics gap, and a misleading "we have audit logging" claim.

**Fix.** Write activity rows at each significant mutation (create/publish/delete schedule, reassign shift,
deactivate user, approve/reject swap), or remove the panel until it's real.

---

#### LOGIC-021 — Silent invite no-ops and orphan sign-up accounts (Low-Med)

**What's wrong.** To avoid user-enumeration, an invite to an already-registered email returns
`{ error: null }` — a **silent success** — in both `inviteEmployee` (`app/actions/manager.ts:282-285`) and
`inviteManager` (`app/actions/owner.ts:76-79`). Meanwhile the public `/auth/sign-up` form calls
`supabase.auth.signUp` directly (`components/sign-up-form.tsx:50-58`) creating an **auth user with no
`users` profile row and no company**. That orphan account can never use the app (the role guards throw),
**and** it poisons any future invite to that email (already-registered → silent no-op), so the person can
never be properly provisioned.

**Reproduction.**
1. A prospective employee self-signs-up at `/auth/sign-up` (orphan auth account created).
2. Their manager later invites that same email; the invite returns "success" but is a no-op.
3. The employee never appears in the org and no one knows why.

**Impact.** Users silently fall into an unrecoverable limbo; confusing onboarding failures.

**Fix.** Either remove/repurpose public sign-up (the product is invite-only) or make it create a full
company+owner (self-serve — see §3). Detect the orphan-account case on invite and repair it. Consider a
manager-visible "already registered / re-sent" state instead of a blind success.

---

#### LOGIC-022 — Invite rate limiter fails open and counts the wrong thing (Low)

**What's wrong.** `inviteRateLimitExceeded` (`lib/rate-limit.ts`) is DB-backed (correct across serverless
instances — the "in-memory" concern does not apply). But it counts **created user rows**
(`count ?? 0 >= INVITE_MAX`), so it fails **open** on a count-query error (`count ?? 0 → 0 → allowed`) and
doesn't count invite *attempts* that don't create a row (e.g. the already-registered silent no-op of
LOGIC-021). The window/limit are also generous (20 per 10 min).

**Impact.** The throttle under-counts and is bypassable; low severity given it's an abuse-mitigation, not a
correctness gate.

**Fix.** Fail closed (or log) on count error; count attempts, not created rows (e.g. a dedicated
rate-limit/audit table).

---

#### LOGIC-023 — Unbounded reads that degrade with tenant age (Low)

**What's wrong.** Several reads grow without bound: the employee swaps query reads pending public swaps
before filtering to the caller's groups in JS; the manager dashboard/swaps path fans out an ever-growing
list of shift IDs via `.in(...)`; large groups can hit the PostgREST default row cap (1000), silently
dropping rows. No pagination or server-side narrowing.

**Impact.** Slowdowns and, at the row cap, silent data loss for large/old tenants.

**Fix.** Push filters into the query (join/`in` on the caller's group IDs server-side), paginate, and set
explicit ranges; never rely on the implicit row cap.

---

#### LOGIC-024 — No reactivation; only the creating manager can deactivate (Low)

**What's wrong.** Deactivation flips `is_active=false` and bans the auth user, but there is **no
reactivation action anywhere** — every deactivation is permanent. And `deactivateEmployee`
(`app/actions/manager.ts:320-326`) is scoped `eq("created_by", profile.id)`, so **only the manager who
created the employee** can deactivate them — a co-manager or the owner cannot.

**Impact.** Accidental or staff-churn deactivations are irreversible; admin dead-ends when the creating
manager is gone (compounds LOGIC-005).

**Fix.** Add a reactivation action (unban + `is_active=true`); broaden deactivation authority to the owner
and any manager of the employee's group, scoped by company.

---

## 3. SaaS Competitiveness & Feature-Gap Analysis

### 3.1 Capability matrix vs. commercial WFM standard

Benchmarked against **7shifts, Homebase, Deputy, When I Work, Connecteam, Sling**.

| Capability | shift-flow | Evidence |
|-----------|:---------:|----------|
| Schedule drafting vs publishing | **Partial** | `schedules.status` exists; but publish is unenforced (LOGIC-003) and invisible to employees (LOGIC-008) |
| Shift templates | **Present** | `shift_templates`, `createShiftTemplate` |
| Shift swaps & drops | **Present** | Direct + public swap board, `app/actions/employee.ts` — a genuine strength |
| Weekly / monthly export | **Present** | `app/api/export-schedule`, `export-monthly-report` (exceljs) |
| In-app notifications | **Partial (shell)** | Bell UI + realtime subscribe, but **no writer** (LOGIC-004) |
| Roles & permissions | **Partial** | 3 hardcoded roles (owner/manager/employee); no granularity, owner can't schedule |
| Open / unassigned shifts & bidding | **Absent** | No unassigned-shift concept; `shifts.assigned_to` is required |
| Availability & preferences | **Absent** | No availability table or capture |
| Time-off / PTO / leave | **Absent** | No time-off table; employees can be scheduled while away |
| Time tracking (clock in/out, breaks, geofence) | **Absent** | No time-clock table; scheduled hours billed as worked |
| Overtime & labor-law compliance (max hours, min rest, minors, breaks) | **Absent** | No rules engine; no double-booking guard (LOGIC-002) |
| Labor cost / wage rates / budget forecasting | **Absent** | No wage/cost model |
| Multi-location / site | **Absent** | Single company→groups; no site dimension |
| Reporting & analytics | **Partial** | Two fixed spreadsheets; no in-app analytics, date ranges, or drill-down |
| Audit logs | **Absent (shell)** | `activity_logs` read but never written (LOGIC-020) |
| Real-time delivery (push / email / SMS) | **Absent** | In-app only, and even that is dead (LOGIC-004) |
| Payroll / POS integrations | **Absent** | Manual Excel only |
| Public API / webhooks | **Absent** | None |
| Mobile app / PWA / offline | **Absent** | Responsive web only; builder barely usable on phone (§4) |
| Onboarding & self-serve signup | **Absent** | Invite-only; public sign-up is broken (LOGIC-021) |
| Billing / subscription | **Absent** | No billing whatsoever — cannot charge |
| i18n & multi-currency | **Absent** | Hardcoded en-US strings/date formats |
| GDPR / retention / export / erasure | **Absent** | No data-subject tooling |

### 3.2 Critical missing features — the blockers to charging money

| Feature | Why it blocks | Segment blocked | Build |
|--------|---------------|-----------------|:-----:|
| **Billing / subscription** | You cannot take payment; there is no revenue mechanism | All paying customers | M |
| **Self-serve company signup** | No way for a company to create itself; onboarding is manual and the public form is broken | All self-serve SMB | M |
| **Time tracking (clock in/out)** | Scheduled ≠ worked; without actuals, payroll/labor reporting is fiction | Hourly-workforce buyers (the category's core) | L |
| **Time-off / PTO / leave** | Employees get scheduled on holiday; managers schedule blind | Any team with leave (≈ all) | M |
| **Availability & preferences** | Managers schedule without knowing who can work — the #1 scheduling input | All | M |
| **Real notification delivery (email/push)** | Coordination silently depends on polling; the in-app system is dead | Mobile-first hourly teams | M |
| **Overtime & labor-law compliance** | Legal exposure (max hours, min rest, minor rules, breaks); no double-booking guard | Regulated / multi-state, larger teams | L |
| **Open/unassigned shifts & bidding** | Coverage gaps are structurally unexpressible; no way to advertise an unfilled shift | Any team with variable demand | M |
| **User-lifecycle management (reactivation, orphan handling)** | Deactivation is irreversible and orphans data (LOGIC-005/006/024) | All (operational) | S |

### 3.3 Nice-to-have / growth features

Multi-location/site model · labor-cost & budget forecasting · in-app analytics with custom date ranges &
drill-down · split/double shifts (currently one shift per employee per day is the structural assumption) ·
finer permission model · payroll/POS integrations, public API, webhooks · native mobile app / PWA /
offline · GDPR export & erasure tooling · multi-currency & i18n.

### 3.4 Differentiation & who it can serve today

**Honest read: no defensible wedge yet — a thinner clone of the incumbents with one genuinely good idea**
(the public swap board is clean and better-executed than some competitors' equivalents). Every incumbent
has swaps *plus* time tracking, time-off, availability, and mobile apps; shift-flow has swaps and not much
else, plus a payroll-math bug.

- **Could sell to today (barely):** a **single-site, single-manager** small team (café, salon, small
  retail) that pays hourly *by the published schedule*, runs **no overnight shifts**, and tolerates manual
  onboarding and Excel payroll — and only after LOGIC-001 is fixed.
- **Cannot serve:** multi-site operators (no site model), anyone needing actual worked-hours (no time
  clock), regulated/large employers (no compliance, no audit trail), 24-hour operations (LOGIC-001), or
  anyone expecting self-serve signup and billing.

### 3.5 Readiness score & the five highest-leverage next builds

**Score: 3.5 / 10.** Justification: a clean, secure core scheduling loop and a strong swap feature (+),
undercut by a Critical payroll bug, a dead notification/audit layer, unenforced publishing, and the
absence of every monetization and table-stakes WFM capability (−).

Build next, in order:
1. **Fix the correctness core** (LOGIC-001 midnight math, LOGIC-002 overlap, LOGIC-003/007/008 publish &
   draft handling, LOGIC-009 atomic swap) — nothing else matters until hours are trustworthy.
2. **Make notifications real** (writers + email/push) — the product's coordination loop.
3. **Self-serve signup + billing** — the ability to acquire and charge customers.
4. **Time-off + availability** — the two inputs every scheduler needs before it's usable daily.
5. **Time tracking (clock in/out)** — turns "scheduled hours" into a real payroll/labor product.

---

## 4. UX & Operational Friction Points

Walkthroughs of the real components under `app/(dashboard)/**` and `components/**`:

- **Owner is a dead-end.** The owner dashboard (`app/(dashboard)/owner/page.tsx`) shows pending swaps but
  they are **not actionable**, both "quick access" links point to the same page, and the owner has **no
  ability to view or build any schedule** — so the top role can't do the product's main job (compounds
  LOGIC-005: when a manager is deactivated, the owner can't step in).
- **No bulk operations.** Placing 10 shifts (journey A) costs ~34 discrete interactions — there is no
  bulk assign, no drag-to-fill, no multi-select, no "clear day/week." `copyFromLastWeek` is the only
  batch primitive and it's unsafe (LOGIC-011).
- **Destructive actions with no confirmation or impact preview.** Deactivating a user, removing a group
  member, and removing a shift all fire on a **single click** with **no confirmation and no impact count**
  ("this will delete N future shifts"); only *group delete* confirms (`group-row-actions.tsx:128`). None
  are undoable, and none is reversible (LOGIC-024).
- **Failure feedback is poor.** Optimistic actions close their dialog and then surface any error as a line
  of text at the **top of the page** (after the dialog is gone); several employee actions
  (`swaps-client.tsx`) discard the server's error result entirely, so failures are invisible; copy is a
  generic "Something went wrong" with no recovery path (LOGIC-019).
- **Accessibility gaps.** `SimpleDialog` (every manager/owner modal) has **no dialog semantics, focus
  trap, or focus restoration**; the schedule grid is a `div` grid with **no table semantics** and empty
  cells are **icon-only add buttons with no accessible name**.
- **Mobile is rough for the primary user.** The 939-line schedule builder
  (`components/manager/schedule-client.tsx`) shows **fewer than three days at once** on a phone and shares
  **one `pending` flag across every header button** (so all buttons spin together); the loading skeleton
  doesn't match the real grid, causing a layout jump. The Employee **Account page is unreachable on
  desktop** and the mobile nav is doubled.
- **No i18n.** All strings and date/time formats are hardcoded en-US.
- **Swap dead-ends.** A swap stuck in `pending_employee` (recipient never responds, no expiry — LOGIC-010)
  has **no manager resolution path**; the manager can only act once it reaches `accepted_by_employee` /
  `pending_manager`.

---

## 5. Recommended Action Plan / Product Roadmap

### Phase 1 — Core Logic Fixes (pre-launch, must-do before any paid or production use)
- **LOGIC-001** overnight/`→00:00` hour math (all 3 surfaces) + `end > start` template guard + document
  overnight date attribution.
- **LOGIC-002** double-booking/overlap check on `addShift`, `updateShift`, `copyFromLastWeek`, `approveSwap`.
- **LOGIC-003** enforce `schedule.status` in all shift-mutating actions (+ re-notify on published edits).
- **LOGIC-007 / LOGIC-008** exclude draft schedules from payroll and from the employee schedule view.
- **LOGIC-009** atomic approve+reassign, recipient re-validation, correct `extra_hours` handling.
- **LOGIC-005 / LOGIC-006** orphan handling + impact previews on manager/employee deactivation.
- Quick wins: LOGIC-013 (cache tags), LOGIC-018 (rounding), LOGIC-019 (log swallowed errors),
  LOGIC-011/016 (copy/delete safety), confirmation dialogs on destructive actions (§4).

### Phase 2 — Essential Launch Features (make it a sellable product)
- Wire the notification system to real writers + an email/push channel (LOGIC-004).
- Self-serve company signup + billing/subscription; fix/replace public sign-up (LOGIC-021).
- Time-off / leave + availability capture.
- User-lifecycle: reactivation, co-manager/delegation, owner-level scheduling (LOGIC-005/024, §4 owner).
- Bulk shift assignment + drag-to-fill; timezone-per-company (LOGIC-015).
- Populate the audit log (LOGIC-020).

### Phase 3 — Market Expansion (move from "usable" to "competitive")
- Time tracking / clock in-out (+ break rules), turning scheduled → actual hours.
- Overtime & labor-law compliance engine; open/unassigned shifts & bidding.
- Multi-location/site model; labor-cost & budget forecasting; in-app analytics with date ranges.
- Integrations / public API / webhooks; native mobile app or PWA with offline; i18n & multi-currency;
  GDPR export/erasure tooling.

---

*Prepared as a read-only audit; no application code was modified. All line references reflect the source as
read on 2026-07-22. Findings rated Critical/High were manually re-verified against the cited code.*
