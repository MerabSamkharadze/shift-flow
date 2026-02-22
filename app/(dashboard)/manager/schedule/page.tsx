import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ScheduleClient,
  type GroupRow,
  type MemberRow,
  type TemplateRow,
  type ShiftRow,
  type ScheduleRow,
} from "@/components/manager/schedule-client";

export const dynamic = "force-dynamic";

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  // ── 1. Manager's groups ───────────────────────────────────────────────────
  const { data: groupsRaw } = await supabase
    .from("groups")
    .select("id, name, color")
    .eq("manager_id", profile.id)
    .order("name");

  const groups: GroupRow[] = (groupsRaw ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
  }));

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

  // ── 2. Shift templates for selected group ────────────────────────────────
  const { data: templatesRaw } = await supabase
    .from("shift_templates")
    .select("id, name, start_time, end_time, color")
    .eq("group_id", selectedGroupId)
    .order("start_time");

  const templates: TemplateRow[] = (templatesRaw ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    startTime: t.start_time,
    endTime: t.end_time,
    color: t.color ?? "#3b82f6",
  }));

  // ── 3. Members of selected group ─────────────────────────────────────────
  const { data: membersRaw } = await supabase
    .from("group_members")
    .select("user_id, users(id, first_name, last_name)")
    .eq("group_id", selectedGroupId);

  type UserDetail = { id: string; first_name: string; last_name: string };

  const members: MemberRow[] = (membersRaw ?? [])
    .map((m) => {
      const u = m.users as UserDetail | null;
      if (!u) return null;
      return { id: u.id, firstName: u.first_name, lastName: u.last_name };
    })
    .filter((m): m is MemberRow => m !== null);

  // ── 4. Schedule for this group + week ────────────────────────────────────
  const { data: scheduleRaw } = await supabase
    .from("schedules")
    .select("id, status")
    .eq("group_id", selectedGroupId)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  const schedule: ScheduleRow | null = scheduleRaw
    ? { id: scheduleRaw.id, status: scheduleRaw.status as ScheduleRow["status"] }
    : null;

  // ── 5. Shifts for this schedule ──────────────────────────────────────────
  const { data: shiftsRaw } = schedule
    ? await supabase
        .from("shifts")
        .select("id, assigned_to, date, start_time, end_time, shift_template_id, notes")
        .eq("schedule_id", schedule.id)
    : { data: [] as {
        id: string;
        assigned_to: string;
        date: string;
        start_time: string;
        end_time: string;
        shift_template_id: string | null;
        notes: string | null;
      }[] };

  const shifts: ShiftRow[] = (shiftsRaw ?? []).map((s) => ({
    id: s.id,
    userId: s.assigned_to,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    templateId: s.shift_template_id,
    notes: s.notes,
  }));

  // ── 6. Check if previous week has a schedule (for Copy button) ───────────
  const prevWeekStart = addDays(weekStart, -7);
  const { data: prevSchedule } = await supabase
    .from("schedules")
    .select("id")
    .eq("group_id", selectedGroupId)
    .eq("week_start_date", prevWeekStart)
    .maybeSingle();

  const prevScheduleExists = !!prevSchedule;

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
