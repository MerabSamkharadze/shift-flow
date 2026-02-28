"use client";

import { useState, useMemo } from "react";

type Employee = {
  name: string;
  totalHours: number;
  extraHours: number;
  daysWorked: number;
};

type Props = {
  employees: Employee[];
  totalHours: number;
  totalOvertime: number;
  employeeCount: number;
  currentMonth: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MonthlyReportClient({
  employees,
  totalHours,
  totalOvertime,
  employeeCount,
  currentMonth,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxHours = useMemo(
    () => Math.max(...employees.map((e) => e.totalHours), 1),
    [employees],
  );
  const avgHours = useMemo(
    () => (employeeCount > 0 ? Math.round(totalHours / employeeCount) : 0),
    [employeeCount, totalHours],
  );

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/export-monthly-report?month=${currentMonth}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Monthly_Report_${currentMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const summaryStats = [
    { label: "Total Hours", value: totalHours.toLocaleString() + "h", icon: "ri-time-line", color: "#14B8A6" },
    { label: "Total Employees", value: String(employeeCount), icon: "ri-team-line", color: "#F5A623" },
    { label: "Avg Hours/Employee", value: String(avgHours) + "h", icon: "ri-bar-chart-line", color: "#4ECBA0" },
    { label: "Overtime", value: totalOvertime + "h", icon: "ri-alarm-warning-line", color: "#E8604C" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Export Button */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          disabled={loading}
          className="px-4 md:px-5 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-sm whitespace-nowrap disabled:opacity-50"
        >
          <i className="ri-file-excel-line mr-2" />
          {loading ? "Exporting..." : "Export Excel"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#E8604C]/10 rounded-lg border border-[#E8604C]/20">
          <i className="ri-error-warning-line text-[#E8604C]" />
          <span className="text-sm text-[#E8604C]">{error}</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {summaryStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: stat.color + "20" }}
              >
                <i className={`${stat.icon} text-lg md:text-xl`} style={{ color: stat.color }} />
              </div>
            </div>
            <div
              className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {stat.value}
            </div>
            <div className="text-xs md:text-sm text-[#7A94AD]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Employee Table */}
      {employees.length > 0 ? (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">
                    Employee
                  </th>
                  <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">
                    Days Worked
                  </th>
                  <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">
                    Total Hours
                  </th>
                  <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">
                    Overtime
                  </th>
                  <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors ${
                      idx % 2 === 0 ? "bg-white/[0.01]" : ""
                    }`}
                  >
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center text-[#0A1628] text-xs font-semibold flex-shrink-0">
                          {getInitials(emp.name)}
                        </div>
                        <span className="text-xs md:text-sm font-medium text-[#F0EDE8] truncate">
                          {emp.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <span
                        className="text-xs md:text-sm text-[#F0EDE8]"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {emp.daysWorked}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <span
                        className="text-xs md:text-sm font-semibold text-[#F0EDE8]"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {emp.totalHours}h
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      {emp.extraHours > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-[#E8604C]/10 text-[#E8604C] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                          <i className="ri-alarm-warning-line text-xs md:text-sm" />
                          {emp.extraHours}h
                        </span>
                      ) : (
                        <span className="text-xs md:text-sm text-[#7A94AD]">—</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 bg-[#4ECBA0]/10 text-[#4ECBA0] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4ECBA0]" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-12 text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#0A1628]">
            <i className="ri-bar-chart-line text-3xl text-[#7A94AD]" />
          </div>
          <p className="text-[#7A94AD] text-sm">No shift data for this month</p>
        </div>
      )}

      {/* Hours Distribution */}
      {employees.length > 0 && (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4 md:mb-6">
            Hours Distribution
          </h2>
          <div className="space-y-3 md:space-y-4">
            {employees.map((emp, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs md:text-sm gap-2">
                  <span className="text-[#F0EDE8] font-medium truncate flex-1">{emp.name}</span>
                  <span
                    className="text-[#F5A623] font-semibold whitespace-nowrap"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {emp.totalHours}h
                  </span>
                </div>
                <div className="relative h-6 md:h-8 bg-[#0A1628] rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#F5A623] to-[#E09415] rounded-lg"
                    style={{ width: `${(emp.totalHours / maxHours) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
