
import { useState, useEffect } from 'react';

type NotificationType = 'shift-reminder' | 'swap-request' | 'swap-approved' | 'swap-declined' | 'schedule-update' | 'overtime-alert' | 'coverage-gap';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  avatar: string;
  avatarColor: string;
  actionable: boolean;
  from?: string;
  shiftDate?: string;
  shiftTime?: string;
  branch?: string;
}

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'swap-request',
    title: 'Swap Request',
    message: 'wants to swap their Jan 22 evening shift with your Jan 23 morning shift.',
    time: '5 min ago',
    timestamp: 1,
    read: false,
    avatar: 'AB',
    avatarColor: '#F5A623',
    actionable: true,
    from: 'Ana Beridze',
    shiftDate: 'Jan 22',
    shiftTime: '14:00 – 22:00',
    branch: 'Downtown',
  },
  {
    id: 'n2',
    type: 'shift-reminder',
    title: 'Upcoming Shift',
    message: 'Your shift starts in 2 hours at the Downtown branch.',
    time: '12 min ago',
    timestamp: 2,
    read: false,
    avatar: 'SF',
    avatarColor: '#14B8A6',
    actionable: false,
    shiftDate: 'Today',
    shiftTime: '14:00 – 22:00',
    branch: 'Downtown',
  },
  {
    id: 'n3',
    type: 'swap-approved',
    title: 'Swap Approved',
    message: 'Your swap request with Giorgi Maisuradze for Jan 20 has been approved by the manager.',
    time: '28 min ago',
    timestamp: 3,
    read: false,
    avatar: 'GM',
    avatarColor: '#4ECBA0',
    actionable: false,
    from: 'Giorgi Maisuradze',
    shiftDate: 'Jan 20',
    shiftTime: '09:00 – 17:00',
    branch: 'Westside',
  },
  {
    id: 'n4',
    type: 'overtime-alert',
    title: 'Overtime Alert',
    message: 'Luka Janelidze has exceeded 40 weekly hours. Currently at 43.5h this week.',
    time: '1 hour ago',
    timestamp: 4,
    read: false,
    avatar: 'LJ',
    avatarColor: '#E8604C',
    actionable: false,
    from: 'Luka Janelidze',
    branch: 'Eastside',
  },
  {
    id: 'n5',
    type: 'coverage-gap',
    title: 'Coverage Gap Detected',
    message: 'No employees scheduled for Westside branch on Jan 25, 06:00 – 14:00. Assign coverage now.',
    time: '1.5 hours ago',
    timestamp: 5,
    read: true,
    avatar: 'WS',
    avatarColor: '#F5A623',
    actionable: true,
    shiftDate: 'Jan 25',
    shiftTime: '06:00 – 14:00',
    branch: 'Westside',
  },
  {
    id: 'n6',
    type: 'swap-request',
    title: 'Swap Request',
    message: 'wants to swap their Jan 24 night shift with your Jan 25 afternoon shift.',
    time: '2 hours ago',
    timestamp: 6,
    read: true,
    avatar: 'TG',
    avatarColor: '#14B8A6',
    actionable: true,
    from: 'Tamara Gelashvili',
    shiftDate: 'Jan 24',
    shiftTime: '16:00 – 00:00',
    branch: 'Downtown',
  },
  {
    id: 'n7',
    type: 'schedule-update',
    title: 'Schedule Published',
    message: 'Nino Kharatishvili published the schedule for Week 4 (Jan 22 – Jan 28). Review your shifts.',
    time: '3 hours ago',
    timestamp: 7,
    read: true,
    avatar: 'NK',
    avatarColor: '#F5A623',
    actionable: false,
    from: 'Nino Kharatishvili',
  },
  {
    id: 'n8',
    type: 'shift-reminder',
    title: 'Shift Tomorrow',
    message: 'Reminder: You have an early morning shift tomorrow at Eastside branch.',
    time: '4 hours ago',
    timestamp: 8,
    read: true,
    avatar: 'SF',
    avatarColor: '#14B8A6',
    actionable: false,
    shiftDate: 'Tomorrow',
    shiftTime: '06:00 – 14:00',
    branch: 'Eastside',
  },
  {
    id: 'n9',
    type: 'swap-declined',
    title: 'Swap Declined',
    message: 'Your swap request with Mariam Beridze for Jan 19 was declined. Reason: scheduling conflict.',
    time: '5 hours ago',
    timestamp: 9,
    read: true,
    avatar: 'MB',
    avatarColor: '#E8604C',
    actionable: false,
    from: 'Mariam Beridze',
    shiftDate: 'Jan 19',
    shiftTime: '09:00 – 17:00',
    branch: 'Westside',
  },
  {
    id: 'n10',
    type: 'overtime-alert',
    title: 'Overtime Warning',
    message: 'Davit Gelashvili is approaching the 40h weekly limit. Currently at 38h with 1 shift remaining.',
    time: '6 hours ago',
    timestamp: 10,
    read: true,
    avatar: 'DG',
    avatarColor: '#F5A623',
    actionable: false,
    from: 'Davit Gelashvili',
    branch: 'Downtown',
  },
];

const typeConfig: Record<NotificationType, { icon: string; color: string; label: string }> = {
  'shift-reminder': { icon: 'ri-alarm-line', color: '#14B8A6', label: 'Reminder' },
  'swap-request': { icon: 'ri-swap-line', color: '#F5A623', label: 'Swap Request' },
  'swap-approved': { icon: 'ri-check-double-line', color: '#4ECBA0', label: 'Approved' },
  'swap-declined': { icon: 'ri-close-circle-line', color: '#E8604C', label: 'Declined' },
  'schedule-update': { icon: 'ri-calendar-check-line', color: '#14B8A6', label: 'Schedule' },
  'overtime-alert': { icon: 'ri-error-warning-line', color: '#E8604C', label: 'Overtime' },
  'coverage-gap': { icon: 'ri-user-unfollow-line', color: '#F5A623', label: 'Coverage' },
};

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'swaps', label: 'Swaps' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'alerts', label: 'Alerts' },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('#4ECBA0');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const swapPending = notifications.filter((n) => n.type === 'swap-request' && n.actionable).length;

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'swaps') return n.type.startsWith('swap');
    if (activeFilter === 'reminders') return n.type === 'shift-reminder' || n.type === 'schedule-update';
    if (activeFilter === 'alerts') return n.type === 'overtime-alert' || n.type === 'coverage-gap';
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToastMsg('All notifications marked as read', '#4ECBA0');
  };

  const handleSwapAction = (id: string, action: 'approve' | 'decline') => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            read: true,
            actionable: false,
            type: action === 'approve' ? 'swap-approved' as NotificationType : 'swap-declined' as NotificationType,
            title: action === 'approve' ? 'Swap Approved' : 'Swap Declined',
          };
        }
        return n;
      })
    );
    showToastMsg(
      action === 'approve' ? 'Swap request approved' : 'Swap request declined',
      action === 'approve' ? '#4ECBA0' : '#E8604C'
    );
  };

  const handleCoverageAction = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, actionable: false } : n))
    );
    showToastMsg('Redirecting to Schedule Builder...', '#14B8A6');
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToastMsg('Notification dismissed', '#7A94AD');
  };

  const showToastMsg = (msg: string, color: string) => {
    setToastMessage(msg);
    setToastColor(color);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    markAsRead(id);
  };

  const summaryCards = [
    { label: 'Unread', value: unreadCount, icon: 'ri-mail-unread-line', color: '#F5A623' },
    { label: 'Pending Swaps', value: swapPending, icon: 'ri-swap-line', color: '#14B8A6' },
    { label: 'Alerts', value: notifications.filter((n) => n.type === 'overtime-alert' || n.type === 'coverage-gap').length, icon: 'ri-error-warning-line', color: '#E8604C' },
    { label: 'Today', value: notifications.filter((n) => n.timestamp <= 4).length, icon: 'ri-calendar-todo-line', color: '#4ECBA0' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Notifications</h1>
          <p className="text-sm md:text-base text-[#7A94AD]">Shift reminders, swap alerts &amp; team updates</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 md:px-5 py-2.5 bg-[#142236] border border-white/[0.07] hover:border-[#F5A623]/30 text-[#F0EDE8] font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer text-sm"
          >
            <i className="ri-check-double-line mr-2 text-[#F5A623]"></i>Mark all read
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {summaryCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.07}s both` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: card.color + '15' }}
              >
                <i className={`${card.icon} text-lg md:text-xl`} style={{ color: card.color }}></i>
              </div>
              {card.value > 0 && card.label === 'Unread' && (
                <span className="bg-[#F5A623] text-[#0A1628] text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                  New
                </span>
              )}
            </div>
            <div className="font-['JetBrains_Mono'] text-3xl md:text-4xl font-semibold text-[#F0EDE8] mb-1">{card.value}</div>
            <div className="text-xs md:text-sm text-[#7A94AD]">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => {
          const count =
            tab.id === 'all'
              ? notifications.length
              : tab.id === 'unread'
              ? unreadCount
              : tab.id === 'swaps'
              ? notifications.filter((n) => n.type.startsWith('swap')).length
              : tab.id === 'reminders'
              ? notifications.filter((n) => n.type === 'shift-reminder' || n.type === 'schedule-update').length
              : notifications.filter((n) => n.type === 'overtime-alert' || n.type === 'coverage-gap').length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#F5A623] text-[#0A1628]'
                  : 'bg-[#142236] text-[#7A94AD] hover:text-[#F0EDE8] border border-white/[0.07]'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${activeFilter === tab.id ? 'text-[#0A1628]/70' : 'text-[#7A94AD]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-10 md:p-14 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-notification-off-line text-2xl text-[#F5A623]"></i>
            </div>
            <p className="text-[#F0EDE8] font-medium mb-1">No notifications here</p>
            <p className="text-sm text-[#7A94AD]">You&apos;re all caught up!</p>
          </div>
        )}

        {filtered.map((notif, idx) => {
          const config = typeConfig[notif.type];
          const isExpanded = expandedId === notif.id;

          return (
            <div
              key={notif.id}
              className={`bg-[#142236] border rounded-xl overflow-hidden transition-all duration-200 hover:bg-[#1A2E45] ${
                !notif.read ? 'border-[#F5A623]/25' : 'border-white/[0.07]'
              }`}
              style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.04}s both` }}
            >
              {/* Main Row */}
              <div
                className="flex items-start gap-3 md:gap-4 p-4 md:p-5 cursor-pointer"
                onClick={() => toggleExpand(notif.id)}
              >
                {/* Unread dot */}
                <div className="flex flex-col items-center pt-1 flex-shrink-0">
                  {!notif.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F5A623] mb-2 animate-pulse"></div>
                  )}
                  {notif.read && <div className="w-2.5 h-2.5 mb-2"></div>}
                  <div
                    className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: notif.avatarColor + '20', color: notif.avatarColor }}
                  >
                    {notif.avatar}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap"
                      style={{ backgroundColor: config.color + '15', color: config.color }}
                    >
                      <i className={`${config.icon} text-xs`}></i>
                      {config.label}
                    </span>
                    <span className="text-[10px] md:text-xs text-[#7A94AD]">{notif.time}</span>
                  </div>
                  <h3 className={`text-sm md:text-base font-medium mb-0.5 ${!notif.read ? 'text-[#F0EDE8]' : 'text-[#F0EDE8]/80'}`}>
                    {notif.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#7A94AD] leading-relaxed line-clamp-2">
                    {notif.from && <span className="text-[#F0EDE8] font-medium">{notif.from} </span>}
                    {notif.message}
                  </p>
                </div>

                {/* Expand arrow */}
                <div className="flex-shrink-0 pt-1">
                  <i className={`ri-arrow-down-s-line text-lg text-[#7A94AD] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div
                  className="px-4 md:px-5 pb-4 md:pb-5 pt-0"
                  style={{ animation: 'expandIn 0.2s ease-out both' }}
                >
                  <div className="border-t border-white/[0.07] pt-4 mt-1">
                    {/* Shift details */}
                    {(notif.shiftDate || notif.shiftTime || notif.branch) && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        {notif.shiftDate && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#0A1628] rounded-lg">
                            <i className="ri-calendar-line text-sm text-[#F5A623]"></i>
                            <span className="text-xs md:text-sm text-[#F0EDE8] font-['JetBrains_Mono']">{notif.shiftDate}</span>
                          </div>
                        )}
                        {notif.shiftTime && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#0A1628] rounded-lg">
                            <i className="ri-time-line text-sm text-[#14B8A6]"></i>
                            <span className="text-xs md:text-sm text-[#F0EDE8] font-['JetBrains_Mono']">{notif.shiftTime}</span>
                          </div>
                        )}
                        {notif.branch && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#0A1628] rounded-lg">
                            <i className="ri-building-line text-sm text-[#4ECBA0]"></i>
                            <span className="text-xs md:text-sm text-[#F0EDE8]">{notif.branch}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {notif.type === 'swap-request' && notif.actionable && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSwapAction(notif.id, 'approve'); }}
                            className="px-4 py-2 bg-[#4ECBA0] hover:bg-[#3BA080] text-[#0A1628] text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <i className="ri-check-line mr-1.5"></i>Approve Swap
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSwapAction(notif.id, 'decline'); }}
                            className="px-4 py-2 bg-[#E8604C]/15 hover:bg-[#E8604C]/25 text-[#E8604C] text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <i className="ri-close-line mr-1.5"></i>Decline
                          </button>
                        </>
                      )}
                      {notif.type === 'coverage-gap' && notif.actionable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCoverageAction(notif.id); }}
                          className="px-4 py-2 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-calendar-line mr-1.5"></i>Assign Coverage
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                        className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-[#7A94AD] hover:text-[#F0EDE8] text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-delete-bin-line mr-1.5"></i>Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {showToast && (
        <div
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5 bg-[#142236] border rounded-xl shadow-2xl max-w-[calc(100vw-2rem)]"
          style={{ borderColor: toastColor + '40', animation: 'toastIn 0.3s ease-out both' }}
        >
          <div
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full flex-shrink-0"
            style={{ backgroundColor: toastColor + '15' }}
          >
            <i className="ri-check-line" style={{ color: toastColor }}></i>
          </div>
          <span className="text-xs md:text-sm text-[#F0EDE8]">{toastMessage}</span>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expandIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 300px; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
