"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getEmployeeProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "employee") {
    throw new Error("Unauthorized");
  }

  return { supabase, profile };
}

function deadlineISO(days = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── Swap creation ────────────────────────────────────────────────────────────

export async function createDirectSwap(shiftId: string, toUserId: string) {
  try {
    const { supabase, profile } = await getEmployeeProfile();

    // Verify shift belongs to this employee
    const { data: shift } = await supabase
      .from("shifts")
      .select("id")
      .eq("id", shiftId)
      .eq("user_id", profile.id)
      .single();

    if (!shift) return { error: "Shift not found" };

    // No existing active swap for this shift
    const { data: existing } = await supabase
      .from("shift_swaps")
      .select("id")
      .eq("shift_id", shiftId)
      .eq("requester_id", profile.id)
      .in("status", ["pending", "accepted"])
      .maybeSingle();

    if (existing) return { error: "A swap request already exists for this shift" };

    const { error } = await supabase.from("shift_swaps").insert({
      shift_id: shiftId,
      requester_id: profile.id,
      recipient_id: toUserId,
      type: "direct",
      status: "pending",
      deadline: deadlineISO(),
    });

    if (error) return { error: error.message };

    revalidatePath("/employee");
    revalidatePath("/employee/swaps");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function createPublicSwap(shiftId: string) {
  try {
    const { supabase, profile } = await getEmployeeProfile();

    const { data: shift } = await supabase
      .from("shifts")
      .select("id")
      .eq("id", shiftId)
      .eq("user_id", profile.id)
      .single();

    if (!shift) return { error: "Shift not found" };

    const { data: existing } = await supabase
      .from("shift_swaps")
      .select("id")
      .eq("shift_id", shiftId)
      .eq("requester_id", profile.id)
      .in("status", ["pending", "accepted"])
      .maybeSingle();

    if (existing) return { error: "A swap request already exists for this shift" };

    const { error } = await supabase.from("shift_swaps").insert({
      shift_id: shiftId,
      requester_id: profile.id,
      recipient_id: null,
      type: "public",
      status: "pending",
      deadline: deadlineISO(),
    });

    if (error) return { error: error.message };

    revalidatePath("/employee");
    revalidatePath("/employee/swaps");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Swap responses ──────────────────────────────────────────────────────────

export async function acceptSwap(swapId: string) {
  try {
    const { supabase, profile } = await getEmployeeProfile();

    const { error } = await supabase
      .from("shift_swaps")
      .update({ status: "accepted" })
      .eq("id", swapId)
      .eq("recipient_id", profile.id)
      .eq("type", "direct")
      .eq("status", "pending");

    if (error) return { error: error.message };

    revalidatePath("/employee/swaps");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function rejectSwap(swapId: string) {
  try {
    const { supabase, profile } = await getEmployeeProfile();

    const { error } = await supabase
      .from("shift_swaps")
      .update({ status: "rejected" })
      .eq("id", swapId)
      .eq("recipient_id", profile.id)
      .eq("type", "direct")
      .eq("status", "pending");

    if (error) return { error: error.message };

    revalidatePath("/employee/swaps");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function cancelSwap(swapId: string) {
  try {
    const { supabase, profile } = await getEmployeeProfile();

    const { error } = await supabase
      .from("shift_swaps")
      .update({ status: "expired" })
      .eq("id", swapId)
      .eq("requester_id", profile.id)
      .eq("status", "pending");

    if (error) return { error: error.message };

    revalidatePath("/employee");
    revalidatePath("/employee/swaps");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function takePublicShift(swapId: string) {
  try {
    const { supabase, profile } = await getEmployeeProfile();

    // Verify it's a claimable public swap (not requester's own)
    const { data: swap } = await supabase
      .from("shift_swaps")
      .select("id")
      .eq("id", swapId)
      .eq("type", "public")
      .eq("status", "pending")
      .neq("requester_id", profile.id)
      .single();

    if (!swap) return { error: "Swap not found or not available" };

    const { error } = await supabase
      .from("shift_swaps")
      .update({ recipient_id: profile.id, status: "accepted" })
      .eq("id", swapId)
      .eq("status", "pending"); // guard against race condition

    if (error) return { error: error.message };

    revalidatePath("/employee/swaps");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}
