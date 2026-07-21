-- =============================================================================
-- SEC-001 (Critical) — Enable Row-Level Security + multi-tenant policies
-- =============================================================================
-- Context: the application declared RLS as "the actual security" (middleware.ts)
-- but no policies existed and RLS was disabled, so the browser publishable/anon
-- key was a direct anonymous read/write gateway to every table via PostgREST.
--
-- Model:
--   * The `service_role` key (server-only, createServiceClient) has BYPASSRLS and
--     is unaffected by these policies — the app's cache/read path and privileged
--     writes keep working. The service-role code paths are separately guarded in
--     application code (SEC-002/003/004).
--   * The `anon` role gets NO policies below → it is fully denied (this is the
--     core SEC-001 fix: the public key can no longer read or write anything).
--   * The `authenticated` role (a logged-in user via the RLS-bound client) is
--     restricted to its own tenant / its own rows, matching exactly what the
--     application does through the RLS client.
--
-- Safe to re-run: policies are dropped-if-exists before creation; functions use
-- CREATE OR REPLACE.
-- =============================================================================

-- ─── Helper functions ────────────────────────────────────────────────────────
-- SECURITY DEFINER so they read `users`/`groups` while BYPASSING RLS on those
-- tables — this is what prevents infinite recursion when a policy on `users`
-- (or a table scoped through `groups`) needs to know the caller's company/role.

create or replace function public.get_my_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.users where id = auth.uid();
$$;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- company_id that owns a given group (tenant anchor for group-scoped tables)
create or replace function public.group_company_id(gid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.groups where id = gid;
$$;

-- manager_id that owns a given group (ownership anchor for group-scoped tables)
create or replace function public.group_manager_id(gid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select manager_id from public.groups where id = gid;
$$;

grant execute on function public.get_my_company_id() to authenticated;
grant execute on function public.get_my_role() to authenticated;
grant execute on function public.group_company_id(uuid) to authenticated;
grant execute on function public.group_manager_id(uuid) to authenticated;

-- ─── Enable RLS on every public table ────────────────────────────────────────
alter table public.companies       enable row level security;
alter table public.users           enable row level security;
alter table public.groups          enable row level security;
alter table public.group_members   enable row level security;
alter table public.shift_templates enable row level security;
alter table public.schedules       enable row level security;
alter table public.shifts          enable row level security;
alter table public.shift_swaps     enable row level security;
alter table public.notifications   enable row level security;
alter table public.activity_logs   enable row level security;

-- =============================================================================
-- companies — a user may read only their own company.
-- Writes happen via the service role (signup/settings), so no write policy.
-- =============================================================================
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select to authenticated
  using (id = public.get_my_company_id());

-- =============================================================================
-- users — the sensitive PII table.
--   * Every user may read their OWN row (guards, session profile, login).
--   * Managers/owners may read every user in THEIR company (employee lists,
--     schedule assignees). Employees may NOT read coworkers' rows via the API
--     (coworker names are served server-side via the service role), which keeps
--     email/phone from being dumped with the publishable key + a low-priv session.
--   * NO insert/update/delete policy → the authenticated/anon roles cannot write
--     `users` at all. This blocks `UPDATE users SET role='owner'` self-escalation.
--     All legitimate user writes (invite, deactivate, clear-flag) go through the
--     service role, which is now additionally guarded in application code.
-- =============================================================================
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to authenticated
  using (
    id = auth.uid()
    or (
      public.get_my_role() = any (array['manager', 'owner'])
      and company_id = public.get_my_company_id()
    )
  );

-- =============================================================================
-- groups — same-company read; managers own their groups for write.
-- =============================================================================
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select to authenticated
  using (company_id = public.get_my_company_id());

drop policy if exists groups_insert on public.groups;
create policy groups_insert on public.groups
  for insert to authenticated
  with check (
    manager_id = auth.uid()
    and company_id = public.get_my_company_id()
    and public.get_my_role() = 'manager'
  );

drop policy if exists groups_update on public.groups;
create policy groups_update on public.groups
  for update to authenticated
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists groups_delete on public.groups;
create policy groups_delete on public.groups
  for delete to authenticated
  using (manager_id = auth.uid());

-- =============================================================================
-- group_members — read within tenant; write only by the group's manager.
-- =============================================================================
drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members
  for select to authenticated
  using (public.group_company_id(group_id) = public.get_my_company_id());

drop policy if exists group_members_insert on public.group_members;
create policy group_members_insert on public.group_members
  for insert to authenticated
  with check (public.group_manager_id(group_id) = auth.uid());

drop policy if exists group_members_delete on public.group_members;
create policy group_members_delete on public.group_members
  for delete to authenticated
  using (public.group_manager_id(group_id) = auth.uid());

-- =============================================================================
-- shift_templates — read within tenant; write only by the group's manager.
-- =============================================================================
drop policy if exists shift_templates_select on public.shift_templates;
create policy shift_templates_select on public.shift_templates
  for select to authenticated
  using (public.group_company_id(group_id) = public.get_my_company_id());

drop policy if exists shift_templates_insert on public.shift_templates;
create policy shift_templates_insert on public.shift_templates
  for insert to authenticated
  with check (public.group_manager_id(group_id) = auth.uid());

drop policy if exists shift_templates_update on public.shift_templates;
create policy shift_templates_update on public.shift_templates
  for update to authenticated
  using (public.group_manager_id(group_id) = auth.uid())
  with check (public.group_manager_id(group_id) = auth.uid());

drop policy if exists shift_templates_delete on public.shift_templates;
create policy shift_templates_delete on public.shift_templates
  for delete to authenticated
  using (public.group_manager_id(group_id) = auth.uid());

-- =============================================================================
-- schedules — read within tenant; write only by the owning manager.
-- =============================================================================
drop policy if exists schedules_select on public.schedules;
create policy schedules_select on public.schedules
  for select to authenticated
  using (company_id = public.get_my_company_id());

drop policy if exists schedules_insert on public.schedules;
create policy schedules_insert on public.schedules
  for insert to authenticated
  with check (
    manager_id = auth.uid()
    and public.group_manager_id(group_id) = auth.uid()
  );

drop policy if exists schedules_update on public.schedules;
create policy schedules_update on public.schedules
  for update to authenticated
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());

drop policy if exists schedules_delete on public.schedules;
create policy schedules_delete on public.schedules
  for delete to authenticated
  using (manager_id = auth.uid());

-- =============================================================================
-- shifts — read within tenant; write only by the group's manager.
-- (Employees never write shifts via the RLS client; swap approvals reassign
--  shifts via the service role, which bypasses RLS and is guarded in code.)
-- =============================================================================
drop policy if exists shifts_select on public.shifts;
create policy shifts_select on public.shifts
  for select to authenticated
  using (public.group_company_id(group_id) = public.get_my_company_id());

drop policy if exists shifts_insert on public.shifts;
create policy shifts_insert on public.shifts
  for insert to authenticated
  with check (public.group_manager_id(group_id) = auth.uid());

drop policy if exists shifts_update on public.shifts;
create policy shifts_update on public.shifts
  for update to authenticated
  using (public.group_manager_id(group_id) = auth.uid())
  with check (public.group_manager_id(group_id) = auth.uid());

drop policy if exists shifts_delete on public.shifts;
create policy shifts_delete on public.shifts
  for delete to authenticated
  using (public.group_manager_id(group_id) = auth.uid());

-- =============================================================================
-- shift_swaps — read within tenant, narrowed by role/participation.
--   Managers/owners: all swaps in their company.
--   Employees: public swaps (needed to claim one) + swaps they participate in.
--   All swap writes go through the service role (guarded in code), so there is
--   intentionally NO insert/update policy for authenticated here.
-- =============================================================================
drop policy if exists shift_swaps_select on public.shift_swaps;
create policy shift_swaps_select on public.shift_swaps
  for select to authenticated
  using (
    company_id = public.get_my_company_id()
    and (
      public.get_my_role() = any (array['manager', 'owner'])
      or type = 'public'
      or from_user_id = auth.uid()
      or to_user_id = auth.uid()
      or accepted_by = auth.uid()
    )
  );

-- =============================================================================
-- notifications — a user may read/update ONLY their own notifications.
--   No INSERT policy for authenticated: rows are written by database triggers.
--   Those triggers MUST be SECURITY DEFINER (the standard Supabase pattern) so
--   they can create notifications for other users; keeping INSERT closed here is
--   what blocks the SEC-016 stored-open-redirect (a low-priv session/anon can no
--   longer forge a notification with a malicious action_url for another user).
-- =============================================================================
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================================
-- activity_logs — append-only audit trail. Owners may read their company's
-- logs; nobody may write/modify them via the API (triggers/service role only).
-- =============================================================================
drop policy if exists activity_logs_select on public.activity_logs;
create policy activity_logs_select on public.activity_logs
  for select to authenticated
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() = 'owner'
  );
