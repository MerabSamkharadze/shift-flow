"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function getEmployeeProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "employee") {
    throw new Error("Unauthorized");
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
    // Verify shift belongs to this employee; fetch date + start_time for deadline
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .select("id, date, start_time")
      .eq("id", shiftId)
      .eq("assigned_to", profile.id)
      .single();

    if (shiftError) return { error: shiftError.message };
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

    const { error } = await service.from("shift_swaps").insert({
      shift_id: shiftId,
      from_user_id: profile.id,
      to_user_id: toUserId,
      company_id: profile.company_id,
      type: "direct",
      status: "pending_employee",
      deadline,
    });

    if (error) return { error: error.message };

    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    revalidateTag("manager-swaps");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function createPublicSwap(shiftId: string) {
  const { supabase, profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    // Verify shift belongs to this employee; fetch date + start_time for deadline
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .select("id, date, start_time")
      .eq("id", shiftId)
      .eq("assigned_to", profile.id)
      .single();

    if (shiftError) return { error: shiftError.message };
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

    const { error } = await service.from("shift_swaps").insert({
      shift_id: shiftId,
      from_user_id: profile.id,
      to_user_id: null,
      company_id: profile.company_id,
      type: "public",
      status: "pending_employee",
      deadline,
    });

    if (error) return { error: error.message };

    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    revalidateTag("manager-swaps");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

// ─── Swap responses ───────────────────────────────────────────────────────────

export async function acceptSwap(swapId: string) {
  const { profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    const { error } = await service
      .from("shift_swaps")
      .update({ status: "accepted_by_employee" })
      .eq("id", swapId)
      .eq("to_user_id", profile.id)
      .eq("type", "direct")
      .eq("status", "pending_employee");

    if (error) return { error: error.message };

    revalidateTag("employee-swaps");
    revalidateTag("manager-swaps");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function rejectSwap(swapId: string) {
  const { profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    const { error } = await service
      .from("shift_swaps")
      .update({ status: "rejected_by_employee" })
      .eq("id", swapId)
      .eq("to_user_id", profile.id)
      .eq("type", "direct")
      .eq("status", "pending_employee");

    if (error) return { error: error.message };

    revalidateTag("employee-swaps");
    revalidateTag("manager-swaps");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function cancelSwap(swapId: string) {
  const { profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    const { error } = await service
      .from("shift_swaps")
      .update({ status: "cancelled" })
      .eq("id", swapId)
      .eq("from_user_id", profile.id)
      .eq("status", "pending_employee");

    if (error) return { error: error.message };

    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

export async function takePublicShift(swapId: string) {
  const { supabase, profile } = await getEmployeeProfile();
  const service = createServiceClient();
  try {
    // Verify claimable (public, pending, not the requester's own)
    const { data: swap } = await supabase
      .from("shift_swaps")
      .select("id")
      .eq("id", swapId)
      .eq("type", "public")
      .eq("status", "pending_employee")
      .neq("from_user_id", profile.id)
      .single();

    if (!swap) return { error: "Swap not found or not available" };

    const { error } = await service
      .from("shift_swaps")
      .update({ accepted_by: profile.id, status: "accepted_by_employee" })
      .eq("id", swapId)
      .eq("status", "pending_employee"); // race-condition guard

    if (error) return { error: error.message };

    revalidateTag("employee-swaps");
    revalidateTag("manager-swaps");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
