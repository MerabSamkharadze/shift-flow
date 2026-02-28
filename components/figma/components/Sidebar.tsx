import { useState } from 'react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ activeView, setActiveView, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      window.location.href = '/';
    }, 300);
  };

  const navItems = [
    { section: 'OVERVIEW', items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
      { id: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line', badge: '4' }
    ]},
    { section: 'SCHEDULING', items: [
      { id: 'schedule-builder', label: 'Schedule Builder', icon: 'ri-calendar-line' },
      { id: 'shift-templates', label: 'Shift Templates', icon: 'ri-file-list-line' },
      { id: 'marketplace', label: 'Marketplace', icon: 'ri-store-line', badge: '6' }
    ]},
    { section: 'TEAM', items: [
      { id: 'employees', label: 'Employees', icon: 'ri-team-line' },
      { id: 'managers', label: 'Managers', icon: 'ri-user-star-line' },
      { id: 'branches', label: 'Branches', icon: 'ri-building-line' }
    ]},
    { section: 'ANALYTICS', items: [
      { id: 'monthly-report', label: 'Reports', icon: 'ri-bar-chart-line' },
      { id: 'hours-summary', label: 'Hours Summary', icon: 'ri-time-line' }
    ]},
    { section: 'SETTINGS', items: [
      { id: 'settings', label: 'Company', icon: 'ri-settings-line' },
      { id: 'billing', label: 'Billing', icon: 'ri-bank-card-line' }
    ]}
  ];

  return (
    <aside 
      className={`fixed lg:static top-0 left-0 h-full w-60 bg-[#0D1B2A] border-r border-[rgba(255,255,255,0.07)] flex flex-col z-50 transition-transform duration-300 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
            <i className="ri-calendar-check-line text-xl text-[#0A1628]"></i>
          </div>
          <div>
            <h1 className="text-[#F0EDE8] font-bold text-lg" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>ShiftFlow</h1>
            <p className="text-[#7A94AD] text-xs">Workforce Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3" role="menu">
        {navItems.map((section) => (
          <div key={section.section} className="mb-6">
            <h3 className="text-[#7A94AD] text-xs font-semibold px-3 mb-2 uppercase tracking-wider">
              {section.section}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ease-out relative group ${
                    activeView === item.id
                      ? 'text-[#F5A623] bg-[#F5A623]/10 border-l-3 border-[#F5A623]'
                      : 'text-[#F0EDE8] hover:bg-[#1A2E45] hover:text-[#F5A623]'
                  }`}
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                  role="menuitem"
                  aria-current={activeView === item.id ? 'page' : undefined}
                  aria-label={item.label}
                  tabIndex={0}
                >
                  <i className={`${item.icon} text-lg transition-transform duration-150 ${activeView === item.id ? '' : 'group-hover:scale-110'}`}></i>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="bg-[#F5A623] text-[#0A1628] text-xs font-bold px-2 py-0.5 rounded-full" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.07)] bg-gradient-to-t from-[#0A1628]/50 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4ECBA0] to-[#3BA080] flex items-center justify-center text-[#0A1628] font-bold text-sm">
            MK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#F0EDE8] text-sm font-medium truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Manager Kharatishvili
            </p>
            <span className="inline-block bg-[#4ECBA0]/20 text-[#4ECBA0] text-xs px-2 py-0.5 rounded-full">
              Manager
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[#F0EDE8] hover:bg-[#E8604C]/10 hover:text-[#E8604C] transition-all duration-150 ${
            isLoggingOut ? 'opacity-50 scale-95' : ''
          }`}
          style={{ fontFamily: 'DM Sans, sans-serif' }}
          aria-label="Logout"
          disabled={isLoggingOut}
        >
          <i className={`ri-logout-box-line text-lg ${isLoggingOut ? 'animate-spin' : ''}`}></i>
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
}