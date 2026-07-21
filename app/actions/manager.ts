"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { safeError } from "@/lib/errors";
import { inviteRateLimitExceeded } from "@/lib/rate-limit";

async function getManagerProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, company_id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "manager") {
    throw new Error("Unauthorized");
  }
  // SEC-003: reject deactivated users and clear their session.
  if (profile.is_active === false) {
    await supabase.auth.signOut();
    redirect("/auth/login");
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

    if (error) return { groupId: null, error: safeError(error) };

    revalidateTag("manager-groups");
    revalidateTag("manager-dashboard");
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

    if (error) return { error: safeError(error) };

    revalidateTag("manager-groups");
    revalidateTag("manager-dashboard");
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

    if (error) return { error: safeError(error) };

    revalidateTag("manager-groups");
    revalidateTag("manager-dashboard");
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

    if (error) return { error: safeError(error) };

    revalidateTag("group-detail");
    revalidateTag("manager-schedule");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deleteShiftTemplate(templateId: string, groupId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // SEC-004: verify the manager owns the group before deleting, and scope the
    // delete to that group so a template from another group cannot be targeted.
    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("manager_id", profile.id)
      .single();

    if (!group) return { error: "Group not found" };

    const { error } = await supabase
      .from("shift_templates")
      .delete()
      .eq("id", templateId)
      .eq("group_id", groupId);

    if (error) return { error: safeError(error) };

    revalidateTag("group-detail");
    revalidateTag("manager-schedule");
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
      return { error: safeError(error) };
    }

    revalidateTag("group-detail");
    revalidateTag("employee-team");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function removeGroupMember(memberId: string, groupId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // SEC-004: verify the manager owns the group before removing a member, and
    // scope the delete to that group.
    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("manager_id", profile.id)
      .single();

    if (!group) return { error: "Group not found" };

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId)
      .eq("group_id", groupId);

    if (error) return { error: safeError(error) };

    revalidateTag("group-detail");
    revalidateTag("employee-team");
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

    // SEC-006: throttle invitations to prevent email-bombing / abuse.
    if (await inviteRateLimitExceeded(profile.id)) {
      return {
        error: "Too many invitations sent recently. Please try again later.",
      };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data: authData, error: inviteError } =
      await service.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl}/auth/confirm`,
      });

    if (inviteError) {
      // SEC-008: never echo raw provider errors and do not reveal whether the
      // address already exists (user enumeration). Treat an existing account as
      // a silent no-op so the response is identical to a fresh invitation.
      const alreadyRegistered =
        inviteError.status === 422 ||
        /already|registered|exist/i.test(inviteError.message);
      if (alreadyRegistered) return { error: null };
      return { error: safeError(inviteError) };
    }

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
      return { error: safeError(profileError) };
    }

    revalidateTag("manager-dashboard");
    revalidateTag("manager-employees");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function deactivateEmployee(employeeId: string) {
  const { profile } = await getManagerProfile();
  try {
    const service = createServiceClient();

    const { data: updated, error } = await service
      .from("users")
      .update({ is_active: false })
      .eq("id", employeeId)
      .eq("created_by", profile.id)
      .eq("role", "employee")
      .select("id");

    if (error) return { error: safeError(error) };
    if (!updated || updated.length === 0) {
      return { error: "Employee not found" };
    }

    // SEC-003: revoke the employee's sessions/tokens so deactivation takes effect
    // immediately (banning blocks token refresh and new logins; the is_active
    // check in the auth guards kills the current access token on its next use).
    try {
      await service.auth.admin.updateUserById(employeeId, {
        ban_duration: "876000h",
      });
    } catch {
      // best-effort — the is_active guard is the authoritative gate
    }

    revalidateTag("manager-dashboard");
    revalidateTag("manager-employees");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Swap Requests ────────────────────────────────────────────────────────────

export async function approveSwap(swapId: string) {
  const { profile } = await getManagerProfile();
  const service = createServiceClient();
  try {
    // 1. Fetch the swap — scoped to the caller's company (SEC-002 tenant guard).
    const { data: swap, error: fetchError } = await service
      .from("shift_swaps")
      .select("id, shift_id, from_user_id, to_user_id, accepted_by, type")
      .eq("id", swapId)
      .eq("company_id", profile.company_id)
      .in("status", ["accepted_by_employee", "pending_manager"])
      .single();

    if (fetchError) return { error: safeError(fetchError) };
    if (!swap) return { error: "Swap not found or no longer pending" };

    // 1b. SEC-002: the service client bypasses RLS, so verify explicitly that
    //     the shift being swapped belongs to a group THIS manager manages —
    //     not merely to someone else in the same company.
    const { data: shiftOwner } = await service
      .from("shifts")
      .select("id, groups!inner(manager_id)")
      .eq("id", swap.shift_id)
      .single();

    const ownerGrp = shiftOwner?.groups as { manager_id: string } | null;
    if (!shiftOwner || !ownerGrp || ownerGrp.manager_id !== profile.id) {
      return { error: "Unauthorized" };
    }

    // For direct swaps the recipient is to_user_id; for public it's accepted_by
    const newAssignee =
      swap.type === "direct" ? swap.to_user_id : swap.accepted_by;
    if (!newAssignee) return { error: "No recipient found for this swap" };

    // 2. Reassign the shift — only updates assigned_to + modified_by;
    //    all other columns (extra_hours, extra_hours_notes, start_time,
    //    end_time, shift_template_id, etc.) are preserved automatically.
    const { error: shiftError } = await service
      .from("shifts")
      .update({ assigned_to: newAssignee, modified_by: profile.id })
      .eq("id", swap.shift_id);

    if (shiftError) return { error: safeError(shiftError) };

    // 3. Mark the swap approved
    const { error: swapError } = await service
      .from("shift_swaps")
      .update({
        status: "approved",
        approved_by: profile.id,
        manager_responded_at: new Date().toISOString(),
      })
      .eq("id", swapId);

    if (swapError) return { error: safeError(swapError) };

    revalidateTag("manager-swaps");
    revalidateTag("manager-schedule");
    revalidateTag("manager-dashboard");
    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

export async function rejectSwap(swapId: string, note?: string) {
  const { profile } = await getManagerProfile();
  const service = createServiceClient();
  try {
    // SEC-002: verify the swap is in the caller's company AND its shift belongs
    // to a group this manager manages, before mutating via the service client.
    const { data: swap } = await service
      .from("shift_swaps")
      .select("id, shift_id")
      .eq("id", swapId)
      .eq("company_id", profile.company_id)
      .in("status", ["accepted_by_employee", "pending_manager"])
      .single();

    if (!swap) return { error: "Swap not found or no longer pending" };

    const { data: shiftOwner } = await service
      .from("shifts")
      .select("id, groups!inner(manager_id)")
      .eq("id", swap.shift_id)
      .single();

    const ownerGrp = shiftOwner?.groups as { manager_id: string } | null;
    if (!shiftOwner || !ownerGrp || ownerGrp.manager_id !== profile.id) {
      return { error: "Unauthorized" };
    }

    const { error } = await service
      .from("shift_swaps")
      .update({
        status: "rejected_by_manager",
        approved_by: profile.id,
        manager_notes: note?.trim() || null,
        manager_responded_at: new Date().toISOString(),
      })
      .eq("id", swapId)
      .in("status", ["accepted_by_employee", "pending_manager"]);

    if (error) return { error: safeError(error) };

    revalidateTag("manager-swaps");
    revalidateTag("manager-dashboard");
    revalidateTag("employee-swaps");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}
