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
} from "@/app/actions/schedule";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GroupRow = { id: string; name: string; color: string };
export type MemberRow = { id: string; firstName: string; lastName: string };
export type TemplateRow = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
};
export type ShiftRow = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  templateId: string | null;
  notes: string | null;
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
  | { type: "note"; shiftId: string; note: string | null };

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
  }
}

// ─── Dialog state ─────────────────────────────────────────────────────────────

type Dialog =
  | { type: "none" }
  | { type: "add"; userId: string; date: string; memberName: string }
  | { type: "view"; shift: ShiftRow; memberName: string }
  | { type: "change"; shift: ShiftRow; memberName: string }
  | { type: "note"; shift: ShiftRow; memberName: string };

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

  // ── Dialog title ──────────────────────────────────────────────────────────

  function dialogTitle() {
    if (dialog.type === "none") return "";
    const name = dialog.memberName;
    if (dialog.type === "add")
      return `Add Shift — ${name}, ${fmtShortDate(dialog.date)}`;
    if (dialog.type === "change") return `Change Shift — ${name}`;
    if (dialog.type === "note") return `Note — ${name}`;
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

    return (
      <button
        onClick={() => (isReadOnly ? undefined : openViewDialog(shift, memberName))}
        disabled={isReadOnly}
        className={cn(
          "min-h-[60px] w-full text-left rounded-md p-1.5 transition-all",
          isReadOnly ? "cursor-default" : "hover:ring-1 hover:ring-primary/40",
          isOptimistic && "opacity-70",
        )}
      >
        <div
          className="rounded px-1.5 py-1 h-full"
          style={{ backgroundColor: selectedGroup.color + "20" }}
        >
          <div
            className="text-[10px] font-medium truncate"
            style={{ color: selectedGroup.color }}
          >
            {template?.name ?? "Custom"}
          </div>
          <div className="text-[10px] tabular-nums text-foreground/80 mt-0.5">
            {fmtTime(shift.startTime)}–{fmtTime(shift.endTime)}
          </div>
          {shift.notes && (
            <StickyNote
              size={9}
              className="mt-0.5 text-muted-foreground opacity-60"
            />
          )}
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

        <div className="flex items-center gap-2 ml-auto">
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
        <div className="overflow-x-auto">
          <div className="min-w-[700px] rounded-lg border border-border overflow-hidden">
            {/* Header */}
            <div
              className="grid border-b border-border bg-muted/40"
              style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}
            >
              <div className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Employee
              </div>
              {weekDates.map((date, i) => (
                <div
                  key={date}
                  className="px-2 py-3 text-center border-l border-border"
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

            {/* Rows */}
            {members.map((member, mi) => (
              <div
                key={member.id}
                className={cn(
                  "grid",
                  mi !== members.length - 1 && "border-b border-border",
                )}
                style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}
              >
                <div className="px-4 py-2 flex items-center border-r border-border">
                  <span className="text-sm font-medium truncate">
                    {member.firstName} {member.lastName}
                  </span>
                </div>
                {weekDates.map((date, di) => (
                  <div
                    key={date}
                    className={cn("p-1", di < 6 && "border-r border-border")}
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
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({fmtTime(t.startTime)}–{fmtTime(t.endTime)})
                  </option>
                ))}
              </select>
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
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({fmtTime(t.startTime)}–{fmtTime(t.endTime)})
                </option>
              ))}
            </select>
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
      </ActionSheet>
    </>
  );
}
