import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOwnerDashboardData } from "@/lib/cache";
import {
  Users,
  Briefcase,
  LayoutGrid,
  ArrowLeftRight,
  Activity,
  UserPlus,
  ChevronRight,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyReportButton } from "@/components/owner/monthly-report-button";

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

const ACTION_COLORS: Record<string, string> = {
  swap_approved: "#4ECBA0",
  swap_rejected: "#E8604C",
  schedule_published: "#F5A623",
  employee_added: "#14B8A6",
  manager_invited: "#F5A623",
  group_created: "#4ECBA0",
};

function formatActivity(action: string, actorName: string): string {
  const label = ACTION_LABELS[action] ?? action.replace(/_/g, " ");
  return `${actorName} ${label}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ name, color }: { name: string; color?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const bgColor = color ?? "#7A94AD";
  return (
    <div
      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
      style={{ backgroundColor: bgColor + "20", color: bgColor }}
    >
      {initials || "?"}
    </div>
  );
}

type ManagerStatus = "active" | "pending" | "inactive";

function StatusDot({ status }: { status: ManagerStatus }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-2 h-2 rounded-full",
        status === "active" && "bg-[#4ECBA0] animate-pulse",
        status === "pending" && "bg-[#F5A623]",
        status === "inactive" && "bg-[#7A94AD]",
      )} />
      <span className={cn(
        "text-xs capitalize",
        status === "active" && "text-[#4ECBA0]",
        status === "pending" && "text-[#F5A623]",
        status === "inactive" && "text-[#7A94AD]",
      )}>
        {status === "pending" ? "Invite Pending" : status}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OwnerDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name, role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/signout");
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
      label: "Total Employees",
      value: employeeCount,
      icon: Users,
      iconBg: "bg-[#4ECBA0]/10",
      iconColor: "text-[#4ECBA0]",
      trend: null,
    },
    {
      label: "Active Managers",
      value: managerCount,
      icon: Briefcase,
      iconBg: "bg-[#F5A623]/10",
      iconColor: "text-[#F5A623]",
      trend: null,
      href: "/owner/managers",
    },
    {
      label: "Active Groups",
      value: groupCount,
      icon: LayoutGrid,
      iconBg: "bg-[#14B8A6]/10",
      iconColor: "text-[#14B8A6]",
      trend: null,
    },
    {
      label: "Pending Swaps",
      value: pendingSwapCount,
      icon: ArrowLeftRight,
      iconBg: "bg-[#F5A623]/10",
      iconColor: "text-[#F5A623]",
      badge: pendingSwapCount > 0 ? "Action needed" : null,
    },
  ];

  const quickLinks = [
    {
      label: "Manage Managers",
      description: "Invite, activate or deactivate managers",
      href: "/owner/managers",
      icon: Briefcase,
      color: "#F5A623",
    },
    {
      label: "Add Manager",
      description: "Invite a new manager to the company",
      href: "/owner/managers",
      icon: UserPlus,
      color: "#4ECBA0",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold dark:text-[#F0EDE8]">
            Welcome back{profile.first_name ? `, ${profile.first_name}` : ""}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground dark:text-[#7A94AD] mt-0.5">
            Overview of your company operations
          </p>
        </div>
        <MonthlyReportButton />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map(({ label, value, icon: Icon, iconBg, iconColor, trend, badge, href }) => (
          <div
            key={label}
            className="bg-card dark:bg-[#142236] border border-border dark:border-white/[0.07] rounded-xl p-4 md:p-5 hover:dark:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon size={20} className={iconColor} />
              </div>
              {trend && (
                <div className="flex items-center gap-1 text-[#4ECBA0] text-xs md:text-sm">
                  <ArrowUp size={14} />
                  <span>{trend}</span>
                </div>
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
            {href && (
              <Link
                href={href}
                className="text-xs text-[#F5A623] hover:text-[#E09415] mt-1 inline-block transition-colors"
              >
                View all →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Managers + Pending Swaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Manager list */}
        <div className="bg-card dark:bg-[#142236] border border-border dark:border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold dark:text-[#F0EDE8]">Managers</h2>
            <Link
              href="/owner/managers"
              className="text-xs md:text-sm text-[#F5A623] hover:text-[#E09415] transition-colors flex items-center gap-1"
            >
              Manage <ChevronRight size={14} />
            </Link>
          </div>

          {managers.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-[#7A94AD] py-8 text-center">
              No managers yet.
            </p>
          ) : (
            <div className="space-y-2">
              {managers.map((m, idx) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-all"
                  style={{ animation: `slideInRight 0.3s ease-out ${idx * 0.08}s both` }}
                >
                  <Avatar name={`${m.first_name} ${m.last_name}`} color="#4ECBA0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dark:text-[#F0EDE8] truncate">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground dark:text-[#7A94AD] truncate hidden sm:block">
                      {m.email}
                    </p>
                  </div>
                  <StatusDot status={m.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending swaps */}
        <div className="bg-card dark:bg-[#142236] border border-border dark:border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold dark:text-[#F0EDE8]">
              Pending Swap Approvals
            </h2>
            {pendingSwapCount > 0 && (
              <span className="bg-[#F5A623] text-[#0A1628] text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full">
                {pendingSwapCount}
              </span>
            )}
          </div>

          {pendingSwaps.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-[#7A94AD] py-8 text-center">
              No swap requests pending approval.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingSwaps.map((swap, idx) => {
                const recipientId = swap.to_user_id ?? swap.accepted_by;
                return (
                  <div
                    key={swap.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-all"
                    style={{ animation: `slideInRight 0.3s ease-out ${idx * 0.1}s both` }}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                      <ArrowLeftRight size={16} className="text-[#F5A623]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm dark:text-[#F0EDE8]">
                        <span className="font-medium">
                          {userNameMap[swap.from_user_id] ?? "Unknown"}
                        </span>
                        <span className="text-muted-foreground dark:text-[#7A94AD]"> → </span>
                        {recipientId ? (
                          <span className="font-medium">
                            {userNameMap[recipientId] ?? "Unknown"}
                          </span>
                        ) : (
                          <span className="font-medium text-[#F5A623]">Public</span>
                        )}
                      </p>
                      {swap.requested_at && (
                        <p className="text-[10px] md:text-xs text-muted-foreground dark:text-[#7A94AD] mt-0.5">
                          {fmtDate(swap.requested_at)}
                        </p>
                      )}
                    </div>
                    <span className="bg-[#F5A623]/20 text-[#F5A623] text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                      Pending
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {pendingSwapCount > 5 && (
            <p className="text-xs text-muted-foreground dark:text-[#7A94AD] mt-3 pt-3 border-t border-border dark:border-white/[0.07]">
              +{pendingSwapCount - 5} more pending across the company
            </p>
          )}
        </div>
      </div>

      {/* Activity Feed + Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activity */}
        <div className="bg-card dark:bg-[#142236] border border-border dark:border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <Activity size={16} className="text-[#14B8A6]" />
            </div>
            <h2 className="text-base md:text-lg font-semibold dark:text-[#F0EDE8]">
              Recent Activity
            </h2>
          </div>

          {activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-[#7A94AD] py-8 text-center">
              No activity recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {activityLogs.map((log, idx) => {
                const actorName = userNameMap[log.user_id] ?? "Someone";
                const color = ACTION_COLORS[log.action] ?? "#7A94AD";
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-all cursor-pointer"
                    style={{ animation: `slideInRight 0.3s ease-out ${idx * 0.1}s both` }}
                  >
                    <Avatar name={actorName} color={color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm dark:text-[#F0EDE8] leading-snug">
                        {formatActivity(log.action, actorName)}
                      </p>
                      {log.entity_type && (
                        <p className="text-[10px] md:text-xs text-muted-foreground dark:text-[#7A94AD] mt-0.5 capitalize">
                          {log.entity_type.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground/60 dark:text-[#7A94AD]/60 shrink-0 whitespace-nowrap">
                      {fmtRelative(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Access */}
        <div className="bg-card dark:bg-[#142236] border border-border dark:border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold dark:text-[#F0EDE8] mb-4">
            Quick Access
          </h2>
          <div className="space-y-3">
            {quickLinks.map(({ label, description, href, icon: Icon, color }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-4 rounded-xl border border-border dark:border-white/[0.07] px-4 py-4 transition-all hover:bg-muted/50 dark:hover:bg-[#1A2E45] hover:scale-[1.02] group"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: color + "15" }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-[#F0EDE8]">{label}</p>
                  <p className="text-xs text-muted-foreground dark:text-[#7A94AD] truncate">
                    {description}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground/40 group-hover:text-[#F5A623] transition-colors shrink-0"
                />
              </Link>
            ))}
          </div>
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
