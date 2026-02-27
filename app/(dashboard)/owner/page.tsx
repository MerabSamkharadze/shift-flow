import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { getOwnerDashboardData } from "@/lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Briefcase,
  LayoutGrid,
  ArrowLeftRight,
  Activity,
  UserPlus,
  ChevronRight,
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

function formatActivity(action: string, actorName: string): string {
  const label = ACTION_LABELS[action] ?? action.replace(/_/g, " ");
  return `${actorName} ${label}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={cn(
        "shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary",
        size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs",
      )}
    >
      {initials || "?"}
    </div>
  );
}

type ManagerStatus = "active" | "pending" | "inactive";

function StatusBadge({ status }: { status: ManagerStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
        status === "pending" &&
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
        status === "inactive" && "text-muted-foreground",
      )}
    >
      {status === "active" && "Active"}
      {status === "pending" && "Invite pending"}
      {status === "inactive" && "Inactive"}
    </Badge>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OwnerDashboardPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "owner") redirect(`/${profile.role}`);

  // ── Cached data fetch ───────────────────────────────────────────────────────
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

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Total Employees",
      value: employeeCount,
      icon: Users,
      href: null,
    },
    {
      label: "Active Managers",
      value: managerCount,
      icon: Briefcase,
      href: "/owner/managers",
    },
    {
      label: "Active Groups",
      value: groupCount,
      icon: LayoutGrid,
      href: null,
    },
    {
      label: "Pending Swaps",
      value: pendingSwapCount,
      icon: ArrowLeftRight,
      href: null,
    },
  ];

  // ─── Quick access links ────────────────────────────────────────────────────
  const quickLinks = [
    {
      label: "Manage Managers",
      description: "Invite, activate or deactivate managers",
      href: "/owner/managers",
      icon: Briefcase,
    },
    {
      label: "Add Manager",
      description: "Invite a new manager to the company",
      href: "/owner/managers",
      icon: UserPlus,
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back{profile.first_name ? `, ${profile.first_name}` : ""}
          </h1>
        </div>
        <MonthlyReportButton />
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
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
              <p className="text-3xl font-bold tabular-nums">{value}</p>
              {href && (
                <Link
                  href={href}
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  View all →
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Managers + Pending Swaps ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manager list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Managers
              </CardTitle>
              <Link
                href="/owner/managers"
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Manage <ChevronRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {managers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No managers yet.
              </p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left font-medium text-muted-foreground px-3 py-2 text-xs">
                        Name
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2 text-xs hidden sm:table-cell">
                        Email
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2 text-xs">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((m, i) => (
                      <tr
                        key={m.id}
                        className={cn(
                          "transition-colors hover:bg-muted/30",
                          i !== managers.length - 1 && "border-b border-border",
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={`${m.first_name} ${m.last_name}`} />
                            <span className="font-medium text-sm truncate max-w-[100px]">
                              {m.first_name} {m.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground text-xs truncate max-w-[140px] hidden sm:table-cell">
                          {m.email}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={m.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending swaps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Pending Swap Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingSwaps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No swap requests pending approval.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {pendingSwaps.map((swap) => {
                  const recipientId = swap.to_user_id ?? swap.accepted_by;
                  return (
                    <li key={swap.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm">
                          <span className="font-medium">
                            {userNameMap[swap.from_user_id] ?? "Unknown"}
                          </span>
                          <span className="text-muted-foreground"> → </span>
                          {recipientId ? (
                            <span className="font-medium">
                              {userNameMap[recipientId] ?? "Unknown"}
                            </span>
                          ) : (
                            <span className="font-medium text-violet-600 dark:text-violet-400">
                              Public
                            </span>
                          )}
                        </p>
                        {swap.requested_at && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {fmtDate(swap.requested_at)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {pendingSwapCount > 5 && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                +{pendingSwapCount - 5} more pending across the company
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Activity Feed + Quick Access ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-muted-foreground" />
              <CardTitle className="text-base font-semibold">
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No activity recorded yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {activityLogs.map((log) => {
                  const actorName = userNameMap[log.user_id] ?? "Someone";
                  return (
                    <li key={log.id} className="flex items-start gap-3">
                      <Avatar name={actorName} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">
                          {formatActivity(log.action, actorName)}
                        </p>
                        {log.entity_type && (
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {log.entity_type.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground/60 shrink-0 whitespace-nowrap">
                        {fmtRelative(log.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {quickLinks.map(({ label, description, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-4 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/50 hover:border-border/80 group"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {description}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0"
                />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
