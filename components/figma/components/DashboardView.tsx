import { useState, useEffect } from 'react';

export default function DashboardView() {
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [shiftsThisWeek, setShiftsThisWeek] = useState(0);
  const [pendingSwaps, setPendingSwaps] = useState(0);
  const [hoursThisMonth, setHoursThisMonth] = useState(0);

  useEffect(() => {
    const animateCount = (setter: any, target: number, duration: number = 1000) => {
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

    animateCount(setActiveEmployees, 47);
    animateCount(setShiftsThisWeek, 156);
    animateCount(setPendingSwaps, 3);
    animateCount(setHoursThisMonth, 1847);
  }, []);

  const activities = [
    { name: 'Ana Beridze', action: 'requested swap', time: '12 min ago', avatar: 'AB', icon: 'ri-swap-line', color: '#F5A623' },
    { name: 'Giorgi Maisuradze', action: 'confirmed shift', time: '28 min ago', avatar: 'GM', icon: 'ri-check-line', color: '#4ECBA0' },
    { name: 'Tamara Gelashvili', action: 'added to schedule', time: '1 hour ago', avatar: 'TG', icon: 'ri-user-add-line', color: '#7A94AD' },
    { name: 'Luka Janelidze', action: 'completed shift', time: '2 hours ago', avatar: 'LJ', icon: 'ri-time-line', color: '#4ECBA0' },
    { name: 'Nino Kharatishvili', action: 'published schedule', time: '3 hours ago', avatar: 'NK', icon: 'ri-calendar-check-line', color: '#F5A623' }
  ];

  const weekSchedule = [
    { day: 'Mon', date: '15', shifts: [
      { employee: 'Ana', initial: 'AB', time: '09:00-17:00', color: '#14B8A6', active: false },
      { employee: 'Giorgi', initial: 'GM', time: '14:00-22:00', color: '#F5A623', active: true }
    ]},
    { day: 'Tue', date: '16', shifts: [
      { employee: 'Tamara', initial: 'TG', time: '08:00-16:00', color: '#14B8A6', active: false },
      { employee: 'Luka', initial: 'LJ', time: '16:00-00:00', color: '#E8604C', active: false }
    ]},
    { day: 'Wed', date: '17', shifts: [
      { employee: 'Nino', initial: 'NK', time: '09:00-17:00', color: '#14B8A6', active: false },
      { employee: 'Ana', initial: 'AB', time: '17:00-01:00', color: '#E8604C', active: false }
    ]},
    { day: 'Thu', date: '18', shifts: [
      { employee: 'Giorgi', initial: 'GM', time: '10:00-18:00', color: '#14B8A6', active: false }
    ]},
    { day: 'Fri', date: '19', shifts: [
      { employee: 'Tamara', initial: 'TG', time: '09:00-17:00', color: '#14B8A6', active: false },
      { employee: 'Luka', initial: 'LJ', time: '14:00-22:00', color: '#F5A623', active: false }
    ]},
    { day: 'Sat', date: '20', shifts: [
      { employee: 'Ana', initial: 'AB', time: '08:00-16:00', color: '#14B8A6', active: false }
    ]},
    { day: 'Sun', date: '21', shifts: [
      { employee: 'Giorgi', initial: 'GM', time: '10:00-18:00', color: '#14B8A6', active: false }
    ]}
  ];

  const marketplaceShifts = [
    { poster: 'Ana Beridze', avatar: 'AB', date: 'Jan 22', time: '14:00-22:00', branch: 'Downtown', hours: 8, posted: '2 hours ago' },
    { poster: 'Luka Janelidze', avatar: 'LJ', date: 'Jan 23', time: '09:00-17:00', branch: 'Westside', hours: 8, posted: '5 hours ago' },
    { poster: 'Tamara Gelashvili', avatar: 'TG', date: 'Jan 24', time: '16:00-00:00', branch: 'Downtown', hours: 8, posted: '1 day ago' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Dashboard</h1>
        <p className="text-sm md:text-base text-[#7A94AD]">Overview of your workforce operations</p>
      </div>

      {/* Stat Cards - 4 cols → 2 cols tablet → 1 col mobile */}
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
          <div className="text-xs md:text-sm text-[#7A94AD]">Active Employees Today</div>
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

      {/* Weekly Schedule + Activity Feed - 2 cols → stacked on mobile/tablet */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 md:gap-6">
        {/* Weekly Schedule */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Weekly Schedule</h2>
          {/* Horizontal scroll on mobile */}
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Activity Feed</h2>
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-all cursor-pointer"
                style={{ animation: `slideInRight 0.3s ease-out ${idx * 0.1}s both` }}
              >
                <div 
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: activity.color + '20', color: activity.color }}
                >
                  {activity.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm text-[#F0EDE8]">
                    <span className="font-medium">{activity.name}</span>
                    <span className="text-[#7A94AD]"> {activity.action}</span>
                  </div>
                  <div className="text-[10px] md:text-xs text-[#7A94AD] mt-0.5">{activity.time}</div>
                </div>
                <i className={`${activity.icon} text-base md:text-lg flex-shrink-0`} style={{ color: activity.color }}></i>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marketplace - 3 cols → 2 tablet → 1 mobile */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">Open Shifts — Marketplace</h2>
          <button className="text-xs md:text-sm text-[#F5A623] hover:text-[#E09415] transition-colors whitespace-nowrap cursor-pointer">
            View all <i className="ri-arrow-right-line"></i>
          </button>
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
                  <div className="text-[10px] md:text-xs text-[#7A94AD]">posted {shift.posted}</div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-[#7A94AD]">Date</span>
                  <span className="text-xs md:text-sm font-medium text-[#F0EDE8]">{shift.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-[#7A94AD]">Time</span>
                  <span className="text-xs md:text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{shift.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-[#7A94AD]">Branch</span>
                  <span className="text-xs md:text-sm text-[#F0EDE8]">{shift.branch}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-[#7A94AD]">Hours</span>
                  <span className="bg-[#14B8A6]/20 text-[#14B8A6] text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                    {shift.hours}h
                  </span>
                </div>
              </div>
              <button className="w-full bg-[#14B8A6] hover:bg-[#12A594] text-[#0A1628] font-medium py-2 md:py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs md:text-sm">
                Take this shift
              </button>
            </div>
          ))}
        </div>
      </div>

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