
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ScheduleBuilder from './components/ScheduleBuilder';
import ShiftTemplates from './components/ShiftTemplates';
import Employees from './components/Employees';
import Managers from './components/Managers';
import Branches from './components/Branches';
import Marketplace from './components/Marketplace';
import MonthlyReport from './components/MonthlyReport';
import HoursSummary from './components/HoursSummary';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import Billing from './components/Billing';

export default function DashboardPage() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // View fade transition
  const handleViewChange = (newView: string) => {
    if (newView === activeView) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveView(newView);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close sidebar on mobile
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-[#0A1628] overflow-hidden">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#142236] border border-[rgba(255,255,255,0.07)] rounded-lg flex items-center justify-center text-[#F0EDE8] hover:bg-[#1A2E45] hover:border-[#F5A623] transition-all duration-150"
        aria-label="Toggle menu"
        aria-expanded={sidebarOpen}
      >
        <i className={`${sidebarOpen ? 'ri-close-line' : 'ri-menu-line'} text-xl transition-transform duration-150 ${sidebarOpen ? 'rotate-90' : ''}`}></i>
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <Sidebar 
        activeView={activeView} 
        setActiveView={handleViewChange}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main 
        className={`flex-1 overflow-y-auto p-4 md:p-5 lg:p-7 pt-20 lg:pt-7 transition-opacity duration-200 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        role="main"
        aria-live="polite"
      >
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'notifications' && <Notifications />}
        {activeView === 'schedule-builder' && <ScheduleBuilder />}
        {activeView === 'shift-templates' && <ShiftTemplates />}
        {activeView === 'employees' && <Employees />}
        {activeView === 'managers' && <Managers />}
        {activeView === 'branches' && <Branches />}
        {activeView === 'marketplace' && <Marketplace />}
        {activeView === 'monthly-report' && <MonthlyReport />}
        {activeView === 'hours-summary' && <HoursSummary />}
        {activeView === 'settings' && <Settings />}
        {activeView === 'billing' && <Billing />}
      </main>
    </div>
  );
}
