"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Users2,
  Layers,
  ArrowLeftRight,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV: Record<UserRole, NavSection[]> = {
  owner: [
    {
      title: "OVERVIEW",
      items: [
        { href: "/owner", label: "Dashboard", icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: "TEAM",
      items: [
        { href: "/owner/managers", label: "Managers", icon: Users2 },
      ],
    },
  ],
  manager: [
    {
      title: "OVERVIEW",
      items: [
        { href: "/manager", label: "Dashboard", icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: "SCHEDULING",
      items: [
        { href: "/manager/schedule", label: "Schedule Builder", icon: Calendar },
        { href: "/manager/swaps", label: "Swap Requests", icon: ArrowLeftRight },
      ],
    },
    {
      title: "TEAM",
      items: [
        { href: "/manager/groups", label: "Groups", icon: Layers },
        { href: "/manager/employees", label: "Employees", icon: Users },
      ],
    },
  ],
  employee: [
    {
      title: "OVERVIEW",
      items: [
        { href: "/employee", label: "My Schedule", icon: Calendar, exact: true },
      ],
    },
    {
      title: "TEAM",
      items: [
        { href: "/employee/team", label: "Team", icon: Users },
        { href: "/employee/swaps", label: "Swap Requests", icon: ArrowLeftRight },
      ],
    },
  ],
};

export function NavLinks({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const sections = NAV[role];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-muted-foreground dark:text-[#7A94AD] text-[11px] font-semibold px-3 mb-2 uppercase tracking-wider">
            {section.title}
          </h3>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 relative group",
                      isActive
                        ? "bg-primary text-primary-foreground dark:text-[#F5A623] dark:bg-[#F5A623]/10 dark:border-l-[3px] dark:border-[#F5A623]"
                        : "text-muted-foreground hover:bg-accent dark:text-[#F0EDE8] dark:hover:bg-[#1A2E45] dark:hover:text-[#F5A623]",
                    )}
                  >
                    <item.icon size={18} strokeWidth={2} className={cn(
                      "transition-transform duration-150",
                      !isActive && "group-hover:scale-110"
                    )} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
