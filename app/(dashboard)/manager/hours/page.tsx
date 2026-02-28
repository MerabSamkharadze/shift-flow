import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getManagerHoursSummaryData } from "@/lib/cache";
import { HoursSummaryClient } from "@/components/owner/hours-summary-client";
import { MonthSelector } from "@/components/owner/month-selector";

export default async function ManagerHoursPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  const now = new Date();
  const currentMonth =
    searchParams.month ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { employees, weeks, branches } = await getManagerHoursSummaryData(
    profile.id,
    currentMonth,
  );

  const monthOptions: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    monthOptions.push({ value, label });
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Hours Summary
          </h1>
          <p className="text-sm md:text-base text-[#7A94AD]">
            Weekly &amp; monthly breakdowns for your team
          </p>
        </div>
        <MonthSelector currentMonth={currentMonth} options={monthOptions} basePath="/manager/hours" />
      </div>

      <HoursSummaryClient employees={employees} weeks={weeks} branches={branches} />
    </div>
  );
}
