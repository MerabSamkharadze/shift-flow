"use client";

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ManagersViewData } from '@/lib/types/dashboard';
import { inviteManager, deactivateManager } from '@/app/actions/owner';

interface ManagersProps {
  data: unknown;
  userRole: string;
}

interface DisplayManager {
  id: string;
  name: string;
  initial: string;
  status: 'active' | 'pending' | 'inactive';
  color: string;
  email: string;
  createdAt: string;
}

export default function Managers({ data, userRole }: ManagersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const typedData = data as ManagersViewData | null;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<DisplayManager | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const colorPool = ['#4ECBA0', '#F5A623', '#E8604C', '#14B8A6'];

  // --- Derive display managers from real data ---
  const managers: DisplayManager[] = (typedData?.managers ?? []).map((m, idx) => {
    const initials = ((m.first_name?.[0] ?? '') + (m.last_name?.[0] ?? '')).toUpperCase();
    const fullName = `${m.first_name} ${m.last_name}`;

    let status: DisplayManager['status'] = 'inactive';
    if (m.is_active && !m.must_change_password) {
      status = 'active';
    } else if (m.is_active && m.must_change_password) {
      status = 'pending';
    }

    return {
      id: m.id,
      name: fullName,
      initial: initials,
      status,
      color: colorPool[idx % colorPool.length],
      email: m.email,
      createdAt: m.created_at,
    };
  });

  // --- Summary counts ---
  const totalManagers = managers.length;
  const activeCount = managers.filter(m => m.status === 'active').length;
  const pendingCount = managers.filter(m => m.status === 'pending').length;
  const inactiveCount = managers.filter(m => m.status === 'inactive').length;

  const filters = [
    { id: 'all', label: 'All', count: totalManagers },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'inactive', label: 'Inactive', count: inactiveCount },
  ];

  const filteredManagers = managers.filter((mgr) => {
    const matchesSearch = mgr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mgr.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' ? true : mgr.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '' });
  };

  const handleAddManager = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) return;
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    const fd = new FormData();
    fd.set('first_name', formData.firstName.trim());
    fd.set('last_name', formData.lastName.trim());
    fd.set('email', formData.email.trim());

    startTransition(async () => {
      const result = await inviteManager(fd);
      if (result.error) {
        setToastMessage(`Error: ${result.error}`);
        setShowToast(true);
      } else {
        setShowAddModal(false);
        resetForm();
        setToastMessage(`${fullName} has been invited as a manager`);
        setShowToast(true);
        router.refresh();
      }
    });
  };

  const handleDeactivate = (managerId: string, managerName: string) => {
    startTransition(async () => {
      const result = await deactivateManager(managerId);
      if (result.error) {
        setToastMessage(`Error: ${result.error}`);
        setShowToast(true);
      } else {
        setToastMessage(`${managerName} has been deactivated`);
        setShowToast(true);
        setShowProfileModal(false);
        setSelectedManager(null);
        router.refresh();
      }
    });
  };

  const handleViewProfile = (mgr: DisplayManager) => {
    setSelectedManager(mgr);
    setShowProfileModal(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    active: { label: 'Active', dot: 'bg-[#4ECBA0] animate-pulse', bg: 'bg-[#4ECBA0]/10', text: 'text-[#4ECBA0]' },
    pending: { label: 'Pending', dot: 'bg-[#F0C040]', bg: 'bg-[#F0C040]/10', text: 'text-[#F0C040]' },
    inactive: { label: 'Inactive', dot: 'bg-[#7A94AD]', bg: 'bg-[#7A94AD]/10', text: 'text-[#7A94AD]' },
  };

  const isFormValid = formData.firstName.trim() && formData.lastName.trim() && formData.email.trim();
  const inputClass = "w-full px-4 py-3 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50 transition-colors";
  const labelClass = "block text-sm font-medium text-[#7A94AD] mb-1.5";

  // --- Role gate ---
  if (userRole !== 'owner') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#142236]">
            <i className="ri-lock-line text-3xl text-[#7A94AD]"></i>
          </div>
          <h2 className="text-xl font-['Syne'] font-semibold text-[#F0EDE8] mb-2">Access Restricted</h2>
          <p className="text-[#7A94AD] text-sm">Only available for owners</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Managers</h1>
          <p className="text-sm md:text-base text-[#7A94AD]">Oversee your management team</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={isPending}
          className="px-4 md:px-6 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-sm md:text-base disabled:opacity-50"
        >
          <i className="ri-user-star-line mr-2"></i>Add Manager
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
              <i className="ri-team-line text-[#4ECBA0]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Total Managers</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{totalManagers}</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
              <i className="ri-checkbox-circle-line text-[#4ECBA0]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Active</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#4ECBA0]">{activeCount}</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F0C040]/10">
              <i className="ri-time-line text-[#F0C040]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Pending</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0C040]">{pendingCount}</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7A94AD]/10">
              <i className="ri-user-unfollow-line text-[#7A94AD]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Inactive</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#7A94AD]">{inactiveCount}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD] text-lg"></i>
          <input
            type="text"
            placeholder="Search managers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 md:py-3 bg-[#142236] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === filter.id
                  ? 'bg-[#F5A623] text-[#0A1628]'
                  : 'bg-[#142236] text-[#7A94AD] hover:text-[#F0EDE8] border border-white/[0.07]'
              }`}
            >
              {filter.label}
              <span className={`ml-1.5 md:ml-2 ${activeFilter === filter.id ? 'text-[#0A1628]' : 'text-[#7A94AD]'}`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Manager Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredManagers.map((mgr, idx) => {
          const status = statusConfig[mgr.status];
          return (
            <div
              key={mgr.id}
              className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6 hover:bg-[#1A2E45] hover:-translate-y-0.5 hover:border-[#F5A623]/30 transition-all duration-200 cursor-pointer"
              style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both` }}
              onClick={() => handleViewProfile(mgr)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-base md:text-lg font-semibold"
                    style={{ backgroundColor: mgr.color + '20', color: mgr.color }}
                  >
                    {mgr.initial}
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-[#F0EDE8]">{mgr.name}</h3>
                    <span className="text-xs md:text-sm text-[#7A94AD]">{mgr.email}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                  <div className={`w-2 h-2 rounded-full ${status.dot}`}></div>
                  <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-sm font-medium text-[#F0EDE8]">{mgr.email}</div>
                  <div className="text-xs text-[#7A94AD] mt-0.5">Email</div>
                </div>
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-sm font-medium text-[#F0EDE8]">{new Date(mgr.createdAt).toLocaleDateString()}</div>
                  <div className="text-xs text-[#7A94AD] mt-0.5">Joined</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
                <span className={`px-2.5 py-1 text-xs rounded-full ${status.bg} ${status.text}`}>
                  <i className="ri-shield-user-line mr-1"></i>Manager
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewProfile(mgr); }}
                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#0A1628] hover:bg-[#F5A623]/10 text-[#7A94AD] hover:text-[#F5A623] rounded-lg transition-colors cursor-pointer"
                    aria-label={`View ${mgr.name} profile`}
                  >
                    <i className="ri-eye-line text-sm md:text-base"></i>
                  </button>
                  {mgr.status !== 'inactive' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeactivate(mgr.id, mgr.name); }}
                      disabled={isPending}
                      className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#0A1628] hover:bg-[#E8604C]/10 text-[#7A94AD] hover:text-[#E8604C] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      aria-label={`Deactivate ${mgr.name}`}
                    >
                      <i className="ri-user-unfollow-line text-sm md:text-base"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredManagers.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#142236]">
            <i className="ri-user-star-line text-3xl text-[#7A94AD]"></i>
          </div>
          <p className="text-[#7A94AD] text-sm">No managers found matching your search</p>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'modalBgIn 0.2s ease-out both' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileModal(false)}></div>
          <div className="relative w-full max-w-md bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden" style={{ animation: 'modalIn 0.2s ease-out both' }}>
            {/* Profile Header */}
            <div className="relative px-6 pt-8 pb-6 text-center">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                style={{ backgroundColor: selectedManager.color + '20', color: selectedManager.color }}
              >
                {selectedManager.initial}
              </div>
              <h2 className="text-xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">{selectedManager.name}</h2>
              <p className="text-sm text-[#7A94AD] mb-3">Manager</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig[selectedManager.status].bg}`}>
                <div className={`w-2 h-2 rounded-full ${statusConfig[selectedManager.status].dot}`}></div>
                <span className={`text-xs font-medium ${statusConfig[selectedManager.status].text}`}>{statusConfig[selectedManager.status].label}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="px-6 pb-6 space-y-3">
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
                    <i className="ri-mail-line text-[#4ECBA0] text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs text-[#7A94AD]">Email</div>
                    <div className="text-sm text-[#F0EDE8]">{selectedManager.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                    <i className="ri-calendar-line text-[#F5A623] text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs text-[#7A94AD]">Created At</div>
                    <div className="text-sm text-[#F0EDE8]">{new Date(selectedManager.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.07] bg-[#0D1B2A]/50">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors whitespace-nowrap cursor-pointer border border-white/[0.07]"
              >
                Close
              </button>
              {selectedManager.status !== 'inactive' && (
                <button
                  onClick={() => handleDeactivate(selectedManager.id, selectedManager.name)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-[#E8604C] hover:bg-[#D4503E] text-white font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-sm disabled:opacity-50"
                >
                  <i className="ri-user-unfollow-line mr-1.5"></i>{isPending ? 'Deactivating...' : 'Deactivate'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Manager Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'modalBgIn 0.2s ease-out both' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); resetForm(); }}></div>
          <div className="relative w-full max-w-lg bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ animation: 'modalIn 0.2s ease-out both' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                  <i className="ri-user-star-line text-[#F5A623] text-base md:text-lg"></i>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Add New Manager</h2>
                  <p className="text-xs text-[#7A94AD]">Invite a new manager via email</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer flex-shrink-0"
              >
                <i className="ri-close-line text-lg md:text-xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-4 md:px-6 py-4 md:py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name <span className="text-[#E8604C]">*</span></label>
                  <input type="text" placeholder="e.g. Davit" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Last Name <span className="text-[#E8604C]">*</span></label>
                  <input type="text" placeholder="e.g. Tsiklauri" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address <span className="text-[#E8604C]">*</span></label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]"></i>
                  <input type="email" placeholder="manager@shiftflow.io" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`${inputClass} pl-11`} />
                </div>
              </div>

              {/* Preview */}
              {formData.firstName && formData.lastName && (
                <div className="mt-2 p-4 bg-[#0A1628] rounded-xl border border-white/[0.07]" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <div className="text-xs text-[#7A94AD] mb-3 uppercase tracking-wider">Preview</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#F5A623]/15 text-[#F5A623] flex items-center justify-center font-semibold text-sm">
                      {(formData.firstName[0] + formData.lastName[0]).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[#F0EDE8] font-medium text-sm">{formData.firstName} {formData.lastName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#7A94AD]">Manager</span>
                        {formData.email && (
                          <>
                            <span className="text-[#7A94AD] text-xs">&middot;</span>
                            <span className="text-xs text-[#F5A623]">{formData.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-4 md:px-6 py-4 border-t border-white/[0.07] bg-[#0D1B2A]/50">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors whitespace-nowrap cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleAddManager}
                disabled={!isFormValid || isPending}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isFormValid && !isPending ? 'bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628]' : 'bg-[#F5A623]/30 text-[#0A1628]/50 cursor-not-allowed'
                }`}
              >
                <i className="ri-check-line mr-1.5"></i>{isPending ? 'Inviting...' : 'Add Manager'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5 bg-[#142236] border border-[#4ECBA0]/30 rounded-xl shadow-2xl max-w-[calc(100vw-2rem)]" style={{ animation: 'toastIn 0.3s ease-out both' }}>
          <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-[#4ECBA0]/15 flex-shrink-0">
            <i className="ri-check-line text-[#4ECBA0]"></i>
          </div>
          <span className="text-xs md:text-sm text-[#F0EDE8]">{toastMessage}</span>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalBgIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        select option {
          background: #142236;
          color: #F0EDE8;
        }
      `}</style>
    </div>
  );
}
