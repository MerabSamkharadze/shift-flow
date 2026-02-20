import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, must_change_password")
    .eq("id", user.id)
    .single();

  // Session exists but no profile in users table — sign out to break any redirect loop
  if (!profile) redirect("/auth/signout");

  if (profile.must_change_password) redirect("/auth/change-password");

  redirect(`/${profile.role}`);
}
