
import React, { useState, useMemo } from 'react';

type Period = 'weekly' | 'monthly';
type WeekKey = 'week1' | 'week2' | 'week3' | 'week4';

interface EmployeeHours {
  name: string;
  initial: string;
  role: string;
  branch: string;
  color: string;
  weekly: Record<
    WeekKey,
    { scheduled: number; actual: number; overtime: number }
  >;
  monthly: {
    scheduled: number;
    actual: number;
    overtime: number;
    daysWorked: number;
  };
}

const employees: EmployeeHours[] = [
  {
    name: 'Ana Beridze',
    initial: 'AB',
    role: 'Shift Manager',
    branch: 'Downtown',
    color: '#14B8A6',
    weekly: {
      week1: { scheduled: 40, actual: 42, overtime: 2 },
      week2: { scheduled: 40, actual: 40, overtime: 0 },
      week3: { scheduled: 40, actual: 44, overtime: 4 },
      week4: { scheduled: 40, actual: 42, overtime: 2 },
    },
    monthly: { scheduled: 160, actual: 168, overtime: 8, daysWorked: 21 },
  },
  {
    name: 'Giorgi Maisuradze',
    initial: 'GM',
    role: 'Team Lead',
    branch: 'Westside',
    color: '#F5A623',
    weekly: {
      week1: { scheduled: 40, actual: 44, overtime: 4 },
      week2: { scheduled: 40, actual: 43, overtime: 3 },
      week3: { scheduled: 40, actual: 42, overtime: 2 },
      week4: { scheduled: 40, actual: 43, overtime: 3 },
    },
    monthly: { scheduled: 160, actual: 172, overtime: 12, daysWorked: 22 },
  },
  {
    name: 'Tamara Gelashvili',
    initial: 'TG',
    role: 'Associate',
    branch: 'Downtown',
    color: '#E8604C',
    weekly: {
      week1: { scheduled: 40, actual: 38, overtime: 0 },
      week2: { scheduled: 40, actual: 40, overtime: 0 },
      week3: { scheduled: 40, actual: 39, overtime: 0 },
      week4: { scheduled: 40, actual: 39, overtime: 0 },
    },
    monthly: { scheduled: 160, actual: 156, overtime: 0, daysWorked: 19 },
  },
  {
    name: 'Luka Janelidze',
    initial: 'LJ',
    role: 'Associate',
    branch: 'Eastside',
    color: '#4ECBA0',
    weekly: {
      week1: { scheduled: 40, actual: 41, overtime: 1 },
      week2: { scheduled: 40, actual: 42, overtime: 2 },
      week3: { scheduled: 40, actual: 40, overtime: 0 },
      week4: { scheduled: 40, actual: 41, overtime: 1 },
    },
    monthly: { scheduled: 160, actual: 164, overtime: 4, daysWorked: 20 },
  },
  {
    name: 'Nino Kharatishvili',
    initial: 'NK',
    role: 'Manager',
    branch: 'Downtown',
    color: '#F5A623',
    weekly: {
      week1: { scheduled: 40, actual: 45, overtime: 5 },
      week2: { scheduled: 40, actual: 44, overtime: 4 },
      week3: { scheduled: 40, actual: 46, overtime: 6 },
      week4: { scheduled: 40, actual: 45, overtime: 5 },
    },
    monthly: { scheduled: 160, actual: 180, overtime: 20, daysWorked: 22 },
  },
  {
    name: 'Mariam Beridze',
    initial: 'MB',
    role: 'Associate',
    branch: 'Westside',
    color: '#14B8A6',
    weekly: {
      week1: { scheduled: 40, actual: 36, overtime: 0 },
      week2: { scheduled: 40, actual: 38, overtime: 0 },
      week3: { scheduled: 40, actual: 37, overtime: 0 },
      week4: { scheduled: 40, actual: 37, overtime: 0 },
    },
    monthly: { scheduled: 160, actual: 148, overtime: 0, daysWorked: 18 },
  },
  {
    name: 'Davit Gelashvili',
    initial: 'DG',
    role: 'Team Lead',
    branch: 'Downtown',
    color: '#E8604C',
    weekly: {
      week1: { scheduled: 40, actual: 44, overtime: 4 },
      week2: { scheduled: 40, actual: 43, overtime: 3 },
      week3: { scheduled: 40, actual: 45, overtime: 5 },
      week4: { scheduled: 40, actual: 44, overtime: 4 },
    },
    monthly: { scheduled: 160, actual: 176, overtime: 16, daysWorked: 22 },
  },
  {
    name: 'Salome Janelidze',
    initial: 'SJ',
    role: 'Associate',
    branch: 'Eastside',
    color: '#4ECBA0',
    weekly: {
      week1: { scheduled: 40, actual: 38, overtime: 0 },
      week2: { scheduled: 40, actual: 39, overtime: 0 },
      week3: { scheduled: 40, actual: 37, overtime: 0 },
      week4: { scheduled: 40, actual: 38, overtime: 0 },
    },
    monthly: { scheduled: 160, actual: 152, overtime: 0, daysWorked: 19 },
  },
  {
    name: 'Nika Maisuradze',
    initial: 'NM',
    role: 'Shift Manager',
    branch: 'Westside',
    color: '#F5A623',
    weekly: {
      week1: { scheduled: 40, actual: 42, overtime: 2 },
      week2: { scheduled: 40, actual: 43, overtime: 3 },
      week3: { scheduled: 40, actual: 44, overtime: 4 },
      week4: { scheduled: 40, actual: 41, overtime: 1 },
    },
    monthly: { scheduled: 160, actual: 170, overtime: 10, daysWorked: 21 },
  },
];

const weekLabels: {
  key: WeekKey;
  label: string;
  dates: string;
}[] = [
  { key: 'week1', label: 'Week 1', dates: 'Jan 1 – 7' },
  { key: 'week2', label: 'Week 2', dates: 'Jan 8 – 14' },
  { key: 'week3', label: 'Week 3', dates: 'Jan 15 – 21' },
  { key: 'week4', label: 'Week 4', dates: 'Jan 22 – 28' },
];

export default function HoursSummary() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [selectedWeek, setSelectedWeek] = useState<WeekKey>('week4');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'actual' | 'overtime'>('actual');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const branches = ['all', 'Downtown', 'Westside', 'Eastside'];

  const filtered = useMemo(() => {
    let list = [...employees];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q)
      );
    }
    if (branchFilter !== 'all') {
      list = list.filter((e) => e.branch === branchFilter);
    }
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return sortDir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const aVal =
        period === 'weekly'
          ? sortBy === 'overtime'
            ? a.weekly[selectedWeek].overtime
            : a.weekly[selectedWeek].actual
          : sortBy === 'overtime'
          ? a.monthly.overtime
          : a.monthly.actual;
      const bVal =
        period === 'weekly'
          ? sortBy === 'overtime'
            ? b.weekly[selectedWeek].overtime
            : b.weekly[selectedWeek].actual
          : sortBy === 'overtime'
          ? b.monthly.overtime
          : b.monthly.actual;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [
    searchQuery,
    branchFilter,
    sortBy,
    sortDir,
    period,
    selectedWeek,
  ]);

  const totals = useMemo(() => {
    if (period === 'weekly') {
      return filtered.reduce(
        (acc, e) => ({
          scheduled: acc.scheduled + e.weekly[selectedWeek].scheduled,
          actual: acc.actual + e.weekly[selectedWeek].actual,
          overtime: acc.overtime + e.weekly[selectedWeek].overtime,
        }),
        { scheduled: 0, actual: 0, overtime: 0 }
      );
    }
    return filtered.reduce(
      (acc, e) => ({
        scheduled: acc.scheduled + e.monthly.scheduled,
        actual: acc.actual + e.monthly.actual,
        overtime: acc.overtime + e.monthly.overtime,
      }),
      { scheduled: 0, actual: 0, overtime: 0 }
    );
  }, [filtered, period, selectedWeek]);

  const avgHours =
    filtered.length > 0 ? Math.round(totals.actual / filtered.length) : 0;

  const handleSort = (col: 'name' | 'actual' | 'overtime') => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'name' ? 'asc' : 'desc');
    }
  };

  const sortIcon = (col: string) => {
    if (sortBy !== col) return 'ri-arrow-up-down-line text-[#7A94AD]/40';
    return sortDir === 'asc'
      ? 'ri-arrow-up-s-line text-[#F5A623]'
      : 'ri-arrow-down-s-line text-[#F5A623]';
  };

  const getUtilization = (scheduled: number, actual: number) => {
    if (scheduled === 0) return 0;
    return Math.round((actual / scheduled) * 100);
  };

  const getUtilColor = (pct: number) => {
    if (pct > 110) return '#E8604C';
    if (pct >= 95) return '#4ECBA0';
    if (pct >= 80) return '#F5A623';
    return '#7A94AD';
  };

  const maxActual = useMemo(() => {
    return Math.max(
      ...filtered.map((e) =>
        period === 'weekly' ? e.weekly[selectedWeek].actual : e.monthly.actual
      ),
      1
    );
  }, [filtered, period, selectedWeek]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">
            Hours Summary
          </h1>
          <p className="text-sm md:text-base text-[#7A94AD]">
            Weekly &amp; monthly breakdowns with per-employee tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#142236] border border-white/[0.07] rounded-lg p-1">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                period === 'weekly'
                  ? 'bg-[#F5A623] text-[#0A1628]'
                  : 'text-[#7A94AD] hover:text-[#F0EDE8]'
              }`}
            >
              <i className="ri-calendar-line mr-1.5"></i>Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                period === 'monthly'
                  ? 'bg-[#F5A623] text-[#0A1628]'
                  : 'text-[#7A94AD] hover:text-[#F0EDE8]'
              }`}
            >
              <i className="ri-calendar-2-line mr-1.5"></i>Monthly
            </button>
          </div>
          <button className="px-4 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-sm whitespace-nowrap cursor-pointer">
            <i className="ri-download-line mr-1.5"></i>Export
          </button>
        </div>
      </div>

      {/* Week Selector (only in weekly mode) */}
      {period === 'weekly' && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {weekLabels.map((w) => (
            <button
              key={w.key}
              onClick={() => setSelectedWeek(w.key)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedWeek === w.key
                  ? 'bg-[#F5A623]/10 border-[#F5A623]/40 text-[#F0EDE8]'
                  : 'bg-[#142236] border-white/[0.07] text-[#7A94AD] hover:bg-[#1A2E45] hover:text-[#F0EDE8]'
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
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <i className="ri-time-line text-xl text-[#14B8A6]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">
              {period === 'weekly' ? 'This Week' : 'This Month'}
            </span>
          </div>
          <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1">
            {totals.actual.toLocaleString()}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">
            Total Actual Hours
          </div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-calendar-check-line text-xl text-[#F5A623]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Scheduled</span>
          </div>
          <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1">
            {totals.scheduled.toLocaleString()}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">
            Total Scheduled Hours
          </div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#E8604C]/10 flex items-center justify-center">
              <i className="ri-alarm-warning-line text-xl text-[#E8604C]"></i>
            </div>
            {totals.overtime > 0 && (
              <span className="bg-[#E8604C]/15 text-[#E8604C] text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                Attention
              </span>
            )}
          </div>
          <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1">
            {totals.overtime}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">
            Total Overtime
          </div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#4ECBA0]/10 flex items-center justify-center">
              <i className="ri-user-line text-xl text-[#4ECBA0]"></i>
            </div>
            <div className="flex items-center gap-1 text-[#4ECBA0] text-xs">
              <i className="ri-arrow-up-line"></i>
              <span>{getUtilization(totals.scheduled, totals.actual)}%</span>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1">
            {avgHours}h
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">
            Avg Hours / Employee
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD] text-lg"></i>
          <input
            type="text"
            placeholder="Search by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 md:py-3 bg-[#142236] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => setBranchFilter(b)}
              className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                branchFilter === b
                  ? 'bg-[#F5A623] text-[#0A1628]'
                  : 'bg-[#142236] text-[#7A94AD] hover:text-[#F0EDE8] border border-white/[0.07]'
              }`}
            >
              {b === 'all' ? 'All Branches' : b}
            </button>
          ))}
        </div>
      </div>

      {/* Per-Employee Table */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left px-4 md:px-6 py-3 md:py-4">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Employee{' '}
                    <i className={`${sortIcon('name')} text-xs`}></i>
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
                    onClick={() => handleSort('actual')}
                    className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer whitespace-nowrap mx-auto"
                  >
                    Actual{' '}
                    <i className={`${sortIcon('actual')} text-xs`}></i>
                  </button>
                </th>
                <th className="text-center px-4 md:px-6 py-3 md:py-4">
                  <button
                    onClick={() => handleSort('overtime')}
                    className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer whitespace-nowrap mx-auto"
                  >
                    Overtime{' '}
                    <i className={`${sortIcon('overtime')} text-xs`}></i>
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
                  period === 'weekly' ? emp.weekly[selectedWeek] : emp.monthly;
                const util = getUtilization(data.scheduled, data.actual);
                const utilColor = getUtilColor(util);
                const isExpanded = expandedRow === emp.name;

                return (
                  <React.Fragment key={emp.name}>
                    <tr
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : emp.name)
                      }
                      className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        idx % 2 === 0 ? 'bg-white/[0.01]' : ''
                      } ${isExpanded ? 'bg-[#F5A623]/[0.03]' : ''}`}
                      style={{
                        animation: `fadeIn 0.3s ease-out ${idx *
                          0.04}s both`,
                      }}
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: emp.color + '20',
                              color: emp.color,
                            }}
                          >
                            {emp.initial}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs md:text-sm font-medium text-[#F0EDE8] truncate block">
                              {emp.name}
                            </span>
                            <span className="text-[10px] md:text-xs text-[#7A94AD]">
                              {emp.role}
                            </span>
                          </div>
                          <i
                            className={`ri-arrow-${
                              isExpanded ? 'up' : 'down'
                            }-s-line text-[#7A94AD] text-sm ml-auto flex-shrink-0`}
                          ></i>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span className="px-2 py-0.5 bg-[#F5A623]/10 text-[#F5A623] text-[10px] md:text-xs rounded-full whitespace-nowrap">
                          {emp.branch}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span className="text-xs md:text-sm font-['JetBrains_Mono'] text-[#7A94AD]">
                          {data.scheduled}h
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span className="text-xs md:text-sm font-['JetBrains_Mono'] font-semibold text-[#F0EDE8]">
                          {data.actual}h
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        {data.overtime > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#E8604C]/10 text-[#E8604C] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                            <i className="ri-alarm-warning-line text-xs"></i>
                            {data.overtime}h
                          </span>
                        ) : (
                          <span className="text-xs md:text-sm text-[#7A94AD]">
                            &mdash;
                          </span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <span
                          className="text-xs md:text-sm font-['JetBrains_Mono'] font-semibold"
                          style={{ color: utilColor }}
                        >
                          {util}%
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex justify-center">
                          <div className="w-20 h-6 flex items-end gap-[3px]">
                            {Object.values(emp.weekly).map((w, i) => (
                              <div
                                key={i}
                                className="flex-1 rounded-sm transition-all duration-300"
                                style={{
                                  height: `${(w.actual / 50) * 100}%`,
                                  backgroundColor:
                                    w.overtime > 0 ? '#E8604C' : '#4ECBA0',
                                  opacity:
                                    period === 'weekly' &&
                                    weekLabels[i].key === selectedWeek
                                      ? 1
                                      : 0.4,
                                }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#0D1B2A]/60">
                        <td colSpan={7} className="px-4 md:px-6 py-4">
                          <div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            style={{ animation: 'fadeIn 0.2s ease-out' }}
                          >
                            <div className="bg-[#142236] rounded-xl p-4 border border-white/[0.07]">
                              <h4 className="text-sm font-semibold text-[#F0EDE8] mb-3">
                                Weekly Breakdown
                              </h4>
                              <div className="space-y-2.5">
                                {weekLabels.map((w) => {
                                  const wd = emp.weekly[w.key];
                                  const wUtil = getUtilization(
                                    wd.scheduled,
                                    wd.actual
                                  );
                                  return (
                                    <div
                                      key={w.key}
                                      className="flex items-center gap-3"
                                    >
                                      <span className="text-xs text-[#7A94AD] w-16 flex-shrink-0">
                                        {w.label}
                                      </span>
                                      <div className="flex-1 h-5 bg-[#0A1628] rounded-md overflow-hidden relative">
                                        <div
                                          className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                                          style={{
                                            width: `${Math.min(
                                              (wd.actual / 50) * 100,
                                              100
                                            )}%`,
                                            backgroundColor:
                                              wd.overtime > 0
                                                ? '#E8604C'
                                                : '#4ECBA0',
                                          }}
                                        ></div>
                                      </div>
                                      <span className="text-xs font-['JetBrains_Mono'] text-[#F0EDE8] w-10 text-right flex-shrink-0">
                                        {wd.actual}h
                                      </span>
                                      <span
                                        className="text-[10px] font-['JetBrains_Mono'] w-10 text-right flex-shrink-0"
                                        style={{ color: getUtilColor(wUtil) }}
                                      >
                                        {wUtil}%
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="bg-[#142236] rounded-xl p-4 border border-white/[0.07]">
                              <h4 className="text-sm font-semibold text-[#F0EDE8] mb-3">
                                Monthly Summary
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#0A1628] rounded-lg p-3">
                                  <div className="text-[10px] text-[#7A94AD] mb-1">
                                    Days Worked
                                  </div>
                                  <div className="text-lg font-['JetBrains_Mono'] font-semibold text-[#F0EDE8]">
                                    {emp.monthly.daysWorked}
                                  </div>
                                </div>
                                <div className="bg-[#0A1628] rounded-lg p-3">
                                  <div className="text-[10px] text-[#7A94AD] mb-1">
                                    Total Hours
                                  </div>
                                  <div className="text-lg font-['JetBrains_Mono'] font-semibold text-[#F0EDE8]">
                                    {emp.monthly.actual}h
                                  </div>
                                </div>
                                <div className="bg-[#0A1628] rounded-lg p-3">
                                  <div className="text-[10px] text-[#7A94AD] mb-1">
                                    Overtime
                                  </div>
                                  <div
                                    className="text-lg font-['JetBrains_Mono'] font-semibold"
                                    style={{
                                      color:
                                        emp.monthly.overtime > 0
                                          ? '#E8604C'
                                          : '#7A94AD',
                                    }}
                                  >
                                    {emp.monthly.overtime > 0
                                      ? `${emp.monthly.overtime}h`
                                      : '\u2014'}
                                  </div>
                                </div>
                                <div className="bg-[#0A1628] rounded-lg p-3">
                                  <div className="text-[10px] text-[#7A94AD] mb-1">
                                    Utilization
                                  </div>
                                  <div
                                    className="text-lg font-['JetBrains_Mono'] font-semibold"
                                    style={{
                                      color: getUtilColor(
                                        getUtilization(
                                          emp.monthly.scheduled,
                                          emp.monthly.actual
                                        )
                                      ),
                                    }}
                                  >
                                    {getUtilization(
                                      emp.monthly.scheduled,
                                      emp.monthly.actual
                                    )}
                                    %
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F5A623]/10 flex items-center justify-center mb-4">
              <i className="ri-search-line text-2xl text-[#F5A623]"></i>
            </div>
            <p className="text-sm text-[#7A94AD]">
              No employees match your search
            </p>
          </div>
        )}
      </div>

      {/* Hours Distribution Visual */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">
            {period === 'weekly' ? 'Weekly' : 'Monthly'} Hours Distribution
          </h2>
          <span className="text-xs text-[#7A94AD]">
            {filtered.length} employees
          </span>
        </div>
        <div className="space-y-3">
          {filtered.map((emp, idx) => {
            const data =
              period === 'weekly' ? emp.weekly[selectedWeek] : emp.monthly;
            const pct = maxActual > 0 ? (data.actual / maxActual) * 100 : 0;
            const overtimePct =
              data.scheduled > 0
                ? Math.max(0, ((data.actual - data.scheduled) / maxActual) * 100)
                : 0;
            const basePct = Math.min(
              pct,
              (data.scheduled / maxActual) * 100
            );

            return (
              <div key={emp.name} className="group">
                <div className="flex items-center justify-between text-xs md:text-sm gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                      style={{
                        backgroundColor: emp.color + '20',
                        color: emp.color,
                      }}
                    >
                      {emp.initial}
                    </div>
                    <span className="text-[#F0EDE8] font-medium truncate">
                      {emp.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {data.overtime > 0 && (
                      <span className="text-[10px] text-[#E8604C] font-['JetBrains_Mono']">
                        +{data.overtime}h OT
                      </span>
                    )}
                    <span className="font-['JetBrains_Mono'] text-[#F5A623] font-semibold">
                      {data.actual}h
                    </span>
                  </div>
                </div>
                <div className="relative h-6 md:h-7 bg-[#0A1628] rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#14B8A6] to-[#4ECBA0] rounded-lg transition-all duration-700"
                    style={{
                      width: `${basePct}%`,
                      animation: `expandBar 0.8s ease-out ${idx *
                        0.06}s both`,
                    }}
                  ></div>
                  {overtimePct > 0 && (
                    <div
                      className="absolute inset-y-0 bg-gradient-to-r from-[#E8604C] to-[#E8604C]/70 rounded-r-lg transition-all duration-700"
                      style={{
                        left: `${basePct}%`,
                        width: `${overtimePct}%`,
                        animation: `expandBar 0.8s ease-out ${idx *
                          0.06 +
                          0.3}s both`,
                      }}
                    ></div>
                  )}
                  <div
                    className="absolute inset-y-0 w-[2px] bg-white/20"
                    style={{
                      left: `${(data.scheduled / maxActual) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-5 pt-4 border-t border-white/[0.07]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#14B8A6] to-[#4ECBA0]"></div>
            <span className="text-xs text-[#7A94AD]">Regular Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#E8604C]"></div>
            <span className="text-xs text-[#7A94AD]">Overtime</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[2px] h-3 bg-white/20"></div>
            <span className="text-xs text-[#7A94AD]">Scheduled Target</span>
          </div>
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
      `}</style>
    </div>
  );
}
