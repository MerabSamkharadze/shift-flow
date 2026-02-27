import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getManagerGroupsList, getScheduleData } from "@/lib/cache";
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
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  const weekStart = getMonday(searchParams.week);

  // Step 1: lightweight groups fetch to resolve selectedGroupId
  const { groups } = await getManagerGroupsList(profile.id);

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

  // Step 2: resolve selected group
  const selectedGroupId =
    searchParams.group && groups.some((g) => g.id === searchParams.group)
      ? searchParams.group
      : groups[0].id;

  // Step 3: single fetch with correct groupId
  const data = await getScheduleData(profile.id, selectedGroupId, weekStart);

  const allGroups: GroupRow[] = data.groups.length > 0 ? data.groups : groups;
  const templates: TemplateRow[] = data.templates;
  const members: MemberRow[] = data.members;
  const schedule: ScheduleRow | null = data.schedule as ScheduleRow | null;
  const shifts: ShiftRow[] = data.shifts;
  const prevScheduleExists = data.prevScheduleExists;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule Builder</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Build and publish weekly shift schedules for your groups.
        </p>
      </div>

      <ScheduleClient
        groups={allGroups}
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
