"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeftRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionSheet } from "@/components/ui/action-sheet";
import { createDirectSwap, createPublicSwap } from "@/app/actions/employee";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShiftRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  templateColor: string;
  extraHours: number | null;
  extraHoursNotes: string | null;
  swapId: string | null;
  swapStatus: string | null;
  swapType: "direct" | "public" | null;
};

export type ColleagueRow = {
  id: string;
  firstName: string;
  lastName: string;
  groupIds: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LONG  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Swap status badge ────────────────────────────────────────────────────────

function SwapStatusBadge({ status, type }: { status: string | null; type: string | null }) {
  const label =
    status === "pending_employee" && type === "direct" ? "Swap sent"  :
    status === "pending_employee" && type === "public"  ? "On board"   :
    status === "accepted_by_employee" || status === "pending_manager" ? "Mgr review" :
    null;
  if (!label) return null;
  return (
    <Badge
      variant="outline"
      className="text-xs py-1 px-2.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400 whitespace-nowrap"
    >
      {label}
    </Badge>
  );
}

// ─── Shift card ───────────────────────────────────────────────────────────────

function ShiftCard({ shift, onGiveAway }: { shift: ShiftRow; onGiveAway: () => void }) {
  return (
    <div
      className="rounded-2xl border-l-4 bg-card dark:bg-[#142236] border border-border dark:border-white/[0.07] shadow-sm overflow-hidden hover:dark:bg-[#1A2E45] transition-all duration-200"
      style={{ borderLeftColor: shift.templateColor }}
    >
      <div
        className="px-4 py-4"
        style={{ backgroundColor: `${shift.templateColor}10` }}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left — info */}
          <div className="flex-1 min-w-0">
            {/* Group */}
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: shift.groupColor }}
              />
              <span className="text-xs font-medium text-muted-foreground dark:text-[#7A94AD] truncate">
                {shift.groupName}
              </span>
            </div>

            {/* Time — large and bold */}
            <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground dark:text-[#F0EDE8] leading-none font-['JetBrains_Mono']">
              {fmtTime(shift.startTime)}
              <span className="text-muted-foreground dark:text-[#7A94AD] font-normal mx-1">–</span>
              {fmtTime(shift.endTime)}
            </p>

            {/* OT badge */}
            {shift.extraHours != null && shift.extraHours > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-sm font-semibold text-amber-600 dark:text-[#F5A623]">
                  +{shift.extraHours}h overtime
                </span>
                {shift.extraHoursNotes && (
                  <span title={shift.extraHoursNotes} className="cursor-help">
                    <Info
                      size={13}
                      className="text-amber-500 dark:text-[#F5A623] shrink-0"
                    />
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right — action */}
          <div className="shrink-0 flex items-center self-center">
            {shift.swapId ? (
              <SwapStatusBadge status={shift.swapStatus} type={shift.swapType} />
            ) : (
              <button
                onClick={onGiveAway}
                className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl border border-border dark:border-white/[0.07] bg-background dark:bg-[#0A1628] text-sm font-medium transition-all hover:bg-muted dark:hover:bg-[#1A2E45] active:scale-95 dark:text-[#F0EDE8]"
              >
                <ArrowLeftRight size={14} className="shrink-0" />
                <span>Give Away</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const [sheetShift, setSheetShift] = useState<ShiftRow | null>(null);
  const [mode, setMode] = useState<"direct" | "public">("direct");
  const [toUserId, setToUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const today = todayStr();
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const isCurrentWeek = weekDates.includes(today);

  // Build date → shifts map
  const shiftMap = new Map<string, ShiftRow[]>();
  for (const s of shifts) {
    const list = shiftMap.get(s.date) ?? [];
    list.push(s);
    shiftMap.set(s.date, list);
  }

  const eligibleColleagues = sheetShift
    ? colleagues.filter((c) => c.groupIds.includes(sheetShift.groupId))
    : [];

  // On mount / week change: scroll to today if visible
  useEffect(() => {
    if (isCurrentWeek) {
      const el = document.getElementById(`day-${today}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  function openSheet(shift: ShiftRow) {
    setSheetShift(shift);
    setMode("direct");
    setToUserId("");
    setError(null);
  }

  function closeSheet() {
    setSheetShift(null);
    setError(null);
  }

  function handleSubmit() {
    if (!sheetShift) return;
    if (mode === "direct" && !toUserId) {
      setError("Please select a colleague");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        mode === "direct"
          ? await createDirectSwap(sheetShift.id, toUserId)
          : await createPublicSwap(sheetShift.id);
      if (result.error) {
        setError(result.error);
      } else {
        closeSheet();
        router.refresh();
      }
    });
  }

  return (
    <>
      {/* ── Week navigation ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`${pathname}?week=${prevWeek}`)}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted dark:hover:bg-[#1A2E45] transition-colors dark:text-[#F0EDE8]"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold tabular-nums px-1 dark:text-[#F0EDE8] font-['JetBrains_Mono']">
            {fmtShortDate(weekStart)} – {fmtShortDate(weekDates[6])}
          </span>
          <button
            onClick={() => router.push(`${pathname}?week=${nextWeek}`)}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted dark:hover:bg-[#1A2E45] transition-colors dark:text-[#F0EDE8]"
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {!isCurrentWeek && (
          <button
            onClick={() => router.push(pathname)}
            className="h-10 px-3 rounded-xl text-xs font-semibold text-primary dark:text-[#F5A623] hover:bg-muted dark:hover:bg-[#F5A623]/10 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {/* ── Date strip ────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {weekDates.map((date, i) => {
          const hasShifts = (shiftMap.get(date) ?? []).length > 0;
          const isToday = date === today;
          return (
            <button
              key={date}
              onClick={() => {
                const el = document.getElementById(`day-${date}`);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "relative flex flex-col items-center gap-0.5 min-w-[44px] py-2.5 rounded-2xl transition-colors shrink-0",
                isToday
                  ? "bg-[#F5A623] text-[#0A1628]"
                  : "hover:bg-muted dark:hover:bg-[#1A2E45]",
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isToday ? "text-[#0A1628]/80" : "text-muted-foreground dark:text-[#7A94AD]",
                )}
              >
                {DAY_SHORT[i]}
              </span>
              <span
                className={cn(
                  "text-sm font-bold",
                  isToday ? "text-[#0A1628]" : "text-foreground dark:text-[#F0EDE8]",
                )}
              >
                {new Date(date + "T00:00:00").getDate()}
              </span>
              {/* Dot — days with shifts that aren't today */}
              {hasShifts && !isToday && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#F5A623]" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Agenda list ───────────────────────────────────────────────── */}
      <div className="space-y-6">
        {weekDates.map((date, i) => {
          const dayShifts = shiftMap.get(date) ?? [];
          const isToday = date === today;
          return (
            <div key={date} id={`day-${date}`} className="scroll-mt-4">
              {/* Day header */}
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-primary" : "text-foreground",
                  )}
                >
                  {DAY_LONG[i]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {fmtShortDate(date)}
                </span>
                {isToday && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-[#F5A623] text-[#0A1628] px-1.5 py-0.5 rounded-full leading-none">
                    Today
                  </span>
                )}
              </div>

              {/* Day content */}
              {dayShifts.length === 0 ? (
                <div className="flex items-center px-4 py-3 rounded-2xl bg-muted/40 dark:bg-[#142236] dark:border dark:border-white/[0.07]">
                  <span className="text-sm text-muted-foreground dark:text-[#7A94AD]">Day off</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dayShifts.map((shift) => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      onGiveAway={() => openSheet(shift)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Give Away action sheet ────────────────────────────────────── */}
      <ActionSheet
        open={sheetShift !== null}
        onClose={closeSheet}
        title="Give Away Shift"
      >
        {sheetShift && (
          <div className="space-y-4 pt-2">
            {/* Shift summary */}
            <div
              className="rounded-2xl border-l-4 px-4 py-3"
              style={{
                borderLeftColor: sheetShift.templateColor,
                backgroundColor: `${sheetShift.templateColor}15`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: sheetShift.groupColor }}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {sheetShift.groupName}
                </span>
              </div>
              <p className="text-base font-bold tabular-nums">
                {fmtShortDate(sheetShift.date)}
                <span className="font-normal text-muted-foreground mx-1">·</span>
                {fmtTime(sheetShift.startTime)}–{fmtTime(sheetShift.endTime)}
              </p>
              {sheetShift.extraHours != null && sheetShift.extraHours > 0 && (
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                  +{sheetShift.extraHours}h overtime
                </p>
              )}
              {sheetShift.extraHoursNotes && (
                <p className="text-xs text-muted-foreground italic mt-1 truncate">
                  &ldquo;{sheetShift.extraHoursNotes}&rdquo;
                </p>
              )}
            </div>

            {/* Option A — Direct */}
            <button
              onClick={() => setMode("direct")}
              className={cn(
                "w-full text-left rounded-2xl border p-4 transition-colors",
                mode === "direct"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    mode === "direct" ? "border-primary" : "border-muted-foreground",
                  )}
                >
                  {mode === "direct" && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </span>
                <span className="text-sm font-medium">Send to a colleague</span>
              </div>
              {mode === "direct" && (
                <div className="mt-3 ml-8">
                  {eligibleColleagues.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No colleagues in this group yet.
                    </p>
                  ) : (
                    <select
                      value={toUserId}
                      onChange={(e) => setToUserId(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                "w-full text-left rounded-2xl border p-4 transition-colors",
                mode === "public"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    mode === "public" ? "border-primary" : "border-muted-foreground",
                  )}
                >
                  {mode === "public" && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </span>
                <span className="text-sm font-medium">Post to public board</span>
              </div>
              {mode === "public" && (
                <p className="text-xs text-muted-foreground mt-2 ml-8">
                  Anyone in {sheetShift.groupName} can pick this up.
                </p>
              )}
            </button>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="w-full h-12 text-base font-semibold rounded-xl"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Posting…" : "Confirm Give Away"}
            </Button>
          </div>
        )}
      </ActionSheet>
    </>
  );
}
