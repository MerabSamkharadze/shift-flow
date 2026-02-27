import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
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

  if (!profile) redirect("/auth/login");

  // Flag already cleared — send to their dashboard
  if (!profile.must_change_password) redirect(profile.role === "employee" ? "/employee" : "/dashboard");

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <ChangePasswordForm role={profile.role} />
    </div>
  );
}
