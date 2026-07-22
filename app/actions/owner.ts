"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { safeError } from "@/lib/errors";
import { inviteRateLimitExceeded } from "@/lib/rate-limit";
import { isEmail } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

async function getOwnerProfile() {
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

  if (!profile || profile.role !== "owner") {
    throw new Error("Unauthorized");
  }
  // SEC-003: reject deactivated users and clear their session.
  if (profile.is_active === false) {
    await supabase.auth.signOut();
    redirect("/auth/login");
  }

  return { supabase, profile };
}

// ─── Managers ─────────────────────────────────────────────────────────────────

export async function inviteManager(formData: FormData) {
  try {
    const { profile } = await getOwnerProfile();

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

    // NEXT_PUBLIC_SITE_URL must be set in production (e.g. https://yourapp.com).
    // Falls back to localhost for local development.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Create the auth user and send the invite email.
    const { data: authData, error: inviteError } =
      await service.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl}/auth/confirm`,
      });

    if (inviteError) {
      // SEC-008: never echo raw provider errors and do not reveal whether the
      // address already exists (user enumeration).
      const alreadyRegistered =
        inviteError.status === 422 ||
        /already|registered|exist/i.test(inviteError.message);
      if (alreadyRegistered) return { error: null };
      return { error: safeError(inviteError) };
    }

    // Create the profile row. must_change_password ensures the middleware
    // forces a password update on first login (safety net for the invite flow).
    const { error: profileError } = await service.from("users").insert({
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role: "manager",
      company_id: profile.company_id,
      created_by: profile.id,
      must_change_password: true,
      is_active: true,
    });

    if (profileError) {
      // Roll back: remove the auth user we just created so the email stays clean.
      await service.auth.admin.deleteUser(authData.user.id);
      return { error: safeError(profileError) };
    }

    await logActivity({
      companyId: profile.company_id,
      userId: profile.id,
      action: "manager_invited",
      entityType: "manager",
      entityId: authData.user.id,
    });

    revalidateTag("owner-managers");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

export async function deactivateManager(managerId: string) {
  try {
    const { profile } = await getOwnerProfile();
    const service = createServiceClient();

    const { data: updated, error } = await service
      .from("users")
      .update({ is_active: false })
      .eq("id", managerId)
      .eq("company_id", profile.company_id)
      .eq("role", "manager")
      .select("id");

    if (error) return { error: safeError(error) };
    if (!updated || updated.length === 0) {
      return { error: "Manager not found" };
    }

    // SEC-003: revoke the manager's sessions/tokens so deactivation takes effect
    // immediately (banning blocks token refresh and new logins; the is_active
    // check in the auth guards kills the current access token on its next use).
    try {
      await service.auth.admin.updateUserById(managerId, {
        ban_duration: "876000h",
      });
    } catch {
      // best-effort — the is_active guard is the authoritative gate
    }

    await logActivity({
      companyId: profile.company_id,
      userId: profile.id,
      action: "manager_deactivated",
      entityType: "manager",
      entityId: managerId,
    });

    revalidateTag("owner-managers");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

// LOGIC-024: reactivation — undo a deactivation. Sets is_active back to true and
// lifts the auth ban so the manager can log in again.
export async function reactivateManager(managerId: string) {
  try {
    const { profile } = await getOwnerProfile();
    const service = createServiceClient();

    const { data: updated, error } = await service
      .from("users")
      .update({ is_active: true })
      .eq("id", managerId)
      .eq("company_id", profile.company_id)
      .eq("role", "manager")
      .select("id");

    if (error) return { error: safeError(error) };
    if (!updated || updated.length === 0) {
      return { error: "Manager not found" };
    }

    // Lift the auth ban applied at deactivation. Unlike deactivation, the unban
    // is NOT best-effort: a banned user is rejected by GoTrue at login before the
    // is_active guard ever runs, so a failed unban must be surfaced — otherwise
    // we'd report success while the manager stays locked out. Retry is safe
    // (the is_active write is idempotent).
    try {
      const { error: unbanError } = await service.auth.admin.updateUserById(
        managerId,
        { ban_duration: "none" },
      );
      if (unbanError) throw unbanError;
    } catch (unbanErr) {
      console.error("[reactivateManager] unban failed", unbanErr);
      return { error: "Could not fully reactivate — please try again" };
    }

    await logActivity({
      companyId: profile.company_id,
      userId: profile.id,
      action: "manager_reactivated",
      entityType: "manager",
      entityId: managerId,
    });

    revalidateTag("owner-managers");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

// LOGIC-005: hand a manager's groups (and their schedules) to another manager.
// This is the escape hatch for the "deactivating a manager permanently freezes
// their groups" risk — the owner can move ownership to an active manager.
export async function reassignManagerGroups(
  fromManagerId: string,
  toManagerId: string,
) {
  try {
    const { profile } = await getOwnerProfile();

    if (fromManagerId === toManagerId) {
      return { error: "Choose a different manager to reassign to" };
    }

    const service = createServiceClient();

    // Target must be an ACTIVE manager in this company.
    const { data: target } = await service
      .from("users")
      .select("id, is_active")
      .eq("id", toManagerId)
      .eq("company_id", profile.company_id)
      .eq("role", "manager")
      .maybeSingle();

    if (!target || target.is_active === false) {
      return { error: "The target manager is not available" };
    }

    // Source must be a manager in this company (usually the deactivated one).
    const { data: source } = await service
      .from("users")
      .select("id")
      .eq("id", fromManagerId)
      .eq("company_id", profile.company_id)
      .eq("role", "manager")
      .maybeSingle();

    if (!source) return { error: "Manager not found" };

    // Move the groups...
    const { data: movedGroups, error: groupErr } = await service
      .from("groups")
      .update({ manager_id: toManagerId })
      .eq("manager_id", fromManagerId)
      .eq("company_id", profile.company_id)
      .select("id");

    if (groupErr) return { error: safeError(groupErr) };

    // ...AND their schedules: schedules RLS/ownership keys off schedules.manager_id,
    // so without this the new manager could not publish or edit those schedules.
    const { error: schedErr } = await service
      .from("schedules")
      .update({ manager_id: toManagerId })
      .eq("manager_id", fromManagerId)
      .eq("company_id", profile.company_id);

    if (schedErr) return { error: safeError(schedErr) };

    await logActivity({
      companyId: profile.company_id,
      userId: profile.id,
      action: "groups_reassigned",
      entityType: "manager",
      entityId: fromManagerId,
      newValue: { toManagerId, groupCount: movedGroups?.length ?? 0 },
    });

    revalidateTag("owner-managers");
    revalidateTag("owner-dashboard");
    revalidateTag("manager-groups");
    revalidateTag("manager-schedule");
    revalidateTag("manager-dashboard");
    revalidateTag("manager-swaps");
    return { error: null, movedCount: movedGroups?.length ?? 0 };
  } catch (err) {
    return { error: safeError(err) };
  }
}