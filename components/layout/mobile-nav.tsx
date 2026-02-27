"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavLinks } from "./nav-links";
import { LogoutButton } from "./logout-button";
import { ModeToggle } from "@/components/mode-toggle";
import type { UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Owner",
  manager: "Manager",
  employee: "Employee",
};

const ROLE_COLOR: Record<UserRole, string> = {
  owner: "from-[#F5A623] to-[#E09415]",
  manager: "from-[#4ECBA0] to-[#3BA080]",
  employee: "from-[#14B8A6] to-[#0D9488]",
};

type Props = {
  role: UserRole;
  firstName: string;
  lastName: string;
  userId: string;
};

export function MobileNav({ role, firstName, lastName }: Props) {
  const [open, setOpen] = useState(false);

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent dark:hover:bg-[#1A2E45] dark:hover:border-[#F5A623] transition-all duration-150 dark:text-[#F0EDE8]"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-60 flex-col p-0 dark:bg-[#0D1B2A] dark:border-white/[0.07]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-border dark:border-white/[0.07]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
            </div>
            <div>
              <h1 className="text-foreground dark:text-[#F0EDE8] font-bold text-lg font-['Syne']">ShiftFlow</h1>
              <p className="text-muted-foreground dark:text-[#7A94AD] text-xs">Workforce Manager</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div onClick={() => setOpen(false)}>
              <NavLinks role={role} />
            </div>
          </nav>

          {/* User section */}
          <div className="shrink-0 border-t border-border dark:border-white/[0.07] p-4 dark:bg-gradient-to-t dark:from-[#0A1628]/50 dark:to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${ROLE_COLOR[role]} text-[#0A1628] text-xs font-bold`}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium dark:text-[#F0EDE8]">
                  {firstName} {lastName}
                </p>
                <span className="inline-block bg-[#4ECBA0]/20 text-[#4ECBA0] text-xs px-2 py-0.5 rounded-full">
                  {ROLE_LABEL[role]}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <ModeToggle />
            </div>
            <LogoutButton />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
