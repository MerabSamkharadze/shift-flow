"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { safeError } from "@/lib/errors";
import { inviteRateLimitExceeded } from "@/lib/rate-limit";
import { isEmail, isTime, cleanText, MAX_NAME, MAX_NOTE } from "@/lib/validation";
import { isZeroLengthShift } from "@/lib/shifts";
import { findOverlappingShift } from "@/lib/shifts.server";
import { createNotifications, formatShiftDate } from "@/lib/notifications";

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

    // LOGIC-013: the owner dashboard shows a company group count.
    revalidateTag("manager-groups");
    revalidateTag("manager-dashboard");
    revalidateTag("owner-dashboard");
    return { groupId: data.id, error: null };
  } catch (err) {
    return { groupId: null, error: safeError(err) };
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

    // LOGIC-013: deleting a group cascades away its schedules, shifts, members
    // and swaps — invalidate every surface that presents them, not just the
    // manager's own group list.
    revalidateTag("manager-groups");
    revalidateTag("manager-dashboard");
    revalidateTag("manager-schedule");
    revalidateTag("manager-swaps");
    revalidateTag("employee-team");
    revalidateTag("employee-schedule");
    revalidateTag("employee-swaps");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
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
  } catch (err) {
    return { error: safeError(err) };
  }
}

// ─── Shift Templates ──────────────────────────────────────────────────────────

export async function createShiftTemplate(groupId: string, formData: FormData) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const name = cleanText(formData.get("name"), MAX_NAME);
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;
    const color = (formData.get("color") as string) || "#3b82f6";

    if (!name) return { error: "Template name is required" };
    if (!startTime || !endTime) return { error: "Start and end time are required" };
    // SEC-010: reject malformed times (they otherwise poison duration/payroll math)
    if (!isTime(startTime) || !isTime(endTime)) {
      return { error: "Invalid time format" };
    }
    // LOGIC-001: a zero-length shift (start === end) is the only genuinely
    // invalid duration. Overnight shifts (end < start, e.g. 22:00→06:00) are
    // valid and handled by the midnight-aware duration math in lib/shifts.
    if (isZeroLengthShift(startTime, endTime)) {
      return { error: "Start and end time must be different" };
    }

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
  } catch (err) {
    return { error: safeError(err) };
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
  } catch (err) {
    return { error: safeError(err) };
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

    // LOGIC-013: a newly added member must become schedulable immediately.
    revalidateTag("group-detail");
    revalidateTag("employee-team");
    revalidateTag("employee-schedule");
    revalidateTag("manager-schedule");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
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

    // LOGIC-013: removal changes who is schedulable and whose shifts show.
    revalidateTag("group-detail");
    revalidateTag("employee-team");
    revalidateTag("employee-schedule");
    revalidateTag("manager-schedule");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
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
    // SEC-010: validate email format before hitting the invite API.
    if (!isEmail(email)) {
      return { error: "Please enter a valid email address" };
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
  } catch (err) {
    return { error: safeError(err) };
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

    // LOGIC-006/013: a deactivated employee must stop appearing as schedulable
    // (member picker, colleague lists) and as an available swap target.
    revalidateTag("manager-dashboard");
    revalidateTag("manager-employees");
    revalidateTag("owner-dashboard");
    revalidateTag("manager-schedule");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("group-detail");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
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
    //     not merely to someone else in the same company. Also pull the fields
    //     needed to re-validate the reassignment (group, date, times).
    const { data: shiftOwner } = await service
      .from("shifts")
      .select("id, group_id, date, start_time, end_time, groups!inner(manager_id)")
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

    // LOGIC-009: re-validate the recipient AT APPROVAL TIME — between request and
    // approval they may have been removed from the group or deactivated.
    const { data: recipientMembership } = await service
      .from("group_members")
      .select("id, users!inner(is_active)")
      .eq("group_id", shiftOwner.group_id)
      .eq("user_id", newAssignee)
      .maybeSingle();

    if (
      !recipientMembership ||
      (recipientMembership.users as { is_active: boolean } | null)?.is_active === false
    ) {
      return { error: "The employee for this swap is no longer available" };
    }

    // LOGIC-002: the recipient must not already be working an overlapping shift.
    const conflict = await findOverlappingShift(
      newAssignee,
      shiftOwner.date,
      shiftOwner.start_time,
      shiftOwner.end_time,
      swap.shift_id,
    );
    if (conflict) {
      return { error: "The employee already has an overlapping shift that day" };
    }

    // 2. SEC-018: claim the swap FIRST, guarded on its current status, so a
    //    concurrent approval can't double-process it. Only if this update claims
    //    the row do we proceed to reassign the shift.
    const { data: approved, error: swapError } = await service
      .from("shift_swaps")
      .update({
        status: "approved",
        approved_by: profile.id,
        manager_responded_at: new Date().toISOString(),
      })
      .eq("id", swapId)
      .in("status", ["accepted_by_employee", "pending_manager"])
      .select("id");

    if (swapError) return { error: safeError(swapError) };
    if (!approved || approved.length === 0) {
      return { error: "This swap was already resolved" };
    }

    // 3. Reassign the shift. LOGIC-009: reset extra_hours — they were recorded
    //    against the ORIGINAL assignee's work and must not follow the shift to
    //    the new person.
    const { error: shiftError } = await service
      .from("shifts")
      .update({
        assigned_to: newAssignee,
        modified_by: profile.id,
        extra_hours: null,
        extra_hours_notes: null,
      })
      .eq("id", swap.shift_id);

    if (shiftError) {
      // LOGIC-009: no DB transaction is available here, so compensate for the
      // failed reassign by reverting the swap out of "approved" — otherwise it
      // would be permanently stuck approved while the shift never moved. Check
      // the revert itself: if it too fails, the swap is stuck and needs manual
      // reconciliation, so log it loudly rather than swallowing it.
      const { data: reverted, error: revertError } = await service
        .from("shift_swaps")
        .update({
          status: "accepted_by_employee",
          approved_by: null,
          manager_responded_at: null,
        })
        .eq("id", swapId)
        .eq("status", "approved")
        .select("id");
      if (revertError || !reverted || reverted.length === 0) {
        console.error(
          "[approveSwap] shift reassign failed AND revert did not take — swap stuck approved with shift unmoved",
          { swapId, shiftId: swap.shift_id, shiftError, revertError },
        );
      }
      return { error: safeError(shiftError) };
    }

    // LOGIC-004: notify both sides that the swap is approved and the shift moved.
    await createNotifications([
      {
        userId: swap.from_user_id,
        type: "swap_approved",
        title: "Swap approved",
        message: `Your ${formatShiftDate(shiftOwner.date)} shift swap was approved. The shift is no longer yours.`,
        relatedShiftId: swap.shift_id,
        relatedSwapId: swapId,
        actionUrl: "/employee",
      },
      {
        userId: newAssignee,
        type: "swap_approved",
        title: "Shift assigned to you",
        message: `You've been assigned the ${formatShiftDate(shiftOwner.date)} shift from a swap.`,
        relatedShiftId: swap.shift_id,
        relatedSwapId: swapId,
        actionUrl: "/employee",
      },
    ]);

    revalidateTag("manager-swaps");
    revalidateTag("manager-schedule");
    revalidateTag("manager-dashboard");
    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("owner-dashboard");
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
      .select("id, shift_id, from_user_id, to_user_id, accepted_by, type")
      .eq("id", swapId)
      .eq("company_id", profile.company_id)
      .in("status", ["accepted_by_employee", "pending_manager"])
      .single();

    if (!swap) return { error: "Swap not found or no longer pending" };

    const { data: shiftOwner } = await service
      .from("shifts")
      .select("id, date, groups!inner(manager_id)")
      .eq("id", swap.shift_id)
      .single();

    const ownerGrp = shiftOwner?.groups as { manager_id: string } | null;
    if (!shiftOwner || !ownerGrp || ownerGrp.manager_id !== profile.id) {
      return { error: "Unauthorized" };
    }

    const cleanNote = cleanText(note, MAX_NOTE);

    const { data: rejected, error } = await service
      .from("shift_swaps")
      .update({
        status: "rejected_by_manager",
        approved_by: profile.id,
        manager_notes: cleanNote,
        manager_responded_at: new Date().toISOString(),
      })
      .eq("id", swapId)
      .in("status", ["accepted_by_employee", "pending_manager"])
      .select("id");

    if (error) return { error: safeError(error) };
    // SEC-018: 0 rows means the swap was already resolved.
    if (!rejected || rejected.length === 0) {
      return { error: "This swap was already resolved" };
    }

    // LOGIC-004: notify everyone involved that the manager rejected the swap. The
    // requester keeps the shift; the would-be taker is released — that's the
    // direct-swap accepter (to_user_id) or the public claimer (accepted_by),
    // mirroring who approveSwap reassigns to.
    const reason = cleanNote ? ` Reason: ${cleanNote}` : "";
    const otherParty = swap.type === "direct" ? swap.to_user_id : swap.accepted_by;
    const notifyIds = [
      ...new Set(
        [swap.from_user_id, otherParty].filter((id): id is string => !!id),
      ),
    ];
    await createNotifications(
      notifyIds.map((userId) => ({
        userId,
        type: "swap_rejected_by_manager" as const,
        title: "Swap not approved",
        message: `Your manager declined the ${formatShiftDate(shiftOwner.date)} shift swap.${reason}`,
        relatedShiftId: swap.shift_id,
        relatedSwapId: swapId,
        actionUrl: "/employee/swaps",
      })),
    );

    // LOGIC-013: the requester's own schedule card shows the swap badge, so it
    // must refresh when the manager rejects; the owner dashboard pending-swap
    // count also changes.
    revalidateTag("manager-swaps");
    revalidateTag("manager-dashboard");
    revalidateTag("employee-swaps");
    revalidateTag("employee-schedule");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}
