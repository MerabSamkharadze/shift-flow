"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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

// Views that need server-side data — navigating to these requires router.push
const SERVER_VIEWS = new Set<string>([
  'dashboard', 'employees', 'schedule-builder', 'shift-templates',
  'marketplace', 'monthly-report', 'hours-summary', 'managers',
]);

interface DashboardClientProps {
  user: DashboardUser;
  initialView: ViewName;
  viewData: unknown;
}

export default function DashboardClient({ user, initialView, viewData }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The URL-driven view (from server) or client-override for non-data views
  const urlView = searchParams.get('view') ?? initialView;
  const [clientView, setClientView] = useState<string | null>(null);
  const activeView = clientView ?? urlView;

  // Reset client override when URL changes (server navigation completed)
  useEffect(() => {
    setClientView(null);
  }, [urlView]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleViewChange = useCallback((newView: string) => {
    if (newView === activeView) return;

    if (SERVER_VIEWS.has(newView)) {
      // Needs server data — do a real navigation
      router.push(`/dashboard?view=${newView}`);
    } else {
      // Client-only view (notifications, settings, billing, branches)
      // Switch instantly without server roundtrip
      setClientView(newView);
      // Update URL without triggering server fetch
      window.history.pushState(null, '', `/dashboard?view=${newView}`);
    }
  }, [activeView, router]);

  // Handle browser back/forward for client-side view changes
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') ?? initialView;
      if (!SERVER_VIEWS.has(view)) {
        setClientView(view);
      } else {
        setClientView(null);
        // Let Next.js handle server data views
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialView]);

  // Keyboard: Escape closes mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const viewContent = useMemo(() => {
    switch (activeView) {
      case 'dashboard': return <DashboardView data={viewData} />;
      case 'notifications': return <Notifications userId={user.id} />;
      case 'schedule-builder': return <ScheduleBuilder data={viewData} />;
      case 'shift-templates': return <ShiftTemplates data={viewData} />;
      case 'employees': return <Employees data={viewData} />;
      case 'managers': return <Managers data={viewData} userRole={user.role} />;
      case 'branches': return <Branches />;
      case 'marketplace': return <Marketplace data={viewData} />;
      case 'monthly-report': return <MonthlyReport data={viewData} companyId={user.company_id} />;
      case 'hours-summary': return <HoursSummary data={viewData} />;
      case 'settings': return <Settings />;
      case 'billing': return <Billing />;
      default: return <DashboardView data={viewData} />;
    }
  }, [activeView, viewData, user]);

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
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        activeView={activeView}
        setActiveView={handleViewChange}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
      />
      <main
        className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-7 pt-20 lg:pt-7"
        role="main"
      >
        {viewContent}
      </main>
    </div>
  );
}
