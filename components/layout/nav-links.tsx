"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: string; // Remixicon class
  exact?: boolean;
  badge?: string;
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const OWNER_NAV: NavSection[] = [
  {
    section: "OVERVIEW",
    items: [
      { href: "/owner", label: "Dashboard", icon: "ri-dashboard-line", exact: true },
    ],
  },
  {
    section: "TEAM",
    items: [
      { href: "/owner/managers", label: "Managers", icon: "ri-user-star-line" },
      { href: "/owner/branches", label: "Branches", icon: "ri-building-line" },
    ],
  },
  {
    section: "ANALYTICS",
    items: [
      { href: "/owner/reports", label: "Reports", icon: "ri-bar-chart-line" },
      { href: "/owner/hours", label: "Hours Summary", icon: "ri-time-line" },
    ],
  },
  {
    section: "SETTINGS",
    items: [
      { href: "/owner/settings", label: "Company", icon: "ri-settings-line" },
      { href: "/owner/billing", label: "Billing", icon: "ri-bank-card-line" },
    ],
  },
];

const MANAGER_NAV: NavSection[] = [
  {
    section: "OVERVIEW",
    items: [
      { href: "/manager", label: "Dashboard", icon: "ri-dashboard-line", exact: true },
      { href: "/manager/notifications", label: "Notifications", icon: "ri-notification-3-line" },
    ],
  },
  {
    section: "SCHEDULING",
    items: [
      { href: "/manager/schedule", label: "Schedule Builder", icon: "ri-calendar-line" },
      { href: "/manager/templates", label: "Shift Templates", icon: "ri-file-list-line" },
      { href: "/manager/marketplace", label: "Marketplace", icon: "ri-store-line" },
    ],
  },
  {
    section: "TEAM",
    items: [
      { href: "/manager/employees", label: "Employees", icon: "ri-team-line" },
    ],
  },
  {
    section: "ANALYTICS",
    items: [
      { href: "/manager/reports", label: "Reports", icon: "ri-bar-chart-line" },
      { href: "/manager/hours", label: "Hours Summary", icon: "ri-time-line" },
    ],
  },
];

const EMPLOYEE_NAV: NavSection[] = [
  {
    section: "OVERVIEW",
    items: [
      { href: "/employee", label: "My Schedule", icon: "ri-calendar-line", exact: true },
      { href: "/employee/team", label: "Team", icon: "ri-team-line" },
      { href: "/employee/swaps", label: "Swap Requests", icon: "ri-swap-line" },
    ],
  },
];

const NAV_BY_ROLE: Record<UserRole, NavSection[]> = {
  owner: OWNER_NAV,
  manager: MANAGER_NAV,
  employee: EMPLOYEE_NAV,
};

export function NavLinks({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = NAV_BY_ROLE[role];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.section}>
          <h3 className="text-[#7A94AD] text-xs font-semibold px-3 mb-2 uppercase tracking-wider">
            {section.section}
          </h3>
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ease-out relative group",
                    isActive
                      ? "text-[#F5A623] bg-[#F5A623]/10 border-l-[3px] border-[#F5A623]"
                      : "text-[#F0EDE8] hover:bg-[#1A2E45] hover:text-[#F5A623]"
                  )}
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  <i
                    className={cn(
                      item.icon,
                      "text-lg transition-transform duration-150",
                      !isActive && "group-hover:scale-110"
                    )}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className="bg-[#F5A623] text-[#0A1628] text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
