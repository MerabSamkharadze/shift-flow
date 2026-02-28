
export default function Marketplace() {
  const openShifts = [
    { 
      poster: 'Ana Beridze', 
      avatar: 'AB', 
      date: 'Jan 22, 2025', 
      time: '14:00-22:00', 
      branch: 'Downtown', 
      hours: 8, 
      posted: '2 hours ago',
      status: 'available'
    },
    { 
      poster: 'Luka Janelidze', 
      avatar: 'LJ', 
      date: 'Jan 23, 2025', 
      time: '09:00-17:00', 
      branch: 'Westside', 
      hours: 8, 
      posted: '5 hours ago',
      status: 'pending'
    },
    { 
      poster: 'Tamara Gelashvili', 
      avatar: 'TG', 
      date: 'Jan 24, 2025', 
      time: '16:00-00:00', 
      branch: 'Downtown', 
      hours: 8, 
      posted: '1 day ago',
      status: 'claimed',
      claimedBy: 'Nino'
    },
    { 
      poster: 'Giorgi Maisuradze', 
      avatar: 'GM', 
      date: 'Jan 25, 2025', 
      time: '08:00-16:00', 
      branch: 'Eastside', 
      hours: 8, 
      posted: '1 day ago',
      status: 'available'
    },
    { 
      poster: 'Mariam Beridze', 
      avatar: 'MB', 
      date: 'Jan 26, 2025', 
      time: '14:00-22:00', 
      branch: 'Westside', 
      hours: 8, 
      posted: '2 days ago',
      status: 'available'
    },
    { 
      poster: 'Davit Gelashvili', 
      avatar: 'DG', 
      date: 'Jan 27, 2025', 
      time: '10:00-18:00', 
      branch: 'Downtown', 
      hours: 8, 
      posted: '2 days ago',
      status: 'pending'
    }
  ];

  const getStatusBadge = (shift: any) => {
    if (shift.status === 'claimed') {
      return (
        <div className="absolute top-3 right-3 md:top-4 md:right-4 px-2.5 md:px-3 py-1 bg-[#4ECBA0] text-[#0A1628] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
          Claimed by {shift.claimedBy}
        </div>
      );
    }
    if (shift.status === 'pending') {
      return (
        <div className="absolute top-3 right-3 md:top-4 md:right-4 px-2.5 md:px-3 py-1 bg-[#F5A623] text-[#0A1628] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
          Awaiting Approval
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Marketplace</h1>
          <p className="text-sm md:text-base text-[#7A94AD]">Open Shifts — Available to Claim</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
          <select className="px-3 md:px-4 py-2 md:py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-xs md:text-sm cursor-pointer">
            <option>All Dates</option>
            <option>This Week</option>
            <option>Next Week</option>
            <option>This Month</option>
          </select>
          <select className="px-3 md:px-4 py-2 md:py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-xs md:text-sm cursor-pointer">
            <option>All Branches</option>
            <option>Downtown</option>
            <option>Westside</option>
            <option>Eastside</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {openShifts.map((shift, idx) => (
          <div
            key={idx}
            className={`relative bg-[#142236] border rounded-xl p-5 md:p-6 hover:bg-[#1A2E45] hover:scale-[1.02] transition-all duration-200 cursor-pointer ${
              shift.status === 'available' 
                ? 'border-[#F5A623]/20 hover:border-[#F5A623]/40' 
                : 'border-white/[0.07]'
            }`}
            style={{
              animation: `fadeInScale 0.3s ease-out ${idx * 0.08}s both`
            }}
          >
            {getStatusBadge(shift)}

            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center text-[#0A1628] text-xs md:text-sm font-semibold flex-shrink-0">
                {shift.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm md:text-base font-semibold text-[#F0EDE8] mb-0.5 truncate">{shift.poster}</div>
                <div className="text-[11px] md:text-xs text-[#7A94AD]">posted {shift.posted}</div>
              </div>
            </div>

            <div className="space-y-2.5 md:space-y-3 mb-4 md:mb-5">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <div className="flex items-center gap-2 text-[#7A94AD]">
                  <i className="ri-calendar-line text-sm md:text-base"></i>
                  <span className="text-xs md:text-sm">Date</span>
                </div>
                <span className="text-xs md:text-sm font-medium text-[#F0EDE8]">{shift.date}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <div className="flex items-center gap-2 text-[#7A94AD]">
                  <i className="ri-time-line text-sm md:text-base"></i>
                  <span className="text-xs md:text-sm">Time</span>
                </div>
                <span className="text-xs md:text-sm font-['JetBrains_Mono'] font-medium text-[#F0EDE8]">{shift.time}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <div className="flex items-center gap-2 text-[#7A94AD]">
                  <i className="ri-building-line text-sm md:text-base"></i>
                  <span className="text-xs md:text-sm">Branch</span>
                </div>
                <span className="text-xs md:text-sm font-medium text-[#F0EDE8]">{shift.branch}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-[#7A94AD]">
                  <i className="ri-hourglass-line text-sm md:text-base"></i>
                  <span className="text-xs md:text-sm">Hours</span>
                </div>
                <span className="bg-[#14B8A6]/20 text-[#14B8A6] text-[10px] md:text-xs font-semibold px-2.5 md:px-3 py-1 rounded-full whitespace-nowrap">
                  {shift.hours}h
                </span>
              </div>
            </div>

            {shift.status === 'available' && (
              <button className="w-full bg-[#14B8A6] hover:bg-[#12A594] text-[#0A1628] font-medium py-2.5 md:py-3 rounded-lg transition-all hover:scale-[1.02] whitespace-nowrap cursor-pointer text-sm md:text-base">
                <i className="ri-hand-coin-line mr-2"></i>Claim Shift
              </button>
            )}

            {shift.status === 'pending' && (
              <button className="w-full bg-[#F5A623]/10 text-[#F5A623] font-medium py-2.5 md:py-3 rounded-lg cursor-not-allowed whitespace-nowrap text-sm md:text-base" disabled>
                <i className="ri-time-line mr-2"></i>Pending Approval
              </button>
            )}

            {shift.status === 'claimed' && (
              <button className="w-full bg-[#4ECBA0]/10 text-[#4ECBA0] font-medium py-2.5 md:py-3 rounded-lg cursor-not-allowed whitespace-nowrap text-sm md:text-base" disabled>
                <i className="ri-check-line mr-2"></i>Already Claimed
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
