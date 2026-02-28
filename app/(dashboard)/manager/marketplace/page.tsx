import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";

export default async function MarketplacePage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Marketplace
        </h1>
        <p className="text-sm md:text-base text-[#7A94AD]">
          Browse available shifts and open positions
        </p>
      </div>

      <div className="bg-[#142236] border border-dashed border-white/[0.15] rounded-xl p-12 text-center">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#0A1628]">
          <i className="ri-store-2-line text-3xl text-[#7A94AD]" />
        </div>
        <h3 className="text-base font-semibold text-[#F0EDE8] mb-2">Coming Soon</h3>
        <p className="text-sm text-[#7A94AD] max-w-sm mx-auto">
          The shift marketplace will allow employees to pick up available shifts and managers to post open positions.
        </p>
      </div>
    </div>
  );
}
