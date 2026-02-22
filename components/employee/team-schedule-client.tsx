"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TeamMemberRow = {
  id: string;
  firstName: string;
  lastName: string;
};

export type TeamShiftRow = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  groupColor: string;
  templateColor: string;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function fmtShortDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtDayDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamScheduleClient({
  weekStart,
  members,
  shifts,
}: {
  weekStart: string;
  members: TeamMemberRow[];
  shifts: TeamShiftRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const today = todayStr();

  // Build userId → shifts[] map
  const memberShiftsMap = new Map<string, TeamShiftRow[]>();
  for (const s of shifts) {
    const list = memberShiftsMap.get(s.userId) ?? [];
    list.push(s);
    memberShiftsMap.set(s.userId, list);
  }

  return (
    <>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`${pathname}?week=${prevWeek}`)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium tabular-nums">
            {fmtShortDate(weekStart)} – {fmtShortDate(weekDates[6])}
          </span>
          <button
            onClick={() => router.push(`${pathname}?week=${nextWeek}`)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
        >
          This week
        </button>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            You&apos;re not in any groups yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const memberShifts = (memberShiftsMap.get(member.id) ?? []).sort(
              (a, b) =>
                a.date.localeCompare(b.date) ||
                a.startTime.localeCompare(b.startTime),
            );
            return (
              <div
                key={member.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <p className="font-semibold text-sm mb-3">
                  {member.firstName} {member.lastName}
                </p>
                {memberShifts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Off this week</p>
                ) : (
                  <div className="space-y-2">
                    {memberShifts.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-center justify-between rounded-xl border-l-4 px-3 py-2.5",
                          s.date === today && "ring-1 ring-primary/30",
                        )}
                        style={{
                          backgroundColor: `${s.templateColor}15`,
                          borderLeftColor: s.templateColor,
                        }}
                      >
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {fmtDayDate(s.date)}
                            {s.date === today && (
                              <span className="ml-1.5 text-primary font-medium">
                                Today
                              </span>
                            )}
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.groupColor }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {s.groupName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
