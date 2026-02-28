import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { getManagerDashboardData } from "@/lib/cache";

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
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
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
    todayShifts,
    userNameMap,
    today,
  } = await getManagerDashboardData(profile.id);

  const stats = [
    { label: "Active Employees", value: employeeCount, icon: "ri-team-line", color: "#14B8A6" },
    { label: "Groups", value: groups.length, icon: "ri-layout-grid-line", color: "#F5A623" },
    {
      label: "Pending Swaps",
      value: pendingCount,
      icon: "ri-arrow-left-right-line",
      color: "#E8604C",
      badge: pendingCount > 0 ? "Action needed" : undefined,
    },
    { label: "Published Schedules", value: publishedCount, icon: "ri-calendar-check-line", color: "#4ECBA0" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Welcome back{profile.first_name ? `, ${profile.first_name}` : ""}
        </h1>
        <p className="text-sm md:text-base text-[#7A94AD]">
          Here&apos;s what&apos;s happening across your team today
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: stat.color + "20" }}
              >
                <i className={`${stat.icon} text-lg md:text-xl`} style={{ color: stat.color }} />
              </div>
              {stat.badge && (
                <span className="bg-[#E8604C]/15 text-[#E8604C] text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                  {stat.badge}
                </span>
              )}
            </div>
            <div
              className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {stat.value}
            </div>
            <div className="text-xs md:text-sm text-[#7A94AD]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Today's Shifts + Pending Swaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Today's Shifts */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">
              Today&apos;s Shifts
            </h2>
            <span className="text-xs text-[#7A94AD]">{fmtDate(today)}</span>
          </div>

          {todayShifts.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3 rounded-full bg-[#0A1628]">
                <i className="ri-calendar-line text-xl text-[#7A94AD]" />
              </div>
              <p className="text-sm text-[#7A94AD]">No shifts scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayShifts.map((shift) => {
                const gId = scheduleGroupMap[shift.schedule_id] ?? "";
                return (
                  <div
                    key={shift.id}
                    className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg hover:bg-[#0D1B2A] transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: groupColorMap[gId] ?? "#F5A623" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F0EDE8] truncate">
                        {shift.assigned_to
                          ? (userNameMap[shift.assigned_to] ?? "Unknown")
                          : "Unassigned"}
                      </p>
                      <p className="text-xs text-[#7A94AD]">
                        {groupNameMap[gId] ?? ""}
                      </p>
                    </div>
                    <span
                      className="text-xs text-[#7A94AD] whitespace-nowrap"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
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
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">
              Pending Swap Requests
            </h2>
            {pendingCount > 0 && (
              <Link
                href="/manager/swaps"
                className="text-xs text-[#F5A623] hover:text-[#E09415] transition-colors"
              >
                View all
              </Link>
            )}
          </div>

          {pendingSwaps.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3 rounded-full bg-[#0A1628]">
                <i className="ri-arrow-left-right-line text-xl text-[#7A94AD]" />
              </div>
              <p className="text-sm text-[#7A94AD]">No swap requests pending</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingSwaps.map((swap) => (
                <div
                  key={swap.id}
                  className="flex items-center justify-between gap-3 p-3 bg-[#0A1628] rounded-lg hover:bg-[#0D1B2A] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-[#F0EDE8] font-medium truncate">
                      {userNameMap[swap.from_user_id] ?? "Unknown"}
                    </span>
                    <i className="ri-arrow-right-line text-[#7A94AD] text-xs flex-shrink-0" />
                    {(swap.to_user_id ?? swap.accepted_by) ? (
                      <span className="text-sm text-[#F0EDE8] font-medium truncate">
                        {userNameMap[swap.to_user_id ?? swap.accepted_by ?? ""] ?? "Unknown"}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-[#8B5CF6]/15 text-[#A78BFA] rounded-full whitespace-nowrap">
                        Public
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#7A94AD] whitespace-nowrap flex-shrink-0">
                    {swap.requested_at
                      ? new Date(swap.requested_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                </div>
              ))}
              {pendingCount > 3 && (
                <Link
                  href="/manager/swaps"
                  className="block text-center pt-2 text-xs text-[#7A94AD] hover:text-[#F0EDE8] transition-colors"
                >
                  +{pendingCount - 3} more · Go to Swap Requests →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
