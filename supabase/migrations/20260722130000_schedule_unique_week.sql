-- =============================================================================
-- LOGIC-017 — one schedule per (group, week)
-- =============================================================================
-- Context: createSchedule and copyFromLastWeek already reject a duplicate week in
-- application code, but two concurrent requests could still slip a second
-- schedule row past that check for the same group + week_start_date. A unique
-- index makes the database the final arbiter, so a duplicate can never exist and
-- the read paths never have to pick between two schedules for one week.
--
-- NOTE: if the table already contains duplicate (group_id, week_start_date) rows
-- (possible only from before the app-level guard), this index creation will fail
-- until those duplicates are merged/removed. On a fresh/pre-launch DB there are
-- none, so it applies cleanly.
--
-- Idempotent on the index itself: re-running is a no-op.
-- =============================================================================

create unique index if not exists schedules_group_week_uniq
  on public.schedules (group_id, week_start_date);
