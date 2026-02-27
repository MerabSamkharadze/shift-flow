import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getManagerDashboardData,
  getManagerEmployeesData,
  getScheduleData,
  getManagerGroupsData,
  getGroupDetailData,
  getManagerSwapsData,
  getMonthlyReportData,
  getHoursSummaryData,
  getOwnerManagersData,
} from "@/lib/cache";
import DashboardClient from "@/components/dashboard/DashboardClient";
import type { DashboardUser, ViewName } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return localDateStr(monday);
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchViewData(
  view: ViewName,
  profile: { id: string; role: string; company_id: string },
  searchParams: { group?: string; week?: string; month?: string },
): Promise<unknown> {
  switch (view) {
    case "dashboard":
      return getManagerDashboardData(profile.id);
    case "employees":
      return getManagerEmployeesData(profile.id);
    case "schedule-builder": {
      const groupsData = await getManagerGroupsData(profile.id);
      const groups = groupsData.groups;
      const selectedGroupId = searchParams.group ?? groups[0]?.id ?? "";
      const weekStart = searchParams.week ?? getCurrentWeekStart();
      if (selectedGroupId) {
        return getScheduleData(profile.id, selectedGroupId, weekStart);
      }
      return { groups: [], members: [], templates: [], schedule: null, shifts: [], prevScheduleExists: false };
    }
    case "shift-templates": {
      const groupsData = await getManagerGroupsData(profile.id);
      const selectedGroupId = searchParams.group ?? groupsData.groups[0]?.id ?? null;
      let templates: { id: string; name: string; start_time: string; end_time: string; color: string | null }[] = [];
      if (selectedGroupId) {
        const detail = await getGroupDetailData(selectedGroupId, profile.company_id, profile.id);
        templates = detail?.templates ?? [];
      }
      return { groups: groupsData.groups, templates, selectedGroupId };
    }
    case "marketplace":
      return getManagerSwapsData(profile.id);
    case "monthly-report": {
      const month = searchParams.month ?? getCurrentMonth();
      return getMonthlyReportData(profile.company_id, month);
    }
    case "hours-summary": {
      const month = searchParams.month ?? getCurrentMonth();
      return getHoursSummaryData(profile.id, month);
    }
    case "managers":
      if (profile.role === "owner") {
        return getOwnerManagersData(profile.company_id);
      }
      return { managers: [] };
    default:
      return null;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { view?: string; group?: string; week?: string; month?: string };
}) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = createClient();

  // getUser() validates the JWT — middleware already refreshed the session,
  // but we still need the user id. Supabase SSR deduplicates the actual
  // network call within the same request when cookies haven't changed.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/signout");

  if (profile.role === "employee") redirect("/employee");

  const dashboardUser: DashboardUser = {
    id: profile.id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    role: profile.role,
    company_id: profile.company_id,
  };

  // ── View + Data Fetching ──────────────────────────────────────────────────
  const view = (searchParams.view ?? "dashboard") as ViewName;
  const viewData = await fetchViewData(view, profile, searchParams);

  return (
    <Suspense fallback={null}>
      <DashboardClient
        user={dashboardUser}
        initialView={view}
        viewData={viewData}
      />
    </Suspense>
  );
}
