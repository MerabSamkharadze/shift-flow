export default function MonthlyReport() {
  const summaryStats = [
    { label: 'Total Hours', value: '1,847', icon: 'ri-time-line', color: '#14B8A6' },
    { label: 'Total Employees', value: '9', icon: 'ri-team-line', color: '#F5A623' },
    { label: 'Avg Hours/Employee', value: '205', icon: 'ri-bar-chart-line', color: '#4ECBA0' },
    { label: 'Overtime', value: '47h', icon: 'ri-alarm-warning-line', color: '#E8604C' }
  ];

  const employeeData = [
    { name: 'Nino Kharatishvili', initial: 'NK', daysWorked: 22, totalHours: 180, overtime: 4, status: 'active' },
    { name: 'Giorgi Maisuradze', initial: 'GM', daysWorked: 21, totalHours: 172, overtime: 8, status: 'active' },
    { name: 'Davit Gelashvili', initial: 'DG', daysWorked: 22, totalHours: 176, overtime: 6, status: 'active' },
    { name: 'Nika Maisuradze', initial: 'NM', daysWorked: 21, totalHours: 170, overtime: 2, status: 'active' },
    { name: 'Ana Beridze', initial: 'AB', daysWorked: 21, totalHours: 168, overtime: 0, status: 'active' },
    { name: 'Luka Janelidze', initial: 'LJ', daysWorked: 20, totalHours: 164, overtime: 4, status: 'active' },
    { name: 'Tamara Gelashvili', initial: 'TG', daysWorked: 19, totalHours: 156, overtime: 0, status: 'active' },
    { name: 'Salome Janelidze', initial: 'SJ', daysWorked: 19, totalHours: 152, overtime: 0, status: 'active' },
    { name: 'Mariam Beridze', initial: 'MB', daysWorked: 18, totalHours: 148, overtime: 0, status: 'active' }
  ];

  const maxHours = Math.max(...employeeData.map(e => e.totalHours));

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Monthly Report</h1>
          <p className="text-sm md:text-base text-[#7A94AD]">Hours summary and analytics</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <select className="w-full sm:w-auto px-4 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-sm cursor-pointer">
            <option>January 2025</option>
            <option>December 2024</option>
            <option>November 2024</option>
            <option>October 2024</option>
          </select>
          <div className="flex gap-2">
            <button className="flex-1 sm:flex-none px-4 md:px-5 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-sm whitespace-nowrap cursor-pointer">
              <i className="ri-file-pdf-line mr-2"></i>
              <span className="hidden sm:inline">Export </span>PDF
            </button>
            <button className="flex-1 sm:flex-none px-4 md:px-5 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors text-sm whitespace-nowrap cursor-pointer">
              <i className="ri-file-excel-line mr-2"></i>
              <span className="hidden sm:inline">Export </span>Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {summaryStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div 
                className="w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: stat.color + '20' }}
              >
                <i className={`${stat.icon} text-lg md:text-xl`} style={{ color: stat.color }}></i>
              </div>
            </div>
            <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1">
              {stat.value}
            </div>
            <div className="text-xs md:text-sm text-[#7A94AD]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Employee Table - Horizontally Scrollable on Mobile */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Employee</th>
                <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Days Worked</th>
                <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Total Hours</th>
                <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Overtime</th>
                <th className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] px-4 md:px-6 py-3 md:py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {employeeData.map((employee, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors ${
                    idx % 2 === 0 ? 'bg-white/[0.01]' : ''
                  }`}
                >
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center text-[#0A1628] text-xs font-semibold flex-shrink-0">
                        {employee.initial}
                      </div>
                      <span className="text-xs md:text-sm font-medium text-[#F0EDE8] truncate">{employee.name}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                    <span className="text-xs md:text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{employee.daysWorked}</span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                    <span className="text-xs md:text-sm font-['JetBrains_Mono'] font-semibold text-[#F0EDE8]">{employee.totalHours}h</span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                    {employee.overtime > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-[#E8604C]/10 text-[#E8604C] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                        <i className="ri-alarm-warning-line text-xs md:text-sm"></i>
                        {employee.overtime}h
                      </span>
                    ) : (
                      <span className="text-xs md:text-sm text-[#7A94AD]">—</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 bg-[#4ECBA0]/10 text-[#4ECBA0] text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4ECBA0]"></div>
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hours Distribution Chart - Responsive */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4 md:mb-6">Hours Distribution</h2>
        <div className="space-y-3 md:space-y-4">
          {employeeData.map((employee, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-xs md:text-sm gap-2">
                <span className="text-[#F0EDE8] font-medium truncate flex-1">{employee.name}</span>
                <span className="font-['JetBrains_Mono'] text-[#F5A623] font-semibold whitespace-nowrap">{employee.totalHours}h</span>
              </div>
              <div className="relative h-6 md:h-8 bg-[#0A1628] rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#F5A623] to-[#E09415] rounded-lg transition-all duration-500"
                  style={{ 
                    width: `${(employee.totalHours / maxHours) * 100}%`,
                    animation: `expandBar 0.8s ease-out ${idx * 0.1}s both`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes expandBar {
          from {
            width: 0;
          }
        }
      `}</style>
    </div>
  );
}