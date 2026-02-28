import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getManagerSwapsData } from "@/lib/cache";
import { SwapsClient, type SwapRow } from "@/components/manager/swaps-client";

export default async function SwapsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  const { swaps } = await getManagerSwapsData(profile.id);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Swap Requests
        </h1>
        <p className="text-sm md:text-base text-[#7A94AD]">
          Review and approve shift swap requests from your team
        </p>
      </div>

      <SwapsClient swaps={swaps as SwapRow[]} />
    </div>
  );
}
