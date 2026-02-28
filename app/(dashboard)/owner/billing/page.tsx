import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getOwnerSettingsData } from "@/lib/cache";
import { BillingClient } from "@/components/owner/billing-client";

export default async function BillingPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "owner") redirect("/owner");

  const { company } = await getOwnerSettingsData(profile.company_id, user.id);

  // TODO: Replace with real billing data from DB when Bank of Georgia integration is ready.
  // For now, use company creation date as the activation date.
  const activatedAt = company.created_at || new Date().toISOString();
  const isPaid = true; // Will come from DB field (e.g. companies.is_paid)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Billing
        </h1>
        <p className="text-sm md:text-base text-[#7A94AD]">
          Manage your subscription and payments
        </p>
      </div>

      <BillingClient
        activatedAt={activatedAt}
        isPaid={isPaid}
      />
    </div>
  );
}
