"use client";

import { useRouter } from 'next/navigation';
import type { MonthlyReportViewData } from '@/lib/types/dashboard';

interface MonthlyReportProps {
  data: unknown;
  companyId: string;
}

export default function MonthlyReport({ data, companyId }: MonthlyReportProps) {
  const d = data as MonthlyReportViewData | null;
  const router = useRouter();

  const rows = d?.rows ?? [];
  const currentMonth = d?.month ?? '';

  const totalRegular = rows.reduce((s, r) => s + r.regularHours, 0);
  const totalExtra = rows.reduce((s, r) => s + r.extraHours, 0);
  const totalHours = Math.round((totalRegular + totalExtra) * 100) / 100;
  const avgHours = rows.length > 0 ? Math.round(totalHours / rows.length) : 0;

  const summaryStats = [
    { label: 'Total Hours', value: String(Math.round(totalHours)), icon: 'ri-time-line', color: '#14B8A6' },
    { label: 'Total Employees', value: String(rows.length), icon: 'ri-team-line', color: '#F5A623' },
    { label: 'Avg Hours/Employee', value: String(avgHours), icon: 'ri-bar-chart-line', color: '#4ECBA0' },
    { label: 'Extra Hours', value: `${Math.round(totalExtra)}h`, icon: 'ri-alarm-warning-line', color: '#E8604C' }
  ];

  const maxHours = rows.length > 0 ? Math.max(...rows.map(e => e.regularHours + e.extraHours)) : 1;

  // Generate month options
  const now = new Date();
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { value, label };
  });

  const handleMonthChange = (month: string) => {
    router.push(`/dashboard?view=monthly-report&month=${month}`);
  };

  const handleExportExcel = () => {
    window.open(`/api/export-monthly-report?month=${currentMonth}`, '_blank');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Monthly Report</h1>
          <p className="text-sm md:text-base text-[#7A94AD]">Hours summary and analytics</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <select
            value={currentMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-sm cursor-pointer"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-4 md:px-5 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-sm whitespace-nowrap cursor-pointer"
            >
              <i className="ri-file-excel-line mr-2"></i>
              <span className="hidden sm:inline">Export </span>Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {summaryStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: stat.color + '20' }}
              >
                <i className={`${stat.icon} text-lg md:text-xl`} style={{ color: stat.color }}></i>
              </div>
            </div>
            <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1">
              {stat.value}
            </div>
            <div className="text-xs md:text-sm text-[#7A94AD]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Employee Table */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Employee</th>
                <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Regular Hours</th>
                <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Extra Hours</th>
                <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((employee, idx) => {
                const total = Math.round((employee.regularHours + employee.extraHours) * 100) / 100;
                const initials = employee.employeeName.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase();
                return (
                  <tr
                    key={idx}
                    className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors ${
                      idx % 2 === 0 ? 'bg-white/[0.01]' : ''
                    }`}
                  >
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center text-[#0A1628] text-xs font-semibold flex-shrink-0">
                          {initials}
                        </div>
                        <span className="text-xs md:text-sm font-medium text-[#F0EDE8] truncate">{employee.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <span className="text-xs md:text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{Math.round(employee.regularHours * 100) / 100}h</span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      {employee.extraHours > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-[#E8604C]/10 text-[#E8604C] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                          <i className="ri-alarm-warning-line text-xs md:text-sm"></i>
                          {Math.round(employee.extraHours * 100) / 100}h
                        </span>
                      ) : (
                        <span className="text-xs md:text-sm text-[#7A94AD]">—</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <span className="text-xs md:text-sm font-['JetBrains_Mono'] font-semibold text-[#F0EDE8]">{total}h</span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-[#7A94AD]">
                    No shift data for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hours Distribution Chart */}
      {rows.length > 0 && (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4 md:mb-6">Hours Distribution</h2>
          <div className="space-y-3 md:space-y-4">
            {rows.map((employee, idx) => {
              const total = employee.regularHours + employee.extraHours;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-xs md:text-sm gap-2">
                    <span className="text-[#F0EDE8] font-medium truncate flex-1">{employee.employeeName}</span>
                    <span className="font-['JetBrains_Mono'] text-[#F5A623] font-semibold whitespace-nowrap">{Math.round(total)}h</span>
                  </div>
                  <div className="relative h-6 md:h-8 bg-[#0A1628] rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#F5A623] to-[#E09415] rounded-lg transition-all duration-500"
                      style={{
                        width: `${(total / maxHours) * 100}%`,
                        animation: `expandBar 0.8s ease-out ${idx * 0.1}s both`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes expandBar {
          from {
            width: 0;
          }
        }
        select option {
          background: #142236;
          color: #F0EDE8;
        }
      `}</style>
    </div>
  );
}
