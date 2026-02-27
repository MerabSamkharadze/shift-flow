import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getTeamScheduleData } from "@/lib/cache";
import {
  TeamScheduleClient,
  type TeamMemberRow,
  type TeamShiftRow,
} from "@/components/employee/team-schedule-client";

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localDateStr(d);
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: { week?: string; employeeId?: string };
}) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "employee") redirect("/auth/login");

  const weekStart = getMonday(searchParams.week);

  const { members, shifts } = await getTeamScheduleData(profile.id, weekStart);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Team Schedule</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Published shifts for everyone in your group this week.
        </p>
      </div>

      <TeamScheduleClient
        weekStart={weekStart}
        selectedEmployeeId={searchParams.employeeId ?? ""}
        members={members as TeamMemberRow[]}
        shifts={shifts as TeamShiftRow[]}
      />
    </div>
  );
}
