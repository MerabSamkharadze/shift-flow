import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  TeamScheduleClient,
  type TeamMemberRow,
  type TeamShiftRow,
} from "@/components/employee/team-schedule-client";

export const dynamic = "force-dynamic";

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

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  // Auth always uses the session-based server client
  const supabase = createClient();
  const service = createServiceClient();

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

  // ── 1. My group memberships ───────────────────────────────────────────────
  // Own rows — server client is fine here
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", profile.id);

  const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

  if (myGroupIds.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold">Team Schedule</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            View your colleagues&apos; shifts for the week.
          </p>
        </div>
        <TeamScheduleClient weekStart={weekStart} members={[]} shifts={[]} />
      </div>
    );
  }

  // ── 2. ALL members of my groups (cross-user read → service client) ────────
  const { data: allMemberRows } = await service
    .from("group_members")
    .select("user_id, group_id")
    .in("group_id", myGroupIds);

  const memberUserIds = [
    ...new Set((allMemberRows ?? []).map((m) => m.user_id)),
  ];

  // Cross-user read: fetch names of all group members
  const { data: memberUsers } = memberUserIds.length
    ? await service
        .from("users")
        .select("id, first_name, last_name")
        .in("id", memberUserIds)
        .eq("is_active", true)
        .order("first_name")
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  // ── 3. Published + locked schedules for my groups ─────────────────────────
  // Employees see published and locked schedules (not drafts)
  const { data: schedules } = await service
    .from("schedules")
    .select("id, group_id")
    .in("group_id", myGroupIds)
    .in("status", ["published", "locked"]);

  const scheduleIds = (schedules ?? []).map((s) => s.id);
  const scheduleGroupMap = new Map(
    (schedules ?? []).map((s) => [s.id, s.group_id]),
  );

  // ── 4. All shifts for those schedules, this week, across all members ──────
  const { data: shifts } = scheduleIds.length
    ? await service
        .from("shifts")
        .select("id, schedule_id, assigned_to, date, start_time, end_time, shift_template_id, shift_templates(color)")
        .in("schedule_id", scheduleIds)
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .order("start_time")
    : {
        data: [] as {
          id: string;
          schedule_id: string;
          assigned_to: string;
          date: string;
          start_time: string;
          end_time: string;
          shift_template_id: string | null;
          shift_templates: { color: string | null } | null;
        }[],
      };

  // ── 5. Group info ─────────────────────────────────────────────────────────
  const { data: groups } = await service
    .from("groups")
    .select("id, name, color")
    .in("id", myGroupIds);

  const groupMap = new Map(
    (groups ?? []).map((g) => [g.id, { name: g.name, color: g.color }]),
  );

  // ── Assemble props ────────────────────────────────────────────────────────
  const members: TeamMemberRow[] = (memberUsers ?? []).map((u) => ({
    id: u.id,
    firstName: u.first_name??'',
    lastName: u.last_name??"",
  }));

  const teamShifts: TeamShiftRow[] = (shifts ?? []).map((s) => {
    const groupId = scheduleGroupMap.get(s.schedule_id) ?? "";
    const group = groupMap.get(groupId) ?? { name: "", color: "#6366f1" };
    const templateData = (s as unknown as { shift_templates: { color: string | null } | null }).shift_templates;
    const templateColor = templateData?.color ?? "#3b82f6";
    return {
      id: s.id,
      userId: s.assigned_to,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      groupName: group.name,
      groupColor: group.color,
      templateColor,
    };
  });

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
        members={members}
        shifts={teamShifts}
      />
    </div>
  );
}
