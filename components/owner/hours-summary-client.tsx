"use client";

import { useState, useMemo } from "react";

type Period = "weekly" | "monthly";

type WeekData = { scheduled: number; actual: number; overtime: number };

type Employee = {
  name: string;
  branch: string;
  weekly: Record<string, WeekData>;
  monthly: { scheduled: number; actual: number; overtime: number; daysWorked: number };
};

type WeekInfo = { key: string; label: string; dates: string };

type Props = {
  employees: Employee[];
  weeks: WeekInfo[];
  branches: string[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = ["#14B8A6", "#F5A623", "#E8604C", "#4ECBA0", "#8B5CF6", "#EC4899"];

function getColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function getUtilization(scheduled: number, actual: number) {
  if (scheduled === 0) return actual > 0 ? 100 : 0;
  return Math.round((actual / scheduled) * 100);
}

function getUtilColor(pct: number) {
  if (pct > 110) return "#E8604C";
  if (pct >= 95) return "#4ECBA0";
  if (pct >= 80) return "#F5A623";
  return "#7A94AD";
}

export function HoursSummaryClient({ employees, weeks, branches }: Props) {
  const [period, setPeriod] = useState<Period>("weekly");
  const [selectedWeek, setSelectedWeek] = useState(weeks[weeks.length - 1]?.key ?? "week1");
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "actual" | "overtime">("actual");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...employees];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (branchFilter !== "all") {
      list = list.filter((e) => e.branch.includes(branchFilter));
    }
    list.sort((a, b) => {
      if (sortBy === "name") {
        return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const aVal =
        period === "weekly"
          ? sortBy === "overtime"
            ? (a.weekly[selectedWeek]?.overtime ?? 0)
            : (a.weekly[selectedWeek]?.actual ?? 0)
          : sortBy === "overtime"
            ? a.monthly.overtime
            : a.monthly.actual;
      const bVal =
        period === "weekly"
          ? sortBy === "overtime"
            ? (b.weekly[selectedWeek]?.overtime ?? 0)
            : (b.weekly[selectedWeek]?.actual ?? 0)
          : sortBy === "overtime"
            ? b.monthly.overtime
            : b.monthly.actual;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [searchQuery, branchFilter, sortBy, sortDir, period, selectedWeek, employees]);

  const totals = useMemo(() => {
    if (period === "weekly") {
      return filtered.reduce(
        (acc, e) => {
          const w = e.weekly[selectedWeek] ?? { scheduled: 0, actual: 0, overtime: 0 };
          return {
            scheduled: acc.scheduled + w.scheduled,
            actual: acc.actual + w.actual,
            overtime: acc.overtime + w.overtime,
          };
        },
        { scheduled: 0, actual: 0, overtime: 0 },
      );
    }
    return filtered.reduce(
      (acc, e) => ({
        scheduled: acc.scheduled + e.monthly.scheduled,
        actual: acc.actual + e.monthly.actual,
        overtime: acc.overtime + e.monthly.overtime,
      }),
      { scheduled: 0, actual: 0, overtime: 0 },
    );
  }, [filtered, period, selectedWeek]);

  const avgHours = filtered.length > 0 ? Math.round(totals.actual / filtered.length) : 0;

  const handleSort = (col: "name" | "actual" | "overtime") => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir(col === "name" ? "asc" : "desc");
    }
  };

  const sortIcon = (col: string) => {
    if (sortBy !== col) return "ri-arrow-up-down-line text-[#7A94AD]/40";
    return sortDir === "asc" ? "ri-arrow-up-s-line text-[#F5A623]" : "ri-arrow-down-s-line text-[#F5A623]";
  };

  const maxActual = useMemo(() => {
    return Math.max(
      ...filtered.map((e) =>
        period === "weekly" ? (e.weekly[selectedWeek]?.actual ?? 0) : e.monthly.actual,
      ),
      1,
    );
  }, [filtered, period, selectedWeek]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Period Toggle + Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex bg-[#142236] border border-white/[0.07] rounded-lg p-1">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              period === "weekly"
                ? "bg-[#F5A623] text-[#0A1628]"
                : "text-[#7A94AD] hover:text-[#F0EDE8]"
            }`}
          >
            <i className="ri-calendar-line mr-1.5" />
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              period === "monthly"
                ? "bg-[#F5A623] text-[#0A1628]"
                : "text-[#7A94AD] hover:text-[#F0EDE8]"
            }`}
          >
            <i className="ri-calendar-2-line mr-1.5" />
            Monthly
          </button>
        </div>
      </div>

      {/* Week Selector */}
      {period === "weekly" && weeks.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {weeks.map((w) => (
            <button
              key={w.key}
              onClick={() => setSelectedWeek(w.key)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedWeek === w.key
                  ? "bg-[#F5A623]/10 border-[#F5A623]/40 text-[#F0EDE8]"
                  : "bg-[#142236] border-white/[0.07] text-[#7A94AD] hover:bg-[#1A2E45] hover:text-[#F0EDE8]"
              }`}
            >
              <div className="text-sm font-semibold">{w.label}</div>
              <div className="text-xs mt-0.5 opacity-70">{w.dates}</div>
            </button>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <i className="ri-time-line text-xl text-[#14B8A6]" />
            </div>
            <span className="text-xs text-[#7A94AD]">
              {period === "weekly" ? "This Week" : "This Month"}
            </span>
          </div>
          <div
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {Math.round(totals.actual)}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Total Actual Hours</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-calendar-check-line text-xl text-[#F5A623]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Scheduled</span>
          </div>
          <div
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {Math.round(totals.scheduled)}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Total Scheduled Hours</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#E8604C]/10 flex items-center justify-center">
              <i className="ri-alarm-warning-line text-xl text-[#E8604C]" />
            </div>
            {totals.overtime > 0 && (
              <span className="bg-[#E8604C]/15 text-[#E8604C] text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                Attention
              </span>
            )}
          </div>
          <div
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {Math.round(totals.overtime)}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Total Overtime</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#4ECBA0]/10 flex items-center justify-center">
              <i className="ri-user-line text-xl text-[#4ECBA0]" />
            </div>
            <div className="flex items-center gap-1 text-[#4ECBA0] text-xs">
              <i className="ri-arrow-up-line" />
              <span>{getUtilization(totals.scheduled, totals.actual)}%</span>
            </div>
          </div>
          <div
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {avgHours}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Avg Hours / Employee</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD] text-lg" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 md:py-3 bg-[#142236] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", ...branches].map((b) => (
            <button
              key={b}
              onClick={() => setBranchFilter(b)}
              className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                branchFilter === b
                  ? "bg-[#F5A623] text-[#0A1628]"
                  : "bg-[#142236] text-[#7A94AD] hover:text-[#F0EDE8] border border-white/[0.07]"
              }`}
            >
              {b === "all" ? "All Branches" : b}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Table */}
      {filtered.length > 0 ? (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left px-4 md:px-6 py-3 md:py-4">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Employee <i className={`${sortIcon("name")} text-xs`} />
                    </button>
                  </th>
                  <th className="text-center px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-[#7A94AD]">
                    Branch
                  </th>
                  <th className="text-center px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-[#7A94AD]">
                    Scheduled
                  </th>
                  <th className="text-center px-4 md:px-6 py-3 md:py-4">
                    <button
                      onClick={() => handleSort("actual")}
                      className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer whitespace-nowrap mx-auto"
                    >
                      Actual <i className={`${sortIcon("actual")} text-xs`} />
                    </button>
                  </th>
                  <th className="text-center px-4 md:px-6 py-3 md:py-4">
                    <button
                      onClick={() => handleSort("overtime")}
                      className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer whitespace-nowrap mx-auto"
                    >
                      Overtime <i className={`${sortIcon("overtime")} text-xs`} />
                    </button>
                  </th>
                  <th className="text-center px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-[#7A94AD]">
                    Utilization
                  </th>
                  <th className="text-center px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-[#7A94AD]">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => {
                  const data =
                    period === "weekly"
                      ? (emp.weekly[selectedWeek] ?? { scheduled: 0, actual: 0, overtime: 0 })
                      : emp.monthly;
                  const util = getUtilization(data.scheduled, data.actual);
                  const utilColor = getUtilColor(util);
                  const isExpanded = expandedRow === emp.name;
                  const color = getColor(idx);

                  return (
                    <tr
                      key={emp.name}
                      onClick={() => setExpandedRow(isExpanded ? null : emp.name)}
                      className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        idx % 2 === 0 ? "bg-white/[0.01]" : ""
                      } ${isExpanded ? "bg-[#F5A623]/[0.03]" : ""}`}
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{ backgroundColor: color + "20", color }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <span className="text-xs md:text-sm font-medium text-[#F0EDE8] truncate">
                            {emp.name}
                          </span>
                          <i
                            className={`ri-arrow-${isExpanded ? "up" : "down"}-s-line text-[#7A94AD] text-sm ml-auto flex-shrink-0`}
                          />
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span className="px-2 py-0.5 bg-[#F5A623]/10 text-[#F5A623] text-[10px] md:text-xs rounded-full whitespace-nowrap">
                          {emp.branch || "—"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span
                          className="text-xs md:text-sm text-[#7A94AD]"
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {Math.round(data.scheduled)}h
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span
                          className="text-xs md:text-sm font-semibold text-[#F0EDE8]"
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {Math.round(data.actual)}h
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        {data.overtime > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#E8604C]/10 text-[#E8604C] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                            <i className="ri-alarm-warning-line text-xs" />
                            {Math.round(data.overtime)}h
                          </span>
                        ) : (
                          <span className="text-xs md:text-sm text-[#7A94AD]">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span
                          className="text-xs md:text-sm font-semibold"
                          style={{ color: utilColor, fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {util}%
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex justify-center">
                          <div className="w-20 h-6 flex items-end gap-[3px]">
                            {weeks.map((w, i) => {
                              const wd = emp.weekly[w.key] ?? { actual: 0, overtime: 0 };
                              const maxBar = 50;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 rounded-sm transition-all duration-300"
                                  style={{
                                    height: `${Math.min((wd.actual / maxBar) * 100, 100)}%`,
                                    minHeight: wd.actual > 0 ? "3px" : "0",
                                    backgroundColor: wd.overtime > 0 ? "#E8604C" : "#4ECBA0",
                                    opacity:
                                      period === "weekly" && w.key === selectedWeek ? 1 : 0.4,
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-4">
            <i className="ri-search-line text-2xl text-[#F5A623]" />
          </div>
          <p className="text-sm text-[#7A94AD]">
            {employees.length === 0 ? "No shift data for this month" : "No employees match your search"}
          </p>
        </div>
      )}

      {/* Hours Distribution */}
      {filtered.length > 0 && (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">
              {period === "weekly" ? "Weekly" : "Monthly"} Hours Distribution
            </h2>
            <span className="text-xs text-[#7A94AD]">{filtered.length} employees</span>
          </div>
          <div className="space-y-3">
            {filtered.map((emp, idx) => {
              const data =
                period === "weekly"
                  ? (emp.weekly[selectedWeek] ?? { scheduled: 0, actual: 0, overtime: 0 })
                  : emp.monthly;
              const pct = maxActual > 0 ? (data.actual / maxActual) * 100 : 0;
              const overtimePct =
                data.scheduled > 0
                  ? Math.max(0, ((data.actual - data.scheduled) / maxActual) * 100)
                  : 0;
              const basePct = Math.min(pct, (data.scheduled / maxActual) * 100);
              const color = getColor(idx);

              return (
                <div key={emp.name} className="group">
                  <div className="flex items-center justify-between text-xs md:text-sm gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                        style={{ backgroundColor: color + "20", color }}
                      >
                        {getInitials(emp.name)}
                      </div>
                      <span className="text-[#F0EDE8] font-medium truncate">{emp.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {data.overtime > 0 && (
                        <span
                          className="text-[10px] text-[#E8604C]"
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          +{Math.round(data.overtime)}h OT
                        </span>
                      )}
                      <span
                        className="text-[#F5A623] font-semibold"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {Math.round(data.actual)}h
                      </span>
                    </div>
                  </div>
                  <div className="relative h-6 md:h-7 bg-[#0A1628] rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#14B8A6] to-[#4ECBA0] rounded-lg"
                      style={{ width: `${basePct}%` }}
                    />
                    {overtimePct > 0 && (
                      <div
                        className="absolute inset-y-0 bg-gradient-to-r from-[#E8604C] to-[#E8604C]/70 rounded-r-lg"
                        style={{ left: `${basePct}%`, width: `${overtimePct}%` }}
                      />
                    )}
                    {data.scheduled > 0 && (
                      <div
                        className="absolute inset-y-0 w-[2px] bg-white/20"
                        style={{ left: `${(data.scheduled / maxActual) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-5 pt-4 border-t border-white/[0.07]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#14B8A6] to-[#4ECBA0]" />
              <span className="text-xs text-[#7A94AD]">Regular Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#E8604C]" />
              <span className="text-xs text-[#7A94AD]">Overtime</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[2px] h-3 bg-white/20" />
              <span className="text-xs text-[#7A94AD]">Scheduled Target</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
