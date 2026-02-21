import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, LayoutGrid, ArrowLeftRight, CalendarCheck } from "lucide-react";

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/signout"); // consistent with layout — sign out if no profile
  if (profile.role !== "manager") redirect(`/${profile.role}`); // wrong role → their home

  // ── 1. Groups ────────────────────────────────────────────────────────────────
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, color")
    .eq("manager_id", profile.id);

  const groupIds = (groups ?? []).map((g) => g.id);

  // ── 2. Schedules ─────────────────────────────────────────────────────────────
  const { data: schedules } = groupIds.length
    ? await supabase
        .from("schedules")
        .select("id, group_id, status")
        .in("group_id", groupIds)
    : { data: [] as { id: string; group_id: string; status: string }[] };

  const scheduleIds = (schedules ?? []).map((s) => s.id);
  const publishedCount = (schedules ?? []).filter(
    (s) => s.status === "published",
  ).length;

  // ── 3. All shifts (needed for swaps + today filter) ──────────────────────────
  const { data: allShifts } = scheduleIds.length
    ? await supabase
        .from("shifts")
        .select("id, schedule_id, date, start_time, end_time, assigned_to")
        .in("schedule_id", scheduleIds)
    : { data: [] as { id: string; schedule_id: string; date: string; start_time: string; end_time: string; assigned_to: string | null }[] };

  const allShiftIds = (allShifts ?? []).map((s) => s.id);

  // ── 4. Active employee count ─────────────────────────────────────────────────
  const { count: employeeCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("created_by", profile.id)
    .eq("role", "employee")
    .eq("is_active", true);

  // ── 5. Pending swap requests ─────────────────────────────────────────────────
  const { data: pendingSwaps, count: pendingCount } = allShiftIds.length
    ? await supabase
        .from("shift_swaps")
        .select("id, shift_id, from_user_id, to_user_id, accepted_by, requested_at", {
          count: "exact",
        })
        .in("shift_id", allShiftIds)
        .in("status", ["accepted_by_employee", "pending_manager"])
        .order("requested_at", { ascending: false })
        .limit(3)
    : { data: [], count: 0 };

  // ── Lookup maps ──────────────────────────────────────────────────────────────
  const scheduleGroupMap = new Map(
    (schedules ?? []).map((s) => [s.id, s.group_id]),
  );
  const groupNameMap = new Map((groups ?? []).map((g) => [g.id, g.name]));
  const groupColorMap = new Map((groups ?? []).map((g) => [g.id, g.color]));
  const shiftDateMap = new Map(
    (allShifts ?? []).map((s) => [s.id, s.date]),
  );

  // ── Today's shifts ───────────────────────────────────────────────────────────
  const _d = new Date();
  const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, "0")}-${String(_d.getDate()).padStart(2, "0")}`;
  const todayShifts = (allShifts ?? [])
    .filter((s) => s.date === today)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Fetch employee names for today's shifts
  const todayUserIds = [
    ...new Set(todayShifts.map((s) => s.assigned_to).filter(Boolean) as string[]),
  ];
  const { data: todayUsers } = todayUserIds.length
    ? await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", todayUserIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  const todayUserMap = new Map(
    (todayUsers ?? []).map((u) => [u.id, `${u.first_name} ${u.last_name}`]),
  );

  // Fetch employee names for pending swaps
  const swapUserIds = [
    ...new Set([
      ...(pendingSwaps ?? []).map((s) => s.from_user_id),
      ...(pendingSwaps ?? []).map((s) => s.to_user_id).filter((id): id is string => id !== null),
      ...(pendingSwaps ?? []).map((s) => s.accepted_by).filter((id): id is string => id !== null),
    ]),
  ];
  const { data: swapUsers } = swapUserIds.length
    ? await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", swapUserIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  const swapUserMap = new Map(
    (swapUsers ?? []).map((u) => [u.id, `${u.first_name} ${u.last_name}`]),
  );

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = [
    { label: "Active Employees", value: employeeCount ?? 0, icon: Users },
    { label: "Groups", value: (groups ?? []).length, icon: LayoutGrid },
    { label: "Pending Swaps", value: pendingCount ?? 0, icon: ArrowLeftRight },
    { label: "Published Schedules", value: publishedCount, icon: CalendarCheck },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{profile.first_name ? `, ${profile.first_name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Here&apos;s what&apos;s happening across your team today.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon size={16} className="text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Shifts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Today&apos;s Shifts
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {fmtDate(today)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {todayShifts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No shifts scheduled for today.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {todayShifts.map((shift) => {
                  const gId = scheduleGroupMap.get(shift.schedule_id) ?? "";
                  return (
                    <li key={shift.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: groupColorMap.get(gId) ?? "#6366f1" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {shift.assigned_to
                            ? (todayUserMap.get(shift.assigned_to) ?? "Unknown")
                            : "Unassigned"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {groupNameMap.get(gId) ?? ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {fmtTime(shift.start_time)}–{fmtTime(shift.end_time)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Pending Swap Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Pending Swap Requests
              </CardTitle>
              {(pendingCount ?? 0) > 0 && (
                <Link
                  href="/manager/swaps"
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {(pendingSwaps ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No swap requests pending approval.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {(pendingSwaps ?? []).map((swap) => {
                    const shiftDate = shiftDateMap.get(swap.shift_id);
                    return (
                      <li key={swap.id} className="py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm">
                            <span className="font-medium">
                              {swapUserMap.get(swap.from_user_id) ?? "Unknown"}
                            </span>
                            <span className="text-muted-foreground"> → </span>
                            {(swap.to_user_id ?? swap.accepted_by) ? (
                              <span className="font-medium">
                                {swapUserMap.get(swap.to_user_id ?? swap.accepted_by ?? "") ?? "Unknown"}
                              </span>
                            ) : (
                              <span className="font-medium text-violet-600 dark:text-violet-400">
                                Public
                              </span>
                            )}
                          </p>
                          {shiftDate && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                              {fmtDate(shiftDate)}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {(pendingCount ?? 0) > 3 && (
                  <div className="pt-3 mt-1 border-t border-border">
                    <Link
                      href="/manager/swaps"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      +{(pendingCount ?? 0) - 3} more · Go to Swap Requests →
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
