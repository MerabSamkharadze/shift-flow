"use client";

export default function Settings() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Company Settings</h1>
        <p className="text-sm md:text-base text-[#7A94AD]">Manage your company preferences</p>
      </div>

      {/* Form Grid - Responsive: 2 columns → 1 column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Company Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Company Name</label>
              <input
                type="text"
                defaultValue="ShiftFlow Inc."
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Industry</label>
              <select className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm cursor-pointer">
                <option>Retail</option>
                <option>Hospitality</option>
                <option>Healthcare</option>
                <option>Manufacturing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Time Zone</label>
              <select className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm cursor-pointer">
                <option>GMT+4 (Tbilisi)</option>
                <option>GMT+0 (London)</option>
                <option>GMT-5 (New York)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Shift Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Default Shift Duration</label>
              <input
                type="number"
                defaultValue="8"
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono'] focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Overtime Threshold</label>
              <input
                type="number"
                defaultValue="40"
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono'] focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 bg-[#0A1628] rounded-lg">
              <div className="flex-1 min-w-0 mr-3">
                <div className="text-xs md:text-sm font-medium text-[#F0EDE8] mb-1">Allow Shift Swaps</div>
                <div className="text-[10px] md:text-xs text-[#7A94AD]">Employees can request shift swaps</div>
              </div>
              <button className="relative w-12 h-6 bg-[#F5A623] rounded-full transition-colors cursor-pointer flex-shrink-0">
                <div className="absolute right-1 top-1 w-4 h-4 bg-[#0A1628] rounded-full"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences - Full Width */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          {[
            { label: 'Shift swap requests', desc: 'Get notified when employees request swaps' },
            { label: 'Schedule published', desc: 'Alert when new schedules are published' },
            { label: 'Overtime alerts', desc: 'Notify when employees approach overtime' },
            { label: 'Absence notifications', desc: 'Alert for unplanned absences' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-[#0A1628] rounded-lg hover:bg-[#0D1B2A] transition-colors">
              <div className="flex-1 min-w-0 mr-3">
                <div className="text-xs md:text-sm font-medium text-[#F0EDE8] mb-1">{item.label}</div>
                <div className="text-[10px] md:text-xs text-[#7A94AD]">{item.desc}</div>
              </div>
              <button className="relative w-12 h-6 bg-[#F5A623] rounded-full transition-colors cursor-pointer flex-shrink-0">
                <div className="absolute right-1 top-1 w-4 h-4 bg-[#0A1628] rounded-full"></div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons - Responsive: Full width on mobile, right-aligned on desktop */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button className="w-full sm:w-auto px-6 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors whitespace-nowrap cursor-pointer">
          Cancel
        </button>
        <button className="w-full sm:w-auto px-6 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer">
          <i className="ri-save-line mr-2"></i>Save Changes
        </button>
      </div>
    </div>
  );
}
