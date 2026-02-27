"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { HoursSummaryViewData } from '@/lib/types/dashboard';

interface HoursSummaryProps {
  data: unknown;
}

export default function HoursSummary({ data }: HoursSummaryProps) {
  const d = data as HoursSummaryViewData | null;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'totalHours' | 'extraHours'>('totalHours');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const colorPool = ['#14B8A6', '#F5A623', '#E8604C', '#4ECBA0'];
  const employees = d?.employees ?? [];
  const currentMonth = d?.month ?? '';

  // Generate month options
  const now = new Date();
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const label = dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { value, label };
  });

  const handleMonthChange = (month: string) => {
    router.push(`/dashboard?view=hours-summary&month=${month}`);
  };

  const filtered = useMemo(() => {
    let list = [...employees];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const aVal = sortBy === 'extraHours' ? a.extraHours : a.totalHours;
      const bVal = sortBy === 'extraHours' ? b.extraHours : b.totalHours;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [employees, searchQuery, sortBy, sortDir]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, e) => ({
        totalHours: acc.totalHours + e.totalHours,
        extraHours: acc.extraHours + e.extraHours,
        shiftCount: acc.shiftCount + e.shiftCount,
      }),
      { totalHours: 0, extraHours: 0, shiftCount: 0 }
    );
  }, [filtered]);

  const avgHours = filtered.length > 0 ? Math.round(totals.totalHours / filtered.length) : 0;
  const maxHours = filtered.length > 0 ? Math.max(...filtered.map((e) => e.totalHours), 1) : 1;

  const handleSort = (col: 'name' | 'totalHours' | 'extraHours') => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'name' ? 'asc' : 'desc');
    }
  };

  const sortIcon = (col: string) => {
    if (sortBy !== col) return 'ri-arrow-up-down-line text-[#7A94AD]/40';
    return sortDir === 'asc' ? 'ri-arrow-up-s-line text-[#F5A623]' : 'ri-arrow-down-s-line text-[#F5A623]';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Hours Summary</h1>
          <p className="text-sm md:text-base text-[#7A94AD]">Monthly per-employee hours tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={currentMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="px-4 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-sm cursor-pointer"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <i className="ri-time-line text-lg md:text-xl text-[#14B8A6]"></i>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1">
            {Math.round(totals.totalHours)}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Total Hours</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-team-line text-lg md:text-xl text-[#F5A623]"></i>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1">
            {filtered.length}
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Employees</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#4ECBA0]/10 flex items-center justify-center">
              <i className="ri-bar-chart-line text-lg md:text-xl text-[#4ECBA0]"></i>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1">
            {avgHours}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Avg Hours/Employee</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#E8604C]/10 flex items-center justify-center">
              <i className="ri-alarm-warning-line text-lg md:text-xl text-[#E8604C]"></i>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-semibold text-[#E8604C] mb-1">
            {Math.round(totals.extraHours)}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Extra Hours</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD] text-lg"></i>
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 md:py-3 bg-[#142236] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th
                  className="text-left text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4 cursor-pointer select-none hover:text-[#F0EDE8] transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    Employee
                    <i className={`${sortIcon('name')} text-sm`}></i>
                  </div>
                </th>
                <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Shifts</th>
                <th
                  className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4 cursor-pointer select-none hover:text-[#F0EDE8] transition-colors"
                  onClick={() => handleSort('totalHours')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Total Hours
                    <i className={`${sortIcon('totalHours')} text-sm`}></i>
                  </div>
                </th>
                <th
                  className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4 cursor-pointer select-none hover:text-[#F0EDE8] transition-colors"
                  onClick={() => handleSort('extraHours')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Extra Hours
                    <i className={`${sortIcon('extraHours')} text-sm`}></i>
                  </div>
                </th>
                <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => {
                const initials = emp.name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase();
                const color = colorPool[idx % colorPool.length];
                return (
                  <tr
                    key={emp.id}
                    className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors ${
                      idx % 2 === 0 ? 'bg-white/[0.01]' : ''
                    }`}
                    style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.03}s both` }}
                  >
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div
                          className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: color + '20', color }}
                        >
                          {initials}
                        </div>
                        <span className="text-xs md:text-sm font-medium text-[#F0EDE8] truncate">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <span className="text-xs md:text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{emp.shiftCount}</span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <span className="text-xs md:text-sm font-['JetBrains_Mono'] font-semibold text-[#F0EDE8]">{Math.round(emp.totalHours * 10) / 10}h</span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      {emp.extraHours > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-[#E8604C]/10 text-[#E8604C] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                          <i className="ri-alarm-warning-line text-xs"></i>
                          {Math.round(emp.extraHours * 10) / 10}h
                        </span>
                      ) : (
                        <span className="text-xs md:text-sm text-[#7A94AD]">—</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="relative h-5 bg-[#0A1628] rounded-full overflow-hidden min-w-[100px]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{
                            width: `${(emp.totalHours / maxHours) * 100}%`,
                            backgroundColor: color,
                            animation: `expandBar 0.8s ease-out ${idx * 0.05}s both`,
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#7A94AD]">
                    No data for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expandBar {
          from { width: 0; }
        }
        select option {
          background: #142236;
          color: #F0EDE8;
        }
      `}</style>
    </div>
  );
}
