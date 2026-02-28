"use client";

import { useState } from "react";

type Branch = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  managerId: string;
  managerName: string;
  employeeCount: number;
};

const STATUS_CONFIG = {
  active: { label: "Active", dot: "bg-[#4ECBA0] animate-pulse", bg: "bg-[#4ECBA0]/10", text: "text-[#4ECBA0]" },
  inactive: { label: "Inactive", dot: "bg-[#7A94AD]", bg: "bg-[#7A94AD]/10", text: "text-[#7A94AD]" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BranchesClient({ branches }: { branches: Branch[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const counts = {
    all: branches.length,
    active: branches.filter((b) => b.isActive).length,
    inactive: branches.filter((b) => !b.isActive).length,
  };

  const totalEmployees = branches.reduce((s, b) => s + b.employeeCount, 0);

  const filters: { id: "all" | "active" | "inactive"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  const filtered = branches.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.managerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      activeFilter === "all" ||
      (activeFilter === "active" && b.isActive) ||
      (activeFilter === "inactive" && !b.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
              <i className="ri-building-line text-[#4ECBA0]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Total Branches</span>
          </div>
          <div className="text-2xl font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {counts.all}
          </div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
              <i className="ri-team-line text-[#F5A623]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Total Employees</span>
          </div>
          <div className="text-2xl font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {totalEmployees}
          </div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
              <i className="ri-checkbox-circle-line text-[#4ECBA0]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Active</span>
          </div>
          <div className="text-2xl font-bold text-[#4ECBA0]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {counts.active}
          </div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7A94AD]/10">
              <i className="ri-close-circle-line text-[#7A94AD]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Inactive</span>
          </div>
          <div className="text-2xl font-bold text-[#7A94AD]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {counts.inactive}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD] text-lg" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 md:py-3 bg-[#142236] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? "bg-[#F5A623] text-[#0A1628]"
                  : "bg-[#142236] text-[#7A94AD] hover:text-[#F0EDE8] border border-white/[0.07]"
              }`}
            >
              {filter.label}
              <span className={`ml-1.5 md:ml-2 ${activeFilter === filter.id ? "text-[#0A1628]" : "text-[#7A94AD]"}`}>
                {counts[filter.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((branch) => {
          const status = branch.isActive ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
          return (
            <div
              key={branch.id}
              className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden hover:bg-[#1A2E45] hover:-translate-y-0.5 hover:border-[#F5A623]/30 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedBranch(branch)}
            >
              {/* Color accent bar */}
              <div className="h-1" style={{ backgroundColor: branch.color }} />

              <div className="p-5 md:p-6">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: branch.color + "15", color: branch.color }}
                    >
                      <i className="ri-building-line" />
                    </div>
                    <div>
                      <h3
                        className="text-base md:text-lg font-semibold text-[#F0EDE8]"
                        style={{ fontFamily: "Syne, sans-serif" }}
                      >
                        {branch.name}
                      </h3>
                      <p className="text-xs md:text-sm text-[#7A94AD]">
                        {branch.employeeCount} employee{branch.employeeCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                    <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                    <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-[#0A1628] rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {branch.employeeCount}
                    </div>
                    <div className="text-[10px] text-[#7A94AD] mt-0.5">Members</div>
                  </div>
                  <div className="bg-[#0A1628] rounded-lg p-2.5 text-center">
                    <div
                      className={`text-lg font-bold ${branch.isActive ? "text-[#4ECBA0]" : "text-[#7A94AD]"}`}
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {branch.isActive ? "Yes" : "No"}
                    </div>
                    <div className="text-[10px] text-[#7A94AD] mt-0.5">Active</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ backgroundColor: branch.color + "20", color: branch.color }}
                    >
                      {getInitials(branch.managerName)}
                    </div>
                    <div>
                      <div className="text-xs text-[#7A94AD]">Manager</div>
                      <div className="text-sm text-[#F0EDE8]">{branch.managerName}</div>
                    </div>
                  </div>
                  <span className="text-xs text-[#7A94AD]">
                    <i className="ri-calendar-line mr-1" />
                    {fmtDate(branch.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#142236]">
            <i className="ri-building-line text-3xl text-[#7A94AD]" />
          </div>
          <p className="text-[#7A94AD] text-sm">
            {searchQuery || activeFilter !== "all"
              ? "No branches found matching your search"
              : "No branches yet."}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedBranch(null)}
          />
          <div className="relative w-full max-w-lg bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Accent bar */}
            <div className="h-1.5" style={{ backgroundColor: selectedBranch.color }} />

            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: selectedBranch.color + "15", color: selectedBranch.color }}
                  >
                    <i className="ri-building-line" />
                  </div>
                  <div>
                    <h2
                      className="text-xl font-semibold text-[#F0EDE8]"
                      style={{ fontFamily: "Syne, sans-serif" }}
                    >
                      {selectedBranch.name}
                    </h2>
                    <p className="text-sm text-[#7A94AD] mt-0.5">
                      {selectedBranch.isActive ? "Active" : "Inactive"} branch
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBranch(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8] transition-colors flex-shrink-0"
                >
                  <i className="ri-close-line text-xl" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A1628] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
                      <i className="ri-team-line text-[#4ECBA0] text-sm" />
                    </div>
                    <span className="text-xs text-[#7A94AD]">Members</span>
                  </div>
                  <div className="text-2xl font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {selectedBranch.employeeCount}
                  </div>
                </div>
                <div className="bg-[#0A1628] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                      <i className="ri-checkbox-circle-line text-[#F5A623] text-sm" />
                    </div>
                    <span className="text-xs text-[#7A94AD]">Status</span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${selectedBranch.isActive ? "text-[#4ECBA0]" : "text-[#7A94AD]"}`}
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {selectedBranch.isActive ? "Active" : "Off"}
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="px-6 pb-6 space-y-2">
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                  <i className="ri-user-star-line text-[#F5A623] text-sm" />
                </div>
                <div>
                  <div className="text-xs text-[#7A94AD]">Manager</div>
                  <div className="text-sm text-[#F0EDE8]">{selectedBranch.managerName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
                  <i className="ri-palette-line text-[#4ECBA0] text-sm" />
                </div>
                <div>
                  <div className="text-xs text-[#7A94AD]">Color</div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedBranch.color }} />
                    <span className="text-sm text-[#F0EDE8]">{selectedBranch.color}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E8604C]/10">
                  <i className="ri-calendar-line text-[#E8604C] text-sm" />
                </div>
                <div>
                  <div className="text-xs text-[#7A94AD]">Created</div>
                  <div className="text-sm text-[#F0EDE8]">{fmtDate(selectedBranch.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.07] bg-[#0D1B2A]/50">
              <button
                onClick={() => setSelectedBranch(null)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors border border-white/[0.07]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
