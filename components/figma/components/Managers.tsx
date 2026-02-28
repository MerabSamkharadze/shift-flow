
import { useState, useEffect } from 'react';

interface Manager {
  name: string;
  initial: string;
  role: string;
  branch: string;
  status: 'active' | 'away' | 'offline';
  employees: number;
  hours: number;
  color: string;
  email: string;
  phone: string;
}

export default function Managers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'Branch Manager',
    branch: 'Downtown',
    email: '',
    phone: '',
  });

  const colorPool = ['#4ECBA0', '#F5A623', '#E8604C', '#14B8A6'];

  const [managers, setManagers] = useState<Manager[]>([
    { name: 'Nino Kharatishvili', initial: 'NK', role: 'General Manager', branch: 'All Branches', status: 'active', employees: 24, hours: 192, color: '#4ECBA0', email: 'nino@shiftflow.io', phone: '+995 555 123 456' },
    { name: 'Davit Tsiklauri', initial: 'DT', role: 'Branch Manager', branch: 'Downtown', status: 'active', employees: 9, hours: 176, color: '#F5A623', email: 'davit@shiftflow.io', phone: '+995 555 234 567' },
    { name: 'Elene Gogishvili', initial: 'EG', role: 'Branch Manager', branch: 'Westside', status: 'away', employees: 8, hours: 168, color: '#E8604C', email: 'elene@shiftflow.io', phone: '+995 555 345 678' },
    { name: 'Irakli Lomidze', initial: 'IL', role: 'Shift Supervisor', branch: 'Eastside', status: 'active', employees: 7, hours: 184, color: '#14B8A6', email: 'irakli@shiftflow.io', phone: '+995 555 456 789' },
    { name: 'Maia Chkheidze', initial: 'MC', role: 'Shift Supervisor', branch: 'Downtown', status: 'offline', employees: 6, hours: 160, color: '#F5A623', email: 'maia@shiftflow.io', phone: '+995 555 567 890' },
    { name: 'Giorgi Papashvili', initial: 'GP', role: 'Branch Manager', branch: 'Eastside', status: 'active', employees: 7, hours: 180, color: '#4ECBA0', email: 'giorgi@shiftflow.io', phone: '+995 555 678 901' },
  ]);

  const filters = [
    { id: 'all', label: 'All', count: managers.length },
    { id: 'active', label: 'Active', count: managers.filter(m => m.status === 'active').length },
    { id: 'away', label: 'Away', count: managers.filter(m => m.status === 'away').length },
    { id: 'offline', label: 'Offline', count: managers.filter(m => m.status === 'offline').length },
  ];

  const filteredManagers = managers.filter((mgr) => {
    const matchesSearch = mgr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mgr.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mgr.branch.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' ? true : mgr.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', role: 'Branch Manager', branch: 'Downtown', email: '', phone: '' });
  };

  const handleAddManager = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    const initials = (formData.firstName[0] + formData.lastName[0]).toUpperCase();
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
    const newManager: Manager = {
      name: fullName,
      initial: initials,
      role: formData.role,
      branch: formData.branch,
      status: 'active',
      employees: 0,
      hours: 0,
      color: colorPool[managers.length % colorPool.length],
      email: formData.email,
      phone: formData.phone,
    };
    setManagers((prev) => [newManager, ...prev]);
    setShowAddModal(false);
    resetForm();
    setToastMessage(`${fullName} has been added as a manager`);
    setShowToast(true);
  };

  const handleViewProfile = (mgr: Manager) => {
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
    away: { label: 'Away', dot: 'bg-[#F0C040]', bg: 'bg-[#F0C040]/10', text: 'text-[#F0C040]' },
    offline: { label: 'Offline', dot: 'bg-[#7A94AD]', bg: 'bg-[#7A94AD]/10', text: 'text-[#7A94AD]' },
  };

  const isFormValid = formData.firstName.trim() && formData.lastName.trim();
  const inputClass = "w-full px-4 py-3 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50 transition-colors";
  const labelClass = "block text-sm font-medium text-[#7A94AD] mb-1.5";

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
          className="px-4 md:px-6 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-sm md:text-base"
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
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{managers.length}</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
              <i className="ri-checkbox-circle-line text-[#4ECBA0]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Active Now</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#4ECBA0]">{managers.filter(m => m.status === 'active').length}</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
              <i className="ri-group-line text-[#F5A623]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Employees Managed</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{managers.reduce((sum, m) => sum + m.employees, 0)}</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E8604C]/10">
              <i className="ri-building-line text-[#E8604C]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Branches Covered</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{new Set(managers.map(m => m.branch)).size}</div>
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
              key={idx}
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
                    <span className="text-xs md:text-sm text-[#7A94AD]">{mgr.role}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                  <div className={`w-2 h-2 rounded-full ${status.dot}`}></div>
                  <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-lg font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{mgr.employees}</div>
                  <div className="text-xs text-[#7A94AD] mt-0.5">Employees</div>
                </div>
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-lg font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{mgr.hours}h</div>
                  <div className="text-xs text-[#7A94AD] mt-0.5">Hours</div>
                </div>
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-lg font-['JetBrains_Mono'] font-bold text-[#4ECBA0]">98%</div>
                  <div className="text-xs text-[#7A94AD] mt-0.5">Coverage</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
                <span className="px-2.5 py-1 bg-[#F5A623]/10 text-[#F5A623] text-xs rounded-full whitespace-nowrap">
                  <i className="ri-building-line mr-1"></i>{mgr.branch}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewProfile(mgr); }}
                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#0A1628] hover:bg-[#F5A623]/10 text-[#7A94AD] hover:text-[#F5A623] rounded-lg transition-colors cursor-pointer"
                    aria-label={`View ${mgr.name} profile`}
                  >
                    <i className="ri-eye-line text-sm md:text-base"></i>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#0A1628] hover:bg-[#F5A623]/10 text-[#7A94AD] hover:text-[#F5A623] rounded-lg transition-colors cursor-pointer"
                    aria-label={`Edit ${mgr.name}`}
                  >
                    <i className="ri-edit-line text-sm md:text-base"></i>
                  </button>
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
              <p className="text-sm text-[#7A94AD] mb-3">{selectedManager.role}</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig[selectedManager.status].bg}`}>
                <div className={`w-2 h-2 rounded-full ${statusConfig[selectedManager.status].dot}`}></div>
                <span className={`text-xs font-medium ${statusConfig[selectedManager.status].text}`}>{statusConfig[selectedManager.status].label}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="px-6 pb-6 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{selectedManager.employees}</div>
                  <div className="text-xs text-[#7A94AD] mt-1">Employees</div>
                </div>
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{selectedManager.hours}h</div>
                  <div className="text-xs text-[#7A94AD] mt-1">This Month</div>
                </div>
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-xl font-['JetBrains_Mono'] font-bold text-[#4ECBA0]">98%</div>
                  <div className="text-xs text-[#7A94AD] mt-1">Coverage</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                    <i className="ri-building-line text-[#F5A623] text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs text-[#7A94AD]">Branch</div>
                    <div className="text-sm text-[#F0EDE8]">{selectedManager.branch}</div>
                  </div>
                </div>
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
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E8604C]/10">
                    <i className="ri-phone-line text-[#E8604C] text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs text-[#7A94AD]">Phone</div>
                    <div className="text-sm text-[#F0EDE8]">{selectedManager.phone}</div>
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
              <button className="flex-1 px-4 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-sm">
                <i className="ri-edit-line mr-1.5"></i>Edit Profile
              </button>
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
                  <p className="text-xs text-[#7A94AD]">Assign a new team leader</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Role</label>
                  <div className="relative">
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className={`${inputClass} appearance-none pr-10 cursor-pointer`}>
                      <option value="Branch Manager">Branch Manager</option>
                      <option value="Shift Supervisor">Shift Supervisor</option>
                      <option value="General Manager">General Manager</option>
                      <option value="Area Manager">Area Manager</option>
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-[#7A94AD] pointer-events-none"></i>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Branch</label>
                  <div className="relative">
                    <select value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} className={`${inputClass} appearance-none pr-10 cursor-pointer`}>
                      <option value="Downtown">Downtown</option>
                      <option value="Westside">Westside</option>
                      <option value="Eastside">Eastside</option>
                      <option value="All Branches">All Branches</option>
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-[#7A94AD] pointer-events-none"></i>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]"></i>
                  <input type="email" placeholder="manager@shiftflow.io" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`${inputClass} pl-11`} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <i className="ri-phone-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]"></i>
                  <input type="tel" placeholder="+995 5XX XXX XXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`${inputClass} pl-11`} />
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
                        <span className="text-xs text-[#7A94AD]">{formData.role}</span>
                        <span className="text-[#7A94AD] text-xs">&middot;</span>
                        <span className="text-xs text-[#F5A623]">{formData.branch}</span>
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
                disabled={!isFormValid}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isFormValid ? 'bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628]' : 'bg-[#F5A623]/30 text-[#0A1628]/50 cursor-not-allowed'
                }`}
              >
                <i className="ri-check-line mr-1.5"></i>Add Manager
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
