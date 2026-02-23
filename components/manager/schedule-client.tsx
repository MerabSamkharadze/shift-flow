"use client";

import { useOptimistic, useTransition, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionSheet } from "@/components/ui/action-sheet";
import {
  createSchedule,
  copyFromLastWeek,
  publishSchedule,
  addShift,
  updateShift,
  removeShift,
  addShiftNote,
  saveExtraHours,
} from "@/app/actions/schedule";
import { ExportButton } from "@/components/manager/export-button";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GroupRow = { id: string; name: string; color: string };
export type MemberRow = { id: string; firstName: string; lastName: string };
export type TemplateRow = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
};
export type ShiftRow = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  templateId: string | null;
  notes: string | null;
  extraHours: number | null;
  extraHoursNotes: string | null;
};
export type ScheduleRow = {
  id: string;
  status: "draft" | "published" | "locked" | "archived";
};

// ─── Optimistic reducer ───────────────────────────────────────────────────────

type OptimisticAction =
  | { type: "add"; shift: ShiftRow }
  | {
      type: "update";
      shiftId: string;
      templateId: string;
      startTime: string;
      endTime: string;
    }
  | { type: "remove"; shiftId: string }
  | { type: "note"; shiftId: string; note: string | null }
  | {
      type: "overtime";
      shiftId: string;
      extraHours: number | null;
      extraHoursNotes: string | null;
    };

function shiftsReducer(state: ShiftRow[], action: OptimisticAction): ShiftRow[] {
  switch (action.type) {
    case "add":
      return [...state, action.shift];
    case "update":
      return state.map((s) =>
        s.id === action.shiftId
          ? {
              ...s,
              templateId: action.templateId,
              startTime: action.startTime,
              endTime: action.endTime,
            }
          : s,
      );
    case "remove":
      return state.filter((s) => s.id !== action.shiftId);
    case "note":
      return state.map((s) =>
        s.id === action.shiftId ? { ...s, notes: action.note } : s,
      );
    case "overtime":
      return state.map((s) =>
        s.id === action.shiftId
          ? { ...s, extraHours: action.extraHours, extraHoursNotes: action.extraHoursNotes }
          : s,
      );
  }
}

// ─── Dialog state ─────────────────────────────────────────────────────────────

type Dialog =
  | { type: "none" }
  | { type: "add"; userId: string; date: string; memberName: string }
  | { type: "view"; shift: ShiftRow; memberName: string }
  | { type: "change"; shift: ShiftRow; memberName: string }
  | { type: "note"; shift: ShiftRow; memberName: string }
  | { type: "overtime"; shift: ShiftRow; memberName: string };

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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ScheduleRow["status"] }) {
  const map: Record<ScheduleRow["status"], [string, string]> = {
    draft: [
      "Draft",
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
    ],
    published: [
      "Published",
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
    ],
    locked: [
      "Locked",
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
    ],
    archived: ["Archived", "border-border bg-muted text-muted-foreground"],
  };
  const [label, cls] = map[status] ?? ["Unknown", "border-border text-muted-foreground"];
  return (
    <Badge variant="outline" className={cls}>
      {label}
    </Badge>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScheduleClient({
  groups,
  selectedGroupId,
  weekStart,
  members,
  templates,
  schedule,
  shifts,
  prevScheduleExists,
}: {
  groups: GroupRow[];
  selectedGroupId: string;
  weekStart: string;
  members: MemberRow[];
  templates: TemplateRow[];
  schedule: ScheduleRow | null;
  shifts: ShiftRow[];
  prevScheduleExists: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Optimistic shifts state
  const [optimisticShifts, applyOptimistic] = useOptimistic(shifts, shiftsReducer);

  const [dialog, setDialog] = useState<Dialog>({ type: "none" });
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");
  const [overtimeNotes, setOvertimeNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)!;
  const isReadOnly =
    schedule?.status === "archived" || schedule?.status === "locked";
  const canPublish = schedule?.status === "draft";

  // Build lookup maps from optimistic state
  const shiftMap = new Map<string, ShiftRow>();
  for (const s of optimisticShifts) {
    shiftMap.set(`${s.userId}::${s.date}`, s);
  }

  const templateMap = new Map<string, TemplateRow>();
  for (const t of templates) {
    templateMap.set(t.id, t);
  }

  function navigate(params: { group?: string; week?: string }) {
    router.push(
      `${pathname}?group=${params.group ?? selectedGroupId}&week=${params.week ?? weekStart}`,
    );
  }

  function openAddDialog(userId: string, date: string, memberName: string) {
    setDialog({ type: "add", userId, date, memberName });
    setSelectedTemplateId(templates[0]?.id ?? "");
    setError(null);
  }

  function openViewDialog(shift: ShiftRow, memberName: string) {
    setDialog({ type: "view", shift, memberName });
    setError(null);
  }

  function closeDialog() {
    setDialog({ type: "none" });
    setError(null);
  }

  // ── Non-cell actions ───────────────────────────────────────────────────────

  function handleCreateSchedule() {
    startTransition(async () => {
      const result = await createSchedule(selectedGroupId, weekStart);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleCopyFromLastWeek() {
    startTransition(async () => {
      const result = await copyFromLastWeek(selectedGroupId, weekStart);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handlePublish() {
    if (!schedule) return;
    startTransition(async () => {
      const result = await publishSchedule(schedule.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  // ── Cell actions (all optimistic) ─────────────────────────────────────────

  function handleAddShift() {
    if (dialog.type !== "add" || !schedule || !selectedTemplateId) return;
    const { userId, date } = dialog;
    const template = templateMap.get(selectedTemplateId);
    if (!template) return;

    const optimisticShift: ShiftRow = {
      id: `opt-${Date.now()}`,
      userId,
      date,
      startTime: template.startTime,
      endTime: template.endTime,
      templateId: selectedTemplateId,
      notes: null,
      extraHours: null,
      extraHoursNotes: null,
    };

    closeDialog();
    startTransition(async () => {
      applyOptimistic({ type: "add", shift: optimisticShift });
      const result = await addShift(schedule.id, userId, date, selectedTemplateId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleChangeShift() {
    if (dialog.type !== "change" || !selectedTemplateId) return;
    const { shift, memberName } = dialog;
    const template = templateMap.get(selectedTemplateId);
    if (!template) return;

    closeDialog();
    startTransition(async () => {
      applyOptimistic({
        type: "update",
        shiftId: shift.id,
        templateId: selectedTemplateId,
        startTime: template.startTime,
        endTime: template.endTime,
      });
      const result = await updateShift(shift.id, selectedTemplateId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
    void memberName;
  }

  function handleRemoveShift() {
    if (dialog.type !== "view") return;
    const { shift } = dialog;

    closeDialog();
    startTransition(async () => {
      applyOptimistic({ type: "remove", shiftId: shift.id });
      const result = await removeShift(shift.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleSaveNote() {
    if (dialog.type !== "note") return;
    const { shift } = dialog;
    const note = noteText.trim() || null;

    closeDialog();
    startTransition(async () => {
      applyOptimistic({ type: "note", shiftId: shift.id, note });
      const result = await addShiftNote(shift.id, noteText);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleSaveOvertime() {
    if (dialog.type !== "overtime") return;
    const { shift } = dialog;
    const parsed = parseFloat(overtimeHours);
    const extraHours = overtimeHours.trim() === "" || isNaN(parsed) || parsed <= 0
      ? null
      : parsed;
    const extraHoursNotes = overtimeNotes.trim() || null;

    closeDialog();
    startTransition(async () => {
      applyOptimistic({ type: "overtime", shiftId: shift.id, extraHours, extraHoursNotes });
      const result = await saveExtraHours(shift.id, extraHours, extraHoursNotes);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  // ── Dialog title ──────────────────────────────────────────────────────────

  function dialogTitle() {
    if (dialog.type === "none") return "";
    const name = dialog.memberName;
    if (dialog.type === "add")
      return `Add Shift — ${name}, ${fmtShortDate(dialog.date)}`;
    if (dialog.type === "change") return `Change Shift — ${name}`;
    if (dialog.type === "note") return `Note — ${name}`;
    if (dialog.type === "overtime") return `Extra Hours — ${name}`;
    return `Shift — ${name} · ${fmtShortDate(dialog.shift.date)}`;
  }

  // ── Cell renderer ─────────────────────────────────────────────────────────

  function ShiftCell({
    userId,
    date,
    memberName,
  }: {
    userId: string;
    date: string;
    memberName: string;
  }) {
    const shift = shiftMap.get(`${userId}::${date}`);

    if (!shift) {
      if (isReadOnly || !schedule) {
        return (
          <div className="min-h-[60px] flex items-center justify-center">
            <span className="text-[11px] text-muted-foreground/40 select-none">
              —
            </span>
          </div>
        );
      }
      return (
        <button
          onClick={() => openAddDialog(userId, date, memberName)}
          className="min-h-[60px] w-full flex items-center justify-center group hover:bg-muted/40 transition-colors rounded-sm"
        >
          <Plus
            size={14}
            className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors"
          />
        </button>
      );
    }

    const template = shift.templateId ? templateMap.get(shift.templateId) : null;
    const isOptimistic = shift.id.startsWith("opt-");
    const color = template?.color ?? "#3b82f6";

    return (
      <button
        onClick={() => (isReadOnly ? undefined : openViewDialog(shift, memberName))}
        disabled={isReadOnly}
        className={cn(
          "min-h-[60px] w-full text-left rounded-md p-1 md:p-1.5 transition-all",
          isReadOnly ? "cursor-default" : "hover:ring-1 hover:ring-primary/40",
          isOptimistic && "opacity-70",
        )}
      >
        <div
          className="rounded border-l-4 px-1 md:px-1.5 py-1 h-full"
          style={{
            backgroundColor: `${color}1a`,
            borderLeftColor: color,
          }}
        >
          <div className="text-[10px] font-medium truncate text-foreground">
            {template?.name ?? "Custom"}
          </div>
          <div className="text-[10px] tabular-nums text-foreground/70 mt-0.5 whitespace-nowrap">
            {fmtTime(shift.startTime)}–{fmtTime(shift.endTime)}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {shift.notes && (
              <StickyNote
                size={9}
                className="text-muted-foreground opacity-60"
              />
            )}
            {shift.extraHours && shift.extraHours > 0 && (
              <span className="text-[9px] font-semibold leading-none text-amber-600 dark:text-amber-400">
                +{shift.extraHours}h OT
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Top controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={selectedGroupId}
          onChange={(e) => navigate({ group: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate({ week: prevWeek })}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium tabular-nums px-1">
            {fmtShortDate(weekStart)} – {fmtShortDate(weekDates[6])}
          </span>
          <button
            onClick={() => navigate({ week: nextWeek })}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {schedule && <StatusBadge status={schedule.status} />}

        <div className="flex items-start gap-2 ml-auto">
          {!schedule && prevScheduleExists && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={handleCopyFromLastWeek}
            >
              {isPending ? "Copying…" : "Copy Last Week"}
            </Button>
          )}
          {!schedule && (
            <Button size="sm" disabled={isPending} onClick={handleCreateSchedule}>
              {isPending ? "Creating…" : "Create Schedule"}
            </Button>
          )}
          {canPublish && (
            <Button size="sm" disabled={isPending} onClick={handlePublish}>
              {isPending ? "Publishing…" : "Publish"}
            </Button>
          )}
          {schedule && (
            <ExportButton weekStart={weekStart} groupId={selectedGroupId} />
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {schedule && templates.length === 0 && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
          No shift templates found.{" "}
          <a
            href="/manager/groups"
            className="font-medium underline underline-offset-2"
          >
            Add templates in group settings
          </a>{" "}
          before adding shifts.
        </div>
      )}

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No employees in this group yet.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Right-edge fade — mobile only. Signals the table scrolls right. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-30 rounded-r-lg md:hidden"
          />

          {/*
           * Scroll container rules:
           *  – overflow-x-auto + touch momentum scrolling
           *  – Thin always-visible scrollbar so users know it's scrollable
           *  – NO overflow-hidden: that breaks position:sticky on child cells
           */}
          <div
            className={cn(
              "overflow-x-auto rounded-lg border border-border",
              // Always-visible thin scrollbar (WebKit / Blink)
              "[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-1.5",
              "[&::-webkit-scrollbar-track]:bg-muted/40 [&::-webkit-scrollbar-track]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-thumb]:rounded-full",
            )}
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {/*
             * min-w-[1200px] forces horizontal scroll on any viewport narrower
             * than 1200 px. gridTemplateColumns stays 1fr so desktop columns
             * still stretch to fill whatever space is available — desktop view
             * is completely unaffected.
             */}
            {/*
             * min-w-[780px] = 80px name + 7 × 100px day columns.
             * On mobile this forces horizontal scroll; on desktop the grid
             * fills the available space (no forced scroll).
             */}
            <div className="min-w-[780px]">
              {/* ── Header row ─────────────────────────────────────────────── */}
              <div
                className="grid border-b border-border bg-muted/40"
                style={{ gridTemplateColumns: "auto repeat(7, minmax(100px, 1fr))" }}
              >
                {/* Sticky "Employee" header — width drives the auto column */}
                <div className="sticky left-0 z-20 bg-muted w-[80px] md:w-[180px] px-2 md:px-4 py-3 text-xs font-medium text-muted-foreground border-r border-border">
                  <span className="md:hidden">Name</span>
                  <span className="hidden md:inline">Employee</span>
                </div>
                {weekDates.map((date, i) => (
                  <div
                    key={date}
                    className="px-1 py-2 md:px-2 md:py-3 text-center border-l border-border"
                  >
                    <div className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      {DAY_NAMES[i]}
                    </div>
                    <div className="text-xs md:text-sm font-semibold mt-0.5 tabular-nums">
                      {new Date(date + "T00:00:00").getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Data rows ──────────────────────────────────────────────── */}
              {members.map((member, mi) => (
                <div
                  key={member.id}
                  className={cn(
                    "grid",
                    mi !== members.length - 1 && "border-b border-border",
                  )}
                  style={{ gridTemplateColumns: "auto repeat(7, minmax(100px, 1fr))" }}
                >
                  {/*
                   * Sticky name cell — width matches the header cell.
                   * Mobile:  80px, stacked first/last name at text-[11px].
                   * Desktop: 180px, full name on one line at text-sm.
                   */}
                  <div className="sticky left-0 z-10 bg-background flex items-center min-h-[68px] w-[80px] md:w-[180px] px-2 md:px-4 py-2 border-r border-border shadow-[2px_0_4px_-1px_hsl(var(--border))]">
                    {/* Desktop: single line */}
                    <span className="hidden md:block text-sm font-medium truncate whitespace-nowrap">
                      {member.firstName} {member.lastName}
                    </span>
                    {/* Mobile: stacked */}
                    <div className="md:hidden w-full">
                      <div className="text-[11px] font-semibold leading-tight truncate">
                        {member.firstName}
                      </div>
                      <div className="text-[11px] font-medium leading-tight truncate text-muted-foreground">
                        {member.lastName}
                      </div>
                    </div>
                  </div>

                  {weekDates.map((date, di) => (
                    <div
                      key={date}
                      className={cn(
                        "p-1 min-h-[68px]",
                        di < 6 && "border-r border-border",
                      )}
                    >
                      <ShiftCell
                        userId={member.id}
                        date={date}
                        memberName={`${member.firstName} ${member.lastName}`}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Swipe hint — mobile only, disappears on md+ */}
          <p className="mt-2 text-center text-[11px] text-muted-foreground/50 select-none md:hidden">
            Swipe right to view full schedule →
          </p>
        </div>
      )}

      {/* ── Action sheet (Drawer on mobile, Dialog on desktop) ────────────── */}
      <ActionSheet
        open={dialog.type !== "none"}
        onClose={closeDialog}
        title={dialogTitle()}
      >
        {/* Add shift */}
        {dialog.type === "add" && (
          <div className="space-y-4 pt-2">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No shift templates yet. Add them in group settings.
              </p>
            ) : (
              <div className="space-y-1.5">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-all text-left",
                      selectedTemplateId === t.id
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-auto tabular-nums text-muted-foreground">
                      {fmtTime(t.startTime)}–{fmtTime(t.endTime)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={closeDialog}>
                Cancel
              </Button>
              {templates.length > 0 && (
                <Button size="sm" onClick={handleAddShift}>
                  Add Shift
                </Button>
              )}
            </div>
          </div>
        )}

        {/* View shift */}
        {dialog.type === "view" && (
          <div className="space-y-4 pt-2">
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-sm font-medium">
                {fmtShortDate(dialog.shift.date)}
              </p>
              <p className="text-sm text-muted-foreground">
                {fmtTime(dialog.shift.startTime)}–{fmtTime(dialog.shift.endTime)}
              </p>
              {dialog.shift.templateId && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {templateMap.get(dialog.shift.templateId)?.name}
                </p>
              )}
              {dialog.shift.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  &ldquo;{dialog.shift.notes}&rdquo;
                </p>
              )}
              {dialog.shift.extraHours && dialog.shift.extraHours > 0 && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1">
                  +{dialog.shift.extraHours}h overtime
                  {dialog.shift.extraHoursNotes && (
                    <span className="font-normal text-muted-foreground">
                      {" "}· {dialog.shift.extraHoursNotes}
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedTemplateId(
                    dialog.shift.templateId ?? templates[0]?.id ?? "",
                  );
                  setDialog({
                    type: "change",
                    shift: dialog.shift,
                    memberName: dialog.memberName,
                  });
                }}
              >
                Change
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNoteText(dialog.shift.notes ?? "");
                  setDialog({
                    type: "note",
                    shift: dialog.shift,
                    memberName: dialog.memberName,
                  });
                }}
              >
                {dialog.shift.notes ? "Edit Note" : "Add Note"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setOvertimeHours(
                    dialog.shift.extraHours ? String(dialog.shift.extraHours) : "",
                  );
                  setOvertimeNotes(dialog.shift.extraHoursNotes ?? "");
                  setDialog({
                    type: "overtime",
                    shift: dialog.shift,
                    memberName: dialog.memberName,
                  });
                }}
              >
                {dialog.shift.extraHours ? "Edit OT" : "Extra Hours"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 ml-auto"
                onClick={handleRemoveShift}
              >
                Remove
              </Button>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={closeDialog}>
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Change template */}
        {dialog.type === "change" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {fmtShortDate(dialog.shift.date)} ·{" "}
              {fmtTime(dialog.shift.startTime)}–{fmtTime(dialog.shift.endTime)}
            </p>
            <div className="space-y-1.5">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-all text-left",
                    selectedTemplateId === t.id
                      ? "border-primary ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/40",
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="font-medium">{t.name}</span>
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {fmtTime(t.startTime)}–{fmtTime(t.endTime)}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDialog({
                    type: "view",
                    shift: dialog.shift,
                    memberName: dialog.memberName,
                  })
                }
              >
                Back
              </Button>
              <Button size="sm" onClick={handleChangeShift}>
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Note */}
        {dialog.type === "note" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {fmtShortDate(dialog.shift.date)} ·{" "}
              {fmtTime(dialog.shift.startTime)}–{fmtTime(dialog.shift.endTime)}
            </p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note for this shift…"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDialog({
                    type: "view",
                    shift: dialog.shift,
                    memberName: dialog.memberName,
                  })
                }
              >
                Back
              </Button>
              <Button size="sm" onClick={handleSaveNote}>
                Save Note
              </Button>
            </div>
          </div>
        )}

        {/* Extra Hours / Overtime */}
        {dialog.type === "overtime" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {fmtShortDate(dialog.shift.date)} ·{" "}
              {fmtTime(dialog.shift.startTime)}–{fmtTime(dialog.shift.endTime)}
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Extra Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(e.target.value)}
                placeholder="e.g. 1.5"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Manager Notes</label>
              <textarea
                value={overtimeNotes}
                onChange={(e) => setOvertimeNotes(e.target.value)}
                placeholder="e.g. Stayed late to finish inventory"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDialog({
                    type: "view",
                    shift: dialog.shift,
                    memberName: dialog.memberName,
                  })
                }
              >
                Back
              </Button>
              <Button size="sm" onClick={handleSaveOvertime}>
                Save
              </Button>
            </div>
          </div>
        )}
      </ActionSheet>
    </>
  );
}
