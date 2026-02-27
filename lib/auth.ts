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
      "id, role, company_id, must_change_password, first_name, last_name, email",
    )
    .eq("id", user.id)
    .single();

  return { user, profile };
});
