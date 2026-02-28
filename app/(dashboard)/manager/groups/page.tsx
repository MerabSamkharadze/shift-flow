import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { getManagerGroupsData } from "@/lib/cache";
import { CreateGroupDialog } from "@/components/manager/create-group-dialog";
import { GroupRowActions } from "@/components/manager/group-row-actions";

export default async function GroupsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  const { groups } = await getManagerGroupsData(profile.id);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Groups
          </h1>
          <p className="text-sm md:text-base text-[#7A94AD]">
            Manage your departments, templates, and members
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {!groups?.length ? (
        <div className="bg-[#142236] border border-dashed border-white/[0.15] rounded-xl p-12 text-center">
          <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#0A1628]">
            <i className="ri-layout-grid-line text-2xl text-[#7A94AD]" />
          </div>
          <p className="text-sm text-[#7A94AD]">No groups yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {groups.map((g) => (
            <div
              key={g.id}
              className="relative bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden hover:bg-[#1A2E45] hover:border-[#F5A623]/30 transition-all duration-200"
            >
              <div className="h-1" style={{ backgroundColor: g.color }} />
              <Link href={`/manager/groups/${g.id}`} className="block p-5 pr-12">
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="font-semibold text-[#F0EDE8]">{g.name}</span>
                </div>
                <p className="text-xs text-[#7A94AD]">
                  {g.group_members.length}{" "}
                  {g.group_members.length === 1 ? "member" : "members"} ·{" "}
                  {g.shift_templates.length}{" "}
                  {g.shift_templates.length === 1 ? "template" : "templates"}
                </p>
              </Link>
              <div className="absolute top-4 right-3">
                <GroupRowActions groupId={g.id} groupName={g.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
