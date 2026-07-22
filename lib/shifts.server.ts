import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { shiftsOverlap } from "@/lib/shifts";

/** Add days to a "YYYY-MM-DD" date, anchored in UTC (stable day arithmetic). */
function addDaysUTC(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type OverlappingShift = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
};

/**
 * LOGIC-002: find an existing (non-cancelled) shift that overlaps
 * [date, start, end] for `userId`, or null if none.
 *
 * Uses the service client so overlaps in OTHER groups — including groups the
 * calling manager does not manage — are still detected: double-booking
 * prevention is company-wide, not per-group. Scans the day before and after so
 * overnight shifts on adjacent dates are caught.
 */
export async function findOverlappingShift(
  userId: string,
  date: string,
  start: string,
  end: string,
  excludeShiftId?: string,
): Promise<OverlappingShift | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("shifts")
    .select("id, date, start_time, end_time, status")
    .eq("assigned_to", userId)
    .gte("date", addDaysUTC(date, -1))
    .lte("date", addDaysUTC(date, 1));

  for (const s of data ?? []) {
    if (excludeShiftId && s.id === excludeShiftId) continue;
    if (s.status === "cancelled") continue;
    if (shiftsOverlap(date, start, end, s.date, s.start_time, s.end_time)) {
      return {
        id: s.id,
        date: s.date,
        start_time: s.start_time,
        end_time: s.end_time,
      };
    }
  }
  return null;
}
