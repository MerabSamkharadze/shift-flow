import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileNav } from "@/components/layout/mobile-nav";

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
    <div className="flex h-screen overflow-hidden bg-background dark:bg-[#0A1628]">
      <Sidebar
        role={profile.role}
        firstName={profile.first_name ?? ""}
        lastName={profile.last_name ?? ""}
        email={profile.email}
        userId={user.id}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border dark:border-white/[0.07] px-3 md:hidden dark:bg-[#0D1B2A]">
          <MobileNav
            role={profile.role}
            firstName={profile.first_name ?? ""}
            lastName={profile.last_name ?? ""}
            userId={user.id}
          />
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
            </div>
            <span className="text-base font-bold tracking-tight font-[Syne]">ShiftFlow</span>
          </div>
          <NotificationBell userId={user.id} />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
