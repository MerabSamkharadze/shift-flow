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

const NAV: Record<UserRole, NavItem[]> = {
  owner: [
    { href: "/owner", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/owner/managers", label: "Managers", icon: Users2 },
  ],
  manager: [
    { href: "/manager", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/manager/groups", label: "Groups", icon: Layers },
    { href: "/manager/employees", label: "Employees", icon: Users },
    { href: "/manager/swaps", label: "Swap Requests", icon: ArrowLeftRight },
  ],
  employee: [
    { href: "/employee", label: "My Schedule", icon: Calendar, exact: true },
    { href: "/employee/swaps", label: "Swap Requests", icon: ArrowLeftRight },
  ],
};

export function NavLinks({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV[role];

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
