import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getOwnerBranchesData } from "@/lib/cache";
import { BranchesClient } from "@/components/owner/branches-client";

export default async function BranchesPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "owner") redirect("/owner");

  const { branches } = await getOwnerBranchesData(profile.company_id);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Branches
        </h1>
        <p className="text-sm md:text-base text-[#7A94AD]">
          Manage your locations and groups
        </p>
      </div>

      <BranchesClient branches={branches} />
    </div>
  );
}
