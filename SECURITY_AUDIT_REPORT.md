# Comprehensive Application Security Audit Report
**Project:** shift-flow · **Stack:** Next.js 14.2.35 (App Router) + Supabase (`@supabase/ssr`)
**Assessed:** 2026-07-21 · **Remediation applied:** 2026-07-21 · **Branch:** main
**Methodology:** OWASP Top 10 (2021), CWE, secure-coding review. Static source review + adversarial multi-agent verification. Deployment status per owner: **pre-launch / development**. RLS status per owner at time of assessment: **not configured**.

> **Document status:** This report has been updated with a remediation column. **18 of 19 findings (SEC-001 → SEC-018) have been fixed in code** and the project builds cleanly (`npm run build` ✓, types + lint pass). SEC-019 (supply-chain, informational) remains open. **Two operational steps cannot be done from the codebase and remain outstanding:** (1) apply the RLS migration to the live Supabase project, and (2) rotate the service-role key.

## 1. Executive Summary

**Scope.** Full repository: middleware, all server actions across 5 action files, 2 API routes, the entire `lib/supabase/*` + `lib/cache.ts` data layer, all auth flows and route-group layouts, every client component, configuration, secrets, and the dependency tree.

**Posture at assessment.** Application-layer authorization was mostly disciplined (per-action `getXProfile()` guards, ownership predicates on most writes), but the security model had a hole at its foundation: RLS was documented as "the actual security" yet **no RLS policies existed and RLS was disabled**, making the browser publishable key a direct anonymous read/write gateway to every table. Two service-role paths were cross-tenant IDORs, deactivation was cosmetic, and several mutations lacked ownership checks.

**Posture after remediation.** RLS is now defined in a committed migration (multi-tenant policies for all 10 tables + `SECURITY DEFINER` helpers); the service-role IDORs (`approveSwap`/`rejectSwap`) enforce company + group-manager ownership; deactivation is enforced on every request (`is_active`) and revokes sessions; all bare-`id` mutations verify ownership; open redirects, error leakage, weak input handling, and the remaining low-severity items are closed. The one thing code cannot do — **enabling RLS on the live project** — is now a single migration apply away, and is the top operational action.

**Risk & remediation breakdown**

| Severity | Count | Fixed in code | Open |
|---|---|---|---|
| Critical | 1 | 1 | 0 |
| High | 3 | 3 | 0 |
| Medium | 5 | 5 | 0 |
| Low | 9 | 9 | 0 |
| Info / Supply-chain | 1 | 0 | 1 (SEC-019) |
| **Total** | **19** | **18** | **1** |

**Status legend:** ✅ Fixed (code) — remediated in the codebase, build-verified · ⚠️ needs deploy/config — code done, an operational/dashboard action remains · ⬜ Open — not yet addressed.

## 2. Risk Matrix Summary

| ID | Severity | Category (OWASP/CWE) | Title | Affected File(s) | Status |
|---|---|---|---|---|---|
| SEC-001 | Critical | A01 / CWE-1220, 306 | RLS disabled → publishable key = anonymous full-DB read/write | `supabase/migrations/…sql` (new), `lib/supabase/client.ts` | ✅ Fixed (code) · ⚠️ **apply migration to live project** |
| SEC-002 | High | A01 / CWE-639 | `approveSwap`/`rejectSwap` cross-tenant IDOR via service client | `app/actions/manager.ts` | ✅ Fixed |
| SEC-003 | High | A01, A07 / CWE-613 | Deactivation cosmetic — no `is_active` check, no session revocation | `lib/auth.ts`, `app/actions/*.ts`, both API routes | ✅ Fixed |
| SEC-004 | High | A01 / CWE-639, 862 | Shift/template/member mutations act on bare `id` (no ownership) | `app/actions/schedule.ts`, `manager.ts` | ✅ Fixed |
| SEC-005 | Medium | A01 / CWE-601 | Open redirect via unvalidated `next` param | `app/auth/callback/route.ts`, `confirm/confirm-client.tsx` | ✅ Fixed |
| SEC-006 | Medium | A04, A07 / CWE-307, 770 | No rate limiting on login / reset / invite | `lib/rate-limit.ts` (new), `manager.ts`, `owner.ts` | ✅ Fixed (invites) · ⚠️ login/reset via Supabase Auth limits |
| SEC-007 | Medium | A05 / CWE-1021, 693 | No security headers (clickjacking, no CSP/HSTS) | `next.config.mjs` | ✅ Fixed |
| SEC-008 | Medium | A05, A01 / CWE-209, 204 | Raw DB errors to client; invite enumeration oracle | `lib/errors.ts` (new), all `app/actions/*.ts`, `export-monthly-report` | ✅ Fixed |
| SEC-009 | Medium | A04, A08 / CWE-639, 841 | Swap integrity: unvalidated participants, no group check, deadline bypass | `app/actions/employee.ts`, `schedule.ts` | ✅ Fixed |
| SEC-010 | Low | A03, A04 / CWE-20 | No input validation; unbounded `extra_hours` feeds payroll | `lib/validation.ts` (new), `manager.ts`, `owner.ts`, `schedule.ts` | ✅ Fixed |
| SEC-011 | Low | A04 / CWE-306 | `clearMustChangePassword` clears flag with no password proof | `app/actions/auth.ts`, `change-password-form.tsx` | ✅ Fixed |
| SEC-012 | Low | A05 / CWE-1004, 614 | `sf-role` cookie client-writable/non-Secure; account page missing role check | `login-form.tsx`, `employee/account/page.tsx` | ✅ Fixed |
| SEC-013 | Low | A07 / CWE-521 | Weak/inconsistent password policy | `update-password-form.tsx`, `sign-up-form.tsx` | ✅ Fixed (client) · ⚠️ set Supabase Auth policy |
| SEC-014 | Low | A01 / CWE-352 | State-changing GET signout (CSRF); doesn't clear `sf-role` | `app/auth/signout/route.ts` | ✅ Fixed |
| SEC-015 | Low | A03 / CWE-116 | `Content-Disposition` filename spoofing | `app/api/export-schedule/route.ts` | ✅ Fixed |
| SEC-016 | Low | A01 / CWE-601 | `router.push(action_url)` no scheme allowlist | `components/layout/notification-bell.tsx` | ✅ Fixed |
| SEC-017 | Low | A05 / CWE-312, 295 | `.gitignore` gap; TLS footgun; plaintext service key | `.gitignore`, `.env` | ✅ Fixed (code) · ⚠️ **rotate service-role key** |
| SEC-018 | Low | A04 / CWE-362 | Update actions never check affected-row count (silent races) | `app/actions/employee.ts`, `manager.ts` | ✅ Fixed |
| SEC-019 | Info | A06 / CWE-1104, 1395 | Supply chain: `"latest"` pins, npm-audit findings, prettier in prod, starter cruft | `package.json`, `package-lock.json` | ⬜ Open |

## 3. Detailed Findings

### [SEC-001] RLS disabled → the browser publishable key is an anonymous full-database read/write gateway
- **Severity:** Critical · **OWASP:** A01:2021 · **CWE:** CWE-1220, CWE-306, CWE-284
- **Status:** ✅ Fixed in code · ⚠️ **migration must be applied to the live Supabase project to take effect**
- **Location:** Supabase project (no RLS); `lib/supabase/client.ts:5-8`; `middleware.ts:39-40`
- **Description.** Every `public` table is exposed over PostgREST; the `anon`/`authenticated` roles have default table grants, and RLS is the only row gate. RLS was disabled and no policies existed, so the publishable (anon) key shipped in the browser bundle could read/write the entire database — bypassing all server-side checks.
- **Impact.** Unauthenticated dump of all PII (`users.email/phone/…`) across tenants; arbitrary writes incl. `UPDATE users SET role='owner'`; row deletion.
- **Remediation (implemented).** New migration `supabase/migrations/20260721120000_enable_rls_and_policies.sql`: enables RLS on all 10 tables; adds `SECURITY DEFINER` helpers (`get_my_company_id`, `get_my_role`, `group_company_id`, `group_manager_id`) to express tenant/ownership scoping without policy recursion; policies scoped `TO authenticated` (so `anon` is fully denied) with `users` restricted to own-row for employees / whole-company for managers/owners, group-scoped tables gated by `group_manager_id() = auth.uid()` for writes, `notifications` own-only, `shift_swaps` company + role/participation, `activity_logs` owner-read-only. The `service_role` (server-only) still bypasses RLS by design, so the app's read/write paths keep working while `anon` loses all access.
- **Residual operational action.** Apply the migration (`supabase db push` or SQL editor). **Verify:** the unauthenticated `curl` below must return `[]`/an RLS error afterward.
  ```bash
  curl "https://<PROJECT>.supabase.co/rest/v1/users?select=email" -H "apikey: <PUBLISHABLE_KEY>"
  ```

---

### [SEC-002] `approveSwap` / `rejectSwap` — cross-tenant IDOR via the service-role client
- **Severity:** High · **OWASP:** A01:2021 · **CWE:** CWE-639
- **Status:** ✅ Fixed
- **Location:** `app/actions/manager.ts` (`approveSwap`, `rejectSwap`)
- **Description.** Both authenticated only that the caller is *a* manager, then operated via the RLS-bypassing service client filtering on `.eq("id", swapId)` + status — no tenant/ownership predicate. Any manager could approve/reject any swap in any company by UUID. (This class survives even after RLS, since the service role bypasses it.)
- **Remediation (implemented).** Both actions now scope the swap fetch to `.eq("company_id", profile.company_id)` **and** verify the underlying shift's group is managed by the caller (`shifts → groups!inner(manager_id) === profile.id`) before any mutation; otherwise return `Unauthorized`. Mirrors the correct pattern already used by `deactivateEmployee`.

---

### [SEC-003] Deactivation is cosmetic — no session revocation and `is_active` never enforced
- **Severity:** High · **OWASP:** A01:2021, A07:2021 · **CWE:** CWE-613
- **Status:** ✅ Fixed
- **Location:** `lib/auth.ts`, `app/actions/{employee,manager,owner,schedule}.ts` guards, both API routes; `deactivate*` in `manager.ts`/`owner.ts`
- **Description.** Deactivation only set `is_active=false`; no code read `is_active` and no session/token was revoked, so a deactivated user kept full access until JWT expiry.
- **Remediation (implemented).** `is_active` is now selected and enforced in `getSessionProfile` (signs out + returns null), in every `getXProfile()` guard (signs out + redirects to login), and in both export API routes (403). `deactivateEmployee`/`deactivateManager` now confirm a row was actually updated, then **revoke the target's sessions** via `service.auth.admin.updateUserById(id, { ban_duration: "876000h" })` (blocks refresh + new logins; the per-request `is_active` check terminates the current access token on next use).

---

### [SEC-004] Shift/template/member mutations act on a bare `id` with no ownership predicate
- **Severity:** High · **OWASP:** A01:2021 · **CWE:** CWE-639, CWE-862
- **Status:** ✅ Fixed
- **Location:** `app/actions/schedule.ts` (`updateShift`, `removeShift`, `addShiftNote`, `saveExtraHours`); `manager.ts` (`deleteShiftTemplate`, `removeGroupMember`)
- **Description.** These mutated rows filtering only on the row's `id`; the two `manager.ts` actions even accepted an unused `groupId`.
- **Remediation (implemented).** The four `schedule.ts` shift mutations now resolve the shift's group and require `groups!inner(manager_id) === profile.id` before mutating (and `updateShift` verifies the template belongs to the shift's group). `deleteShiftTemplate`/`removeGroupMember` now verify the manager owns `groupId` and scope the delete to that group.

---

### [SEC-005] Open redirect via unvalidated `next` parameter after session establishment
- **Severity:** Medium · **OWASP:** A01:2021 · **CWE:** CWE-601
- **Status:** ✅ Fixed
- **Location:** `app/auth/callback/route.ts`, `app/auth/confirm/confirm-client.tsx`
- **Description.** `next` was passed to `new URL(next, origin)` / `router.replace(next)`; an absolute or `//evil.com` value produced an external redirect after cookies were set.
- **Remediation (implemented).** Both sites now sanitize: `const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/"` — only same-origin relative redirects are followed.

---

### [SEC-006] No rate limiting on login, password reset, or invite
- **Severity:** Medium · **OWASP:** A04:2021, A07:2021 · **CWE:** CWE-307, CWE-770
- **Status:** ✅ Fixed (invites) · ⚠️ login/reset delegated to Supabase Auth's built-in limits
- **Location:** `lib/rate-limit.ts` (new), `manager.ts`, `owner.ts`; forms document the auth stance
- **Description.** No throttle existed; a manager/owner could drive unlimited invite emails (email-bombing).
- **Remediation (implemented).** New `inviteRateLimitExceeded(inviterId)` — a **DB-backed** throttle (counts rows the inviter created in a 10-minute window, cap 20), correct across serverless instances with no external infra — gates both invite actions (`created_by` was added to the manager invite so owners are counted too). Login and password-reset go browser→Supabase directly (no app hop); those are rate-limited server-side by **Supabase Auth's own limits**, documented inline in `login-form.tsx`/`forgot-password-form.tsx`. **Operational:** confirm/tune those limits in the Supabase dashboard.

---

### [SEC-007] No security headers (clickjacking, no CSP/HSTS)
- **Severity:** Medium · **OWASP:** A05:2021 · **CWE:** CWE-1021, CWE-693
- **Status:** ✅ Fixed
- **Location:** `next.config.mjs`
- **Remediation (implemented).** Added an `async headers()` block emitting `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS, and a CSP with `frame-ancestors 'none'` / `object-src 'none'` / `base-uri 'self'` / `form-action 'self'` (scripts allow `unsafe-inline`/`unsafe-eval` — required by Next's App Router bootstrap without nonce wiring — and `connect-src` is opened to Supabase).

---

### [SEC-008] Raw DB error messages to client; invite user-enumeration oracle
- **Severity:** Medium · **OWASP:** A05:2021, A01:2021 · **CWE:** CWE-209, CWE-204
- **Status:** ✅ Fixed
- **Location:** `lib/errors.ts` (new); all `app/actions/*.ts`; `app/api/export-monthly-report/route.ts`
- **Description.** Supabase/Postgres error strings were forwarded verbatim; invites echoed "already registered", enabling email enumeration.
- **Remediation (implemented).** New `safeError(error)` logs the real error server-side (`console.error`, preserved in prod builds) and returns a generic `"Something went wrong"`; applied to every DB-error passthrough across all action files and the monthly-report route (verified by grep — no `<dbError>.message` reaches the client). Invites now treat an already-registered address as a silent no-op returning the **same** response as a fresh invite, closing the enumeration oracle.

---

### [SEC-009] Swap integrity: unvalidated participants, missing group check, deadline bypass
- **Severity:** Medium · **OWASP:** A04:2021, A08:2021 · **CWE:** CWE-639, CWE-841
- **Status:** ✅ Fixed
- **Location:** `app/actions/employee.ts` (`createDirectSwap`, `takePublicShift`), `schedule.ts` (`addShift`)
- **Remediation (implemented).** `createDirectSwap` now requires `toUserId` to be an **active employee who is a member of the shift's group** (same tenant), and rejects self-swaps. `takePublicShift` requires the caller to be a **member of the shift's group** and **re-checks the deadline** at claim time. `addShift` requires `templateId` to belong to the schedule's group and `userId` to be a **member of that group**.

---

### [SEC-010] No input validation; unbounded `extra_hours` feeds payroll
- **Severity:** Low · **OWASP:** A03:2021, A04:2021 · **CWE:** CWE-20
- **Status:** ✅ Fixed
- **Location:** `lib/validation.ts` (new); `manager.ts`, `owner.ts`, `schedule.ts`
- **Remediation (implemented).** New dependency-free `lib/validation.ts` (`isEmail`, `isTime`, `isDate`, `clampExtraHours`, `cleanText`). Applied: email-format validation on both invites; `HH:MM` validation on shift templates; `YYYY-MM-DD` validation in `createSchedule`/`copyFromLastWeek`/`addShift`; **`extra_hours` clamped to [0, 24]** before it feeds the payroll report; free-text notes length-capped; unsafe `as string` casts replaced with `cleanText` where edited.

---

### [SEC-011] `clearMustChangePassword` cleared the forced-password flag without proof a password was set
- **Severity:** Low · **OWASP:** A04:2021 · **CWE:** CWE-306
- **Status:** ✅ Fixed
- **Location:** `app/actions/auth.ts`, `components/auth/change-password-form.tsx`
- **Remediation (implemented).** Removed the standalone `clearMustChangePassword` primitive and replaced it with `setInitialPassword(newPassword)` — one server action that validates length, calls `updateUser({ password })`, and clears `must_change_password` **only after** the password update succeeds. The form now calls this single action, so the flag can no longer be cleared without setting a password.

---

### [SEC-012] `sf-role` cookie client-writable/non-`Secure`; account page missing role check
- **Severity:** Low · **OWASP:** A05:2021 · **CWE:** CWE-1004, CWE-614
- **Status:** ✅ Fixed
- **Location:** `components/login-form.tsx`, `app/(dashboard)/employee/account/page.tsx`
- **Remediation (implemented).** The `sf-role` cookie is now set with `Secure` (over HTTPS) and an explicit `Max-Age`; it remains a UX redirect hint only (never an authorization input, since all pages re-derive role from the DB). Added the missing `role !== "employee"` redirect to the employee account page.

---

### [SEC-013] Weak and inconsistent password policy
- **Severity:** Low · **OWASP:** A07:2021 · **CWE:** CWE-521
- **Status:** ✅ Fixed (client-side) · ⚠️ set the authoritative policy in Supabase
- **Location:** `components/update-password-form.tsx`, `components/sign-up-form.tsx`
- **Remediation (implemented).** Added consistent min-8 checks to the reset and sign-up forms (change-password already enforced 8). These are client-side; the **authoritative** control is the Supabase project Auth password policy — configure it in the dashboard (min length, complexity, breach check).

---

### [SEC-014] State-changing GET signout (CSRF logout); doesn't clear `sf-role`
- **Severity:** Low · **OWASP:** A01:2021 · **CWE:** CWE-352
- **Status:** ✅ Fixed
- **Location:** `app/auth/signout/route.ts`
- **Remediation (implemented).** The GET handler now rejects `cross-site` requests via `Sec-Fetch-Site` (so `<img src="/auth/signout">` cannot force a logout) while same-origin server-redirect loop-breakers still work, and it clears the `sf-role` cookie on the response.

---

### [SEC-015] `Content-Disposition` filename spoofing
- **Severity:** Low · **OWASP:** A03:2021 · **CWE:** CWE-116
- **Status:** ✅ Fixed
- **Location:** `app/api/export-schedule/route.ts`
- **Remediation (implemented).** `weekStart` is now regex-validated (`YYYY-MM-DD`) before use, and the manager-controlled `group.name` is sanitized to `[A-Za-z0-9_-]` (capped at 50 chars) before interpolation into the header. (Full response splitting was never achievable — undici rejects CR/LF — so this closes the residual filename/extension spoofing.)

---

### [SEC-016] `router.push(action_url)` with no scheme allowlist
- **Severity:** Low · **OWASP:** A01:2021 · **CWE:** CWE-601
- **Status:** ✅ Fixed
- **Location:** `components/layout/notification-bell.tsx`
- **Remediation (implemented).** `action_url` is now followed only when it is a same-origin relative path (`startsWith("/") && !startsWith("//")`), blocking absolute/protocol-relative/`javascript:` values. (Under fixed RLS, `notifications` INSERT is also closed to the API, removing the write vector.)

---

### [SEC-017] Secrets hygiene: `.gitignore` gap, TLS footgun, plaintext service key
- **Severity:** Low · **OWASP:** A05:2021 · **CWE:** CWE-312, CWE-295
- **Status:** ✅ Fixed (code) · ⚠️ **rotate the service-role key (manual)**
- **Location:** `.gitignore`, `.env`
- **Remediation (implemented).** `.gitignore` broadened to `.env*` with `!.env.example` (closes the `.env.production`/`.env.development` gap); the commented `NODE_TLS_REJECT_UNAUTHORIZED=0` footgun was removed from `.env`.
- **Residual operational action.** The live `SUPABASE_SERVICE_ROLE_KEY` sits in plaintext in the working tree (never committed — git history is clean). Rotate it as a precaution (Supabase dashboard → API → roll key) and update `.env`.

---

### [SEC-018] Update actions never checked affected-row count → silent success on races
- **Severity:** Low · **OWASP:** A04:2021 · **CWE:** CWE-362
- **Status:** ✅ Fixed
- **Location:** `app/actions/employee.ts`, `manager.ts`
- **Remediation (implemented).** All swap-status updates (`acceptSwap`, `rejectSwap`, `cancelSwap`, `takePublicShift`, manager `approveSwap`/`rejectSwap`) now `.select("id")` and check the affected-row count, returning an explicit conflict message ("already taken / no longer available / already resolved") instead of a false success. `approveSwap` was reordered to claim the swap row (status-guarded) **before** reassigning the shift, so a concurrent approval cannot double-process.

---

### [SEC-019] Supply chain & dependency hygiene
- **Severity:** Info · **OWASP:** A06:2021 · **CWE:** CWE-1104, CWE-1395
- **Status:** ⬜ **Open** (not addressed in the remediation pass)
- **Location:** `package.json`, `package-lock.json`
- **Findings (unchanged).** `@supabase/ssr` and `@supabase/supabase-js` are pinned to `"latest"` (non-reproducible; repin to caret ranges and update 0.8.0→0.12.3 / 2.97.0→2.110.7). `npm audit`: 14 findings (11 high, all in the dev/lint toolchain; only `exceljs`→`uuid` is a direct prod moderate) — no criticals. `next` is 14.2.35 (patched vs CVE-2025-29927/2024-51479; recommend raising the declared floor to `^14.2.25`). `prettier` is in `dependencies` — move to `devDependencies`. Leftover Supabase starter components (`components/tutorial/*`, `hero.tsx`, `deploy-button.tsx`, `env-var-warning.tsx`, `supabase-logo.tsx`, `next-logo.tsx`) should be removed after confirming zero importers.

## 4. Third-Party & Supply-Chain Audit
See SEC-019 (Open). No committed secrets; no custom crypto and no `Math.random` in any security path (clean — all hashing/JWT/randomness delegated to Supabase/GoTrue). No Dockerfile/compose/CI/vercel.json in the repo (deployment config is out-of-repo).

## 5. Remediation Summary & Remaining Actions

**Completed in code (build-verified, `npm run build` ✓):** SEC-001 (RLS migration authored), SEC-002, SEC-003, SEC-004, SEC-005, SEC-006, SEC-007, SEC-008, SEC-009, SEC-010, SEC-011, SEC-012, SEC-013, SEC-014, SEC-015, SEC-016, SEC-017, SEC-018.

**Remaining operational steps (cannot be done from the codebase):**
1. **Apply the RLS migration** `supabase/migrations/20260721120000_enable_rls_and_policies.sql` to the live project (`supabase db push` or SQL editor). *This is what actually activates SEC-001.* Verify with the SEC-001 `curl`. **Assumption to confirm:** the `notifications`/`activity_logs` INSERT triggers are `SECURITY DEFINER` (standard) so trigger-written rows still succeed under RLS.
2. **Rotate the service-role key** (SEC-017) and update `.env`.
3. **Configure Supabase Auth** — password policy (SEC-013) and rate limits (SEC-006 for login/reset).

**Remaining code work (optional, informational):**
4. **SEC-019** — repin the two `"latest"` deps and update; raise the Next floor to `^14.2.25`; move `prettier` to `devDependencies`; remove leftover starter components.

**Recommended validation (smoke-test on a staging Supabase branch, since RLS + the atomic password flow change runtime behavior):** login → invited-user set-password → manager creates/edits schedule → employee creates a swap → manager approves; confirm cross-tenant IDs return `Unauthorized`; confirm a deactivated user is rejected on next request; re-run `npm run build` and `npm audit`.

---
*Original assessment via static source review + adversarial multi-agent verification (3 independent skeptics per finding). Remediation applied 2026-07-21; severities reflect the confirmed RLS-disabled, pre-launch state at assessment time. Items marked ⚠️ require an operational/dashboard action outside the repository.*
