"use client";

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteEmployee, deactivateEmployee } from '@/app/actions/manager';
import type { EmployeesViewData } from '@/lib/types/dashboard';

interface EmployeesProps {
  data: unknown;
}

export default function Employees({ data }: EmployeesProps) {
  const d = data as EmployeesViewData | null;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const colorPool = ['#14B8A6', '#F5A623', '#E8604C', '#4ECBA0'];

  const employees = (d?.employees ?? []).map((e, idx) => ({
    id: e.id,
    name: `${e.first_name} ${e.last_name}`.trim(),
    initial: ((e.first_name?.[0] ?? '') + (e.last_name?.[0] ?? '')).toUpperCase() || '?',
    email: e.email,
    status: e.is_active ? 'active' : 'inactive',
    color: colorPool[idx % colorPool.length],
    created_at: e.created_at,
  }));

  const filters = [
    { id: 'all', label: 'All', count: employees.length },
    { id: 'active', label: 'Active', count: employees.filter(e => e.status === 'active').length },
    { id: 'inactive', label: 'Inactive', count: employees.filter(e => e.status === 'inactive').length },
  ];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' ? true : emp.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '' });
  };

  const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  const handleAddEmployee = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) return;

    const fd = new FormData();
    fd.set('first_name', formData.firstName.trim());
    fd.set('last_name', formData.lastName.trim());
    fd.set('email', formData.email.trim());

    startTransition(async () => {
      const result = await inviteEmployee(fd);
      if (result.error) {
        showToastMsg(result.error, 'error');
      } else {
        showToastMsg(`${formData.firstName} ${formData.lastName} has been invited`);
        setShowAddModal(false);
        resetForm();
        router.refresh();
      }
    });
  };

  const handleDeactivate = (employeeId: string, name: string) => {
    startTransition(async () => {
      const result = await deactivateEmployee(employeeId);
      if (result.error) {
        showToastMsg(result.error, 'error');
      } else {
        showToastMsg(`${name} has been deactivated`);
        router.refresh();
      }
    });
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const isFormValid = formData.firstName.trim() && formData.lastName.trim() && formData.email.trim();

  const inputClass = "w-full px-4 py-3 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50 transition-colors";
  const labelClass = "block text-sm font-medium text-[#7A94AD] mb-1.5";

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Employees</h1>
          <p className="text-sm md:text-base text-[#7A94AD]">Manage your workforce</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 md:px-6 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-sm md:text-base"
        >
          <i className="ri-user-add-line mr-2"></i>Add Employee
        </button>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD] text-lg"></i>
          <input
            type="text"
            placeholder="Search employees..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEmployees.map((employee, idx) => (
          <div
            key={employee.id}
            className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6 hover:bg-[#1A2E45] hover:-translate-y-0.5 hover:border-[#F5A623]/30 transition-all duration-200 cursor-pointer"
            style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-base md:text-lg font-semibold"
                style={{ backgroundColor: employee.color + '20', color: employee.color }}
              >
                {employee.initial}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${employee.status === 'active' ? 'bg-[#4ECBA0]' : 'bg-[#7A94AD]'} ${employee.status === 'active' ? 'animate-pulse' : ''}`}></div>
                <span className="text-xs text-[#7A94AD]">
                  {employee.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <h3 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-1">{employee.name}</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs md:text-sm text-[#7A94AD]">{employee.email}</span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
              <div className="text-xs text-[#7A94AD]">
                Joined {new Date(employee.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div className="flex gap-2">
                {employee.status === 'active' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeactivate(employee.id, employee.name); }}
                    disabled={isPending}
                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#0A1628] hover:bg-[#E8604C]/10 text-[#7A94AD] hover:text-[#E8604C] rounded-lg transition-colors cursor-pointer"
                    title="Deactivate employee"
                  >
                    <i className="ri-user-unfollow-line text-sm md:text-base"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#142236]">
            <i className="ri-team-line text-3xl text-[#7A94AD]"></i>
          </div>
          <p className="text-[#7A94AD] text-sm">No employees found</p>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: 'modalBgIn 0.2s ease-out both' }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowAddModal(false); resetForm(); }}
          ></div>
          <div
            className="relative w-full max-w-lg bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ animation: 'modalIn 0.2s ease-out both' }}
          >
            <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                  <i className="ri-user-add-line text-[#F5A623] text-base md:text-lg"></i>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Invite New Employee</h2>
                  <p className="text-xs text-[#7A94AD]">An invitation email will be sent</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer flex-shrink-0"
              >
                <i className="ri-close-line text-lg md:text-xl"></i>
              </button>
            </div>

            <div className="px-4 md:px-6 py-4 md:py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name <span className="text-[#E8604C]">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Nino"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name <span className="text-[#E8604C]">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Kharatishvili"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address <span className="text-[#E8604C]">*</span></label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]"></i>
                  <input
                    type="email"
                    placeholder="employee@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </div>

              {formData.firstName && formData.lastName && (
                <div className="mt-2 p-4 bg-[#0A1628] rounded-xl border border-white/[0.07]" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <div className="text-xs text-[#7A94AD] mb-3 uppercase tracking-wider">Preview</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#F5A623]/15 text-[#F5A623] flex items-center justify-center font-semibold text-sm">
                      {(formData.firstName[0] + formData.lastName[0]).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[#F0EDE8] font-medium text-sm">{formData.firstName} {formData.lastName}</div>
                      <div className="text-xs text-[#7A94AD]">{formData.email || 'email@company.com'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-4 md:px-6 py-4 border-t border-white/[0.07] bg-[#0D1B2A]/50">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={!isFormValid || isPending}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isFormValid && !isPending
                    ? 'bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628]'
                    : 'bg-[#F5A623]/30 text-[#0A1628]/50 cursor-not-allowed'
                }`}
              >
                <i className="ri-check-line mr-1.5"></i>{isPending ? 'Inviting...' : 'Invite Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div
          className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5 bg-[#142236] border rounded-xl shadow-2xl max-w-[calc(100vw-2rem)] ${
            toastType === 'error' ? 'border-[#E8604C]/30' : 'border-[#4ECBA0]/30'
          }`}
          style={{ animation: 'toastIn 0.3s ease-out both' }}
        >
          <div className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full flex-shrink-0 ${
            toastType === 'error' ? 'bg-[#E8604C]/15' : 'bg-[#4ECBA0]/15'
          }`}>
            <i className={`${toastType === 'error' ? 'ri-error-warning-line text-[#E8604C]' : 'ri-check-line text-[#4ECBA0]'}`}></i>
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
      `}</style>
    </div>
  );
}
