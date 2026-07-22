import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { NotificationType } from "@/lib/types/database.types";

/**
 * LOGIC-004: the in-app notification writer.
 *
 * The `notifications` table, the eight NotificationType values and the realtime
 * notification bell all existed, but nothing ever wrote a row — so no swap,
 * approval or schedule change reached anyone. This module is the single writer;
 * every server action that changes state a user cares about calls it.
 *
 * Delivery today is in-app only (the bell subscribes to realtime INSERTs). An
 * email / push channel can hook in at the marked point below without touching
 * any call site.
 */

export type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedShiftId?: string | null;
  relatedSwapId?: string | null;
  actionUrl?: string | null;
};

/** Display name from name parts, with a neutral fallback. */
export function displayName(
  first?: string | null,
  last?: string | null,
): string {
  const n = `${first ?? ""} ${last ?? ""}`.trim();
  return n || "A teammate";
}

/**
 * Human-readable form of a "YYYY-MM-DD" shift date, e.g. "Mon, Mar 2".
 * Anchored in UTC so the label matches the stored calendar date regardless of
 * server timezone.
 */
export function formatShiftDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Persist one or more notifications. This is best-effort from the caller's
 * point of view: a notification failure must NEVER fail the underlying action
 * (the swap/publish/edit already succeeded), but the error is logged rather than
 * silently swallowed. Safe to call with an empty array.
 */
export async function createNotifications(
  items: NotificationInput[],
): Promise<void> {
  if (!items.length) return;
  try {
    const service = createServiceClient();
    const rows = items.map((n) => ({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      related_shift_id: n.relatedShiftId ?? null,
      related_swap_id: n.relatedSwapId ?? null,
      action_url: n.actionUrl ?? null,
    }));
    // ── Future delivery channels (email / push) hook in here ──────────────────
    const { error } = await service.from("notifications").insert(rows);
    if (error) console.error("[notifications] insert failed", error);
  } catch (err) {
    console.error("[notifications] insert threw", err);
  }
}
