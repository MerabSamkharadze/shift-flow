import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * LOGIC-020: the audit-log writer.
 *
 * The `activity_logs` table and the owner dashboard's "Recent Activity" feed both
 * existed, and app/(dashboard)/owner/page.tsx even ships an ACTION_LABELS map for
 * canonical action strings — but nothing ever wrote a row, so the feed was always
 * empty. This is the single writer; significant company-level mutations call it.
 *
 * Action strings match the owner page's ACTION_LABELS where one exists (e.g.
 * "manager_invited", "group_created", "swap_approved"); unknown actions fall back
 * to a humanised form there, so new ones still render sensibly.
 *
 * Best-effort: a logging failure must NEVER fail the underlying action, but the
 * error is logged rather than silently swallowed.
 */

export type ActivityInput = {
  companyId: string;
  userId: string; // the actor who performed the action
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
};

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const service = createServiceClient();
    const { error } = await service.from("activity_logs").insert({
      company_id: input.companyId,
      user_id: input.userId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      old_value: (input.oldValue ?? null) as never,
      new_value: (input.newValue ?? null) as never,
    });
    if (error) console.error("[activity] insert failed", error);
  } catch (err) {
    console.error("[activity] insert threw", err);
  }
}
