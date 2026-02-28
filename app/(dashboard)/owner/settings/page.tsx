import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getOwnerSettingsData } from "@/lib/cache";
import { SettingsClient } from "@/components/owner/settings-client";

export default async function SettingsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "owner") redirect("/owner");

  const { company, owner } = await getOwnerSettingsData(
    profile.company_id,
    user.id,
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Company Settings
        </h1>
        <p className="text-sm md:text-base text-[#7A94AD]">
          Manage your company preferences
        </p>
      </div>

      <SettingsClient company={company} owner={owner} />
    </div>
  );
}
