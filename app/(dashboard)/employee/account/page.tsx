import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/layout/logout-button";

export default async function EmployeeAccountPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");

  const firstName = profile.first_name ?? "";
  const lastName = profile.last_name ?? "";
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Account</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Your profile and settings.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
            {initials || "?"}
          </div>
          <div>
            <p className="font-semibold text-base">
              {firstName} {lastName}
            </p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {profile.role}
            </p>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Logout */}
        <LogoutButton />
      </div>
    </div>
  );
}
