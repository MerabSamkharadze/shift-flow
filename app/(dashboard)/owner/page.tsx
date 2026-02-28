import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { getOwnerDashboardData } from "@/lib/cache";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ACTION_LABELS: Record<string, string> = {
  swap_approved: "approved a swap",
  swap_rejected: "rejected a swap",
  schedule_published: "published a schedule",
  schedule_locked: "locked a schedule",
  schedule_archived: "archived a schedule",
  employee_added: "added an employee",
  manager_invited: "invited a manager",
  manager_deactivated: "deactivated a manager",
  group_created: "created a group",
  group_updated: "updated a group",
  shift_updated: "updated a shift",
};

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  swap_approved: { icon: "ri-swap-line", color: "#F5A623" },
  swap_rejected: { icon: "ri-close-circle-line", color: "#E8604C" },
  schedule_published: { icon: "ri-calendar-check-line", color: "#F5A623" },
  schedule_locked: { icon: "ri-lock-line", color: "#7A94AD" },
  schedule_archived: { icon: "ri-archive-line", color: "#7A94AD" },
  employee_added: { icon: "ri-user-add-line", color: "#4ECBA0" },
  manager_invited: { icon: "ri-user-star-line", color: "#F5A623" },
  manager_deactivated: { icon: "ri-user-unfollow-line", color: "#E8604C" },
  group_created: { icon: "ri-group-line", color: "#4ECBA0" },
  group_updated: { icon: "ri-edit-line", color: "#7A94AD" },
  shift_updated: { icon: "ri-time-line", color: "#14B8A6" },
};

function getActionMeta(action: string) {
  return ACTION_ICONS[action] ?? { icon: "ri-flashlight-line", color: "#7A94AD" };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OwnerDashboardPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "owner") redirect(`/${profile.role}`);

  const {
    managerCount,
    employeeCount,
    groupCount,
    managers,
    pendingSwaps,
    pendingSwapCount,
    activityLogs,
    userNameMap,
  } = await getOwnerDashboardData(profile.company_id);

  const stats = [
    {
      label: "Active Employees",
      value: employeeCount,
      icon: "ri-user-line",
      iconBg: "bg-[#4ECBA0]/10",
      iconColor: "text-[#4ECBA0]",
      trend: null,
    },
    {
      label: "Active Managers",
      value: managerCount,
      icon: "ri-user-star-line",
      iconBg: "bg-[#F5A623]/10",
      iconColor: "text-[#F5A623]",
      trend: null,
    },
    {
      label: "Active Groups",
      value: groupCount,
      icon: "ri-group-line",
      iconBg: "bg-[#14B8A6]/10",
      iconColor: "text-[#14B8A6]",
      trend: null,
    },
    {
      label: "Pending Swaps",
      value: pendingSwapCount,
      icon: "ri-swap-line",
      iconBg: "bg-[#F5A623]/10",
      iconColor: "text-[#F5A623]",
      badge: pendingSwapCount > 0 ? "Action needed" : null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-[#7A94AD]">
          Overview of your company operations
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-default"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}
              >
                <i className={`${stat.icon} text-lg md:text-xl ${stat.iconColor}`} />
              </div>
              {"badge" in stat && stat.badge && (
                <span className="bg-[#F5A623] text-[#0A1628] text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                  {stat.badge}
                </span>
              )}
            </div>
            <div
              className="text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {stat.value}
            </div>
            <div className="text-xs md:text-sm text-[#7A94AD]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Managers + Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 md:gap-6">
        {/* Managers Table */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">
              Managers
            </h2>
            <Link
              href="/owner/managers"
              className="text-xs md:text-sm text-[#F5A623] hover:text-[#E09415] transition-colors whitespace-nowrap"
            >
              View all <i className="ri-arrow-right-line" />
            </Link>
          </div>

          {managers.length === 0 ? (
            <p className="text-sm text-[#7A94AD] py-6 text-center">
              No managers yet.
            </p>
          ) : (
            <div className="space-y-2">
              {managers.map((m) => {
                const name = `${m.first_name} ${m.last_name}`.trim();
                const statusColor =
                  m.status === "active"
                    ? "#4ECBA0"
                    : m.status === "pending"
                      ? "#F5A623"
                      : "#7A94AD";
                const statusLabel =
                  m.status === "active"
                    ? "Active"
                    : m.status === "pending"
                      ? "Invite pending"
                      : "Inactive";

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-all"
                  >
                    <div
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{
                        backgroundColor: statusColor + "20",
                        color: statusColor,
                      }}
                    >
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#F0EDE8] truncate">
                        {name}
                      </div>
                      <div className="text-xs text-[#7A94AD] truncate">{m.email}</div>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{
                        backgroundColor: statusColor + "20",
                        color: statusColor,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">
            Activity Feed
          </h2>

          {activityLogs.length === 0 ? (
            <p className="text-sm text-[#7A94AD] py-6 text-center">
              No activity recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => {
                const actorName = userNameMap[log.user_id] ?? "Someone";
                const label =
                  ACTION_LABELS[log.action] ?? log.action.replace(/_/g, " ");
                const meta = getActionMeta(log.action);

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-all"
                  >
                    <div
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{
                        backgroundColor: meta.color + "20",
                        color: meta.color,
                      }}
                    >
                      {getInitials(actorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs md:text-sm text-[#F0EDE8]">
                        <span className="font-medium">{actorName}</span>
                        <span className="text-[#7A94AD]"> {label}</span>
                      </div>
                      <div className="text-[10px] md:text-xs text-[#7A94AD] mt-0.5">
                        {fmtRelative(log.created_at)}
                      </div>
                    </div>
                    <i
                      className={`${meta.icon} text-base md:text-lg flex-shrink-0`}
                      style={{ color: meta.color }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pending Swap Approvals */}
      {pendingSwapCount > 0 && (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">
              Pending Swap Approvals
            </h2>
            <span
              className="bg-[#F5A623] text-[#0A1628] text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {pendingSwapCount}
            </span>
          </div>

          <div className="space-y-2">
            {pendingSwaps.map((swap) => {
              const fromName = userNameMap[swap.from_user_id] ?? "Unknown";
              const recipientId = swap.to_user_id ?? swap.accepted_by;
              const toName = recipientId
                ? (userNameMap[recipientId] ?? "Unknown")
                : "Public";

              return (
                <div
                  key={swap.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                    <i className="ri-swap-line text-[#F5A623]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#F0EDE8]">
                      <span className="font-medium">{fromName}</span>
                      <span className="text-[#7A94AD]"> → </span>
                      <span
                        className={`font-medium ${!recipientId ? "text-[#14B8A6]" : ""}`}
                      >
                        {toName}
                      </span>
                    </div>
                    {swap.requested_at && (
                      <div className="text-[10px] md:text-xs text-[#7A94AD] mt-0.5">
                        {fmtDate(swap.requested_at)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    Pending
                  </span>
                </div>
              );
            })}
          </div>

          {pendingSwapCount > 5 && (
            <p className="text-xs text-[#7A94AD] mt-3 pt-3 border-t border-white/[0.07]">
              +{pendingSwapCount - 5} more pending across the company
            </p>
          )}
        </div>
      )}
    </div>
  );
}
