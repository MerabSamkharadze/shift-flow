"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deactivateManager } from "@/app/actions/owner";

type Manager = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
};

type Status = "active" | "pending" | "inactive";

function getStatus(m: Manager): Status {
  if (!m.is_active) return "inactive";
  if (m.must_change_password) return "pending";
  return "active";
}

const STATUS_CONFIG: Record<Status, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: "Active", dot: "bg-[#4ECBA0] animate-pulse", bg: "bg-[#4ECBA0]/10", text: "text-[#4ECBA0]" },
  pending: { label: "Invite pending", dot: "bg-[#F5A623]", bg: "bg-[#F5A623]/10", text: "text-[#F5A623]" },
  inactive: { label: "Inactive", dot: "bg-[#7A94AD]", bg: "bg-[#7A94AD]/10", text: "text-[#7A94AD]" },
};

const COLOR_POOL = ["#4ECBA0", "#F5A623", "#E8604C", "#14B8A6"];

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function getColor(index: number) {
  return COLOR_POOL[index % COLOR_POOL.length];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Deactivate Button ────────────────────────────────────────────────────────

function DeactivateButton({ managerId, managerName }: { managerId: string; managerName: string }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDeactivate = () => {
    startTransition(async () => {
      await deactivateManager(managerId);
      setShowConfirm(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowConfirm(true);
        }}
        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#0A1628] hover:bg-[#E8604C]/10 text-[#7A94AD] hover:text-[#E8604C] rounded-lg transition-colors"
        aria-label={`Deactivate ${managerName}`}
      >
        <i className="ri-user-unfollow-line text-sm md:text-base" />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#E8604C]/10 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-2xl text-[#E8604C]" />
            </div>
            <h3 className="text-lg font-semibold text-[#F0EDE8] mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
              Deactivate Manager?
            </h3>
            <p className="text-sm text-[#7A94AD] mb-5">
              Are you sure you want to deactivate <span className="text-[#F0EDE8] font-medium">{managerName}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors border border-white/[0.07]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-[#E8604C] hover:bg-[#D4533F] text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {isPending ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ManagersTable({ managers }: { managers: Manager[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | Status>("all");
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);

  const managersWithStatus = managers.map((m, i) => ({
    ...m,
    status: getStatus(m),
    color: getColor(i),
    initials: getInitials(m.first_name, m.last_name),
    name: `${m.first_name} ${m.last_name}`.trim(),
  }));

  const counts = {
    all: managersWithStatus.length,
    active: managersWithStatus.filter((m) => m.status === "active").length,
    pending: managersWithStatus.filter((m) => m.status === "pending").length,
    inactive: managersWithStatus.filter((m) => m.status === "inactive").length,
  };

  const filters: { id: "all" | Status; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending" },
    { id: "inactive", label: "Inactive" },
  ];

  const filtered = managersWithStatus.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === "all" || m.status === activeFilter;
    return matchSearch && matchFilter;
  });

  const selected = selectedManager
    ? managersWithStatus.find((m) => m.id === selectedManager.id) ?? null
    : null;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
              <i className="ri-team-line text-[#4ECBA0]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Total Managers</span>
          </div>
          <div className="text-2xl font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {counts.all}
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
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
              <i className="ri-mail-send-line text-[#F5A623]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Invite Pending</span>
          </div>
          <div className="text-2xl font-bold text-[#F5A623]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {counts.pending}
          </div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7A94AD]/10">
              <i className="ri-user-unfollow-line text-[#7A94AD]" />
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
            placeholder="Search managers..."
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

      {/* Manager Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((mgr, idx) => {
          const status = STATUS_CONFIG[mgr.status];
          return (
            <div
              key={mgr.id}
              className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6 hover:bg-[#1A2E45] hover:-translate-y-0.5 hover:border-[#F5A623]/30 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedManager(mgr)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-base md:text-lg font-semibold"
                    style={{ backgroundColor: mgr.color + "20", color: mgr.color }}
                  >
                    {mgr.initials}
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-[#F0EDE8]">{mgr.name}</h3>
                    <span className="text-xs md:text-sm text-[#7A94AD]">{mgr.email}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                  <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
                <span className="text-xs text-[#7A94AD]">
                  <i className="ri-calendar-line mr-1" />
                  Added {fmtDate(mgr.created_at)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedManager(mgr);
                    }}
                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#0A1628] hover:bg-[#F5A623]/10 text-[#7A94AD] hover:text-[#F5A623] rounded-lg transition-colors"
                    aria-label={`View ${mgr.name}`}
                  >
                    <i className="ri-eye-line text-sm md:text-base" />
                  </button>
                  {mgr.is_active && (
                    <DeactivateButton managerId={mgr.id} managerName={mgr.name} />
                  )}
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
            <i className="ri-user-star-line text-3xl text-[#7A94AD]" />
          </div>
          <p className="text-[#7A94AD] text-sm">
            {searchQuery || activeFilter !== "all"
              ? "No managers found matching your search"
              : "No managers yet. Use \"Add Manager\" to send an invite."}
          </p>
        </div>
      )}

      {/* Profile Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedManager(null)}
          />
          <div className="relative w-full max-w-md bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden">
            {/* Profile Header */}
            <div className="relative px-6 pt-8 pb-6 text-center">
              <button
                onClick={() => setSelectedManager(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8] transition-colors"
              >
                <i className="ri-close-line text-xl" />
              </button>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                style={{ backgroundColor: selected.color + "20", color: selected.color }}
              >
                {selected.initials}
              </div>
              <h2 className="text-xl font-semibold text-[#F0EDE8] mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
                {selected.name}
              </h2>
              <p className="text-sm text-[#7A94AD] mb-3">Manager</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${STATUS_CONFIG[selected.status].bg}`}>
                <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[selected.status].dot}`} />
                <span className={`text-xs font-medium ${STATUS_CONFIG[selected.status].text}`}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="px-6 pb-6 space-y-2">
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
                  <i className="ri-mail-line text-[#4ECBA0] text-sm" />
                </div>
                <div>
                  <div className="text-xs text-[#7A94AD]">Email</div>
                  <div className="text-sm text-[#F0EDE8]">{selected.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                  <i className="ri-calendar-line text-[#F5A623] text-sm" />
                </div>
                <div>
                  <div className="text-xs text-[#7A94AD]">Date Added</div>
                  <div className="text-sm text-[#F0EDE8]">{fmtDate(selected.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Profile Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.07] bg-[#0D1B2A]/50">
              <button
                onClick={() => setSelectedManager(null)}
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
