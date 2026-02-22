"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function getManagerProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "manager") {
    throw new Error("Unauthorized");
  }

  return { supabase, profile };
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function createGroup(formData: FormData) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const name = (formData.get("name") as string)?.trim();
    const color = (formData.get("color") as string) || "#6366f1";

    if (!name) return { groupId: null, error: "Group name is required" };

    const { data, error } = await supabase
      .from("groups")
      .insert({
        name,
        color,
        company_id: profile.company_id,
        manager_id: profile.id,
      })
      .select("id")
      .single();

    if (error) return { groupId: null, error: error.message };

    revalidatePath("/manager/groups");
    return { groupId: data.id, error: null };
  } catch {
    return { groupId: null, error: "Something went wrong" };
  }
}

export async function deleteGroup(groupId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("manager_id", profile.id);

    if (error) return { error: error.message };

    revalidatePath("/manager/groups");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function updateGroup(groupId: string, name: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const trimmed = name.trim();
    if (!trimmed) return { error: "Group name is required" };

    const { error } = await supabase
      .from("groups")
      .update({ name: trimmed })
      .eq("id", groupId)
      .eq("manager_id", profile.id);

    if (error) return { error: error.message };

    revalidatePath("/manager/groups");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Shift Templates ──────────────────────────────────────────────────────────

export async function createShiftTemplate(groupId: string, formData: FormData) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const name = (formData.get("name") as string)?.trim();
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;
    const color = (formData.get("color") as string) || "#3b82f6";

    if (!name) return { error: "Template name is required" };
    if (!startTime || !endTime) return { error: "Start and end time are required" };

    // Verify group ownership
    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("manager_id", profile.id)
      .single();

    if (!group) return { error: "Group not found" };

    const { error } = await supabase.from("shift_templates").insert({
      group_id: groupId,
      name,
      start_time: startTime,
      end_time: endTime,
      color,
    });

    if (error) return { error: error.message };

    revalidatePath(`/manager/groups/${groupId}`);
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deleteShiftTemplate(templateId: string, groupId: string) {
  const { supabase } = await getManagerProfile();
  try {
    const { error } = await supabase
      .from("shift_templates")
      .delete()
      .eq("id", templateId);

    if (error) return { error: error.message };

    revalidatePath(`/manager/groups/${groupId}`);
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Group Members ────────────────────────────────────────────────────────────

export async function addGroupMember(groupId: string, userId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("manager_id", profile.id)
      .single();

    if (!group) return { error: "Group not found" };

    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: userId,
    });

    if (error) {
      if (error.code === "23505") return { error: "Employee is already in this group" };
      return { error: error.message };
    }

    revalidatePath(`/manager/groups/${groupId}`);
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function removeGroupMember(memberId: string, groupId: string) {
  const { supabase } = await getManagerProfile();
  try {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);

    if (error) return { error: error.message };

    revalidatePath(`/manager/groups/${groupId}`);
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function inviteEmployee(formData: FormData) {
  const { profile } = await getManagerProfile();
  try {
    const firstName = (formData.get("first_name") as string)?.trim();
    const lastName = (formData.get("last_name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      return { error: "All fields are required" };
    }

    const service = createServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data: authData, error: inviteError } =
      await service.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl}/auth/confirm`,
      });

    if (inviteError) return { error: inviteError.message };

    const { error: profileError } = await service.from("users").insert({
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role: "employee",
      company_id: profile.company_id,
      created_by: profile.id,
      must_change_password: true,
      is_active: true,
    });

    if (profileError) {
      await service.auth.admin.deleteUser(authData.user.id);
      return { error: profileError.message };
    }

    revalidatePath("/manager/employees");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deactivateEmployee(employeeId: string) {
  const { profile } = await getManagerProfile();
  try {
    const service = createServiceClient();

    const { error } = await service
      .from("users")
      .update({ is_active: false })
      .eq("id", employeeId)
      .eq("created_by", profile.id)
      .eq("role", "employee");

    if (error) return { error: error.message };

    revalidatePath("/manager/employees");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Swap Requests ────────────────────────────────────────────────────────────

export async function approveSwap(swapId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const { error } = await supabase
      .from("shift_swaps")
      .update({ status: "approved", approved_by: profile.id })
      .eq("id", swapId)
      .in("status", ["accepted_by_employee", "pending_manager"]);

    if (error) return { error: error.message };

    revalidatePath("/manager/swaps");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function rejectSwap(swapId: string, note?: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const { error } = await supabase
      .from("shift_swaps")
      .update({
        status: "rejected_by_manager",
        approved_by: profile.id,
        manager_notes: note?.trim() || null,
      })
      .eq("id", swapId)
      .in("status", ["accepted_by_employee", "pending_manager"]);

    if (error) return { error: error.message };

    revalidatePath("/manager/swaps");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}
