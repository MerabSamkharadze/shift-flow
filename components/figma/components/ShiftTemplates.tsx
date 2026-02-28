
import { useState } from 'react';

interface ShiftTemplate {
  id: string;
  name: string;
  description: string;
  shifts: TemplateShift[];
  createdBy: string;
  createdAvatar: string;
  lastUsed: string;
  usageCount: number;
  isDefault: boolean;
}

interface TemplateShift {
  label: string;
  time: string;
  type: 'morning' | 'evening' | 'night' | 'off';
  days: string[];
}

const shiftTypeColors: Record<string, { bg: string; text: string; label: string }> = {
  morning: { bg: '#14B8A6', text: '#0A1628', label: 'Morning' },
  evening: { bg: '#F5A623', text: '#0A1628', label: 'Evening' },
  night: { bg: '#E8604C', text: '#F0EDE8', label: 'Night' },
  off: { bg: '#7A94AD', text: '#0A1628', label: 'Day Off' },
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const templates: ShiftTemplate[] = [
  {
    id: '1',
    name: 'Standard Retail Week',
    description: 'Classic 5-day retail schedule with morning and evening rotations. Ideal for storefronts with consistent foot traffic.',
    shifts: [
      { label: 'Morning Shift', time: '08:00-16:00', type: 'morning', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { label: 'Evening Shift', time: '14:00-22:00', type: 'evening', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    ],
    createdBy: 'Nino Kharatishvili',
    createdAvatar: 'NK',
    lastUsed: '2 days ago',
    usageCount: 34,
    isDefault: true,
  },
  {
    id: '2',
    name: 'Weekend Coverage',
    description: 'Full weekend coverage with extended hours. Includes Saturday and Sunday shifts for peak weekend demand.',
    shifts: [
      { label: 'Day Shift', time: '09:00-17:00', type: 'morning', days: ['Sat', 'Sun'] },
      { label: 'Evening Shift', time: '16:00-00:00', type: 'night', days: ['Sat', 'Sun'] },
    ],
    createdBy: 'Giorgi Maisuradze',
    createdAvatar: 'GM',
    lastUsed: '5 days ago',
    usageCount: 18,
    isDefault: false,
  },
  {
    id: '3',
    name: '24/7 Rotation A',
    description: 'Three-shift rotation for round-the-clock operations. Covers morning, evening, and night with balanced hours.',
    shifts: [
      { label: 'Morning', time: '06:00-14:00', type: 'morning', days: ['Mon', 'Tue', 'Wed', 'Thu'] },
      { label: 'Evening', time: '14:00-22:00', type: 'evening', days: ['Mon', 'Tue', 'Wed', 'Thu'] },
      { label: 'Night', time: '22:00-06:00', type: 'night', days: ['Mon', 'Tue', 'Wed', 'Thu'] },
    ],
    createdBy: 'Ana Beridze',
    createdAvatar: 'AB',
    lastUsed: '1 week ago',
    usageCount: 12,
    isDefault: false,
  },
  {
    id: '4',
    name: 'Part-Time Flex',
    description: 'Flexible part-time template for employees working reduced hours. Short shifts spread across the week.',
    shifts: [
      { label: 'Short Morning', time: '09:00-13:00', type: 'morning', days: ['Mon', 'Wed', 'Fri'] },
      { label: 'Short Evening', time: '17:00-21:00', type: 'evening', days: ['Tue', 'Thu'] },
    ],
    createdBy: 'Tamara Gelashvili',
    createdAvatar: 'TG',
    lastUsed: '3 days ago',
    usageCount: 21,
    isDefault: false,
  },
  {
    id: '5',
    name: 'Holiday Skeleton Crew',
    description: 'Minimal staffing template for public holidays. Reduced shifts with essential coverage only.',
    shifts: [
      { label: 'Essential Shift', time: '10:00-18:00', type: 'morning', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    ],
    createdBy: 'Luka Janelidze',
    createdAvatar: 'LJ',
    lastUsed: '2 weeks ago',
    usageCount: 5,
    isDefault: false,
  },
  {
    id: '6',
    name: 'Night Owl Schedule',
    description: 'Dedicated night shift template for warehouses and late-night operations. Full week night coverage.',
    shifts: [
      { label: 'Night Shift', time: '22:00-06:00', type: 'night', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { label: 'Weekend Night', time: '20:00-04:00', type: 'night', days: ['Sat', 'Sun'] },
    ],
    createdBy: 'Giorgi Maisuradze',
    createdAvatar: 'GM',
    lastUsed: '4 days ago',
    usageCount: 9,
    isDefault: false,
  },
];

function TemplateDetailModal({
  template,
  onClose,
}: {
  template: ShiftTemplate;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#142236] border border-white/[0.07] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modalIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-white/[0.07]">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <h2 className="text-lg md:text-xl font-['Syne'] font-semibold text-[#F0EDE8] truncate">
                  {template.name}
                </h2>
                {template.isDefault && (
                  <span className="bg-[#F5A623]/15 text-[#F5A623] text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-[#7A94AD]">{template.description}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-all cursor-pointer flex-shrink-0"
            >
              <i className="ri-close-line text-lg md:text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-5 md:space-y-6">
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-[#7A94AD] uppercase tracking-wider mb-3">
              Shift Breakdown
            </h3>
            <div className="space-y-2.5 md:space-y-3">
              {template.shifts.map((shift, idx) => {
                const color = shiftTypeColors[shift.type];
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#0A1628] rounded-xl"
                  >
                    <div
                      className="w-1.5 md:w-2 h-8 md:h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color.bg }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs md:text-sm font-medium text-[#F0EDE8] mb-1">
                        {shift.label}
                      </div>
                      <div className="font-['JetBrains_Mono'] text-[10px] md:text-xs text-[#7A94AD]">
                        {shift.time}
                      </div>
                    </div>
                    <div className="flex gap-1 md:gap-1.5 flex-shrink-0">
                      {dayLabels.map((d) => (
                        <div
                          key={d}
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-md flex items-center justify-center text-[10px] md:text-xs font-medium transition-all ${
                            shift.days.includes(d)
                              ? 'text-[#0A1628]'
                              : 'bg-white/[0.03] text-[#7A94AD]/40'
                          }`}
                          style={
                            shift.days.includes(d)
                              ? { backgroundColor: color.bg }
                              : undefined
                          }
                        >
                          {d.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs md:text-sm font-semibold text-[#7A94AD] uppercase tracking-wider mb-3">
              Weekly Overview
            </h3>
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
              {dayLabels.map((day) => {
                const dayShifts = template.shifts.filter((s) =>
                  s.days.includes(day)
                );
                return (
                  <div key={day} className="text-center">
                    <div className="text-[10px] md:text-xs text-[#7A94AD] mb-1.5 md:mb-2 font-medium">
                      {day}
                    </div>
                    <div className="space-y-1 md:space-y-1.5">
                      {dayShifts.length > 0 ? (
                        dayShifts.map((s, i) => {
                          const color = shiftTypeColors[s.type];
                          return (
                            <div
                              key={i}
                              className="rounded-md py-1 md:py-1.5 px-0.5 md:px-1"
                              style={{
                                backgroundColor: color.bg + '25',
                                borderLeft: `2px solid ${color.bg}`,
                              }}
                            >
                              <div
                                className="text-[9px] md:text-[10px] font-semibold"
                                style={{ color: color.bg }}
                              >
                                {color.label}
                              </div>
                              <div className="text-[8px] md:text-[9px] font-['JetBrains_Mono'] text-[#7A94AD]">
                                {s.time}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-md py-2 md:py-3 bg-white/[0.02] text-[9px] md:text-[10px] text-[#7A94AD]/40">
                          —
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#0A1628] rounded-xl">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center text-[#0A1628] text-xs md:text-sm font-semibold flex-shrink-0">
              {template.createdAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs md:text-sm font-medium text-[#F0EDE8]">
                Created by {template.createdBy}
              </div>
              <div className="text-[10px] md:text-xs text-[#7A94AD]">
                Last used {template.lastUsed} &middot; Applied{' '}
                <span className="font-['JetBrains_Mono']">
                  {template.usageCount}
                </span>{' '}
                times
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
          <button className="flex-1 px-4 md:px-5 py-2 md:py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs md:text-sm">
            <i className="ri-calendar-line mr-2"></i>Apply to Schedule
          </button>
          <button className="px-4 md:px-5 py-2 md:py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors whitespace-nowrap cursor-pointer text-xs md:text-sm">
            <i className="ri-file-copy-line mr-2"></i>Duplicate
          </button>
          <button className="px-4 md:px-5 py-2 md:py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors whitespace-nowrap cursor-pointer text-xs md:text-sm">
            <i className="ri-edit-line mr-2"></i>Edit
          </button>
          <button className="w-full sm:w-9 md:w-10 h-9 md:h-10 flex items-center justify-center bg-[#E8604C]/10 hover:bg-[#E8604C]/20 text-[#E8604C] rounded-lg transition-colors cursor-pointer flex-shrink-0">
            <i className="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modalIn { animation: modalIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}

function CreateTemplateModal({ onClose }: { onClose: () => void }) {
  const [shifts, setShifts] = useState<TemplateShift[]>([
    { label: '', time: '', type: 'morning', days: [] },
  ]);

  const toggleDay = (shiftIdx: number, day: string) => {
    setShifts((prev) =>
      prev.map((s, i) =>
        i === shiftIdx
          ? {
              ...s,
              days: s.days.includes(day)
                ? s.days.filter((d) => d !== day)
                : [...s.days, day],
            }
          : s
      )
    );
  };

  const updateShift = (
    idx: number,
    field: keyof TemplateShift,
    value: string
  ) => {
    setShifts((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const addShift = () => {
    setShifts((prev) => [
      ...prev,
      { label: '', time: '', type: 'morning', days: [] },
    ]);
  };

  const removeShift = (idx: number) => {
    if (shifts.length > 1) {
      setShifts((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#142236] border border-white/[0.07] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-modalIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-white/[0.07]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-['Syne'] font-semibold text-[#F0EDE8]">
              Create Template
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <i className="ri-close-line text-lg md:text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-5">
          <div>
            <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">
              Template Name
            </label>
            <input
              type="text"
              placeholder="e.g. Standard Retail Week"
              className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-xs md:text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder-[#7A94AD]/40"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">
              Description
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="Describe when to use this template..."
              className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-xs md:text-sm resize-none focus:outline-none focus:border-[#F5A623]/50 placeholder-[#7A94AD]/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs md:text-sm font-medium text-[#7A94AD]">
                Shifts
              </label>
              <button
                onClick={addShift}
                className="text-[10px] md:text-xs text-[#F5A623] hover:text-[#E09415] transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line mr-1"></i>Add Shift
              </button>
            </div>
            <div className="space-y-3 md:space-y-4">
              {shifts.map((shift, idx) => (
                <div
                  key={idx}
                  className="p-3 md:p-4 bg-[#0A1628] rounded-xl space-y-2.5 md:space-y-3"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <input
                      type="text"
                      placeholder="Shift label"
                      value={shift.label}
                      onChange={(e) =>
                        updateShift(idx, 'label', e.target.value)
                      }
                      className="flex-1 px-2.5 md:px-3 py-1.5 md:py-2 bg-[#142236] border border-white/[0.07] rounded-md text-[#F0EDE8] text-xs md:text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder-[#7A94AD]/40"
                    />
                    <select
                      value={shift.type}
                      onChange={(e) =>
                        updateShift(idx, 'type', e.target.value)
                      }
                      className="px-2.5 md:px-3 py-1.5 md:py-2 bg-[#142236] border border-white/[0.07] rounded-md text-[#F0EDE8] text-xs md:text-sm cursor-pointer focus:outline-none"
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                      <option value="off">Day Off</option>
                    </select>
                    {shifts.length > 1 && (
                      <button
                        onClick={() => removeShift(idx)}
                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-[#E8604C] hover:bg-[#E8604C]/10 rounded-md transition-colors cursor-pointer flex-shrink-0"
                      >
                        <i className="ri-close-line text-sm md:text-base"></i>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Time range (e.g. 09:00-17:00)"
                    value={shift.time}
                    onChange={(e) =>
                      updateShift(idx, 'time', e.target.value)
                    }
                    className="w-full px-2.5 md:px-3 py-1.5 md:py-2 bg-[#142236] border border-white/[0.07] rounded-md text-[#F0EDE8] text-xs md:text-sm font-['JetBrains_Mono'] focus:outline-none focus:border-[#F5A623]/50 placeholder-[#7A94AD]/40"
                  />
                  <div className="flex gap-1 md:gap-1.5">
                    {dayLabels.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleDay(idx, d)}
                        className={`w-8 h-8 md:w-9 md:h-9 rounded-md text-[10px] md:text-xs font-medium transition-all cursor-pointer ${
                          shift.days.includes(d)
                            ? 'text-[#0A1628]'
                            : 'bg-white/[0.05] text-[#7A94AD] hover:bg-white/[0.08]'
                        }`}
                        style={
                          shift.days.includes(d)
                            ? {
                                backgroundColor:
                                  shiftTypeColors[shift.type].bg,
                              }
                            : undefined
                        }
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 md:px-5 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#0D1B2A] transition-colors whitespace-nowrap cursor-pointer text-xs md:text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 md:px-5 py-2 md:py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs md:text-sm"
          >
            <i className="ri-save-line mr-2"></i>Save Template
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modalIn { animation: modalIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}

export default function ShiftTemplates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] =
    useState<ShiftTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filterOptions = [
    { id: 'all', label: 'All Templates' },
    { id: 'morning', label: 'Morning' },
    { id: 'evening', label: 'Evening' },
    { id: 'night', label: 'Night' },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === 'all' ||
      t.shifts.some((s) => s.type === filterType);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">
            Shift Templates
          </h1>
          <p className="text-sm md:text-base text-[#7A94AD]">
            Reusable schedule patterns for quick deployment
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 md:px-5 py-2 md:py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-sm md:text-base"
        >
          <i className="ri-add-line mr-2"></i>New Template
        </button>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]"></i>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 md:py-2.5 bg-[#142236] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-xs md:text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder-[#7A94AD]/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilterType(opt.id)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterType === opt.id
                  ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                  : 'bg-[#142236] border border-white/[0.07] text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-[#1A2E45]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#F5A623]/5 hover:border-[#F5A623]/20 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm md:text-base font-semibold text-[#F0EDE8] truncate">
                    {template.name}
                  </h3>
                  {template.isDefault && (
                    <span className="bg-[#F5A623]/15 text-[#F5A623] text-[9px] md:text-[10px] font-semibold px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-[10px] md:text-xs text-[#7A94AD] line-clamp-2 leading-relaxed">
                  {template.description}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
              {template.shifts.map((shift, idx) => {
                const color = shiftTypeColors[shift.type];
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 md:gap-3 py-1 md:py-1.5"
                  >
                    <div
                      className="w-1 md:w-1.5 h-5 md:h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color.bg }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] md:text-xs font-medium text-[#F0EDE8]">
                        {shift.label || color.label}
                      </span>
                    </div>
                    <span className="text-[9px] md:text-[11px] font-['JetBrains_Mono'] text-[#7A94AD] flex-shrink-0">
                      {shift.time}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-0.5 md:gap-1 mb-3 md:mb-4">
              {dayLabels.map((day) => {
                const hasShift = template.shifts.some((s) =>
                  s.days.includes(day)
                );
                const shiftForDay = template.shifts.find((s) =>
                  s.days.includes(day)
                );
                return (
                  <div
                    key={day}
                    className={`flex-1 h-1 md:h-1.5 rounded-full transition-all ${
                      hasShift ? '' : 'bg-white/[0.05]'
                    }`}
                    style={
                      hasShift && shiftForDay
                        ? {
                            backgroundColor:
                              shiftTypeColors[shiftForDay.type].bg + '60',
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2.5 md:pt-3 border-t border-white/[0.05]">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center text-[#0A1628] text-[8px] md:text-[9px] font-semibold">
                  {template.createdAvatar}
                </div>
                <span className="text-[10px] md:text-xs text-[#7A94AD]">
                  {template.lastUsed}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] md:text-xs text-[#7A94AD]">
                <i className="ri-repeat-line text-xs md:text-sm"></i>
                <span className="font-['JetBrains_Mono']">
                  {template.usageCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#142236] flex items-center justify-center mx-auto mb-4">
            <i className="ri-file-list-line text-2xl md:text-3xl text-[#7A94AD]"></i>
          </div>
          <h3 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-2">
            No templates found
          </h3>
          <p className="text-xs md:text-sm text-[#7A94AD] mb-4">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
            className="text-xs md:text-sm text-[#F5A623] hover:text-[#E09415] transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear filters
          </button>
        </div>
      )}

      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}

      {showCreateModal && (
        <CreateTemplateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
