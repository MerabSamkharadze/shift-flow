import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
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
    <div className="flex h-screen overflow-hidden bg-[#0A1628]">
      <Sidebar
        role={profile.role}
        firstName={profile.first_name ?? ""}
        lastName={profile.last_name ?? ""}
        email={profile.email}
        userId={user.id}
      />

      {/* Mobile nav (renders its own hamburger + drawer) */}
      <MobileNav
        role={profile.role}
        firstName={profile.first_name ?? ""}
        lastName={profile.last_name ?? ""}
        userId={user.id}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-7 pt-20 md:pt-7">
        {children}
      </main>
    </div>
  );
}
