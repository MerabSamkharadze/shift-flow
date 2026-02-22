"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, ArrowLeftRight, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/employee", label: "Schedule", icon: Calendar, exact: true },
  { href: "/employee/team", label: "Team", icon: Users, exact: false },
  { href: "/employee/swaps", label: "Swaps", icon: ArrowLeftRight, exact: false },
  { href: "/employee/account", label: "Account", icon: CircleUser, exact: false },
] as const;

export function EmployeeBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden safe-area-pb">
      <div className="flex">
        {ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[60px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span
                className={cn(
                  "text-[10px]",
                  isActive ? "font-semibold" : "font-medium",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
