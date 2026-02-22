import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteEmployeeDialog } from "@/components/manager/invite-employee-dialog";
import { EmployeesTable, type EmployeeRow } from "@/components/manager/employees-table";

export default async function EmployeesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "manager") redirect("/manager");

  // Employees this manager invited
  const { data: employees } = await supabase
    .from("users")
    .select(
      "id, first_name, last_name, email, is_active, must_change_password, created_at",
    )
    .eq("created_by", profile.id)
    .eq("role", "employee")
    .order("created_at", { ascending: false });

  // Group memberships for all fetched employees (separate query avoids deep-join typing)
  const employeeIds = (employees ?? []).map((e) => e.id);
  const groupsByEmployee = new Map<
    string,
    { id: string; name: string; color: string }[]
  >();

  if (employeeIds.length > 0) {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("user_id, groups(id, name, color)")
      .in("user_id", employeeIds);

    for (const m of memberships ?? []) {
      const g = m.groups as { id: string; name: string; color: string } | null;
      if (!g) continue;
      const list = groupsByEmployee.get(m.user_id) ?? [];
      list.push(g);
      groupsByEmployee.set(m.user_id, list);
    }
  }

  const rows: EmployeeRow[] = (employees ?? []).map((e) => ({
    id: e.id,
    firstName: e.first_name??'',
    lastName: e.last_name??'',
    email: e.email,
    isActive: e.is_active,
    mustChangePassword: e.must_change_password,
    createdAt: e.created_at??'',
    groups: groupsByEmployee.get(e.id) ?? [],
  }));

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

      <EmployeesTable employees={rows} />
    </div>
  );
}
