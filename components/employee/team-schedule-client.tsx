"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, X, Clock, CalendarDays } from "lucide-react";
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

function shiftDurationHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

function formatHours(h: number): string {
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ firstName, lastName, size = "md" }: {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className={cn(
      "shrink-0 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center",
      size === "sm" && "w-7 h-7 text-[10px]",
      size === "md" && "w-9 h-9 text-xs",
      size === "lg" && "w-12 h-12 text-sm",
    )}>
      {initials || "?"}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamScheduleClient({
  weekStart,
  selectedEmployeeId,
  members,
  shifts,
}: {
  weekStart: string;
  selectedEmployeeId: string;
  members: TeamMemberRow[];
  shifts: TeamShiftRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const today = todayStr();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [dropdownOpen]);

  // ── URL navigation (preserves both params) ─────────────────────────────────
  function navigate(overrides: { week?: string | null; employeeId?: string | null }) {
    const p = new URLSearchParams();
    const w = "week" in overrides ? overrides.week : weekStart;
    const e = "employeeId" in overrides ? overrides.employeeId : selectedEmployeeId;
    if (w) p.set("week", w);
    if (e) p.set("employeeId", e);
    const qs = p.toString();
    router.push(`${pathname}${qs ? "?" + qs : ""}`);
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const selectedMember = members.find((m) => m.id === selectedEmployeeId) ?? null;

  const filteredMembers = searchQuery.trim()
    ? members.filter((m) =>
        `${m.firstName} ${m.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : members;

  const memberShifts = selectedMember
    ? shifts
        .filter((s) => s.userId === selectedEmployeeId)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            a.startTime.localeCompare(b.startTime),
        )
    : [];

  const totalHours = memberShifts.reduce(
    (sum, s) => sum + shiftDurationHours(s.startTime, s.endTime),
    0,
  );
  const shiftCount = memberShifts.length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  function selectEmployee(id: string) {
    navigate({ employeeId: id });
    setDropdownOpen(false);
    setSearchQuery("");
  }

  function clearEmployee(e: React.MouseEvent) {
    e.stopPropagation();
    navigate({ employeeId: null });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 pt-1 pb-3 border-b border-border mb-4">

        {/* Employee combobox */}
        <div className="relative mb-3" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={cn(
              "w-full flex items-center gap-3 rounded-2xl border px-4 min-h-[48px] text-sm text-left transition-colors",
              dropdownOpen
                ? "border-primary ring-1 ring-primary bg-background"
                : "border-border bg-muted/40 hover:bg-muted/70",
            )}
          >
            {selectedMember ? (
              <>
                <Avatar
                  firstName={selectedMember.firstName}
                  lastName={selectedMember.lastName}
                  size="sm"
                />
                <span className="font-medium text-foreground flex-1">
                  {selectedMember.firstName} {selectedMember.lastName}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={clearEmployee}
                  onKeyDown={(e) => e.key === "Enter" && clearEmployee(e as unknown as React.MouseEvent)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Clear selection"
                >
                  <X size={14} className="text-muted-foreground" />
                </span>
              </>
            ) : (
              <>
                <Search size={16} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground flex-1">
                  Search employees…
                </span>
                <ChevronLeft
                  size={14}
                  className={cn(
                    "text-muted-foreground transition-transform",
                    dropdownOpen ? "-rotate-90" : "rotate-180",
                  )}
                />
              </>
            )}
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1.5 rounded-2xl border border-border bg-background shadow-xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                <Search size={14} className="text-muted-foreground shrink-0" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a name…"
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X size={13} className="text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Member list */}
              <div className="max-h-56 overflow-y-auto overscroll-contain">
                {filteredMembers.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground text-center">
                    No employees found.
                  </p>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => selectEmployee(m.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors min-h-[52px]",
                        m.id === selectedEmployeeId
                          ? "bg-primary/8 font-medium"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <Avatar
                        firstName={m.firstName}
                        lastName={m.lastName}
                        size="sm"
                      />
                      <span>
                        {m.firstName}{" "}
                        <span className="font-medium">{m.lastName}</span>
                      </span>
                      {m.id === selectedEmployeeId && (
                        <span className="ml-auto text-primary text-xs font-semibold">
                          Selected
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate({ week: prevWeek })}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium tabular-nums px-1">
              {fmtShortDate(weekStart)} – {fmtShortDate(weekDates[6])}
            </span>
            <button
              onClick={() => navigate({ week: nextWeek })}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
              aria-label="Next week"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => navigate({ week: null })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            This week
          </button>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            You&apos;re not in any groups yet.
          </p>
        </div>
      ) : !selectedMember ? (
        /* No employee selected */
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Search size={28} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Select a colleague above
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {members.length} employee{members.length !== 1 ? "s" : ""} in your groups
          </p>
        </div>
      ) : (
        <>
          {/* ── Summary card ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card p-4 mb-4">
            <div className="flex items-center gap-3">
              <Avatar
                firstName={selectedMember.firstName}
                lastName={selectedMember.lastName}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">
                  {selectedMember.firstName} {selectedMember.lastName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {shiftCount === 0
                    ? "No shifts this week"
                    : `${shiftCount} shift${shiftCount !== 1 ? "s" : ""} this week`}
                </p>
              </div>
              {shiftCount > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold tabular-nums leading-none">
                    {formatHours(totalHours)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    scheduled
                  </p>
                </div>
              )}
            </div>

            {/* Stats strip */}
            {shiftCount > 0 && (
              <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>{formatHours(totalHours)} total hours</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays size={12} />
                  <span>{shiftCount} shift{shiftCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>
                    ~{formatHours(totalHours / shiftCount)} avg/shift
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Shifts ────────────────────────────────────────────────────── */}
          {memberShifts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No shifts scheduled this week.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {memberShifts.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border-l-4 px-4 py-3",
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
                        <span className="ml-1.5 text-primary font-semibold">
                          Today
                        </span>
                      )}
                    </p>
                    <p className="text-base font-bold tabular-nums mt-0.5">
                      {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatHours(shiftDurationHours(s.startTime, s.endTime))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="w-2 h-2 rounded-full"
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
        </>
      )}
    </>
  );
}
