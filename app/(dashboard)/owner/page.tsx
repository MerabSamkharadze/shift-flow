import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Briefcase, LayoutGrid, ArrowLeftRight } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function OwnerDashboardPage() {
  const supabase = createClient();
  const service = createServiceClient();

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

  // ── 1. Counts ─────────────────────────────────────────────────────────────
  const [
    { count: managerCount },
    { count: employeeCount },
    { count: groupCount },
  ] = await Promise.all([
    service
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("role", "manager")
      .eq("is_active", true),
    service
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("role", "employee")
      .eq("is_active", true),
    service
      .from("groups")
      .select("id", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("is_active", true),
  ]);

  // ── 2. Pending swaps (company-wide) ───────────────────────────────────────
  // Get all shift IDs in this company via schedules → groups → company
  const { data: companyGroups } = await service
    .from("groups")
    .select("id")
    .eq("company_id", profile.company_id);

  const companyGroupIds = (companyGroups ?? []).map((g) => g.id);

  const { data: companySchedules } = companyGroupIds.length
    ? await service
        .from("schedules")
        .select("id")
        .in("group_id", companyGroupIds)
    : { data: [] as { id: string }[] };

  const companyScheduleIds = (companySchedules ?? []).map((s) => s.id);

  const { data: companyShifts } = companyScheduleIds.length
    ? await service
        .from("shifts")
        .select("id")
        .in("schedule_id", companyScheduleIds)
    : { data: [] as { id: string }[] };

  const companyShiftIds = (companyShifts ?? []).map((s) => s.id);

  const { data: pendingSwaps, count: pendingSwapCount } = companyShiftIds.length
    ? await service
        .from("shift_swaps")
        .select("id, shift_id, from_user_id, to_user_id, accepted_by, requested_at", {
          count: "exact",
        })
        .in("shift_id", companyShiftIds)
        .in("status", ["accepted_by_employee", "pending_manager"])
        .order("requested_at", { ascending: false })
        .limit(5)
    : { data: [] as { id: string; shift_id: string; from_user_id: string; to_user_id: string | null; accepted_by: string | null; requested_at: string | null }[], count: 0 };

  // ── 3. Recent managers ────────────────────────────────────────────────────
  const { data: recentManagers } = await service
    .from("users")
    .select("id, first_name, last_name, email, created_at")
    .eq("company_id", profile.company_id)
    .eq("role", "manager")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  // ── 4. User names for pending swaps ───────────────────────────────────────
  const swapUserIds = [
    ...new Set([
      ...(pendingSwaps ?? []).map((s) => s.from_user_id),
      ...(pendingSwaps ?? []).map((s) => s.to_user_id).filter((id): id is string => id !== null),
      ...(pendingSwaps ?? []).map((s) => s.accepted_by).filter((id): id is string => id !== null),
    ]),
  ];

  const { data: swapUsers } = swapUserIds.length
    ? await service
        .from("users")
        .select("id, first_name, last_name")
        .in("id", swapUserIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] };

  const swapUserMap = new Map(
    (swapUsers ?? []).map((u) => [u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()]),
  );

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: "Managers", value: managerCount ?? 0, icon: Briefcase, href: "/owner/managers" },
    { label: "Employees", value: employeeCount ?? 0, icon: Users, href: null },
    { label: "Active Groups", value: groupCount ?? 0, icon: LayoutGrid, href: null },
    { label: "Pending Swaps", value: pendingSwapCount ?? 0, icon: ArrowLeftRight, href: null },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{profile.first_name ? `, ${profile.first_name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Company-wide overview across all managers and groups.
        </p>
      </div>

      {/* Stats row */}
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
              <p className="text-3xl font-bold">{value}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Managers */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Managers</CardTitle>
              <Link
                href="/owner/managers"
                className="text-xs text-primary hover:underline"
              >
                Manage
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {(recentManagers ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No managers yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {(recentManagers ?? []).map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {(m.first_name?.[0] ?? m.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.first_name && m.last_name
                          ? `${m.first_name} ${m.last_name}`
                          : m.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {fmtDate(m.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Company-wide Pending Swaps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Pending Swap Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {(pendingSwaps ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No swap requests pending approval.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {(pendingSwaps ?? []).map((swap) => {
                  const recipientId = swap.to_user_id ?? swap.accepted_by;
                  return (
                    <li key={swap.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm">
                          <span className="font-medium">
                            {swapUserMap.get(swap.from_user_id) ?? "Unknown"}
                          </span>
                          <span className="text-muted-foreground"> → </span>
                          {recipientId ? (
                            <span className="font-medium">
                              {swapUserMap.get(recipientId) ?? "Unknown"}
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
            {(pendingSwapCount ?? 0) > 5 && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                +{(pendingSwapCount ?? 0) - 5} more pending across the company
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
