import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getOwnerManagersData } from "@/lib/cache";
import { InviteManagerDialog } from "@/components/owner/invite-manager-dialog";
import { ManagersTable } from "@/components/owner/managers-table";

export default async function ManagersPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "owner") redirect("/owner");

  const { managers } = await getOwnerManagersData(profile.company_id);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Managers
          </h1>
          <p className="text-sm md:text-base text-[#7A94AD]">
            Oversee your management team
          </p>
        </div>
        <InviteManagerDialog />
      </div>

      <ManagersTable managers={managers} />
    </div>
  );
}
