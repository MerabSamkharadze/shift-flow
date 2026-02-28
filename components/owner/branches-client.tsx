"use client";

import { useState, useMemo } from "react";

type Group = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
};

type ManagerBranch = {
  managerId: string;
  managerName: string;
  groups: Group[];
};

const COLOR_POOL = ["#4ECBA0", "#F5A623", "#E8604C", "#14B8A6"];

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

export function BranchesClient({ branches }: { branches: ManagerBranch[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<ManagerBranch | null>(null);
  // branchNames: owner-ის მიერ დარქმეული სახელები (managerId → customName)
  const [branchNames, setBranchNames] = useState<Record<string, string>>({});
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const totalGroups = useMemo(
    () => branches.reduce((s, b) => s + b.groups.length, 0),
    [branches],
  );
  const totalEmployees = useMemo(
    () => branches.reduce((s, b) => s + b.groups.reduce((gs, g) => gs + g.employeeCount, 0), 0),
    [branches],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return branches.filter((b) => {
      const displayName = branchNames[b.managerId] || b.managerName;
      const groupNames = b.groups.map((g) => g.name).join(" ");
      const searchIn = `${displayName} ${b.managerName} ${groupNames}`.toLowerCase();
      return searchIn.includes(q);
    });
  }, [branches, branchNames, searchQuery]);

  const handleStartRename = (managerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingName(managerId);
    setEditValue(branchNames[managerId] || "");
  };

  const handleSaveRename = (managerId: string) => {
    if (editValue.trim()) {
      setBranchNames((prev) => ({ ...prev, [managerId]: editValue.trim() }));
    } else {
      // თუ ცარიელია, წაშლა (default-ზე დაბრუნება)
      setBranchNames((prev) => {
        const next = { ...prev };
        delete next[managerId];
        return next;
      });
    }
    setEditingName(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
              <i className="ri-user-star-line text-[#F5A623]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Managers</span>
          </div>
          <div className="text-2xl font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {branches.length}
          </div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
              <i className="ri-group-line text-[#4ECBA0]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Total Groups</span>
          </div>
          <div className="text-2xl font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {totalGroups}
          </div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#14B8A6]/10">
              <i className="ri-team-line text-[#14B8A6]" />
            </div>
            <span className="text-xs text-[#7A94AD]">Total Employees</span>
          </div>
          <div className="text-2xl font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {totalEmployees}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD] text-lg" />
        <input
          type="text"
          placeholder="Search by manager or group name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-2.5 md:py-3 bg-[#142236] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
        />
      </div>

      {/* Manager Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((branch, idx) => {
          const color = COLOR_POOL[idx % COLOR_POOL.length];
          const displayName = branchNames[branch.managerId] || branch.managerName;
          const totalMembers = branch.groups.reduce((s, g) => s + g.employeeCount, 0);
          const isEditing = editingName === branch.managerId;

          return (
            <div
              key={branch.managerId}
              className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden hover:bg-[#1A2E45] hover:border-[#F5A623]/30 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedBranch(branch)}
            >
              {/* Color accent bar */}
              <div className="h-1" style={{ backgroundColor: color }} />

              <div className="p-5 md:p-6">
                {/* Header: Manager avatar + branch name */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-base md:text-lg font-semibold"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      {getInitials(branch.managerName)}
                    </div>
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename(branch.managerId);
                              if (e.key === "Escape") setEditingName(null);
                            }}
                            className="px-2 py-1 bg-[#0A1628] border border-[#F5A623]/50 rounded text-[#F0EDE8] text-sm focus:outline-none w-36"
                            placeholder={branch.managerName}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(branch.managerId)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-[#F5A623] text-[#0A1628]"
                          >
                            <i className="ri-check-line text-sm" />
                          </button>
                          <button
                            onClick={() => setEditingName(null)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8]"
                          >
                            <i className="ri-close-line text-sm" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-base md:text-lg font-semibold text-[#F0EDE8]"
                            style={{ fontFamily: "var(--font-syne), sans-serif" }}
                          >
                            {displayName}
                          </h3>
                          <button
                            onClick={(e) => handleStartRename(branch.managerId, e)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F5A623] transition-colors opacity-0 group-hover:opacity-100"
                            title="Rename branch"
                          >
                            <i className="ri-edit-line text-xs" />
                          </button>
                        </div>
                      )}
                      {branchNames[branch.managerId] && !isEditing && (
                        <span className="text-xs text-[#7A94AD]">{branch.managerName}</span>
                      )}
                      {!branchNames[branch.managerId] && !isEditing && (
                        <span className="text-xs text-[#7A94AD]">Manager</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleStartRename(branch.managerId, e)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0A1628] hover:bg-[#F5A623]/10 text-[#7A94AD] hover:text-[#F5A623] transition-colors"
                      title="Rename"
                    >
                      <i className="ri-edit-line text-sm" />
                    </button>
                  </div>
                </div>

                {/* Groups list */}
                <div className="space-y-2 mb-4">
                  {branch.groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#F0EDE8] font-medium">{group.name}</span>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: group.color + "20",
                          color: group.color,
                        }}
                      >
                        {group.employeeCount} member{group.employeeCount !== 1 ? "s" : ""}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          group.isActive
                            ? "bg-[#4ECBA0]/10 text-[#4ECBA0]"
                            : "bg-[#7A94AD]/10 text-[#7A94AD]"
                        }`}
                      >
                        {group.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer stats */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#7A94AD]">
                      <i className="ri-group-line mr-1" />
                      {branch.groups.length} group{branch.groups.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-[#7A94AD]">
                      <i className="ri-team-line mr-1" />
                      {totalMembers} member{totalMembers !== 1 ? "s" : ""}
                    </span>
                  </div>
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
            {searchQuery
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
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold"
                    style={{
                      backgroundColor: COLOR_POOL[branches.indexOf(selectedBranch) % COLOR_POOL.length] + "20",
                      color: COLOR_POOL[branches.indexOf(selectedBranch) % COLOR_POOL.length],
                    }}
                  >
                    {getInitials(selectedBranch.managerName)}
                  </div>
                  <div>
                    <h2
                      className="text-xl font-semibold text-[#F0EDE8]"
                      style={{ fontFamily: "var(--font-syne), sans-serif" }}
                    >
                      {branchNames[selectedBranch.managerId] || selectedBranch.managerName}
                    </h2>
                    {branchNames[selectedBranch.managerId] && (
                      <p className="text-sm text-[#7A94AD] mt-0.5">
                        Manager: {selectedBranch.managerName}
                      </p>
                    )}
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
                      <i className="ri-group-line text-[#4ECBA0] text-sm" />
                    </div>
                    <span className="text-xs text-[#7A94AD]">Groups</span>
                  </div>
                  <div className="text-2xl font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {selectedBranch.groups.length}
                  </div>
                </div>
                <div className="bg-[#0A1628] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                      <i className="ri-team-line text-[#F5A623] text-sm" />
                    </div>
                    <span className="text-xs text-[#7A94AD]">Total Members</span>
                  </div>
                  <div className="text-2xl font-bold text-[#F0EDE8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {selectedBranch.groups.reduce((s, g) => s + g.employeeCount, 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Groups list */}
            <div className="px-6 pb-6">
              <h3 className="text-xs text-[#7A94AD] uppercase tracking-wider mb-3">Groups</h3>
              <div className="space-y-2">
                {selectedBranch.groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-4 bg-[#0A1628] rounded-lg"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: group.color + "15" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#F0EDE8]">{group.name}</div>
                      <div className="text-xs text-[#7A94AD] mt-0.5">
                        {group.employeeCount} member{group.employeeCount !== 1 ? "s" : ""} · Created {fmtDate(group.createdAt)}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        group.isActive
                          ? "bg-[#4ECBA0]/10 text-[#4ECBA0]"
                          : "bg-[#7A94AD]/10 text-[#7A94AD]"
                      }`}
                    >
                      {group.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
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
