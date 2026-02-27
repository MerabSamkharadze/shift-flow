"use client";

import type { MarketplaceViewData } from '@/lib/types/dashboard';

interface MarketplaceProps {
  data: unknown;
}

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function fmtDate(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
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

function shiftHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, Math.round((eh * 60 + em - (sh * 60 + sm)) / 60));
}

export default function Marketplace({ data }: MarketplaceProps) {
  const d = data as MarketplaceViewData | null;

  const swaps = (d?.swaps ?? []).map((s) => {
    const statusMap: Record<string, string> = {
      pending_employee: 'available',
      accepted_by_employee: 'pending',
      approved: 'claimed',
    };
    return {
      ...s,
      displayStatus: statusMap[s.status] ?? s.status,
      formattedDate: fmtDate(s.shiftDate),
      timeRange: s.shiftStart && s.shiftEnd ? `${fmtTime(s.shiftStart)}-${fmtTime(s.shiftEnd)}` : '',
      hours: shiftHours(s.shiftStart, s.shiftEnd),
      posted: getTimeAgo(s.createdAt),
      avatar: s.requesterName.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase(),
    };
  });

  const getStatusBadge = (swap: typeof swaps[0]) => {
    if (swap.displayStatus === 'claimed') {
      return (
        <div className="absolute top-3 right-3 md:top-4 md:right-4 px-2.5 md:px-3 py-1 bg-[#4ECBA0] text-[#0A1628] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
          Claimed{swap.recipientName ? ` by ${swap.recipientName.split(' ')[0]}` : ''}
        </div>
      );
    }
    if (swap.displayStatus === 'pending') {
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
          <p className="text-sm md:text-base text-[#7A94AD]">Swap Requests — All Groups</p>
        </div>
      </div>

      {swaps.length === 0 ? (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-10 md:p-14 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
            <i className="ri-store-line text-2xl text-[#F5A623]"></i>
          </div>
          <p className="text-[#F0EDE8] font-medium mb-1">No swap requests</p>
          <p className="text-sm text-[#7A94AD]">When employees create swap requests, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {swaps.map((swap, idx) => (
            <div
              key={swap.id}
              className={`relative bg-[#142236] border rounded-xl p-5 md:p-6 hover:bg-[#1A2E45] hover:scale-[1.02] transition-all duration-200 cursor-pointer ${
                swap.displayStatus === 'available'
                  ? 'border-[#F5A623]/20 hover:border-[#F5A623]/40'
                  : 'border-white/[0.07]'
              }`}
              style={{ animation: `fadeInScale 0.3s ease-out ${idx * 0.08}s both` }}
            >
              {getStatusBadge(swap)}

              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center text-[#0A1628] text-xs md:text-sm font-semibold flex-shrink-0">
                  {swap.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm md:text-base font-semibold text-[#F0EDE8] mb-0.5 truncate">{swap.requesterName}</div>
                  <div className="text-[11px] md:text-xs text-[#7A94AD]">{swap.posted}</div>
                </div>
              </div>

              <div className="space-y-2.5 md:space-y-3 mb-4 md:mb-5">
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2 text-[#7A94AD]">
                    <i className="ri-calendar-line text-sm md:text-base"></i>
                    <span className="text-xs md:text-sm">Date</span>
                  </div>
                  <span className="text-xs md:text-sm font-medium text-[#F0EDE8]">{swap.formattedDate}</span>
                </div>

                {swap.timeRange && (
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2 text-[#7A94AD]">
                      <i className="ri-time-line text-sm md:text-base"></i>
                      <span className="text-xs md:text-sm">Time</span>
                    </div>
                    <span className="text-xs md:text-sm font-['JetBrains_Mono'] font-medium text-[#F0EDE8]">{swap.timeRange}</span>
                  </div>
                )}

                {swap.groupName && (
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2 text-[#7A94AD]">
                      <i className="ri-building-line text-sm md:text-base"></i>
                      <span className="text-xs md:text-sm">Group</span>
                    </div>
                    <span className="text-xs md:text-sm font-medium text-[#F0EDE8]">{swap.groupName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-[#7A94AD]">
                    <i className="ri-hourglass-line text-sm md:text-base"></i>
                    <span className="text-xs md:text-sm">Hours</span>
                  </div>
                  <span className="bg-[#14B8A6]/20 text-[#14B8A6] text-[10px] md:text-xs font-semibold px-2.5 md:px-3 py-1 rounded-full whitespace-nowrap">
                    {swap.hours}h
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#7A94AD]">
                Type: <span className="text-[#F0EDE8]">{swap.type === 'public' ? 'Public' : 'Direct'}</span>
                {swap.recipientName && (
                  <> &middot; To: <span className="text-[#F0EDE8]">{swap.recipientName}</span></>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
