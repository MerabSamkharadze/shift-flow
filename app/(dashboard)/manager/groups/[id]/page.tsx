import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { getGroupDetailData } from "@/lib/cache";
import { GroupDetailTabs } from "@/components/manager/group-detail-tabs";

export default async function GroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "manager") redirect("/manager");

  const data = await getGroupDetailData(params.id, profile.company_id, profile.id);
  if (!data) notFound();

  const { group, templates, members, available } = data;

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
        templates={templates}
        members={members}
        available={available}
      />
    </div>
  );
}
