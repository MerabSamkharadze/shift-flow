import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getManagerDashboardData } from "@/lib/cache";
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

  if (!profile) redirect("/auth/signout");
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  // ── Cached data fetch ───────────────────────────────────────────────────────
  const {
    groups,
    employeeCount,
    publishedCount,
    pendingSwaps,
    pendingCount,
    scheduleGroupMap,
    groupNameMap,
    groupColorMap,
    shiftDateMap,
    todayShifts,
    userNameMap,
    today,
  } = await getManagerDashboardData(profile.id);

  const todayUserMap = userNameMap;
  const swapUserMap = userNameMap;

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = [
    { label: "Active Employees", value: employeeCount, icon: Users },
    { label: "Groups", value: groups.length, icon: LayoutGrid },
    { label: "Pending Swaps", value: pendingCount, icon: ArrowLeftRight },
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
                  const gId = scheduleGroupMap[shift.schedule_id] ?? "";
                  return (
                    <li key={shift.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: groupColorMap[gId] ?? "#6366f1" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {shift.assigned_to
                            ? (todayUserMap[shift.assigned_to] ?? "Unknown")
                            : "Unassigned"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {groupNameMap[gId] ?? ""}
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
              {pendingCount > 0 && (
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
            {pendingSwaps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No swap requests pending approval.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {pendingSwaps.map((swap) => {
                    const shiftDate = shiftDateMap[swap.shift_id];
                    return (
                      <li key={swap.id} className="py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm">
                            <span className="font-medium">
                              {swapUserMap[swap.from_user_id] ?? "Unknown"}
                            </span>
                            <span className="text-muted-foreground"> → </span>
                            {(swap.to_user_id ?? swap.accepted_by) ? (
                              <span className="font-medium">
                                {swapUserMap[swap.to_user_id ?? swap.accepted_by ?? ""] ?? "Unknown"}
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
                {pendingCount > 3 && (
                  <div className="pt-3 mt-1 border-t border-border">
                    <Link
                      href="/manager/swaps"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      +{pendingCount - 3} more · Go to Swap Requests →
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
