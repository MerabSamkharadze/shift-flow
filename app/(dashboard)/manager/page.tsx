import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getManagerDashboardData } from "@/lib/cache";
import { Users, Calendar, ArrowLeftRight, CalendarCheck, ArrowUp, Clock } from "lucide-react";

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

  const stats = [
    {
      label: "Active Employees",
      value: employeeCount,
      icon: Users,
      iconBg: "bg-[#4ECBA0]/10",
      iconColor: "text-[#4ECBA0]",
      trend: "+12%",
      trendColor: "text-[#4ECBA0]",
    },
    {
      label: "Groups",
      value: groups.length,
      icon: Calendar,
      iconBg: "bg-[#F5A623]/10",
      iconColor: "text-[#F5A623]",
      sparkline: true,
    },
    {
      label: "Pending Swaps",
      value: pendingCount,
      icon: ArrowLeftRight,
      iconBg: "bg-[#F5A623]/10",
      iconColor: "text-[#F5A623]",
      badge: pendingCount > 0 ? "Action needed" : null,
    },
    {
      label: "Published Schedules",
      value: publishedCount,
      icon: CalendarCheck,
      iconBg: "bg-[#14B8A6]/10",
      iconColor: "text-[#14B8A6]",
      trend: "+8%",
      trendColor: "text-[#4ECBA0]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold dark:text-[#F0EDE8]">
          Welcome back{profile.first_name ? `, ${profile.first_name}` : ""}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground dark:text-[#7A94AD] mt-0.5">
          Here&apos;s what&apos;s happening across your team today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map(({ label, value, icon: Icon, iconBg, iconColor, trend, trendColor, sparkline, badge }) => (
          <div
            key={label}
            className="bg-card dark:bg-[#142236] border border-border dark:border-white/[0.07] rounded-xl p-4 md:p-5 hover:dark:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon size={20} className={iconColor} />
              </div>
              {trend && (
                <div className={`flex items-center gap-1 ${trendColor} text-xs md:text-sm`}>
                  <ArrowUp size={14} />
                  <span>{trend}</span>
                </div>
              )}
              {sparkline && (
                <svg width="60" height="24" className="opacity-60 hidden sm:block">
                  <polyline
                    points="0,20 10,15 20,18 30,10 40,12 50,8 60,5"
                    fill="none"
                    stroke="#F5A623"
                    strokeWidth="2"
                  />
                </svg>
              )}
              {badge && (
                <span className="bg-[#F5A623] text-[#0A1628] text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                  {badge}
                </span>
              )}
            </div>
            <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold dark:text-[#F0EDE8] mb-1">
              {value}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground dark:text-[#7A94AD]">{label}</div>
          </div>
        ))}
      </div>

      {/* Today's Shifts + Pending Swaps */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 md:gap-6">
        {/* Today's Shifts */}
        <div className="bg-card dark:bg-[#142236] border border-border dark:border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold dark:text-[#F0EDE8]">
              Today&apos;s Shifts
            </h2>
            <span className="text-xs text-muted-foreground dark:text-[#7A94AD] flex items-center gap-1">
              <Clock size={12} />
              {fmtDate(today)}
            </span>
          </div>

          {todayShifts.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-[#7A94AD] py-8 text-center">
              No shifts scheduled for today.
            </p>
          ) : (
            <div className="space-y-2">
              {todayShifts.map((shift, idx) => {
                const gId = scheduleGroupMap[shift.schedule_id] ?? "";
                const color = groupColorMap[gId] ?? "#6366f1";
                return (
                  <div
                    key={shift.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-all cursor-pointer"
                    style={{ animation: `slideInRight 0.3s ease-out ${idx * 0.08}s both` }}
                  >
                    <div
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: color + "20", color: color }}
                    >
                      {shift.assigned_to
                        ? (todayUserMap[shift.assigned_to] ?? "?")
                            .split(" ")
                            .map((n: string) => n[0] ?? "")
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs md:text-sm dark:text-[#F0EDE8]">
                        <span className="font-medium">
                          {shift.assigned_to
                            ? (todayUserMap[shift.assigned_to] ?? "Unknown")
                            : "Unassigned"}
                        </span>
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground dark:text-[#7A94AD] mt-0.5">
                        {groupNameMap[gId] ?? ""}
                      </div>
                    </div>
                    <span
                      className="text-xs font-['JetBrains_Mono'] px-2 py-1 rounded-md flex-shrink-0"
                      style={{ backgroundColor: color + "15", color: color }}
                    >
                      {fmtTime(shift.start_time)}–{fmtTime(shift.end_time)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Swap Requests */}
        <div className="bg-card dark:bg-[#142236] border border-border dark:border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold dark:text-[#F0EDE8]">
              Pending Swaps
            </h2>
            {pendingCount > 0 && (
              <Link
                href="/manager/swaps"
                className="text-xs md:text-sm text-[#F5A623] hover:text-[#E09415] transition-colors whitespace-nowrap cursor-pointer"
              >
                View all →
              </Link>
            )}
          </div>

          {pendingSwaps.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-[#7A94AD] py-8 text-center">
              No swap requests pending approval.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingSwaps.map((swap, idx) => {
                const shiftDate = shiftDateMap[swap.shift_id];
                return (
                  <div
                    key={swap.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-all cursor-pointer"
                    style={{ animation: `slideInRight 0.3s ease-out ${idx * 0.1}s both` }}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                      <ArrowLeftRight size={16} className="text-[#F5A623]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs md:text-sm dark:text-[#F0EDE8]">
                        <span className="font-medium">
                          {swapUserMap[swap.from_user_id] ?? "Unknown"}
                        </span>
                        <span className="text-muted-foreground dark:text-[#7A94AD]"> → </span>
                        {(swap.to_user_id ?? swap.accepted_by) ? (
                          <span className="font-medium">
                            {swapUserMap[swap.to_user_id ?? swap.accepted_by ?? ""] ?? "Unknown"}
                          </span>
                        ) : (
                          <span className="font-medium text-[#F5A623]">Public</span>
                        )}
                      </div>
                      {shiftDate && (
                        <div className="text-[10px] md:text-xs text-muted-foreground dark:text-[#7A94AD] mt-0.5">
                          {fmtDate(shiftDate)}
                        </div>
                      )}
                    </div>
                    <span className="bg-[#F5A623]/20 text-[#F5A623] text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                      Pending
                    </span>
                  </div>
                );
              })}

              {pendingCount > 3 && (
                <div className="pt-3 mt-1 border-t border-border dark:border-white/[0.07]">
                  <Link
                    href="/manager/swaps"
                    className="text-xs text-muted-foreground dark:text-[#7A94AD] hover:text-foreground dark:hover:text-[#F0EDE8] transition-colors"
                  >
                    +{pendingCount - 3} more · Go to Swap Requests →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
