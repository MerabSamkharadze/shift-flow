# Comprehensive Application Security Audit Report
**Project:** shift-flow · **Stack:** Next.js 14.2.35 (App Router) + Supabase (`@supabase/ssr`) · **Assessed:** 2026-07-21 · **Branch:** main
**Methodology:** OWASP Top 10 (2021), CWE, secure-coding review. Static source review + adversarial multi-agent verification. Deployment status per owner: **pre-launch / development**. RLS status per owner: **not configured**.

## 1. Executive Summary

**Scope.** Full repository: middleware, all 27 server actions across 5 action files, 2 API routes, the entire `lib/supabase/*` + `lib/cache.ts` data layer, all auth flows and route-group layouts, every client component, configuration, secrets, and the dependency tree (`package.json` + lockfile + live `npm audit`).

**Posture.** The **application-layer** authorization is, surprisingly, mostly disciplined — every server action calls a `getXProfile()` guard that server-validates the session (`supabase.auth.getUser()`) and re-checks role against the DB, and most write paths carry ownership predicates (`.eq("manager_id", profile.id)` etc.). That is genuinely good and is why several theoretical findings were downgraded.

**But the security model has a hole at its foundation.** The app documents Row-Level Security (`middleware.ts:40`) as "the actual security," yet **no RLS policies, SQL, or migrations exist anywhere in the repo, and RLS is confirmed disabled on the project.** With RLS off, the **publishable (anon) key that ships in the browser bundle is a direct, unauthenticated read/write gateway to every table** — an attacker bypasses the entire well-built app layer by talking to PostgREST directly. This single gap dominates the risk profile and makes the app **not safe to launch** until fixed. Separately, two service-role code paths (`approveSwap`/`rejectSwap`) are cross-tenant IDORs that remain exploitable **even after RLS is enabled**, because the service role bypasses RLS by design.

**Risk breakdown**

| Severity | Count | IDs |
|---|---|---|
| **Critical** | 1 | SEC-001 |
| **High** | 3 | SEC-002, SEC-003, SEC-004 |
| **Medium** | 5 | SEC-005, SEC-006, SEC-007, SEC-008, SEC-009 |
| **Low** | 9 | SEC-010 … SEC-018 |
| **Info / Supply-chain** | 1 | SEC-019 |
| **Total** | **19** | |

## 2. Risk Matrix Summary

| ID | Severity | Category (OWASP / CWE) | Title | Affected File(s) |
|---|---|---|---|---|
| SEC-001 | **Critical** | A01:2021 / CWE-1220, CWE-306, CWE-284 | RLS disabled → browser publishable key grants anonymous full read/write to the entire database | Supabase project (no RLS); `lib/supabase/client.ts`, `.env`, `middleware.ts:40` |
| SEC-002 | **High** | A01:2021 / CWE-639 (IDOR) | `approveSwap` / `rejectSwap` reassign/mutate any swap cross-tenant via service-role client (no ownership check) | `app/actions/manager.ts:283-360` |
| SEC-003 | **High** | A01:2021, A07:2021 / CWE-613 | Deactivation (`is_active=false`) is cosmetic — no session revocation and `is_active` never checked anywhere | `app/actions/manager.ts:258`, `owner.ts:83`, `lib/auth.ts`, both API routes |
| SEC-004 | **High** | A01:2021 / CWE-639, CWE-862 | Shift/template/member mutations act on a bare `id` with no ownership predicate (RLS-dependent; RLS is off) | `app/actions/schedule.ts:256,290,313,333`; `manager.ts:141,191` |
| SEC-005 | **Medium** | A01:2021 / CWE-601 | Open redirect via unvalidated `next` param after session is established | `app/auth/callback/route.ts:8-11`; `app/auth/confirm/confirm-client.tsx:17,27,75` |
| SEC-006 | **Medium** | A04:2021, A07:2021 / CWE-307, CWE-770 | No rate limiting on login, password reset, or invite (credential stuffing, email-bombing, enumeration) | `components/login-form.tsx`, `forgot-password-form.tsx`, `manager.ts:211`, `owner.ts:30` |
| SEC-007 | **Medium** | A05:2021 / CWE-1021, CWE-693 | No security headers (no CSP, HSTS, X-Frame-Options, etc.) → clickjacking of privileged dashboards | `next.config.mjs`, `middleware.ts` |
| SEC-008 | **Medium** | A05:2021, A01:2021 / CWE-209, CWE-204 | Raw DB error messages returned to client; invite flow is a user-enumeration oracle | `app/actions/*.ts` (widespread), `app/api/export-monthly-report/route.ts:109` |
| SEC-009 | **Medium** | A04:2021, A08:2021 / CWE-639, CWE-841 | Swap integrity gaps: unvalidated `toUserId`/`userId`/`templateId`, `takePublicShift` no group check, deadline not re-checked at claim/approve | `app/actions/employee.ts:39,210`; `schedule.ts:200` |
| SEC-010 | **Low** | A03:2021, A04:2021 / CWE-20 | No input-validation library; unchecked `as string` casts; unbounded/negative `extra_hours` feeds payroll | `app/actions/*.ts`; `schedule.ts:333` |
| SEC-011 | **Low** | A04:2021 / CWE-306 | `clearMustChangePassword` self-clears the forced-password flag with no proof a password was set (self-scoped; no escalation) | `app/actions/auth.ts:10-26` |
| SEC-012 | **Low** | A05:2021 / CWE-1004, CWE-614 | `sf-role` cookie is client-writable, non-`Secure` (UX redirect hint only); `employee/account` page missing role check | `components/login-form.tsx:73`; `middleware.ts:41`; `app/(dashboard)/employee/account/page.tsx:7` |
| SEC-013 | **Low** | A07:2021 / CWE-521 | Weak & inconsistent password policy (reset path has 0 client checks; all client-side only) | `components/update-password-form.tsx`, `sign-up-form.tsx`, `auth/change-password-form.tsx` |
| SEC-014 | **Low** | A01:2021 / CWE-352 | State-changing GET signout (CSRF logout); does not clear `sf-role` | `app/auth/signout/route.ts:8-14` |
| SEC-015 | **Low** | A03:2021 / CWE-116 | `Content-Disposition` filename spoofing via unvalidated `weekStart` + `group.name` (no response splitting) | `app/api/export-schedule/route.ts:453,460` |
| SEC-016 | **Low** | A01:2021 / CWE-601 | `router.push(action_url)` on a DB text column with no scheme allowlist (real sink; write-path only under RLS-off) | `components/layout/notification-bell.tsx:106-108` |
| SEC-017 | **Low** | A05:2021 / CWE-312, CWE-295 | Secrets hygiene: `.gitignore` gap (`.env.production`/`.env.development` not ignored), commented `NODE_TLS_REJECT_UNAUTHORIZED=0` footgun, live service key in plaintext `.env` (never committed) | `.env`, `.gitignore:32-34` |
| SEC-018 | **Low** | A04:2021 / CWE-362 | Update actions never check affected-row count → silent success on races / no-op writes | `app/actions/employee.ts`, `manager.ts` (swap updates) |
| SEC-019 | **Info** | A06:2021 / CWE-1104, CWE-1395 | Supply chain: `"latest"` pins on both Supabase packages; 14 `npm audit` findings (11 high, dev/lint); `prettier` in prod deps; leftover starter components | `package.json`, `package-lock.json` |

## 3. Detailed Findings

### [SEC-001] RLS disabled → the browser publishable key is an anonymous full-database read/write gateway
- **Severity:** Critical
- **OWASP:** A01:2021 – Broken Access Control (also A02 sensitive-data exposure)
- **CWE:** CWE-1220 (Insufficient Granularity of Access Control), CWE-306 (Missing Authentication for Critical Function), CWE-284
- **Location:** Supabase project (no RLS); `lib/supabase/client.ts:5-8`; `.env`; security model declared in `middleware.ts:39-40`
- **Description.** Supabase exposes every `public`-schema table over an auto-generated PostgREST HTTP API. By default the `anon` and `authenticated` Postgres roles are **granted** table access, and **Row-Level Security is the *only* thing that restricts which rows a request may read or write.** RLS is confirmed **not configured** here, and the repo contains no policy/SQL/migration artifacts. Meanwhile `lib/supabase/client.ts` hands the **publishable (anon) key** to a browser client, and that key is embedded in the shipped JS bundle (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public by construction). The app's careful server-side role checks are therefore **irrelevant to an attacker**, who never touches the app — they query PostgREST directly with the public key.
- **Impact.** Anyone on the internet (no account required) can:
  - **Exfiltrate all PII** — `SELECT * FROM users` returns every employee's `email`, `phone`, `first_name`, `last_name`, `role`, and `company_id` **across all tenants** (`lib/types/database.types.ts:63-101`). Same for `shifts.notes`, `shift_swaps.manager_notes`, and `activity_logs` (including `ip_address`).
  - **Write/escalate/destroy** — `UPDATE users SET role='owner' WHERE id='<self>'`, reassign shifts, insert forged `notifications` (see SEC-016), or `DELETE` any row.
  This is a complete confidentiality + integrity + tenant-isolation failure. It subsumes and amplifies SEC-004, SEC-009, SEC-016.
- **Proof of Concept / Exploitation Scenario.**
  1. Open the deployed site; read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the page's JS (both are public).
  2. From any machine, unauthenticated:
     ```bash
     curl "https://<PROJECT>.supabase.co/rest/v1/users?select=email,phone,first_name,last_name,role,company_id" \
       -H "apikey: <PUBLISHABLE_KEY>"
     ```
  3. If rows return, the entire user table is world-readable. Repeat against `shifts`, `shift_swaps`, `activity_logs`. A `PATCH`/`POST`/`DELETE` with the same key confirms write access.
  *(Empirical confirmation is fast and definitive — run step 2 against your own project. If it returns data, this Critical is proven.)*
- **Recommended Remediation.**
  1. **Enable RLS on every `public` table** and write policies before any launch. Minimum:
     ```sql
     ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.companies    ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.groups       ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.schedules    ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.shifts       ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.shift_swaps  ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
     ```
     Then per-table policies scoped by `company_id`/ownership. The repo already ships the helper RPCs `get_my_company_id()` and `get_my_role()` (`lib/types/database.types.ts:558-567`) — use them:
     ```sql
     -- Example: a user may read only rows in their own company
     CREATE POLICY users_select_same_company ON public.users
       FOR SELECT USING (company_id = public.get_my_company_id());
     -- Example: nobody may change their own role/company via the API
     CREATE POLICY users_update_self_safe ON public.users
       FOR UPDATE USING (id = auth.uid())
       WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()));
     ```
  2. **Check RLS in `USING` *and* `WITH CHECK`** for write policies (reads and writes are gated separately).
  3. **Commit the policies as versioned SQL** (`supabase/migrations/*.sql`) so this is auditable in git — its absence is what made this invisible.
  4. Keep RLS as defense-in-depth *behind* the app layer, not instead of it.

---

### [SEC-002] `approveSwap` / `rejectSwap` — cross-tenant IDOR via the service-role client
- **Severity:** High
- **OWASP:** A01:2021 – Broken Access Control
- **CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)
- **Location:** `app/actions/manager.ts:283-334` (`approveSwap`), `app/actions/manager.ts:336-360` (`rejectSwap`)
- **Description.** Both actions authenticate the caller as *a* manager via `getManagerProfile()` (which even selects `company_id`) but then operate through `createServiceClient()` — which **bypasses RLS entirely** — filtering only on `.eq("id", swapId)` + status. `profile.company_id` is fetched and discarded. There is no join to `shifts → schedules → groups.manager_id` and no `company_id` predicate. This is the one class of finding that **survives even after RLS is enabled**, because the service role is exempt from RLS by design.
- **Impact.** Any authenticated manager, in any company, can approve or reject **any swap in the entire database** by supplying its UUID — reassigning a shift in another tenant (`.eq("id", swap.shift_id)`, line 309, with no status or tenant filter) and stamping their own id into `approved_by`/`modified_by`, or writing attacker-controlled `manager_notes` into a foreign tenant's record. Verified by all 3 independent skeptics (0/3 refuted, consensus High). Rated High rather than Critical only because the read paths are correctly scoped, so the app provides no in-UI oracle for foreign swap UUIDs — *however, with SEC-001 unfixed, an attacker can read those UUIDs straight from the DB, removing that mitigation.*
- **Proof of Concept.**
  1. Attacker is a manager at Company A (valid session).
  2. Obtain a `swapId` from Company B (via SEC-001 `SELECT id FROM shift_swaps`, a leaked log, or holding accounts in two orgs).
  3. POST the `approveSwap` server action with that `swapId` (server actions are public HTTP endpoints — no UI needed).
  4. Company B's shift is reassigned; the swap is marked `approved` by the attacker.
- **Recommended Remediation.** Enforce tenant/ownership *before* the service write. The sibling `deactivateEmployee` (`manager.ts:266-268`) already shows the correct pattern.
  ```ts
  // BEFORE (manager.ts:288-293) — no tenant scoping
  const { data: swap } = await service.from("shift_swaps")
    .select("id, shift_id, from_user_id, to_user_id, accepted_by, type")
    .eq("id", swapId)
    .in("status", ["accepted_by_employee", "pending_manager"])
    .single();

  // AFTER — resolve via a join to the manager's own groups (do the read on the RLS client,
  // and/or add an explicit company/manager predicate). `shift_swaps.company_id` exists and is set at creation.
  const { data: swap } = await service.from("shift_swaps")
    .select("id, shift_id, from_user_id, to_user_id, accepted_by, type, company_id, shifts!inner(schedule_id, schedules!inner(groups!inner(manager_id)))")
    .eq("id", swapId)
    .eq("company_id", profile.company_id)                    // tenant guard
    .eq("shifts.schedules.groups.manager_id", profile.id)    // ownership guard
    .in("status", ["accepted_by_employee", "pending_manager"])
    .single();
  if (!swap) return { error: "Swap not found" };
  ```
  Apply the same `company_id` + manager-ownership predicate to `rejectSwap`.

---

### [SEC-003] Deactivation is cosmetic — no session revocation and `is_active` is never enforced
- **Severity:** High
- **OWASP:** A01:2021 – Broken Access Control; A07:2021 – Identification & Auth Failures
- **CWE:** CWE-613 (Insufficient Session Expiration)
- **Location:** `app/actions/manager.ts:258-279` (`deactivateEmployee`), `app/actions/owner.ts:83-103` (`deactivateManager`); non-enforcement in `lib/auth.ts:4-20`, `app/actions/{employee,manager,owner}.ts` guards, `middleware.ts`, both API routes
- **Description.** Deactivation only sets `users.is_active = false`. **No code path anywhere reads `is_active`** — `getSessionProfile` (`lib/auth.ts`) and every `getXProfile()` guard select `id, role, company_id` and never `is_active`. No `supabase.auth.admin.signOut()` / refresh-token revocation is called. Verified unanimously (0/3 refuted, consensus High).
- **Impact.** A "deactivated" employee or manager retains **full application access until their JWT naturally expires** (and refresh tokens keep minting new ones). Off-boarding a hostile/terminated user is ineffective — they continue to read data and invoke privileged actions. Under SEC-001 the deactivated user also still holds a working publishable-key path.
- **Proof of Concept.** Manager deactivates employee E. E's browser session keeps working: E continues to load `/employee`, create swaps, and call server actions; nothing checks `is_active`.
- **Recommended Remediation.**
  1. **Enforce `is_active` at the guard**, so it is checked on every request:
     ```ts
     // lib/auth.ts — add is_active to the select and reject inactive users
     const { data: profile } = await supabase.from("users")
       .select("id, role, company_id, must_change_password, is_active, first_name, last_name, email")
       .eq("id", user.id).single();
     if (profile && profile.is_active === false) { await supabase.auth.signOut(); return { user: null, profile: null }; }
     ```
     Mirror in each `getXProfile()` and both API routes; encode as an RLS policy too (`USING (is_active)`).
  2. **Revoke the session server-side** on deactivation using the admin API (e.g. `service.auth.admin.signOut(userId, 'global')` / delete-sessions), so existing JWTs/refresh tokens stop working immediately.

---

### [SEC-004] Shift/template/member mutations act on a bare `id` with no ownership predicate
- **Severity:** High *(in the current RLS-off state; drops to Medium once correct RLS exists, since these use the RLS-bound client)*
- **OWASP:** A01:2021 – Broken Access Control
- **CWE:** CWE-639, CWE-862 (Missing Authorization)
- **Location:** `app/actions/schedule.ts` — `updateShift:256`, `removeShift:290`, `addShiftNote:313`, `saveExtraHours:333`; `app/actions/manager.ts` — `deleteShiftTemplate:141` (accepts an unused `groupId`), `removeGroupMember:191` (accepts an unused `groupId`)
- **Description.** These mutate rows filtering only on `.eq("id", shiftId/templateId/memberId)`. They correctly use the RLS-bound `supabase` client, so *proper RLS would* backstop them — but RLS is off (SEC-001), so today they are fully exploitable, and even with RLS they are missing defense-in-depth. Note the two `manager.ts` actions accept a `groupId` argument they never use — a strong signal the ownership check was intended and dropped. Contrast `createShiftTemplate` (`manager.ts:114-121`), which *does* verify group ownership.
- **Impact.** Any authenticated manager can edit/delete/annotate any shift, delete any shift template, or remove any group member in any tenant by supplying the row's UUID. `saveExtraHours` is payroll-affecting (feeds the monthly report totals).
- **Proof of Concept.** POST `removeShift` with a `shiftId` belonging to another manager's group → the shift is deleted (the code even does a blind `update({modified_by})` first, `schedule.ts:294-297`, whose error is unchecked).
- **Recommended Remediation.** Add an ownership check before mutating, e.g. resolve the shift's group and assert `manager_id === profile.id` (the pattern `addShift` at `schedule.ts:209-225` already uses), and actually use the `groupId` param in the `manager.ts` actions:
  ```ts
  // updateShift — verify the shift's group belongs to this manager first
  const { data: owned } = await supabase.from("shifts")
    .select("id, schedules!inner(groups!inner(manager_id))")
    .eq("id", shiftId).single();
  if (!owned || (owned.schedules as any)?.groups?.manager_id !== profile.id)
    return { error: "Unauthorized" };
  ```

---

### [SEC-005] Open redirect via unvalidated `next` parameter after session establishment
- **Severity:** Medium
- **OWASP:** A01:2021 – Broken Access Control
- **CWE:** CWE-601 (URL Redirection to Untrusted Site)
- **Location:** `app/auth/callback/route.ts:8-11`; `app/auth/confirm/confirm-client.tsx:17,27,75`
- **Description.** `const next = searchParams.get("next") ?? "/"` then `NextResponse.redirect(new URL(next, origin))`. When `next` is absolute or protocol-relative (`//evil.com`), it overrides the `origin` base, producing an external redirect — and it fires **after** `exchangeCodeForSession` has set session cookies on that same response. The client-side confirm flow has the same issue via `router.replace(next)`. Verified (0/3 refuted, consensus Medium).
- **Impact.** Phishing that lands on a legitimately-authenticated flow then bounces the user to an attacker domain; the freshly-set auth context and any follow-on tokens travel with the navigation. Requires the victim to click a crafted link.
- **Proof of Concept.** `https://app/auth/callback?code=<valid>&next=//evil.com` → after cookies are set, browser is redirected to `https://evil.com`.
- **Recommended Remediation.** Allow only same-origin relative paths:
  ```ts
  const raw = searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  return NextResponse.redirect(new URL(next, origin));
  ```
  Apply the identical guard in `confirm-client.tsx` before every `router.replace(next)`.

---

### [SEC-006] No rate limiting on login, password reset, or invite
- **Severity:** Medium
- **OWASP:** A04:2021 – Insecure Design; A07:2021
- **CWE:** CWE-307 (Improper Restriction of Excessive Auth Attempts), CWE-770 (Allocation Without Limits)
- **Location:** `components/login-form.tsx:36-39`, `components/forgot-password-form.tsx:35-37`, `app/actions/manager.ts:211` (`inviteEmployee`), `app/actions/owner.ts:30` (`inviteManager`)
- **Description.** No application-level throttle exists. Login and reset call Supabase directly from the browser; invites call `service.auth.admin.inviteUserByEmail` with no cap.
- **Impact.** Unlimited credential stuffing against login; email-bombing arbitrary addresses via the reset and invite flows (the app's sender reputation is the victim); no lockout/CAPTCHA. Relies solely on Supabase's global limits.
- **Recommended Remediation.** Add per-IP + per-account rate limiting (Supabase Auth rate-limit settings + an edge/middleware limiter such as Upstash) on login, `resetPasswordForEmail`, and both invite actions; add a short cooldown/idempotency key on invites.

---

### [SEC-007] No security headers (clickjacking, no CSP/HSTS)
- **Severity:** Medium
- **OWASP:** A05:2021 – Security Misconfiguration
- **CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers), CWE-693 (Protection Mechanism Failure)
- **Location:** `next.config.mjs` (no `headers()`), `middleware.ts` (sets none)
- **Description.** None of `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` are emitted.
- **Impact.** The privileged manager/owner dashboards (approve-swap, deactivate-user, invite) are fully framable → clickjacking. No CSP means any injected content would execute unconstrained (raising the impact of any future XSS).
- **Recommended Remediation.** Add an `async headers()` block to `next.config.mjs`:
  ```js
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; default-src 'self'; ..." },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ]}];
  }
  ```

---

### [SEC-008] Raw DB error messages returned to client; invite flow is a user-enumeration oracle
- **Severity:** Medium
- **OWASP:** A05:2021; A01:2021
- **CWE:** CWE-209 (Information Exposure Through Error Message), CWE-204 (Observable Response Discrepancy)
- **Location:** widespread `return { error: error.message }` across `app/actions/*.ts` (e.g. `auth.ts:24`, `manager.ts:49,68,90,131,149,180,199,230,244,270`, `owner.ts:54,69,95`, `employee.ts:51,80,132,157,…`); `app/api/export-monthly-report/route.ts:109-111`
- **Description.** Supabase/Postgres error strings (column names, constraint names, schema hints) are forwarded verbatim to the client. The invite actions return `inviteError.message` (`owner.ts:54`, `manager.ts:230`), so inviting an already-registered address yields a distinct "user already exists" message — a **user-enumeration oracle**. *(Login itself is clean — `login-form.tsx:42` returns a generic message.)*
- **Impact.** Schema disclosure aids further attacks; managers/owners can enumerate which emails have accounts.
- **Recommended Remediation.** Log the real error server-side; return a generic message to the client. For invites, return an identical response whether or not the address already exists.

---

### [SEC-009] Swap integrity: unvalidated participants, missing group check, deadline bypass
- **Severity:** Medium
- **OWASP:** A04:2021 – Insecure Design; A08:2021 – Data Integrity Failures
- **CWE:** CWE-639, CWE-841 (Improper Enforcement of Behavioral Workflow)
- **Location:** `app/actions/employee.ts:39-89` (`createDirectSwap`), `:210-240` (`takePublicShift`), `app/actions/schedule.ts:200-254` (`addShift`)
- **Description.** (a) `createDirectSwap` writes `toUserId` via service role with **no check** that it is an employee / active / same company / same group (`employee.ts:73`). (b) `takePublicShift` validates type/status/not-own but **not group or company membership** — the group filter exists only in the UI data layer (`lib/cache.ts:940-945`), not in the action. (c) `addShift` writes `assigned_to: userId` with no group-membership check and fetches `templateId` without checking it belongs to the schedule's group (`schedule.ts:209-226`). (d) The 8-hour deadline is enforced only at swap *creation*, never re-checked in `takePublicShift` or `approveSwap` — a swap created before the deadline can be claimed/approved after the shift has passed.
- **Impact.** Cross-group/cross-tenant shift assignment and swap claiming; data poisoning of assignments; deadline rule trivially bypassed. Under SEC-001 these are directly reachable; even with RLS on, the missing participant validation is a logic flaw.
- **Recommended Remediation.** Validate every user/template/shift id against the caller's company and group membership (join through `group_members`); re-check `shiftDeadline` in `takePublicShift` and `approveSwap`.

---

### [SEC-010] No input-validation library; unchecked casts; unbounded `extra_hours` feeds payroll
- **Severity:** Low
- **OWASP:** A03:2021 – Injection (input handling); A04:2021
- **CWE:** CWE-20 (Improper Input Validation)
- **Location:** `app/actions/*.ts` (all `formData.get(...) as string`); `app/actions/schedule.ts:333-359`
- **Description.** No zod/yup/joi anywhere. `FormData.get()` (which returns `string | File | null`) is cast with `as string`; no email/UUID/date/number-format validation; `inviteEmployee`/`inviteManager` do no email-format check. `saveExtraHours` accepts a negative or absurd number that flows unclamped into payroll totals (`export-monthly-report/route.ts:124-141`, `existing.extraHours += extra`, no `Math.max(0,…)`). Not a SQL-injection risk (PostgREST parameterizes), but an integrity/robustness gap. *(Server actions are public HTTP endpoints — TypeScript types do not validate at runtime.)*
- **Impact.** Payroll figures can be silently reduced or inflated; malformed dates write `"NaN-NaN-NaN"`; crafted payloads bypass UI-only checks.
- **Recommended Remediation.** Introduce `zod` schemas at the top of each server action / route handler; validate UUIDs, emails, `HH:MM` times, `YYYY-MM-DD` dates, and clamp `extra_hours` to a sane non-negative range.

---

### [SEC-011] `clearMustChangePassword` self-clears the forced-password flag without proof a password was set
- **Severity:** Low *(downgraded from initial suspicion after adversarial review — 3/3 refuted as a privilege issue)*
- **OWASP:** A04:2021 – Insecure Design
- **CWE:** CWE-306
- **Location:** `app/actions/auth.ts:10-26`; client caller `components/auth/change-password-form.tsx:43,51`
- **Description.** The action takes no arguments, checks only that a session exists (no role check), and uses the service-role client to set `must_change_password=false`. The actual password set (`supabase.auth.updateUser`) is a separate, unlinked client-side step. **However**, the write is hard-scoped to the caller's own row (`.eq("id", user.id)`, line 22) — there is no horizontal or vertical escalation, and the only caller is the legitimate account holder acting on themselves (a session in the pre-password state requires the single-use invite token from the invitee's own mailbox). The role was already granted by the inviter.
- **Impact.** A user can skip *their own* forced-password-set gate — a UX/onboarding-integrity weakness, not a privilege escalation. Real impact is low.
- **Recommended Remediation.** Set `must_change_password=false` server-side *as part of* the password update (verify the password was actually changed, e.g. via a server action that calls `updateUser` and clears the flag atomically), rather than as an independent client-triggered write.

---

### [SEC-012] `sf-role` cookie is client-writable & non-`Secure`; `employee/account` missing role check
- **Severity:** Low *(downgraded — 3/3 refuted as an access-control primitive)*
- **OWASP:** A05:2021
- **CWE:** CWE-1004 (Sensitive Cookie Without HttpOnly), CWE-614 (Sensitive Cookie Without Secure)
- **Location:** `components/login-form.tsx:73`; read at `middleware.ts:41-52`; `app/(dashboard)/employee/account/page.tsx:7`
- **Description.** `sf-role` is set from JS (`document.cookie`), so it is inherently forgeable and lacks `Secure`/`Max-Age`. **But it is read in exactly one place** and only selects a redirect target — it is **not an authorization input**. All 12 dashboard pages independently re-derive role from the DB via `getSessionProfile()`, so forging it merely lands a user on a route from which the server-side check immediately redirects them. The one page missing its explicit role check — `employee/account/page.tsx:7` (session-only) — renders only the *caller's own* profile, so it leaks nothing.
- **Impact.** Negligible today (cosmetic redirect only). Worth hardening so it is never elevated into a trust decision by future code.
- **Recommended Remediation.** Add `Secure` + an explicit `Max-Age`; treat it as a UX hint only (already the case); add the `profile.role !== "employee"` check to `employee/account/page.tsx` for consistency; clear `sf-role` in `app/auth/signout/route.ts` (see SEC-014).

---

### [SEC-013] Weak and inconsistent password policy (all client-side only)
- **Severity:** Low
- **OWASP:** A07:2021
- **CWE:** CWE-521 (Weak Password Requirements)
- **Location:** `components/update-password-form.tsx:34` (0 checks), `components/sign-up-form.tsx` (match only), `components/auth/change-password-form.tsx:29` (min 8)
- **Description.** The password *reset* path enforces no length/complexity; the invite path enforces 8; sign-up enforces only that the two fields match. All are client-side and bypassable by calling `supabase.auth.updateUser` directly, so the only enforceable control is the Supabase project Auth password policy (not in the repo).
- **Impact.** Users can set weak passwords (especially via reset); inconsistent UX.
- **Recommended Remediation.** Configure a strong password policy in the Supabase dashboard (min length, complexity, breach check); align all three forms to the same client-side minimum for UX.

---

### [SEC-014] State-changing GET signout (CSRF logout); does not clear `sf-role`
- **Severity:** Low
- **OWASP:** A01:2021
- **CWE:** CWE-352 (CSRF)
- **Location:** `app/auth/signout/route.ts:8-14`
- **Description.** `signOut()` runs on a plain `GET` in `PUBLIC_PATHS`, with no CSRF token. Server Actions get Next's Origin/Host protection; this GET does not. It also does not delete `sf-role` (only `components/layout/logout-button.tsx:18` does), leaving a stale cookie.
- **Impact.** A cross-site `<img src="/auth/signout">` forcibly logs the victim out (session denial / annoyance). Low.
- **Recommended Remediation.** Make signout `POST`-only (or verify Origin); clear `sf-role` in the route for symmetry.

---

### [SEC-015] `Content-Disposition` filename spoofing (no response splitting)
- **Severity:** Low *(downgraded — 3/3 refuted; CRLF splitting not achievable)*
- **OWASP:** A03:2021
- **CWE:** CWE-116 (Improper Encoding/Escaping of Output)
- **Location:** `app/api/export-schedule/route.ts:453,460`
- **Description.** `fileName` interpolates unvalidated `weekStart` (presence-checked only, line 98) and `group.name` (only `\s+`→`_`) into the header. A `"` breaks out of `filename="…"`. **Full response splitting is *not* possible** — Next/undici rejects CR/LF in header values (a newline throws → 500). Only in-value quote/semicolon manipulation survives, and because both inputs originate from the same manager who receives the download, it is largely self-inflicted. Contrast `export-monthly-report/route.ts:53`, which regex-validates.
- **Impact.** Download filename/extension spoofing on one's own request. Minimal.
- **Recommended Remediation.** Validate `weekStart` with `/^\d{4}-\d{2}-\d{2}$/` (as monthly does) and sanitize the filename to `[A-Za-z0-9_\-]`.

---

### [SEC-016] `router.push(action_url)` with no scheme allowlist
- **Severity:** Low *(sink is real; write-path only materializes under SEC-001)*
- **OWASP:** A01:2021
- **CWE:** CWE-601
- **Location:** `components/layout/notification-bell.tsx:106-108`
- **Description.** `action_url` (a free-text `notifications` column) is passed to `router.push` with no validation. Next 14 routes external/`javascript:` URLs through `window.location.assign` — an external `https://` value is a genuine open redirect (`javascript:` is blocked by modern browsers via `location.assign`). No application code inserts `notifications` (only trigger-written), **but with RLS disabled (SEC-001), anyone can `INSERT` a notification row targeting any `user_id` with a malicious `action_url`**, turning this into a stored open redirect.
- **Impact.** Stored open-redirect once an attacker can write notifications (which SEC-001 permits).
- **Recommended Remediation.** Allowlist `action_url` to same-origin relative paths before `router.push`; constrain the column via RLS/trigger to internal path templates.

---

### [SEC-017] Secrets hygiene: `.gitignore` gap, TLS footgun, plaintext service key
- **Severity:** Low
- **OWASP:** A05:2021
- **CWE:** CWE-312 (Cleartext Storage), CWE-295 (Improper Certificate Validation)
- **Location:** `.env`, `.gitignore:32-34`
- **Description.** (a) `.env` was **never committed** (git history verified clean) and is gitignored — good — but `.gitignore` covers only `.env` and `*.local`; **`.env.production` and `.env.development` are NOT ignored** (verified via `git check-ignore`), exactly where a prod service key would land. (b) `.env` contains a commented `#$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"` — inert today, but one keystroke from globally disabling TLS verification. (c) The live `SUPABASE_SERVICE_ROLE_KEY` sits in plaintext in the working tree.
- **Impact.** Latent risk of committing a prod secret; latent MITM footgun.
- **Recommended Remediation.** Broaden `.gitignore` to `.env*` with `!.env.example`; delete the `NODE_TLS_REJECT_UNAUTHORIZED` line; rotate the service-role key as a precaution (no repo leak exists, so this is hygiene, not incident response).

---

### [SEC-018] Update actions never check affected-row count → silent success on races
- **Severity:** Low
- **OWASP:** A04:2021
- **CWE:** CWE-362 (Race Condition)
- **Location:** `app/actions/employee.ts` (`takePublicShift:226`, `acceptSwap`/`rejectSwap`/`cancelSwap:149-208`), `app/actions/manager.ts` (swap updates)
- **Description.** Supabase `.update().eq()` returns `{ error: null }` when zero rows match. None of these actions inspect the affected-row count, so a no-op update (already-claimed shift, already-resolved swap) reports success.
- **Impact.** Two employees claiming the same public shift both see "success"; a manager "rejects" an already-resolved swap and is told it worked. Confusing UX / potential double-booking assumptions downstream.
- **Recommended Remediation.** Add `.select()` to the update and verify a row was returned; otherwise return a conflict error.

---

## 4. Third-Party & Supply-Chain Audit
*(Live `npm audit` / `npm outdated` — results quoted, not fabricated.)*

**Dependencies & versions**
- `next` declared `^14.2.15`, **installed 14.2.35** → **patched** against CVE-2025-29927 (middleware bypass, fixed 14.2.25) and CVE-2024-51479 (fixed 14.2.15). The caret range is what saved it — the *declared floor* predates the 29927 fix, so a forced minimum install would be exposed. **Recommend raising the floor to `^14.2.25`.**
- **`@supabase/ssr` and `@supabase/supabase-js` pinned to `"latest"`** — a real supply-chain risk (non-reproducible; auto-adopts any future/compromised release the moment the lockfile is regenerated). Installed 0.8.0 / 2.97.0; both are badly behind (0.12.3 / 2.110.7). **Repin to explicit caret ranges and update.**

**`npm audit`:** 14 findings (11 high, 3 moderate, 0 critical). The 11 high are all in the **dev/lint toolchain** (`eslint-config-next` → `@next/eslint-plugin-next` → `glob`/`brace-expansion`) or transitive `ws` — none shipped to production; their fix needs a major `eslint-config-next` bump (14→16). The only **direct prod** finding is **`exceljs`** (moderate, via bundled `uuid`); npm's suggested "fix" is a semver-major downgrade — better to wait for an exceljs release that bumps `uuid` or accept the low real-world risk.

**Hygiene**
- `prettier@^3.8.1` is under `dependencies` (production) — move to `devDependencies`.
- Leftover Supabase starter components ship in the repo (`components/tutorial/*`, `hero.tsx`, `deploy-button.tsx`, `env-var-warning.tsx`, `supabase-logo.tsx`, `next-logo.tsx`). Next tree-shakes unimported ones out of client bundles, so bundle impact is ~0, but `env-var-warning.tsx` can surface config state and they add reviewer noise — remove after confirming zero importers. `deploy-button.tsx:9` and `sign-up-user-steps.tsx:60,69` use `target="_blank"` without `rel` (static hrefs — Info).

**Secrets / config (see SEC-017):** `.env` never committed (verified); `.gitignore` gap for `.env.production`/`.env.development`; commented TLS-disable footgun. No custom crypto and no `Math.random` in any security path (clean — all hashing/JWT/randomness delegated to Supabase/GoTrue). No Dockerfile/compose/CI/vercel.json in the repo (deployment config is out-of-repo).

## 5. Prioritized Action Plan

**Immediate (block launch until done)**
1. **SEC-001 — Enable RLS on all 10 tables with `company_id`/ownership policies**, committed as versioned SQL. Empirically verify with the `curl` PoC first. *This is the single most important item.*
2. **SEC-002 — Add tenant + ownership predicates to `approveSwap`/`rejectSwap`** (service-role paths that RLS cannot backstop).
3. **SEC-003 — Enforce `is_active` in `lib/auth.ts` + every guard, and revoke sessions on deactivation.**
4. **SEC-004 — Add ownership checks to the bare-`id` shift/template/member mutations.**

**Short-term (before real users)**
5. SEC-005 open-redirect guard on `next`. 6. SEC-006 rate limiting on auth + invite. 7. SEC-007 security headers. 8. SEC-008 generic errors + non-enumerable invites. 9. SEC-009 swap participant/group/deadline validation. 10. SEC-019 repin `"latest"` deps, raise Next floor to `^14.2.25`.

**Long-term hardening**
11. SEC-010 adopt `zod` validation across server actions; clamp `extra_hours`. 12. SEC-011–SEC-018 — atomic password-flag clear, `sf-role` hardening + missing role check, password policy, POST-only signout, filename/`action_url` sanitization, `.gitignore` + TLS-footgun cleanup + key rotation, affected-row-count checks. 13. Remove starter scaffolding; move `prettier` to devDeps.

## 6. Verification (how to confirm findings & fixes end-to-end)
- **SEC-001 (definitive):** run the unauthenticated `curl` in the PoC against your project URL + publishable key. Rows returned = confirmed. After enabling RLS, the same call must return `[]` / an RLS error.
- **SEC-002 / SEC-004:** as a manager in Company A, POST the server action with a Company-B UUID (obtainable via SEC-001) → must return "Unauthorized" after the fix.
- **SEC-003:** deactivate a test user, confirm their existing session is rejected on the next request.
- **SEC-005:** `…/auth/callback?code=x&next=//evil.com` → must redirect to `/`, not the external host.
- **Regression:** `npm run build` + `npm run lint` after remediation; re-run `npm audit`.

---
*Prepared via static source review and adversarial multi-agent verification (3 independent skeptics per finding). Severities reflect the confirmed RLS-disabled, pre-launch state. Two items could not be fully resolved from source and are called out inline: the exact Supabase RLS/grant state (verify empirically via the SEC-001 PoC) and the Auth redirect-URL allowlist (verify in the Supabase dashboard).*
