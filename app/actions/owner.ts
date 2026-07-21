"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { safeError } from "@/lib/errors";
import { inviteRateLimitExceeded } from "@/lib/rate-limit";
import { isEmail } from "@/lib/validation";

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

    revalidateTag("owner-managers");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
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

    revalidateTag("owner-managers");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}