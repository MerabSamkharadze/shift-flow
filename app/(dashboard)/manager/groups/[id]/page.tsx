import { redirect, notFound } from "next/navigation";
import Link from "next/link";
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
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  const data = await getGroupDetailData(params.id, profile.company_id, profile.id);
  if (!data) notFound();

  const { group, templates, members, available } = data;

  return (
    <div className="space-y-4 md:space-y-6">
      <Link
        href="/manager/groups"
        className="inline-flex items-center gap-1.5 text-sm text-[#7A94AD] hover:text-[#F0EDE8] transition-colors"
      >
        <i className="ri-arrow-left-s-line" />
        Groups
      </Link>

      <div className="flex items-center gap-3">
        <span
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8]"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          {group.name}
        </h1>
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
