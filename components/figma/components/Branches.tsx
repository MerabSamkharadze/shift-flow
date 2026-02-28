
import { useState, useEffect } from 'react';

interface Branch {
  name: string;
  address: string;
  city: string;
  manager: string;
  managerInitial: string;
  employees: number;
  activeShifts: number;
  status: 'open' | 'closed' | 'maintenance';
  hours: string;
  phone: string;
  color: string;
  monthlyHours: number;
  coverage: number;
}

export default function Branches() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    manager: '',
    phone: '',
    hours: '08:00 – 22:00',
  });

  const [branches, setBranches] = useState<Branch[]>([
    {
      name: 'Downtown',
      address: '42 Rustaveli Ave',
      city: 'Tbilisi',
      manager: 'Davit Tsiklauri',
      managerInitial: 'DT',
      employees: 9,
      activeShifts: 6,
      status: 'open',
      hours: '08:00 – 22:00',
      phone: '+995 322 100 200',
      color: '#4ECBA0',
      monthlyHours: 1420,
      coverage: 98,
    },
    {
      name: 'Westside',
      address: '15 Pekini Ave',
      city: 'Tbilisi',
      manager: 'Elene Gogishvili',
      managerInitial: 'EG',
      employees: 8,
      activeShifts: 5,
      status: 'open',
      hours: '09:00 – 21:00',
      phone: '+995 322 200 300',
      color: '#F5A623',
      monthlyHours: 1280,
      coverage: 95,
    },
    {
      name: 'Eastside',
      address: '78 Aghmashenebeli Ave',
      city: 'Tbilisi',
      manager: 'Irakli Lomidze',
      managerInitial: 'IL',
      employees: 7,
      activeShifts: 4,
      status: 'open',
      hours: '08:00 – 20:00',
      phone: '+995 322 300 400',
      color: '#E8604C',
      monthlyHours: 1120,
      coverage: 92,
    },
    {
      name: 'Saburtalo',
      address: '23 Vazha-Pshavela Ave',
      city: 'Tbilisi',
      manager: 'Unassigned',
      managerInitial: '—',
      employees: 0,
      activeShifts: 0,
      status: 'maintenance',
      hours: '09:00 – 21:00',
      phone: '+995 322 400 500',
      color: '#7A94AD',
      monthlyHours: 0,
      coverage: 0,
    },
  ]);

  const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    open: { label: 'Open', dot: 'bg-[#4ECBA0] animate-pulse', bg: 'bg-[#4ECBA0]/10', text: 'text-[#4ECBA0]' },
    closed: { label: 'Closed', dot: 'bg-[#7A94AD]', bg: 'bg-[#7A94AD]/10', text: 'text-[#7A94AD]' },
    maintenance: { label: 'Setup', dot: 'bg-[#F5A623]', bg: 'bg-[#F5A623]/10', text: 'text-[#F5A623]' },
  };

  const filters = [
    { id: 'all', label: 'All', count: branches.length },
    { id: 'open', label: 'Open', count: branches.filter(b => b.status === 'open').length },
    { id: 'closed', label: 'Closed', count: branches.filter(b => b.status === 'closed').length },
    { id: 'maintenance', label: 'Setup', count: branches.filter(b => b.status === 'maintenance').length },
  ];

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.manager.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' ? true : branch.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const totalEmployees = branches.reduce((s, b) => s + b.employees, 0);
  const totalActiveShifts = branches.reduce((s, b) => s + b.activeShifts, 0);
  const avgCoverage = branches.filter(b => b.status === 'open').length
    ? Math.round(branches.filter(b => b.status === 'open').reduce((s, b) => s + b.coverage, 0) / branches.filter(b => b.status === 'open').length)
    : 0;

  const resetForm = () => {
    setFormData({ name: '', address: '', city: '', manager: '', phone: '', hours: '08:00 – 22:00' });
  };

  const handleAddBranch = () => {
    if (!formData.name.trim() || !formData.address.trim()) return;
    const colorPool = ['#4ECBA0', '#F5A623', '#E8604C', '#14B8A6'];
    const newBranch: Branch = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim() || 'Tbilisi',
      manager: formData.manager.trim() || 'Unassigned',
      managerInitial: formData.manager.trim() ? formData.manager.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '—',
      employees: 0,
      activeShifts: 0,
      status: 'maintenance',
      hours: formData.hours,
      phone: formData.phone.trim(),
      color: colorPool[branches.length % colorPool.length],
      monthlyHours: 0,
      coverage: 0,
    };
    setBranches((prev) => [...prev, newBranch]);
    setShowAddModal(false);
    resetForm();
    setToastMessage(`${newBranch.name} branch has been added`);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const isFormValid = formData.name.trim() && formData.address.trim();
  const inputClass = "w-full px-4 py-3 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50 transition-colors";
  const labelClass = "block text-sm font-medium text-[#7A94AD] mb-1.5";

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Branches</h1>
          <p className="text-sm md:text-base text-[#7A94AD]">Manage your locations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 md:px-6 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-sm md:text-base"
        >
          <i className="ri-add-line mr-2"></i>Add Branch
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
              <i className="ri-building-line text-[#4ECBA0]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Total Branches</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{branches.length}</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
              <i className="ri-team-line text-[#F5A623]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Total Employees</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{totalEmployees}</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
              <i className="ri-calendar-check-line text-[#4ECBA0]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Active Shifts</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#4ECBA0]">{totalActiveShifts}</div>
        </div>
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E8604C]/10">
              <i className="ri-pie-chart-line text-[#E8604C]"></i>
            </div>
            <span className="text-xs text-[#7A94AD]">Avg Coverage</span>
          </div>
          <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{avgCoverage}%</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD] text-lg"></i>
          <input
            type="text"
            placeholder="Search branches..."
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

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBranches.map((branch, idx) => {
          const status = statusConfig[branch.status];
          return (
            <div
              key={idx}
              className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden hover:bg-[#1A2E45] hover:-translate-y-0.5 hover:border-[#F5A623]/30 transition-all duration-200 cursor-pointer"
              style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.07}s both` }}
              onClick={() => { setSelectedBranch(branch); setShowDetailModal(true); }}
            >
              {/* Color accent bar */}
              <div className="h-1" style={{ backgroundColor: branch.color }}></div>

              <div className="p-5 md:p-6">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: branch.color + '15', color: branch.color }}
                    >
                      <i className="ri-building-line"></i>
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-[#F0EDE8] font-['Syne']">{branch.name}</h3>
                      <p className="text-xs md:text-sm text-[#7A94AD] flex items-center gap-1">
                        <i className="ri-map-pin-line text-xs"></i>
                        {branch.address}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                    <div className={`w-2 h-2 rounded-full ${status.dot}`}></div>
                    <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-[#0A1628] rounded-lg p-2.5 text-center">
                    <div className="text-lg font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{branch.employees}</div>
                    <div className="text-[10px] text-[#7A94AD] mt-0.5">Staff</div>
                  </div>
                  <div className="bg-[#0A1628] rounded-lg p-2.5 text-center">
                    <div className="text-lg font-['JetBrains_Mono'] font-bold text-[#4ECBA0]">{branch.activeShifts}</div>
                    <div className="text-[10px] text-[#7A94AD] mt-0.5">Shifts</div>
                  </div>
                  <div className="bg-[#0A1628] rounded-lg p-2.5 text-center">
                    <div className="text-lg font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{branch.monthlyHours > 0 ? `${(branch.monthlyHours / 1000).toFixed(1)}k` : '—'}</div>
                    <div className="text-[10px] text-[#7A94AD] mt-0.5">Hours</div>
                  </div>
                  <div className="bg-[#0A1628] rounded-lg p-2.5 text-center">
                    <div className={`text-lg font-['JetBrains_Mono'] font-bold ${branch.coverage >= 90 ? 'text-[#4ECBA0]' : branch.coverage >= 70 ? 'text-[#F5A623]' : 'text-[#7A94AD]'}`}>
                      {branch.coverage > 0 ? `${branch.coverage}%` : '—'}
                    </div>
                    <div className="text-[10px] text-[#7A94AD] mt-0.5">Cover</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ backgroundColor: branch.color + '20', color: branch.color }}
                    >
                      {branch.managerInitial}
                    </div>
                    <div>
                      <div className="text-xs text-[#7A94AD]">Manager</div>
                      <div className="text-sm text-[#F0EDE8]">{branch.manager}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#7A94AD]">
                    <i className="ri-time-line"></i>
                    <span>{branch.hours}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBranches.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#142236]">
            <i className="ri-building-line text-3xl text-[#7A94AD]"></i>
          </div>
          <p className="text-[#7A94AD] text-sm">No branches found matching your search</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'modalBgIn 0.2s ease-out both' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative w-full max-w-lg bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ animation: 'modalIn 0.2s ease-out both' }}>
            {/* Accent bar */}
            <div className="h-1.5" style={{ backgroundColor: selectedBranch.color }}></div>

            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: selectedBranch.color + '15', color: selectedBranch.color }}
                  >
                    <i className="ri-building-line"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-['Syne'] font-semibold text-[#F0EDE8]">{selectedBranch.name}</h2>
                    <p className="text-sm text-[#7A94AD] flex items-center gap-1 mt-0.5">
                      <i className="ri-map-pin-line text-xs"></i>
                      {selectedBranch.address}, {selectedBranch.city}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer flex-shrink-0"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A1628] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
                      <i className="ri-team-line text-[#4ECBA0] text-sm"></i>
                    </div>
                    <span className="text-xs text-[#7A94AD]">Employees</span>
                  </div>
                  <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{selectedBranch.employees}</div>
                </div>
                <div className="bg-[#0A1628] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                      <i className="ri-calendar-check-line text-[#F5A623] text-sm"></i>
                    </div>
                    <span className="text-xs text-[#7A94AD]">Active Shifts</span>
                  </div>
                  <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#4ECBA0]">{selectedBranch.activeShifts}</div>
                </div>
                <div className="bg-[#0A1628] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E8604C]/10">
                      <i className="ri-time-line text-[#E8604C] text-sm"></i>
                    </div>
                    <span className="text-xs text-[#7A94AD]">Monthly Hours</span>
                  </div>
                  <div className="text-2xl font-['JetBrains_Mono'] font-bold text-[#F0EDE8]">{selectedBranch.monthlyHours > 0 ? `${selectedBranch.monthlyHours}h` : '—'}</div>
                </div>
                <div className="bg-[#0A1628] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
                      <i className="ri-pie-chart-line text-[#4ECBA0] text-sm"></i>
                    </div>
                    <span className="text-xs text-[#7A94AD]">Coverage</span>
                  </div>
                  <div className={`text-2xl font-['JetBrains_Mono'] font-bold ${selectedBranch.coverage >= 90 ? 'text-[#4ECBA0]' : selectedBranch.coverage >= 70 ? 'text-[#F5A623]' : 'text-[#7A94AD]'}`}>
                    {selectedBranch.coverage > 0 ? `${selectedBranch.coverage}%` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="px-6 pb-6 space-y-2">
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                  <i className="ri-user-star-line text-[#F5A623] text-sm"></i>
                </div>
                <div>
                  <div className="text-xs text-[#7A94AD]">Branch Manager</div>
                  <div className="text-sm text-[#F0EDE8]">{selectedBranch.manager}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4ECBA0]/10">
                  <i className="ri-time-line text-[#4ECBA0] text-sm"></i>
                </div>
                <div>
                  <div className="text-xs text-[#7A94AD]">Operating Hours</div>
                  <div className="text-sm text-[#F0EDE8]">{selectedBranch.hours}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E8604C]/10">
                  <i className="ri-phone-line text-[#E8604C] text-sm"></i>
                </div>
                <div>
                  <div className="text-xs text-[#7A94AD]">Phone</div>
                  <div className="text-sm text-[#F0EDE8]">{selectedBranch.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                  <i className="ri-map-pin-line text-[#F5A623] text-sm"></i>
                </div>
                <div>
                  <div className="text-xs text-[#7A94AD]">Location</div>
                  <div className="text-sm text-[#F0EDE8]">{selectedBranch.address}, {selectedBranch.city}</div>
                </div>
              </div>
            </div>

            {/* Coverage bar */}
            {selectedBranch.coverage > 0 && (
              <div className="px-6 pb-6">
                <div className="text-xs text-[#7A94AD] mb-2">Shift Coverage</div>
                <div className="w-full h-2 bg-[#0A1628] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${selectedBranch.coverage}%`,
                      backgroundColor: selectedBranch.coverage >= 90 ? '#4ECBA0' : selectedBranch.coverage >= 70 ? '#F5A623' : '#E8604C',
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.07] bg-[#0D1B2A]/50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors whitespace-nowrap cursor-pointer border border-white/[0.07]"
              >
                Close
              </button>
              <button className="flex-1 px-4 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-sm">
                <i className="ri-edit-line mr-1.5"></i>Edit Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'modalBgIn 0.2s ease-out both' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); resetForm(); }}></div>
          <div className="relative w-full max-w-lg bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ animation: 'modalIn 0.2s ease-out both' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                  <i className="ri-building-line text-[#F5A623] text-base md:text-lg"></i>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Add New Branch</h2>
                  <p className="text-xs text-[#7A94AD]">Set up a new location</p>
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
              <div>
                <label className={labelClass}>Branch Name <span className="text-[#E8604C]">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Saburtalo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Address <span className="text-[#E8604C]">*</span></label>
                  <div className="relative">
                    <i className="ri-map-pin-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]"></i>
                    <input
                      type="text"
                      placeholder="e.g. 23 Vazha-Pshavela Ave"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    placeholder="e.g. Tbilisi"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Assign Manager</label>
                <div className="relative">
                  <i className="ri-user-star-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]"></i>
                  <input
                    type="text"
                    placeholder="e.g. Davit Tsiklauri"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <div className="relative">
                    <i className="ri-phone-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]"></i>
                    <input
                      type="tel"
                      placeholder="+995 322 XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Operating Hours</label>
                  <div className="relative">
                    <i className="ri-time-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]"></i>
                    <input
                      type="text"
                      placeholder="08:00 – 22:00"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              {formData.name && formData.address && (
                <div className="mt-2 p-4 bg-[#0A1628] rounded-xl border border-white/[0.07]" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <div className="text-xs text-[#7A94AD] mb-3 uppercase tracking-wider">Preview</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#F5A623]/15 text-[#F5A623] flex items-center justify-center text-lg">
                      <i className="ri-building-line"></i>
                    </div>
                    <div>
                      <div className="text-[#F0EDE8] font-medium text-sm">{formData.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#7A94AD]">{formData.address}</span>
                        {formData.city && (
                          <>
                            <span className="text-[#7A94AD] text-xs">&middot;</span>
                            <span className="text-xs text-[#F5A623]">{formData.city}</span>
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
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBranch}
                disabled={!isFormValid}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isFormValid ? 'bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628]' : 'bg-[#F5A623]/30 text-[#0A1628]/50 cursor-not-allowed'
                }`}
              >
                <i className="ri-check-line mr-1.5"></i>Add Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5 bg-[#142236] border border-[#4ECBA0]/30 rounded-xl shadow-2xl max-w-[calc(100vw-2rem)]"
          style={{ animation: 'toastIn 0.3s ease-out both' }}
        >
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
      `}</style>
    </div>
  );
}
