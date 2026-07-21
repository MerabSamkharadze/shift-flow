import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getSessionProfile = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, role, company_id, must_change_password, is_active, first_name, last_name, email",
    )
    .eq("id", user.id)
    .single();

  // SEC-003: a deactivated user's JWT keeps working until it expires. Re-check
  // is_active on every request and terminate the session immediately if revoked.
  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    return { user: null, profile: null };
  }

  return { user, profile };
});
