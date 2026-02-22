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

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  // Build userId+date → shifts map
  const cellMap = new Map<string, TeamShiftRow[]>();
  for (const s of shifts) {
    const key = `${s.userId}::${s.date}`;
    const list = cellMap.get(key) ?? [];
    list.push(s);
    cellMap.set(key, list);
  }

  return (
    <>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`${pathname}?week=${prevWeek}`)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium tabular-nums">
            {fmtShortDate(weekStart)} – {fmtShortDate(weekDates[6])}
          </span>
          <button
            onClick={() => router.push(`${pathname}?week=${nextWeek}`)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          This week
        </button>
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            You&apos;re not in any groups yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px] rounded-lg border border-border overflow-hidden">
            {/* Header row */}
            <div
              className="grid border-b border-border bg-muted/40"
              style={{ gridTemplateColumns: "160px repeat(7, 1fr)" }}
            >
              <div className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Employee
              </div>
              {weekDates.map((date, i) => (
                <div
                  key={date}
                  className={cn(
                    "px-2 py-3 text-center border-l border-border",
                  )}
                >
                  <div className="text-xs font-medium text-muted-foreground">
                    {DAY_NAMES[i]}
                  </div>
                  <div className="text-sm font-semibold mt-0.5">
                    {new Date(date + "T00:00:00").getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Member rows */}
            {members.map((member, mi) => (
              <div
                key={member.id}
                className={cn(
                  "grid",
                  mi !== members.length - 1 && "border-b border-border",
                )}
                style={{ gridTemplateColumns: "160px repeat(7, 1fr)" }}
              >
                {/* Name cell */}
                <div className="px-4 py-2 flex items-center border-r border-border">
                  <span className="text-sm font-medium truncate">
                    {member.firstName} {member.lastName}
                  </span>
                </div>

                {/* Day cells */}
                {weekDates.map((date, di) => {
                  const key = `${member.id}::${date}`;
                  const dayShifts = cellMap.get(key) ?? [];
                  return (
                    <div
                      key={date}
                      className={cn(
                        "px-2 py-2 min-h-[56px]",
                        di < 6 && "border-r border-border",
                      )}
                    >
                      {dayShifts.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground/50 select-none">
                          Off
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {dayShifts.map((s) => (
                            <div
                              key={s.id}
                              className="rounded border-l-4 px-1.5 py-1"
                              style={{
                                backgroundColor: `${s.templateColor}1a`,
                                borderLeftColor: s.templateColor,
                              }}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: s.groupColor }}
                                />
                                <span className="text-[9px] text-muted-foreground truncate">
                                  {s.groupName}
                                </span>
                              </div>
                              <div className="text-[10px] font-medium tabular-nums">
                                {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
