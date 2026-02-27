import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getEmployeeScheduleData } from "@/lib/cache";
import {
  MyScheduleClient,
  type ShiftRow,
  type ColleagueRow,
} from "@/components/employee/my-schedule-client";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localDateStr(d);
}

export default async function EmployeePage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "employee") redirect("/auth/login");

  const weekStart = getMonday(searchParams.week);

  const { shifts, colleagues } = await getEmployeeScheduleData(profile.id, weekStart);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">My Schedule</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Tap a shift to give it away.
        </p>
      </div>

      <MyScheduleClient
        weekStart={weekStart}
        shifts={shifts as ShiftRow[]}
        colleagues={colleagues as ColleagueRow[]}
      />
    </div>
  );
}
