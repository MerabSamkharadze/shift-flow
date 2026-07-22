"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { safeError } from "@/lib/errors";
import {
  createNotifications,
  displayName,
  formatShiftDate,
} from "@/lib/notifications";

async function getEmployeeProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, company_id, is_active, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "employee") {
    throw new Error("Unauthorized");
  }
  // SEC-003: reject deactivated users and clear their session.
  if (profile.is_active === false) {
    await supabase.auth.signOut();
    redirect("/auth/login");
  }

  return { supabase, profile };
}

// deadline = shift date + start_time - 8 hours (local time)
function shiftDeadline(date: string, startTime: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes, secs] = startTime.split(":").map(Number);
  const d = new Date(year, month - 1, day, hours, minutes, secs ?? 0);
  d.setHours(d.getHours() - 8);
  return d.toISOString();
}

// ─── Swap creation ────────────────────────────────────────────────────────────

export async function createDirectSwap(shiftId: string, toUserId: string) {
  const { supabase, profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    if (toUserId === profile.id) {
      return { error: "You cannot swap a shift with yourself" };
    }

    // Verify shift belongs to this employee; fetch date + start_time + group
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .select("id, date, start_time, group_id")
      .eq("id", shiftId)
      .eq("assigned_to", profile.id)
      .single();

    if (shiftError) return { error: safeError(shiftError) };
    if (!shift) return { error: "Shift not found" };

    const deadline = shiftDeadline(shift.date, shift.start_time);
    if (new Date(deadline) <= new Date()) {
      return { error: "The swap deadline for this shift has already passed" };
    }

    // SEC-009: the recipient must be an active employee who is a member of the
    // shift's group (this also confines the swap to the caller's own tenant).
    // toUserId is otherwise attacker-controlled and written straight into the swap.
    const { data: recipient } = await service
      .from("group_members")
      .select("id, users!inner(is_active, company_id, role)")
      .eq("group_id", shift.group_id)
      .eq("user_id", toUserId)
      .maybeSingle();

    const recipientUser = recipient?.users as
      | { is_active: boolean; company_id: string; role: string }
      | null;
    if (
      !recipient ||
      !recipientUser ||
      recipientUser.is_active === false ||
      recipientUser.role !== "employee" ||
      recipientUser.company_id !== profile.company_id
    ) {
      return { error: "Selected employee is not available for this swap" };
    }

    // Guard: no in-flight swap already exists for this shift
    const { data: existing } = await service
      .from("shift_swaps")
      .select("id")
      .eq("shift_id", shiftId)
      .eq("from_user_id", profile.id)
      .in("status", ["pending_employee", "accepted_by_employee", "pending_manager"])
      .maybeSingle();

    if (existing) return { error: "A swap request already exists for this shift" };

    const { data: created, error } = await service
      .from("shift_swaps")
      .insert({
        shift_id: shiftId,
        from_user_id: profile.id,
        to_user_id: toUserId,
        company_id: profile.company_id,
        type: "direct",
        status: "pending_employee",
        deadline,
      })
      .select("id")
      .single();

    if (error) return { error: safeError(error) };

    // LOGIC-004: tell the chosen colleague they've been asked to cover a shift.
    await createNotifications([
      {
        userId: toUserId,
        type: "swap_request_received",
        title: "New shift swap request",
        message: `${displayName(profile.first_name, profile.last_name)} asked you to cover their ${formatShiftDate(shift.date)} shift.`,
        relatedShiftId: shiftId,
        relatedSwapId: created?.id ?? null,
        actionUrl: "/employee/swaps",
      },
    ]);

    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    revalidateTag("manager-swaps");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

export async function createPublicSwap(shiftId: string) {
  const { supabase, profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    // Verify shift belongs to this employee; fetch date + start_time + group
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .select("id, date, start_time, group_id")
      .eq("id", shiftId)
      .eq("assigned_to", profile.id)
      .single();

    if (shiftError) return { error: safeError(shiftError) };
    if (!shift) return { error: "Shift not found" };

    const deadline = shiftDeadline(shift.date, shift.start_time);
    if (new Date(deadline) <= new Date()) {
      return { error: "The swap deadline for this shift has already passed" };
    }

    // Guard: no in-flight swap already exists for this shift
    const { data: existing } = await service
      .from("shift_swaps")
      .select("id")
      .eq("shift_id", shiftId)
      .eq("from_user_id", profile.id)
      .in("status", ["pending_employee", "accepted_by_employee", "pending_manager"])
      .maybeSingle();

    if (existing) return { error: "A swap request already exists for this shift" };

    const { data: created, error } = await service
      .from("shift_swaps")
      .insert({
        shift_id: shiftId,
        from_user_id: profile.id,
        to_user_id: null,
        company_id: profile.company_id,
        type: "public",
        status: "pending_employee",
        deadline,
      })
      .select("id")
      .single();

    if (error) return { error: safeError(error) };

    // LOGIC-004: broadcast the open shift to the rest of the group so someone can
    // pick it up. Only active members, and never the requester.
    const { data: groupMembers } = await service
      .from("group_members")
      .select("user_id, users!inner(is_active)")
      .eq("group_id", shift.group_id)
      .neq("user_id", profile.id);

    const recipients = (groupMembers ?? []).filter(
      (m) => (m.users as { is_active: boolean } | null)?.is_active !== false,
    );
    await createNotifications(
      recipients.map((m) => ({
        userId: m.user_id,
        type: "public_swap_available" as const,
        title: "Shift up for grabs",
        message: `${displayName(profile.first_name, profile.last_name)} put their ${formatShiftDate(shift.date)} shift on the board.`,
        relatedShiftId: shiftId,
        relatedSwapId: created?.id ?? null,
        actionUrl: "/employee/swaps",
      })),
    );

    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    revalidateTag("manager-swaps");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

// ─── Swap responses ───────────────────────────────────────────────────────────

export async function acceptSwap(swapId: string) {
  const { profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    const { data: updated, error } = await service
      .from("shift_swaps")
      .update({ status: "accepted_by_employee" })
      .eq("id", swapId)
      .eq("to_user_id", profile.id)
      .eq("type", "direct")
      .eq("status", "pending_employee")
      .select("id, from_user_id, shift_id");

    if (error) return { error: safeError(error) };
    // SEC-018: 0 rows means the swap was already resolved/reassigned.
    if (!updated || updated.length === 0) {
      return { error: "This swap is no longer available" };
    }

    // LOGIC-004: tell the requester their colleague accepted (now pending manager).
    const swap = updated[0];
    await createNotifications([
      {
        userId: swap.from_user_id,
        type: "swap_request_accepted",
        title: "Swap accepted",
        message: `${displayName(profile.first_name, profile.last_name)} accepted your swap request. Waiting for manager approval.`,
        relatedShiftId: swap.shift_id,
        relatedSwapId: swapId,
        actionUrl: "/employee/swaps",
      },
    ]);

    // LOGIC-013: accepting moves the swap into the manager/owner pending queue,
    // and the requester's own schedule card shows the swap state.
    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    revalidateTag("manager-swaps");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

export async function rejectSwap(swapId: string) {
  const { profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    const { data: updated, error } = await service
      .from("shift_swaps")
      .update({ status: "rejected_by_employee" })
      .eq("id", swapId)
      .eq("to_user_id", profile.id)
      .eq("type", "direct")
      .eq("status", "pending_employee")
      .select("id, from_user_id, shift_id");

    if (error) return { error: safeError(error) };
    // SEC-018: 0 rows means the swap was already resolved.
    if (!updated || updated.length === 0) {
      return { error: "This swap is no longer available" };
    }

    // LOGIC-004: tell the requester their swap was declined so they can retry.
    const swap = updated[0];
    await createNotifications([
      {
        userId: swap.from_user_id,
        type: "swap_request_rejected",
        title: "Swap declined",
        message: `${displayName(profile.first_name, profile.last_name)} declined your shift swap request.`,
        relatedShiftId: swap.shift_id,
        relatedSwapId: swapId,
        actionUrl: "/employee/swaps",
      },
    ]);

    // LOGIC-013: refresh the requester's schedule card too.
    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    revalidateTag("manager-swaps");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

export async function cancelSwap(swapId: string) {
  const { profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    const { data: updated, error } = await service
      .from("shift_swaps")
      .update({ status: "cancelled" })
      .eq("id", swapId)
      .eq("from_user_id", profile.id)
      .eq("status", "pending_employee")
      .select("id");

    if (error) return { error: safeError(error) };
    // SEC-018: 0 rows means the swap can no longer be cancelled.
    if (!updated || updated.length === 0) {
      return { error: "This swap can no longer be cancelled" };
    }

    // LOGIC-013: a cancelled request must also drop off the manager's queue.
    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    revalidateTag("manager-swaps");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

export async function takePublicShift(swapId: string) {
  const { supabase, profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    // Verify claimable (public, pending, not the requester's own)
    const { data: swap } = await supabase
      .from("shift_swaps")
      .select("id, shift_id, deadline, from_user_id")
      .eq("id", swapId)
      .eq("type", "public")
      .eq("status", "pending_employee")
      .neq("from_user_id", profile.id)
      .single();

    if (!swap) return { error: "Swap not found or not available" };

    // SEC-009: the claim window must not have passed.
    if (swap.deadline && new Date(swap.deadline) <= new Date()) {
      return { error: "The deadline to claim this shift has passed" };
    }

    // SEC-009: the caller must be a member of the group that owns the shift.
    // The public board is filtered by group in the UI, but this action accepts
    // an arbitrary swapId, so membership must be enforced here as well.
    const { data: shift } = await service
      .from("shifts")
      .select("group_id")
      .eq("id", swap.shift_id)
      .single();

    if (!shift) return { error: "Swap not found or not available" };

    const { data: membership } = await service
      .from("group_members")
      .select("id")
      .eq("group_id", shift.group_id)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (!membership) return { error: "This shift is not available to you" };

    const { data: claimed, error } = await service
      .from("shift_swaps")
      .update({ accepted_by: profile.id, status: "accepted_by_employee" })
      .eq("id", swapId)
      .eq("status", "pending_employee") // race-condition guard
      .select("id");

    if (error) return { error: safeError(error) };
    // SEC-018: 0 rows means another employee claimed it first.
    if (!claimed || claimed.length === 0) {
      return { error: "This shift was just taken by someone else" };
    }

    // LOGIC-004: tell the original owner their open shift was claimed.
    await createNotifications([
      {
        userId: swap.from_user_id,
        type: "swap_request_accepted",
        title: "Your shift was claimed",
        message: `${displayName(profile.first_name, profile.last_name)} offered to take your open shift. Waiting for manager approval.`,
        relatedShiftId: swap.shift_id,
        relatedSwapId: swapId,
        actionUrl: "/employee/swaps",
      },
    ]);

    // LOGIC-013: claiming a public shift moves it into the manager/owner pending
    // queue and badge counts.
    revalidateTag("employee-swaps");
    revalidateTag("manager-swaps");
    revalidateTag("manager-dashboard");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}
