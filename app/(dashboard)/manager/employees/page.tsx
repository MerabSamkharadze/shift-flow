import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getManagerEmployeesData } from "@/lib/cache";
import { InviteEmployeeDialog } from "@/components/manager/invite-employee-dialog";
import { EmployeesTable, type EmployeeRow } from "@/components/manager/employees-table";

export default async function EmployeesPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "manager") redirect("/manager");

  const { rows } = await getManagerEmployeesData(profile.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Invite and manage employees on your team.
          </p>
        </div>
        <InviteEmployeeDialog />
      </div>

      <EmployeesTable employees={rows as EmployeeRow[]} />
    </div>
  );
}
