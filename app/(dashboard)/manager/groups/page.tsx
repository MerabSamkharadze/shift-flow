import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupDialog } from "@/components/manager/create-group-dialog";
import { GroupRowActions } from "@/components/manager/group-row-actions";

export default async function GroupsPage() {
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

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, color, shift_templates(id), group_members(id)")
    .eq("manager_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your departments, shift templates, and members.
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {!groups?.length ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No groups yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div
              key={g.id}
              className="relative rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <Link
                href={`/manager/groups/${g.id}`}
                className="block p-5 pr-10"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="font-semibold">{g.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {g.group_members.length}{" "}
                  {g.group_members.length === 1 ? "member" : "members"} ·{" "}
                  {g.shift_templates.length}{" "}
                  {g.shift_templates.length === 1 ? "template" : "templates"}
                </p>
              </Link>
              <div className="absolute top-3 right-3">
                <GroupRowActions groupId={g.id} groupName={g.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
