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
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Managers</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Invite and manage your company&apos;s managers.
            </p>
          </div>
          <InviteManagerDialog />
        </div>

        <ManagersTable managers={managers} />
      </div>
  );
}
