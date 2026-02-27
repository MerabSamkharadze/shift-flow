"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from './Sidebar';
import DashboardView from './DashboardView';
import ScheduleBuilder from './ScheduleBuilder';
import ShiftTemplates from './ShiftTemplates';
import Employees from './Employees';
import Managers from './Managers';
import Branches from './Branches';
import Marketplace from './Marketplace';
import MonthlyReport from './MonthlyReport';
import HoursSummary from './HoursSummary';
import Notifications from './Notifications';
import Settings from './Settings';
import Billing from './Billing';
import type { DashboardUser, ViewName } from '@/lib/types/dashboard';

interface DashboardClientProps {
  user: DashboardUser;
  initialView: ViewName;
  viewData: unknown;
}

export default function DashboardClient({ user, initialView, viewData }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = searchParams.get('view') ?? initialView;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // View change with URL navigation
  const handleViewChange = useCallback((newView: string) => {
    if (newView === activeView) return;
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(`/dashboard?view=${newView}`);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  }, [activeView, router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        user={user}
      />
      <main
        className={`flex-1 overflow-y-auto p-4 md:p-5 lg:p-7 pt-20 lg:pt-7 transition-opacity duration-200 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        role="main"
        aria-live="polite"
      >
        {activeView === 'dashboard' && <DashboardView data={viewData} />}
        {activeView === 'notifications' && <Notifications userId={user.id} />}
        {activeView === 'schedule-builder' && <ScheduleBuilder data={viewData} />}
        {activeView === 'shift-templates' && <ShiftTemplates data={viewData} />}
        {activeView === 'employees' && <Employees data={viewData} />}
        {activeView === 'managers' && <Managers data={viewData} userRole={user.role} />}
        {activeView === 'branches' && <Branches />}
        {activeView === 'marketplace' && <Marketplace data={viewData} />}
        {activeView === 'monthly-report' && <MonthlyReport data={viewData} companyId={user.company_id} />}
        {activeView === 'hours-summary' && <HoursSummary data={viewData} />}
        {activeView === 'settings' && <Settings />}
        {activeView === 'billing' && <Billing />}
      </main>
    </div>
  );
}
