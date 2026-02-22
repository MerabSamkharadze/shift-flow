import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  MyScheduleClient,
  type ShiftRow,
  type ColleagueRow,
} from "@/components/employee/my-schedule-client";

export const dynamic = "force-dynamic";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localDateStr(d);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

export default async function EmployeePage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
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

  // ── 1. Employee's shifts for the week ────────────────────────────────────────
  const { data: shifts } = await supabase
    .from("shifts")
    .select("id, schedule_id, date, start_time, end_time, shift_template_id, shift_templates(color), extra_hours, extra_hours_notes")
    .eq("assigned_to", profile.id)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("start_time");

  const scheduleIds = [...new Set((shifts ?? []).map((s) => s.schedule_id))];

  // ── 2. Schedule → group lookup ───────────────────────────────────────────────
  const { data: schedules } = scheduleIds.length
    ? await supabase
        .from("schedules")
        .select("id, group_id")
        .in("id", scheduleIds)
    : { data: [] as { id: string; group_id: string }[] };

  const groupIds = [...new Set((schedules ?? []).map((s) => s.group_id))];

  const { data: groups } = groupIds.length
    ? await supabase
        .from("groups")
        .select("id, name, color")
        .in("id", groupIds)
    : { data: [] as { id: string; name: string; color: string }[] };

  // ── 3. Active swaps for these shifts ─────────────────────────────────────────
  const shiftIds = (shifts ?? []).map((s) => s.id);

  const { data: activeSwaps } = shiftIds.length
    ? await supabase
        .from("shift_swaps")
        .select("id, shift_id, status, type")
        .eq("from_user_id", profile.id)
        .in("shift_id", shiftIds)
        .in("status", ["pending_employee", "accepted_by_employee", "pending_manager"])
    : { data: [] as { id: string; shift_id: string; status: string; type: string }[] };

  // ── 4. Colleagues in my groups ───────────────────────────────────────────────
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", profile.id);

  const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

  const { data: allMemberRows } = myGroupIds.length
    ? await service
        .from("group_members")
        .select("user_id, group_id")
        .in("group_id", myGroupIds)
        .neq("user_id", profile.id)
    : { data: [] as { user_id: string; group_id: string }[] };

  const colleagueIds = [
    ...new Set((allMemberRows ?? []).map((m) => m.user_id)),
  ];

  const { data: colleagueUsers } = colleagueIds.length
    ? await service
        .from("users")
        .select("id, first_name, last_name")
        .in("id", colleagueIds)
        .eq("is_active", true)
        .order("first_name")
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  // ── Build lookup maps ────────────────────────────────────────────────────────
  const scheduleGroupMap = new Map(
    (schedules ?? []).map((s) => [s.id, s.group_id]),
  );
  const groupMap = new Map(
    (groups ?? []).map((g) => [g.id, { name: g.name, color: g.color }]),
  );
  const swapMap = new Map(
    (activeSwaps ?? []).map((s) => [s.shift_id, s]),
  );

  // colleague → which groups we share
  const colleagueGroupsMap = new Map<string, string[]>();
  for (const m of allMemberRows ?? []) {
    const list = colleagueGroupsMap.get(m.user_id) ?? [];
    list.push(m.group_id);
    colleagueGroupsMap.set(m.user_id, list);
  }

  // ── Assemble props ────────────────────────────────────────────────────────────
  const shiftRows: ShiftRow[] = (shifts ?? []).map((s) => {
    const groupId = scheduleGroupMap.get(s.schedule_id) ?? "";
    const group = groupMap.get(groupId) ?? { name: "", color: "#6366f1" };
    const swap = swapMap.get(s.id);
    const templateData = (s as unknown as { shift_templates: { color: string | null } | null }).shift_templates;
    const templateColor = templateData?.color ?? "#3b82f6";
    return {
      id: s.id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      groupId,
      groupName: group.name,
      groupColor: group.color,
      templateColor,
      extraHours: s.extra_hours ?? null,
      extraHoursNotes: s.extra_hours_notes ?? null,
      swapId: swap?.id ?? null,
      swapStatus: swap?.status ?? null,
      swapType: (swap?.type as "direct" | "public") ?? null,
    };
  });

  const colleagues: ColleagueRow[] = (colleagueUsers ?? []).map((u) => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    groupIds: colleagueGroupsMap.get(u.id) ?? [],
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Your shifts for the week. Click &ldquo;Give Away&rdquo; to request a
          swap.
        </p>
      </div>

      <MyScheduleClient
        weekStart={weekStart}
        shifts={shiftRows}
        colleagues={colleagues}
      />
    </div>
  );
}
