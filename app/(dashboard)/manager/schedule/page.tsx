import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScheduleData } from "@/lib/cache";
import {
  ScheduleClient,
  type GroupRow,
  type MemberRow,
  type TemplateRow,
  type ShiftRow,
  type ScheduleRow,
} from "@/components/manager/schedule-client";

function getMonday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dy}`;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { group?: string; week?: string };
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

  if (!profile) redirect("/auth/signout");
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  const weekStart = getMonday(searchParams.week);

  // We need to know the groups first to resolve selectedGroupId,
  // but getScheduleData fetches groups too. We'll do a two-step:
  // first call with a tentative groupId, the cached fn returns groups.
  // Actually, let's fetch groups list from the cached data with a placeholder,
  // then use it. The cache fn handles empty groups gracefully.

  // First, resolve selectedGroupId — we need groups list.
  // We'll call getScheduleData with a tentative selectedGroupId.
  // The function always fetches groups for the manager anyway.
  const tentativeGroupId = searchParams.group ?? "";
  const data = await getScheduleData(profile.id, tentativeGroupId || "__placeholder__", weekStart);

  const groups: GroupRow[] = data.groups;

  if (groups.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Schedule Builder</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Build and publish weekly shift schedules for your groups.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Create a group first before building schedules.
          </p>
        </div>
      </div>
    );
  }

  // Resolve selected group
  const selectedGroupId =
    searchParams.group && groups.some((g) => g.id === searchParams.group)
      ? searchParams.group
      : groups[0].id;

  // If the tentative group was wrong, re-fetch with the correct one
  const finalData =
    tentativeGroupId === selectedGroupId
      ? data
      : await getScheduleData(profile.id, selectedGroupId, weekStart);

  const templates: TemplateRow[] = finalData.templates;
  const members: MemberRow[] = finalData.members;
  const schedule: ScheduleRow | null = finalData.schedule as ScheduleRow | null;
  const shifts: ShiftRow[] = finalData.shifts;
  const prevScheduleExists = finalData.prevScheduleExists;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule Builder</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Build and publish weekly shift schedules for your groups.
        </p>
      </div>

      <ScheduleClient
        groups={groups}
        selectedGroupId={selectedGroupId}
        weekStart={weekStart}
        members={members}
        templates={templates}
        schedule={schedule}
        shifts={shifts}
        prevScheduleExists={prevScheduleExists}
      />
    </div>
  );
}
