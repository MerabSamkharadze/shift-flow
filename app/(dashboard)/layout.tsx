import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/auth/login");
  if (!profile) redirect("/auth/signout");
  if (profile.must_change_password) redirect("/auth/change-password");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        role={profile.role}
        firstName={profile.first_name ?? ""}
        lastName={profile.last_name ?? ""}
        email={profile.email}
        userId={user.id}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 md:hidden">
          <MobileNav
            role={profile.role}
            firstName={profile.first_name ?? ""}
            lastName={profile.last_name ?? ""}
            userId={user.id}
          />
          <span className="flex-1 text-base font-bold tracking-tight">ShiftFlow</span>
          <NotificationBell userId={user.id} />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
