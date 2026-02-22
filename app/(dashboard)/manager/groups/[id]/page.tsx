import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GroupDetailTabs } from "@/components/manager/group-detail-tabs";

export default async function GroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "manager") redirect("/manager");

  // Fetch group — manager_id filter enforces ownership
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, color")
    .eq("id", params.id)
    .eq("manager_id", profile.id)
    .single();

  if (!group) notFound();

  // Shift templates
  const { data: templates } = await supabase
    .from("shift_templates")
    .select("id, name, start_time, end_time, color")
    .eq("group_id", group.id)
    .order("start_time", { ascending: true });

  // Group members with user details
  const { data: membersRaw } = await supabase
    .from("group_members")
    .select("id, user_id, users(id, first_name, last_name, email)")
    .eq("group_id", group.id);

  type UserDetail = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };

  const members = (membersRaw ?? []).map((m) => {
    const u = m.users as UserDetail | null;
    return {
      memberId: m.id,
      userId: m.user_id,
      firstName: u?.first_name ?? "",
      lastName: u?.last_name ?? "",
      email: u?.email ?? "",
    };
  });

  // All active employees in the company not yet in this group
  const memberUserIds = new Set(members.map((m) => m.userId));

  const { data: allEmployees } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("company_id", profile.company_id)
    .eq("role", "employee")
    .eq("is_active", true)
    .order("first_name");

  const available = (allEmployees ?? []).filter(
    (e) => !memberUserIds.has(e.id),
  );

  return (
    <div>
      <Link
        href="/manager/groups"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft size={14} />
        Groups
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <span
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <h1 className="text-2xl font-bold">{group.name}</h1>
      </div>

      <GroupDetailTabs
        groupId={group.id}
        templates={templates ?? []}
        members={members}
        available={available}
      />
    </div>
  );
}
