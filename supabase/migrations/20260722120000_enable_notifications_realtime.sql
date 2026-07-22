-- =============================================================================
-- LOGIC-004 (follow-up) — publish `notifications` to Supabase Realtime
-- =============================================================================
-- Context: the notification bell (components/layout/notification-bell.tsx)
-- subscribes to postgres_changes INSERT events on public.notifications to update
-- the unread badge the moment a swap/approval/schedule change happens. That
-- subscription only delivers rows if the table belongs to the `supabase_realtime`
-- publication — and it did NOT, so notifications only appeared after a full page
-- load. This adds the table to the publication so live updates work.
--
-- RLS still applies to realtime streams: the notifications_select policy
-- (user_id = auth.uid(), see 20260721120000) means each subscriber receives only
-- their OWN notifications, never anyone else's.
--
-- Only INSERT events are consumed by the bell, so no `replica identity full` is
-- needed (an INSERT payload always carries the complete new row).
--
-- Idempotent: does nothing if the table is already published. Safe to re-run.
-- =============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
