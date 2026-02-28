import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getManagerEmployeesData } from "@/lib/cache";
import { InviteEmployeeDialog } from "@/components/manager/invite-employee-dialog";
import { EmployeesTable, type EmployeeRow } from "@/components/manager/employees-table";

export default async function EmployeesPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  const { rows } = await getManagerEmployeesData(profile.id);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Employees
          </h1>
          <p className="text-sm md:text-base text-[#7A94AD]">
            Invite and manage employees on your team
          </p>
        </div>
        <InviteEmployeeDialog />
      </div>

      <EmployeesTable employees={rows as EmployeeRow[]} />
    </div>
  );
}
