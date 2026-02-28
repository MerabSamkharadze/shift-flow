import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getManagerMonthlyReportData } from "@/lib/cache";
import { MonthlyReportClient } from "@/components/owner/monthly-report-client";
import { MonthSelector } from "@/components/owner/month-selector";

export default async function ManagerReportsPage({
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

  const { employees, totalHours, totalOvertime, employeeCount } =
    await getManagerMonthlyReportData(profile.id, currentMonth);

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
            Monthly Report
          </h1>
          <p className="text-sm md:text-base text-[#7A94AD]">
            Your team&apos;s analytics and insights
          </p>
        </div>
        <MonthSelector currentMonth={currentMonth} options={monthOptions} basePath="/manager/reports" />
      </div>

      <MonthlyReportClient
        employees={employees}
        totalHours={totalHours}
        totalOvertime={totalOvertime}
        employeeCount={employeeCount}
        currentMonth={currentMonth}
      />
    </div>
  );
}
