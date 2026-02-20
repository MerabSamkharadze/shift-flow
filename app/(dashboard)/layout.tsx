import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, must_change_password, first_name, last_name, email")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/signout");
  if (profile.must_change_password) redirect("/auth/change-password");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        role={profile.role}
        firstName={profile.first_name}
        lastName={profile.last_name}
        email={profile.email}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
