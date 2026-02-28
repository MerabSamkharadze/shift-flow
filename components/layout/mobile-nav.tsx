"use client";

import { useState } from "react";
import { NavLinks } from "./nav-links";
import { LogoutButton } from "./logout-button";
import type { UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Owner",
  manager: "Manager",
  employee: "Employee",
};

const ROLE_COLOR: Record<UserRole, { from: string; to: string; text: string; bg: string }> = {
  owner: { from: "from-[#F5A623]", to: "to-[#E09415]", text: "text-[#F5A623]", bg: "bg-[#F5A623]/20" },
  manager: { from: "from-[#4ECBA0]", to: "to-[#3BA080]", text: "text-[#4ECBA0]", bg: "bg-[#4ECBA0]/20" },
  employee: { from: "from-[#14B8A6]", to: "to-[#0E8A7A]", text: "text-[#14B8A6]", bg: "bg-[#14B8A6]/20" },
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
  const colors = ROLE_COLOR[role];

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#142236] border border-[rgba(255,255,255,0.07)] rounded-lg flex items-center justify-center text-[#F0EDE8] hover:bg-[#1A2E45] hover:border-[#F5A623] transition-all duration-150"
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        <i
          className={`${open ? "ri-close-line" : "ri-menu-line"} text-xl transition-transform duration-150 ${open ? "rotate-90" : ""}`}
        />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-60 bg-[#0D1B2A] border-r border-[rgba(255,255,255,0.07)] flex flex-col z-50 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Logo */}
        <div className="p-6 border-b border-[rgba(255,255,255,0.07)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
              <i className="ri-calendar-check-line text-xl text-[#0A1628]" />
            </div>
            <div>
              <h1
                className="text-[#F0EDE8] font-bold text-lg"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                ShiftFlow
              </h1>
              <p className="text-[#7A94AD] text-xs">Workforce Manager</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" role="menu">
          <NavLinks role={role} onNavigate={() => setOpen(false)} />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.07)] bg-gradient-to-t from-[#0A1628]/50 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center text-[#0A1628] font-bold text-sm`}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[#F0EDE8] text-sm font-medium truncate"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {firstName} {lastName}
              </p>
              <span className={`inline-block ${colors.bg} ${colors.text} text-xs px-2 py-0.5 rounded-full`}>
                {ROLE_LABEL[role]}
              </span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
