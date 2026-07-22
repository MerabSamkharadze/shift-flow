import { createServiceClient } from "@/lib/supabase/service";

/**
 * SEC-006: throttle invitation emails to prevent email-bombing and abuse of the
 * admin invite endpoints.
 *
 * This is DB-backed (it counts the rows this inviter has created in the recent
 * window) rather than in-memory, so it stays correct across serverless instances
 * without any external infrastructure. It is a soft, per-inviter limit — the goal
 * is to cap sustained abuse, not to be a hard concurrency lock.
 *
 * Note: login and password-reset are NOT application endpoints — those calls go
 * straight from the browser to Supabase Auth (GoTrue) and are rate-limited by
 * Supabase's own server-side limits (configure them in the Supabase dashboard
 * under Authentication → Rate Limits). There is no app code path to throttle
 * them here.
 */
const INVITE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const INVITE_MAX = 20; // max invites per inviter per window

export async function inviteRateLimitExceeded(
  inviterId: string,
): Promise<boolean> {
  const service = createServiceClient();
  const since = new Date(Date.now() - INVITE_WINDOW_MS).toISOString();

  const { count, error } = await service
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("created_by", inviterId)
    .gte("created_at", since);

  // LOGIC-022: fail CLOSED. If the count query errors we cannot prove the caller
  // is under the limit, so treat it as exceeded rather than waving the invite
  // through (the old `count ?? 0` silently allowed every invite on a query error).
  if (error) {
    console.error("[rate-limit] count query failed; failing closed", error);
    return true;
  }

  return (count ?? 0) >= INVITE_MAX;
}
