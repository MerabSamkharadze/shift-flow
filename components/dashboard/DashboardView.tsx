"use client";

import { useState, useEffect } from 'react';
import type { DashboardViewData } from '@/lib/types/dashboard';

function fmtTime(t: string) {
  return t.slice(0, 5);
}

interface DashboardViewProps {
  data: unknown;
}

export default function DashboardView({ data }: DashboardViewProps) {
  const d = data as DashboardViewData | null;

  const targetEmployees = d?.employeeCount ?? 0;
  const targetShifts = d?.shiftsThisWeek ?? 0;
  const targetPending = d?.pendingCount ?? 0;
  const targetHours = d?.monthlyHours ?? 0;

  const [activeEmployees, setActiveEmployees] = useState(0);
  const [shiftsThisWeek, setShiftsThisWeek] = useState(0);
  const [pendingSwaps, setPendingSwaps] = useState(0);
  const [hoursThisMonth, setHoursThisMonth] = useState(0);

  useEffect(() => {
    const animateCount = (setter: (v: number) => void, target: number, duration: number = 1000) => {
      if (target === 0) { setter(0); return; }
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(start));
        }
      }, 16);
    };

    animateCount(setActiveEmployees, targetEmployees);
    animateCount(setShiftsThisWeek, targetShifts);
    animateCount(setPendingSwaps, targetPending);
    animateCount(setHoursThisMonth, targetHours);
  }, [targetEmployees, targetShifts, targetPending, targetHours]);

  // Build week schedule from real week shifts
  const todayShifts = d?.todayShifts ?? [];
  const weekShifts = d?.weekShifts ?? [];
  const userNameMap = d?.userNameMap ?? {};
  const scheduleGroupMap = d?.scheduleGroupMap ?? {};
  const groupColorMap = d?.groupColorMap ?? {};

  // Build a 7-day week view starting from Monday
  const todayDate = new Date();
  const dayOfWeek = todayDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() + mondayOffset);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekSchedule = dayNames.map((day, idx) => {
    const dateObj = new Date(monday);
    dateObj.setDate(monday.getDate() + idx);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === d?.today;

    const shifts = weekShifts
      .filter((s) => s.date === dateStr)
      .map((s) => {
        const name = s.assigned_to ? (userNameMap[s.assigned_to] ?? 'Unknown') : 'Unassigned';
        const initials = name.split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
        const gId = scheduleGroupMap[s.schedule_id] ?? '';
        const color = groupColorMap[gId] ?? '#14B8A6';
        return {
          employee: name.split(' ')[0] ?? '',
          initial: initials,
          time: `${fmtTime(s.start_time)}-${fmtTime(s.end_time)}`,
          color,
          active: isToday,
        };
      });

    return {
      day,
      date: String(dateObj.getDate()),
      shifts,
    };
  });

  // Marketplace shifts from pending public swaps
  const pendingSwapsList = d?.pendingSwaps ?? [];
  const marketplaceShifts = pendingSwapsList.slice(0, 3).map((swap) => {
    const name = userNameMap[swap.from_user_id] ?? 'Unknown';
    const initials = name.split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
    const shiftDate = d?.shiftDateMap?.[swap.shift_id] ?? '';
    return {
      poster: name,
      avatar: initials,
      date: shiftDate ? new Date(shiftDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      time: '',
      branch: '',
      hours: 8,
      posted: swap.requested_at ? getTimeAgo(swap.requested_at) : '',
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Dashboard</h1>
        <p className="text-sm md:text-base text-[#7A94AD]">Overview of your workforce operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#4ECBA0]/10 flex items-center justify-center">
              <i className="ri-user-line text-lg md:text-xl text-[#4ECBA0]"></i>
            </div>
            <div className="flex items-center gap-1 text-[#4ECBA0] text-xs md:text-sm">
              <i className="ri-arrow-up-line"></i>
              <span>12%</span>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1">{activeEmployees}</div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Active Employees</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-calendar-line text-lg md:text-xl text-[#F5A623]"></i>
            </div>
            <svg width="60" height="24" className="opacity-60 hidden sm:block">
              <polyline
                points="0,20 10,15 20,18 30,10 40,12 50,8 60,5"
                fill="none"
                stroke="#F5A623"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1">{shiftsThisWeek}</div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Shifts This Week</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-swap-line text-lg md:text-xl text-[#F5A623]"></i>
            </div>
            {pendingSwaps > 0 && (
              <span className="bg-[#F5A623] text-[#0A1628] text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                Action needed
              </span>
            )}
          </div>
          <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1">{pendingSwaps}</div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Pending Swap Requests</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <i className="ri-time-line text-lg md:text-xl text-[#14B8A6]"></i>
            </div>
            <div className="flex items-center gap-1 text-[#4ECBA0] text-xs md:text-sm">
              <i className="ri-arrow-up-line"></i>
              <span>8%</span>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1">{hoursThisMonth}</div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Hours This Month</div>
        </div>
      </div>

      {/* Weekly Schedule + Today's Shifts */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 md:gap-6">
        {/* Weekly Schedule */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Weekly Schedule</h2>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="grid grid-cols-7 gap-2 min-w-[600px] md:min-w-0">
              {weekSchedule.map((day, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="text-center">
                    <div className="text-xs text-[#7A94AD] mb-1">{day.day}</div>
                    <div className="text-sm font-semibold text-[#F0EDE8]">{day.date}</div>
                  </div>
                  <div className="space-y-2">
                    {day.shifts.map((shift, sidx) => (
                      <div
                        key={sidx}
                        className="relative rounded-lg p-2 text-center transition-all hover:scale-105 cursor-pointer"
                        style={{
                          backgroundColor: shift.color + '20',
                          border: shift.active ? `2px solid ${shift.color}` : `1px solid ${shift.color}40`
                        }}
                      >
                        {shift.active && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#F5A623] rounded-full animate-pulse"></div>
                        )}
                        <div
                          className="w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: shift.color, color: '#0A1628' }}
                        >
                          {shift.initial}
                        </div>
                        <div className="text-[10px] text-[#F0EDE8] font-['JetBrains_Mono']">{shift.time}</div>
                      </div>
                    ))}
                    {day.shifts.length === 0 && (
                      <div className="rounded-lg p-3 text-center border border-dashed border-white/[0.07]">
                        <div className="text-[10px] text-[#7A94AD]">—</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Shifts Feed */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Today&apos;s Shifts</h2>
          <div className="space-y-3">
            {todayShifts.length === 0 ? (
              <p className="text-sm text-[#7A94AD] py-8 text-center">No shifts scheduled for today.</p>
            ) : (
              todayShifts.map((shift, idx) => {
                const name = shift.assigned_to ? (userNameMap[shift.assigned_to] ?? 'Unknown') : 'Unassigned';
                const initials = name.split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
                const gId = scheduleGroupMap[shift.schedule_id] ?? '';
                const color = groupColorMap[gId] ?? '#14B8A6';
                return (
                  <div
                    key={shift.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-all cursor-pointer"
                    style={{ animation: `slideInRight 0.3s ease-out ${idx * 0.1}s both` }}
                  >
                    <div
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs md:text-sm text-[#F0EDE8]">
                        <span className="font-medium">{name}</span>
                      </div>
                      <div className="text-[10px] md:text-xs text-[#7A94AD] mt-0.5">
                        {d?.groupNameMap?.[gId] ?? ''}
                      </div>
                    </div>
                    <span
                      className="text-xs font-['JetBrains_Mono'] px-2 py-1 rounded-md flex-shrink-0"
                      style={{ backgroundColor: color + '15', color }}
                    >
                      {fmtTime(shift.start_time)}–{fmtTime(shift.end_time)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Marketplace */}
      {marketplaceShifts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">Pending Swap Requests</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {marketplaceShifts.map((shift, idx) => (
              <div key={idx} className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] hover:scale-[1.02] transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center text-[#0A1628] text-xs md:text-sm font-semibold">
                    {shift.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-medium text-[#F0EDE8] truncate">{shift.poster}</div>
                    <div className="text-[10px] md:text-xs text-[#7A94AD]">{shift.posted}</div>
                  </div>
                </div>
                {shift.date && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm text-[#7A94AD]">Date</span>
                    <span className="text-xs md:text-sm font-medium text-[#F0EDE8]">{shift.date}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
