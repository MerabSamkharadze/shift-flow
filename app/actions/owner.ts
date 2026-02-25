"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function getOwnerProfile() {
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

  if (!profile || profile.role !== "owner") {
    throw new Error("Unauthorized");
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

    const service = createServiceClient();

    // NEXT_PUBLIC_SITE_URL must be set in production (e.g. https://yourapp.com).
    // Falls back to localhost for local development.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Create the auth user and send the invite email.
    const { data: authData, error: inviteError } =
      await service.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl}/auth/confirm`,
      });

    if (inviteError) return { error: inviteError.message };

    // Create the profile row. must_change_password ensures the middleware
    // forces a password update on first login (safety net for the invite flow).
    const { error: profileError } = await service.from("users").insert({
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role: "manager",
      company_id: profile.company_id,
      must_change_password: true,
      is_active: true,
    });

    if (profileError) {
      // Roll back: remove the auth user we just created so the email stays clean.
      await service.auth.admin.deleteUser(authData.user.id);
      return { error: profileError.message };
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

    const { error } = await service
      .from("users")
      .update({ is_active: false })
      .eq("id", managerId)
      .eq("company_id", profile.company_id)
      .eq("role", "manager");

    if (error) return { error: error.message };

    revalidateTag("owner-managers");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}