"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { createDirectSwap, createPublicSwap } from "@/app/actions/employee";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShiftRow = {
  id: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM:SS
  endTime: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  swapId: string | null;
  swapStatus: string | null;
  swapType: "direct" | "public" | null;
};

export type ColleagueRow = {
  id: string;
  firstName: string;
  lastName: string;
  groupIds: string[]; // groups shared with me
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

// ─── Swap status badge ────────────────────────────────────────────────────────

function swapBadge(shift: ShiftRow) {
  if (!shift.swapId) return null;
  const label =
    shift.swapStatus === "pending" && shift.swapType === "direct"
      ? "Swap sent"
      : shift.swapStatus === "pending" && shift.swapType === "public"
      ? "On board"
      : shift.swapStatus === "accepted"
      ? "Mgr review"
      : null;
  if (!label) return null;
  return (
    <Badge
      variant="outline"
      className="text-[10px] py-0 px-1.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
    >
      {label}
    </Badge>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MyScheduleClient({
  weekStart,
  shifts,
  colleagues,
}: {
  weekStart: string;
  shifts: ShiftRow[];
  colleagues: ColleagueRow[];
}) {
  const [dialogShift, setDialogShift] = useState<ShiftRow | null>(null);
  const [mode, setMode] = useState<"direct" | "public">("direct");
  const [toUserId, setToUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  // Build date → shifts map
  const shiftMap = new Map<string, ShiftRow[]>();
  for (const s of shifts) {
    const list = shiftMap.get(s.date) ?? [];
    list.push(s);
    shiftMap.set(s.date, list);
  }

  // Colleagues in the same group as the active dialog shift
  const eligibleColleagues = dialogShift
    ? colleagues.filter((c) => c.groupIds.includes(dialogShift.groupId))
    : [];

  function openDialog(shift: ShiftRow) {
    setDialogShift(shift);
    setMode("direct");
    setToUserId("");
    setError(null);
  }

  function closeDialog() {
    setDialogShift(null);
    setError(null);
  }

  function handleSubmit() {
    if (!dialogShift) return;
    if (mode === "direct" && !toUserId) {
      setError("Please select a colleague");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        mode === "direct"
          ? await createDirectSwap(dialogShift.id, toUserId)
          : await createPublicSwap(dialogShift.id);
      if (result.error) {
        setError(result.error);
      } else {
        closeDialog();
        router.refresh();
      }
    });
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

      {/* Week grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px] rounded-lg border border-border overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {weekDates.map((date, i) => (
              <div
                key={date}
                className={cn(
                  "p-3 text-center",
                  i < 6 && "border-r border-border",
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

          {/* Shift cells */}
          <div className="grid grid-cols-7">
            {weekDates.map((date, i) => {
              const dayShifts = shiftMap.get(date) ?? [];
              return (
                <div
                  key={date}
                  className={cn(
                    "p-2 min-h-[110px]",
                    i < 6 && "border-r border-border",
                  )}
                >
                  {dayShifts.length === 0 ? (
                    <span className="text-xs text-muted-foreground/60 select-none">
                      Off
                    </span>
                  ) : (
                    <div className="space-y-1.5">
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="rounded-md bg-muted/60 p-2 space-y-1"
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: shift.groupColor }}
                            />
                            <span className="text-[10px] text-muted-foreground truncate">
                              {shift.groupName}
                            </span>
                          </div>
                          <div className="text-xs font-medium tabular-nums">
                            {fmtTime(shift.startTime)}–{fmtTime(shift.endTime)}
                          </div>
                          {swapBadge(shift) ?? (
                            <button
                              onClick={() => openDialog(shift)}
                              className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                              Give Away
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Give Away dialog */}
      <SimpleDialog
        open={dialogShift !== null}
        onClose={closeDialog}
        title="Give Away Shift"
      >
        {dialogShift && (
          <div className="space-y-4">
            {/* Shift summary */}
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{fmtShortDate(dialogShift.date)}</span>
              <span className="text-muted-foreground">
                {" · "}
                {fmtTime(dialogShift.startTime)}–{fmtTime(dialogShift.endTime)}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dialogShift.groupColor }}
                />
                <span className="text-xs text-muted-foreground">
                  {dialogShift.groupName}
                </span>
              </div>
            </div>

            {/* Option A — Direct */}
            <button
              onClick={() => setMode("direct")}
              className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors",
                mode === "direct"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    mode === "direct"
                      ? "border-primary"
                      : "border-muted-foreground",
                  )}
                >
                  {mode === "direct" && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="text-sm font-medium">Send to a colleague</span>
              </div>

              {mode === "direct" && (
                <div className="mt-2 ml-6">
                  {eligibleColleagues.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No colleagues in this group yet.
                    </p>
                  ) : (
                    <select
                      value={toUserId}
                      onChange={(e) => setToUserId(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select colleague…</option>
                      {eligibleColleagues.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </button>

            {/* Option B — Public */}
            <button
              onClick={() => setMode("public")}
              className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors",
                mode === "public"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    mode === "public"
                      ? "border-primary"
                      : "border-muted-foreground",
                  )}
                >
                  {mode === "public" && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="text-sm font-medium">Post to public board</span>
              </div>
              {mode === "public" && (
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Anyone in {dialogShift.groupName} can claim this shift.
                </p>
              )}
            </button>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={closeDialog}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Posting…" : "Give Away"}
              </Button>
            </div>
          </div>
        )}
      </SimpleDialog>
    </>
  );
}
