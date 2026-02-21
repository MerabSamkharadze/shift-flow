import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  TeamScheduleClient,
  type TeamMemberRow,
  type TeamShiftRow,
} from "@/components/employee/team-schedule-client";

export const dynamic = "force-dynamic";

function getMonday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
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

  if (!profile || profile.role !== "employee") redirect("/auth/login");

  const weekStart = getMonday(searchParams.week);
  const weekEnd = addDays(weekStart, 6);

  // ── 1. My group memberships ───────────────────────────────────────────────────
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", profile.id);

  const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

  if (myGroupIds.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Team Schedule</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            View your colleagues&apos; shifts for the week.
          </p>
        </div>
        <TeamScheduleClient
          weekStart={weekStart}
          members={[]}
          shifts={[]}
        />
      </div>
    );
  }

  // ── 2. All members of my groups ───────────────────────────────────────────────
  const { data: allMemberRows } = await supabase
    .from("group_members")
    .select("user_id, group_id")
    .in("group_id", myGroupIds);

  const memberUserIds = [
    ...new Set((allMemberRows ?? []).map((m) => m.user_id)),
  ];

  const { data: memberUsers } = memberUserIds.length
    ? await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", memberUserIds)
        .eq("is_active", true)
        .order("first_name")
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  // ── 3. Published schedules for my groups ─────────────────────────────────────
  const { data: schedules } = await supabase
    .from("schedules")
    .select("id, group_id")
    .in("group_id", myGroupIds)
    .eq("status", "published");

  const scheduleIds = (schedules ?? []).map((s) => s.id);
  const scheduleGroupMap = new Map(
    (schedules ?? []).map((s) => [s.id, s.group_id]),
  );

  // ── 4. Shifts for those schedules, current week, all members ─────────────────
  const { data: shifts } = scheduleIds.length
    ? await supabase
        .from("shifts")
        .select("id, schedule_id, user_id, date, start_time, end_time")
        .in("schedule_id", scheduleIds)
        .in("user_id", memberUserIds)
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .order("start_time")
    : {
        data: [] as {
          id: string;
          schedule_id: string;
          user_id: string;
          date: string;
          start_time: string;
          end_time: string;
        }[],
      };

  // ── 5. Group info ─────────────────────────────────────────────────────────────
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, color")
    .in("id", myGroupIds);

  const groupMap = new Map(
    (groups ?? []).map((g) => [g.id, { name: g.name, color: g.color }]),
  );

  // ── Assemble props ────────────────────────────────────────────────────────────
  const members: TeamMemberRow[] = (memberUsers ?? []).map((u) => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
  }));

  const teamShifts: TeamShiftRow[] = (shifts ?? []).map((s) => {
    const groupId = scheduleGroupMap.get(s.schedule_id) ?? "";
    const group = groupMap.get(groupId) ?? { name: "", color: "#6366f1" };
    return {
      id: s.id,
      userId: s.user_id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      groupName: group.name,
      groupColor: group.color,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team Schedule</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Published shifts for everyone in your group this week.
        </p>
      </div>

      <TeamScheduleClient
        weekStart={weekStart}
        members={members}
        shifts={teamShifts}
      />
    </div>
  );
}
