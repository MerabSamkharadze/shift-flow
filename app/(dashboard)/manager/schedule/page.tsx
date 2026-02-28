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
  const { groups } = await getManagerGroupsList(profile.id);

  if (groups.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Schedule Builder
          </h1>
          <p className="text-sm md:text-base text-[#7A94AD]">
            Build and publish weekly shift schedules
          </p>
        </div>
        <div className="bg-[#142236] border border-dashed border-white/[0.15] rounded-xl p-12 text-center">
          <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#0A1628]">
            <i className="ri-calendar-line text-2xl text-[#7A94AD]" />
          </div>
          <p className="text-sm text-[#7A94AD]">
            Create a group first before building schedules.
          </p>
        </div>
      </div>
    );
  }

  const selectedGroupId =
    searchParams.group && groups.some((g) => g.id === searchParams.group)
      ? searchParams.group
      : groups[0].id;

  const data = await getScheduleData(profile.id, selectedGroupId, weekStart);

  const allGroups: GroupRow[] = data.groups.length > 0 ? data.groups : groups;
  const templates: TemplateRow[] = data.templates;
  const members: MemberRow[] = data.members;
  const schedule: ScheduleRow | null = data.schedule as ScheduleRow | null;
  const shifts: ShiftRow[] = data.shifts;
  const prevScheduleExists = data.prevScheduleExists;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Schedule Builder
        </h1>
        <p className="text-sm md:text-base text-[#7A94AD]">
          Build and publish weekly shift schedules
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
