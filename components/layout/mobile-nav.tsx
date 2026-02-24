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
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          {/* Logo */}
          <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
            <span className="text-base font-bold tracking-tight">ShiftFlow</span>
          </div>

          {/* Nav links — close sheet on any link click */}
          <nav className="flex-1 overflow-y-auto p-3">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Menu
            </p>
            <div onClick={() => setOpen(false)}>
              <NavLinks role={role} />
            </div>
          </nav>

          {/* User section */}
          <div className="shrink-0 border-t border-border p-3 space-y-1">
            <div className="flex items-center gap-3 rounded-md px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {firstName} {lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {ROLE_LABEL[role]}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-1">
              <ModeToggle />
            </div>
            <LogoutButton />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
