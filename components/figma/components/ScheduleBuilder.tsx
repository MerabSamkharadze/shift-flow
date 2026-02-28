import { useState, useEffect, useMemo } from 'react';

interface ShiftData {
  time: string;
  type: 'morning' | 'evening' | 'night' | 'off';
  isGenerated?: boolean;
  isConfirmed?: boolean;
}

interface SelectedCell {
  employee: string;
  day: string;
  dayIndex: number;
}

interface AutoScheduleRules {
  minHoursPerEmployee: number;
  maxConsecutiveDays: number;
  balanceWorkload: boolean;
  preferredShiftTypes: Record<string, ('morning' | 'evening' | 'night')[]>;
}

interface DragData {
  employeeId: string;
  dayIndex: number;
  shift: ShiftData;
}

interface SwapConfirmation {
  sourceEmployee: string;
  sourceDayIndex: number;
  targetEmployee: string;
  targetDayIndex: number;
  sourceShift: ShiftData;
  targetShift: ShiftData | null;
}

interface Conflict {
  id: string;
  type: 'double-booking' | 'rest-violation' | 'overtime';
  employeeId: string;
  employeeName: string;
  days: number[];
  severity: 'high' | 'medium';
  description: string;
  suggestions: Array<{
    dayIndex: number;
    time: string;
    type: 'morning' | 'evening' | 'night';
  }>;
}

export default function ScheduleBuilder() {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [totalHours, setTotalHours] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mobileView, setMobileView] = useState<'grid' | 'list'>('grid');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | null>(null);
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [scheduleHistory, setScheduleHistory] = useState<Record<string, Record<number, ShiftData | null>>[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [autoScheduleRules, setAutoScheduleRules] = useState<AutoScheduleRules>({
    minHoursPerEmployee: 32,
    maxConsecutiveDays: 5,
    balanceWorkload: true,
    preferredShiftTypes: {
      ana: ['morning'],
      giorgi: ['evening'],
      tamara: ['morning'],
      luka: ['night', 'evening'],
      nino: ['morning']
    }
  });

  // Drag & Drop State
  const [draggedShift, setDraggedShift] = useState<DragData | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ employeeId: string; dayIndex: number } | null>(null);
  const [swapConfirmation, setSwapConfirmation] = useState<SwapConfirmation | null>(null);
  const [showDayOffModal, setShowDayOffModal] = useState<{ employeeId: string; dayIndex: number; shift: ShiftData } | null>(null);

  const [conflictPanelOpen, setConflictPanelOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);

  // Helper function to show toast messages
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const employees = [
    { name: 'Ana Beridze', initial: 'AB', id: 'ana', color: 'from-[#4ECBA0] to-[#3BA886]' },
    { name: 'Giorgi Maisuradze', initial: 'GM', id: 'giorgi', color: 'from-[#F5A623] to-[#E09415]' },
    { name: 'Tamara Gelashvili', initial: 'TG', id: 'tamara', color: 'from-[#E8604C] to-[#D14F38]' },
    { name: 'Luka Janelidze', initial: 'LJ', id: 'luka', color: 'from-[#3B82F6] to-[#2563EB]' },
    { name: 'Nino Kharatishvili', initial: 'NK', id: 'nino', color: 'from-[#10B981] to-[#059669]' }
  ];

  const days = [
    { short: 'Mon', date: 15, full: 'Monday, Feb 15' },
    { short: 'Tue', date: 16, full: 'Tuesday, Feb 16' },
    { short: 'Wed', date: 17, full: 'Wednesday, Feb 17' },
    { short: 'Thu', date: 18, full: 'Thursday, Feb 18' },
    { short: 'Fri', date: 19, full: 'Friday, Feb 19' },
    { short: 'Sat', date: 20, full: 'Saturday, Feb 20' },
    { short: 'Sun', date: 21, full: 'Sunday, Feb 21' }
  ];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Generate month calendar data
  const monthData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    // getDay() returns 0=Sun, we want 0=Mon
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return { weeks, daysInMonth };
  }, [currentMonth, currentYear]);

  // Generate pseudo‑random shifts for the month view
  const monthSchedule = useMemo(() => {
    const shiftTypes: ('morning' | 'evening' | 'night' | 'off')[] = ['morning', 'evening', 'night', 'off'];
    const shiftTimes: Record<string, string> = {
      morning: '09:00-17:00',
      evening: '14:00-22:00',
      night: '17:00-01:00',
      off: ''
    };
    const data: Record<string, Record<number, ShiftData | null>> = {};
    employees.forEach((emp, empIdx) => {
      data[emp.id] = {};
      for (let d = 1; d <= monthData.daysInMonth; d++) {
        const dow = new Date(currentYear, currentMonth, d).getDay();
        // Weekends: some off, some work
        if (dow === 0 || dow === 6) {
          const seed = (empIdx * 31 + d * 7) % 10;
          if (seed < 6) {
            data[emp.id][d] = { time: '', type: 'off' };
          } else {
            const t = shiftTypes[seed % 3];
            data[emp.id][d] = { time: shiftTimes[t], type: t };
          }
        } else {
          const seed = (empIdx * 17 + d * 13) % 10;
          if (seed < 2) {
            data[emp.id][d] = null; // empty
          } else if (seed < 3) {
            data[emp.id][d] = { time: '', type: 'off' };
          } else {
            const t = shiftTypes[seed % 3];
            data[emp.id][d] = { time: shiftTimes[t], type: t };
          }
        }
      }
    });
    return data;
  }, [currentMonth, currentYear, monthData.daysInMonth]);

  // Calculate month total hours
  const monthTotalHours = useMemo(() => {
    let total = 0;
    Object.values(monthSchedule).forEach(empSchedule => {
      Object.values(empSchedule).forEach(shift => {
        if (shift && shift.type !== 'off' && shift.time) {
          const parts = shift.time.split('-');
          if (parts.length === 2) {
            const [sh, sm] = parts[0].split(':').map(Number);
            const [eh, em] = parts[1].split(':').map(Number);
            let hours = eh - sh;
            if (hours < 0) hours += 24;
            const mins = em - sm;
            total += hours + mins / 60;
          }
        }
      });
    });
    return Math.round(total);
  }, [monthSchedule]);

  const [animatedMonthHours, setAnimatedMonthHours] = useState(0);

  useEffect(() => {
    if (viewMode !== 'month') return;
    const target = monthTotalHours;
    const duration = 800;
    const steps = 50;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedMonthHours(target);
        clearInterval(timer);
      } else {
        setAnimatedMonthHours(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [viewMode, monthTotalHours]);

  // Get shifts for a specific day in month view
  const getMonthDayShifts = (day: number) => {
    const shifts: { employee: typeof employees[0]; shift: ShiftData }[] = [];
    employees.forEach(emp => {
      const s = monthSchedule[emp.id]?.[day];
      if (s) shifts.push({ employee: emp, shift: s });
    });
    return shifts;
  };

  // Get shift dot color
  const getShiftDotColor = (type: string) => {
    switch (type) {
      case 'morning':
        return '#4ECBA0';
      case 'evening':
        return '#F5A623';
      case 'night':
        return '#E8604C';
      case 'off':
        return '#374151';
      default:
        return '#374151';
    }
  };

  const [schedule, setSchedule] = useState<Record<string, Record<number, ShiftData | null>>>({
    ana: {
      0: { time: '09:00-17:00', type: 'morning' },
      1: null,
      2: { time: '17:00-01:00', type: 'night' },
      3: { time: '09:00-17:00', type: 'morning' },
      4: null,
      5: { time: '08:00-16:00', type: 'morning' },
      6: { time: '', type: 'off' }
    },
    giorgi: {
      0: { time: '14:00-22:00', type: 'evening' },
      1: { time: '09:00-17:00', type: 'morning' },
      2: null,
      3: { time: '10:00-18:00', type: 'morning' },
      4: { time: '14:00-22:00', type: 'evening' },
      5: null,
      6: { time: '10:00-18:00', type: 'morning' }
    },
    tamara: {
      0: null,
      1: { time: '08:00-16:00', type: 'morning' },
      2: { time: '09:00-17:00', type: 'morning' },
      3: null,
      4: { time: '09:00-17:00', type: 'morning' },
      5: { time: '14:00-22:00', type: 'evening' },
      6: { time: '', type: 'off' }
    },
    luka: {
      0: null,
      1: { time: '16:00-00:00', type: 'night' },
      2: { time: '14:00-22:00', type: 'evening' },
      3: { time: '16:00-00:00', type: 'night' },
      4: { time: '14:00-22:00', type: 'evening' },
      5: null,
      6: { time: '09:00-17:00', type: 'morning' }
    },
    nino: {
      0: { time: '09:00-17:00', type: 'morning' },
      1: { time: '09:00-17:00', type: 'morning' },
      2: { time: '09:00-17:00', type: 'morning' },
      3: { time: '09:00-17:00', type: 'morning' },
      4: { time: '09:00-17:00', type: 'morning' },
      5: { time: '', type: 'off' },
      6: { time: '', type: 'off' }
    }
  });

  // Count‑up animation for total hours (week view)
  useEffect(() => {
    if (viewMode !== 'week') return;
    const target = 247;
    const duration = 1000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setTotalHours(target);
        clearInterval(timer);
      } else {
        setTotalHours(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [viewMode]);

  // Keyboard navigation for grid cells
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEditor) {
          setShowEditor(false);
          setSelectedCell(null);
        }
        if (showToast) {
          setShowToast(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditor, showToast]);

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768 ? 'list' : 'grid');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Count generated unconfirmed shifts
  const generatedShiftsCount = useMemo(() => {
    let count = 0;
    Object.values(schedule).forEach(empSchedule => {
      Object.values(empSchedule).forEach(shift => {
        if (shift?.isGenerated && !shift?.isConfirmed) count++;
      });
    });
    return count;
  }, [schedule]);

  // Auto-schedule algorithm
  const generateSchedule = () => {
    // Save current state to history
    setScheduleHistory(prev => [...prev, JSON.parse(JSON.stringify(schedule))]);

    const newSchedule = JSON.parse(JSON.stringify(schedule));
    const shiftTimesByType: Record<string, string> = {
      morning: '09:00-17:00',
      evening: '14:00-22:00',
      night: '22:00-06:00'
    };

    employees.forEach(emp => {
      const empId = emp.id;
      const preferredTypes = autoScheduleRules.preferredShiftTypes[empId] || ['morning'];
      let consecutiveDays = 0;
      let totalHours = 0;

      // Count existing shifts
      for (let day = 0; day < 7; day++) {
        const shift = newSchedule[empId][day];
        if (shift && shift.type !== 'off') {
          consecutiveDays++;
          if (shift.time) {
            const [start, end] = shift.time.split('-');
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            let hours = eh - sh;
            if (hours < 0) hours += 24;
            totalHours += hours + (em - sm) / 60;
          }
        } else {
          consecutiveDays = 0;
        }
      }

      // Fill empty slots
      for (let day = 0; day < 7; day++) {
        if (!newSchedule[empId][day] && totalHours < autoScheduleRules.minHoursPerEmployee) {
          // Check consecutive days rule
          let canSchedule = true;
          if (consecutiveDays >= autoScheduleRules.maxConsecutiveDays) {
            canSchedule = false;
          }

          if (canSchedule) {
            // Pick preferred shift type
            const shiftType = preferredTypes[Math.floor(Math.random() * preferredTypes.length)];
            newSchedule[empId][day] = {
              time: shiftTimesByType[shiftType],
              type: shiftType,
              isGenerated: true,
              isConfirmed: false
            };
            consecutiveDays++;
            totalHours += 8;
          }
        }

        // Reset consecutive counter on off day
        if (newSchedule[empId][day]?.type === 'off' || !newSchedule[empId][day]) {
          consecutiveDays = 0;
        }
      }
    });

    setSchedule(newSchedule);
    setShowAutoScheduleModal(false);
    showToastMessage('Schedule generated! Review and confirm shifts.');
  };

  // Confirm all generated shifts
  const confirmAllShifts = () => {
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    Object.keys(newSchedule).forEach(empId => {
      Object.keys(newSchedule[empId]).forEach(day => {
        const shift = newSchedule[empId][day];
        if (shift?.isGenerated && !shift?.isConfirmed) {
          shift.isConfirmed = true;
          shift.isGenerated = false;
        }
      });
    });
    setSchedule(newSchedule);
  };

  // Undo to previous state
  const undoSchedule = () => {
    if (scheduleHistory.length > 0) {
      const previous = scheduleHistory[scheduleHistory.length - 1];
      setSchedule(previous);
      setScheduleHistory(prev => prev.slice(0, -1));
    }
  };

  // Toggle preferred shift type
  const togglePreferredShift = (empId: string, shiftType: 'morning' | 'evening' | 'night') => {
    setAutoScheduleRules(prev => {
      const current = prev.preferredShiftTypes[empId] || [];
      const updated = current.includes(shiftType)
        ? current.filter(t => t !== shiftType)
        : [...current, shiftType];
      return {
        ...prev,
        preferredShiftTypes: {
          ...prev.preferredShiftTypes,
          [empId]: updated.length > 0 ? updated : ['morning']
        }
      };
    });
  };

  // Get shift color
  const getShiftColor = (type: string) => {
    switch (type) {
      case 'morning':
        return { bg: '#4ECBA0', text: '#0A1628' };
      case 'evening':
        return { bg: '#F5A623', text: '#0A1628' };
      case 'night':
        return { bg: '#E8604C', text: '#F0EDE8' };
      case 'off':
        return { bg: '#374151', text: '#7A94AD' };
      default:
        return { bg: 'transparent', text: '#7A94AD' };
    }
  };

  // Handle publish
  const handlePublish = () => {
    showToastMessage('Schedule published! Employees notified.');
  };

  // Handle cell click
  const handleCellClick = (employeeId: string, dayIndex: number) => {
    setSelectedCell({
      employee: employeeId,
      day: days[dayIndex].full,
      dayIndex
    });
  };

  // Handle save shift
  const handleSaveShift = () => {
    setSelectedCell(null);
  };

  // Handle delete shift
  const handleDeleteShift = () => {
    if (selectedCell) {
      setSchedule(prev => ({
        ...prev,
        [selectedCell.employee]: {
          ...prev[selectedCell.employee],
          [selectedCell.dayIndex]: null
        }
      }));
      setSelectedCell(null);
    }
  };

  // -----------------------------------------------------------------
  // Drag & Drop Handlers
  // -----------------------------------------------------------------
  const handleDragStart = (e: React.DragEvent, employeeId: string, dayIndex: number, shift: ShiftData) => {
    setDraggedShift({ employeeId, dayIndex, shift });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedShift(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent, employeeId: string, dayIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell({ employeeId, dayIndex });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetEmployeeId: string, targetDayIndex: number) => {
    e.preventDefault();
    
    if (!draggedShift) return;

    const { employeeId: sourceEmployeeId, dayIndex: sourceDayIndex, shift: sourceShift } = draggedShift;
    
    // Don't allow dropping on same cell
    if (sourceEmployeeId === targetEmployeeId && sourceDayIndex === targetDayIndex) {
      setDraggedShift(null);
      setDragOverCell(null);
      return;
    }

    const targetShift = schedule[targetEmployeeId][targetDayIndex];

    // Check if dropping on a day off
    if (targetShift?.type === 'off') {
      setShowDayOffModal({
        employeeId: targetEmployeeId,
        dayIndex: targetDayIndex,
        shift: targetShift
      });
      setDraggedShift(null);
      setDragOverCell(null);
      return;
    }

    // If target cell is occupied, show swap confirmation
    if (targetShift) {
      setSwapConfirmation({
        sourceEmployee: sourceEmployeeId,
        sourceDayIndex,
        targetEmployee: targetEmployeeId,
        targetDayIndex,
        sourceShift,
        targetShift
      });
    } else {
      // Move shift to empty cell
      const newSchedule = JSON.parse(JSON.stringify(schedule));
      newSchedule[targetEmployeeId][targetDayIndex] = sourceShift;
      newSchedule[sourceEmployeeId][sourceDayIndex] = null;
      setSchedule(newSchedule);
      showToastMessage('Shift moved successfully.');
    }

    setDraggedShift(null);
    setDragOverCell(null);
  };

  // Check if drop target is valid
  const isValidDropTarget = (employeeId: string, dayIndex: number): boolean => {
    if (!draggedShift) return false;
    
    // Can't drop on same cell
    if (draggedShift.employeeId === employeeId && draggedShift.dayIndex === dayIndex) {
      return false;
    }
    
    return true;
  };

  // Check if drop would create a conflict
  const isConflictingDrop = (employeeId: string, dayIndex: number): boolean => {
    if (!draggedShift) return false;
    
    // Check if employee already has a shift on this day
    const existingShift = schedule[employeeId][dayIndex];
    if (existingShift && existingShift.type !== 'off') {
      return true;
    }
    
    return false;
  };

  // Handle previous month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedMonthDay(null);
  };

  // Handle next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedMonthDay(null);
  };

  // -----------------------------------------------------------------
  // Auto-Schedule Modal Component
  // -----------------------------------------------------------------
  const AutoScheduleModal = () => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => setShowAutoScheduleModal(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#142236] border border-white/[0.07] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modalIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-white/[0.07]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9333EA] to-[#7C3AED] flex items-center justify-center">
                <i className="ri-flashlight-line text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-['Syne'] font-semibold text-[#F0EDE8]">
                  Auto-Schedule
                </h2>
                <p className="text-xs md:text-sm text-[#7A94AD]">Configure AI scheduling rules</p>
              </div>
            </div>
            <button
              onClick={() => setShowAutoScheduleModal(false)}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <i className="ri-close-line text-lg md:text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-5 md:space-y-6">
          {/* Week Range */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">
              Week Range
            </label>
            <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
              <i className="ri-calendar-line text-[#F5A623]"></i>
              <span className="text-sm text-[#F0EDE8]">Feb 15 - Feb 21, 2025</span>
            </div>
          </div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">
                Min Hours per Employee
              </label>
              <input
                type="number"
                value={autoScheduleRules.minHoursPerEmployee}
                onChange={(e) => setAutoScheduleRules(prev => ({ ...prev, minHoursPerEmployee: Number(e.target.value) }))}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono'] focus:outline-none focus:border-[#9333EA]/50"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">
                Max Consecutive Days
              </label>
              <input
                type="number"
                value={autoScheduleRules.maxConsecutiveDays}
                onChange={(e) => setAutoScheduleRules(prev => ({ ...prev, maxConsecutiveDays: Number(e.target.value) }))}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono'] focus:outline-none focus:border-[#9333EA]/50"
              />
            </div>
          </div>

          {/* Balance Workload Toggle */}
          <div className="flex items-center justify-between p-3 md:p-4 bg-[#0A1628] rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#F0EDE8]">Balance Workload</div>
              <div className="text-xs text-[#7A94AD] mt-0.5">Distribute hours evenly across all employees</div>
            </div>
            <button
              onClick={() => setAutoScheduleRules(prev => ({ ...prev, balanceWorkload: !prev.balanceWorkload }))}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                autoScheduleRules.balanceWorkload ? 'bg-[#9333EA]' : 'bg-[#374151]'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  autoScheduleRules.balanceWorkload ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Preferred Shift Types */}
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-[#7A94AD] uppercase tracking-wider mb-3">
              Preferred Shift Types
            </h3>
            <div className="space-y-2">
              {employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                    {emp.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[#F0EDE8]">{emp.name}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {(['morning', 'evening', 'night'] as const).map(type => {
                      const isSelected = autoScheduleRules.preferredShiftTypes[emp.id]?.includes(type);
                      const colors = getShiftColor(type);
                      return (
                        <button
                          key={type}
                          onClick={() => togglePreferredShift(emp.id, type)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'text-[#0A1628]'
                              : 'bg-white/[0.05] text-[#7A94AD] hover:bg-white/[0.08]'
                          }`}
                          style={isSelected ? { backgroundColor: colors.bg } : undefined}
                        >
                          {type.charAt(0).toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowAutoScheduleModal(false)}
            className="flex-1 px-4 md:px-5 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#0D1B2A] transition-colors whitespace-nowrap cursor-pointer text-xs md:text-sm"
          >
            Cancel
          </button>
          <button
            onClick={generateSchedule}
            className="flex-1 px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-[#9333EA] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer text-xs md:text-sm"
          >
            <i className="ri-flashlight-line mr-2"></i>Generate Schedule
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

  // -----------------------------------------------------------------
  // Swap Confirmation Toast
  // -----------------------------------------------------------------
  const SwapConfirmationToast = () => {
    if (!swapConfirmation) return null;

    const sourceEmp = employees.find(e => e.id === swapConfirmation.sourceEmployee);
    const targetEmp = employees.find(e => e.id === swapConfirmation.targetEmployee);

    const performShiftSwap = () => {
      // Placeholder for actual swap logic – add error handling
      try {
        const newSchedule = JSON.parse(JSON.stringify(schedule));
        const source = newSchedule[swapConfirmation.sourceEmployee][swapConfirmation.sourceDayIndex];
        const target = newSchedule[swapConfirmation.targetEmployee][swapConfirmation.targetDayIndex];
        newSchedule[swapConfirmation.sourceEmployee][swapConfirmation.sourceDayIndex] = target;
        newSchedule[swapConfirmation.targetEmployee][swapConfirmation.targetDayIndex] = source;
        setSchedule(newSchedule);
        setSwapConfirmation(null);
        showToastMessage('Shifts swapped successfully.');
      } catch (err) {
        console.error(err);
        showToastMessage('Failed to swap shifts.');
      }
    };

    return (
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#142236] border border-white/[0.07] px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 min-w-[320px]"
        style={{ animation: 'slideDown 0.3s ease' }}
      >
        <div className="flex-1">
          <div className="text-sm font-medium text-[#F0EDE8] mb-1">
            Swap shifts?
          </div>
          <div className="text-xs text-[#7A94AD]">
            {sourceEmp?.name} {days[swapConfirmation.sourceDayIndex].short} ↔ {targetEmp?.name} {days[swapConfirmation.targetDayIndex].short}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={performShiftSwap}
            className="px-4 py-2 bg-[#4ECBA0] hover:bg-[#3BA886] text-[#0A1628] font-medium rounded-lg transition-colors text-sm whitespace-nowrap cursor-pointer"
          >
            Confirm
          </button>
          <button
            onClick={() => setSwapConfirmation(null)}
            className="px-4 py-2 bg-[#0A1628] hover:bg-[#142236] text-[#F0EDE8] font-medium rounded-lg transition-colors text-sm whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------
  // Day Off Replacement Modal
  // -----------------------------------------------------------------
  const DayOffReplacementModal = () => {
    if (!showDayOffModal) return null;

    const emp = employees.find(e => e.id === showDayOffModal.employeeId);
    const handleReplaceDayOff = () => {
      // Placeholder – add actual replacement logic with error handling
      try {
        const newSchedule = { ...schedule };
        newSchedule[showDayOffModal.employeeId][showDayOffModal.dayIndex] = {
          time: '09:00-17:00',
          type: 'morning'
        };
        setSchedule(newSchedule);
        setShowDayOffModal(null);
        showToastMessage('Day off replaced with a shift.');
      } catch (err) {
        console.error(err);
        showToastMessage('Failed to replace day off.');
      }
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setShowDayOffModal(null)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative bg-[#142236] border border-white/[0.07] rounded-2xl w-full max-w-md animate-modalIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
                <i className="ri-alert-line text-[#F5A623] text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-['Syne'] font-semibold text-[#F0EDE8]">
                  Replace Day Off?
                </h3>
                <p className="text-sm text-[#7A94AD]">
                  {emp?.name} • {days[showDayOffModal.dayIndex].full}
                </p>
              </div>
            </div>

            <p className="text-sm text-[#7A94AD] mb-6">
              This will replace {emp?.name}'s scheduled day off with a work shift. Are you sure you want to continue?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDayOffModal(null)}
                className="flex-1 px-4 py-2.5 bg-[#0A1628] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#0D1B2A] transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReplaceDayOff}
                className="flex-1 px-4 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Replace Day Off
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------
  // Conflict Detection Logic
  // -----------------------------------------------------------------
  const conflicts = useMemo(() => {
    const detected: Conflict[] = [];
    let conflictId = 0;

    employees.forEach(emp => {
      const empSchedule = schedule[emp.id];
      let totalHours = 0;
      const doubleBookedDays: number[] = [];
      const restViolationDays: number[] = [];

      // Check each day
      for (let day = 0; day < 7; day++) {
        const shift = empSchedule[day];
        if (!shift || shift.type === 'off') continue;

        // Calculate hours
        if (shift.time) {
          const [start, end] = shift.time.split('-');
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          let hours = eh - sh;
          if (hours < 0) hours += 24;
          totalHours += hours + (em - sm) / 60;
        }

        // Check for double-booking (same employee, overlapping times)
        // For demo: if two shifts on same day (shouldn't happen in current data structure)
        // We'll check if shift exists and mark as potential conflict

        // Check rest violation (night shift followed by morning shift <8h rest)
        if (day < 6) {
          const nextShift = empSchedule[day + 1];
          if (shift.type === 'night' && nextShift?.type === 'morning') {
            // Night ends late, morning starts early = <8h rest
            restViolationDays.push(day, day + 1);
          }
        }
      }

      // Double-booking conflict (for demo, we'll create one for Ana on Wed)
      if (emp.id === 'ana') {
        const wed = empSchedule[2];
        if (wed && wed.type === 'night') {
          detected.push({
            id: `conflict-${conflictId++}`,
            type: 'double-booking',
            employeeId: emp.id,
            employeeName: emp.name,
            days: [2],
            severity: 'high',
            description: 'Scheduled for overlapping shifts on Wednesday',
            suggestions: [
              { dayIndex: 1, time: '09:00-17:00', type: 'morning' },
              { dayIndex: 4, time: '14:00-22:00', type: 'evening' }
            ]
          });
        }
      }

      // Rest violation conflict
      if (restViolationDays.length > 0) {
        detected.push({
          id: `conflict-${conflictId++}`,
          type: 'rest-violation',
          employeeId: emp.id,
          employeeName: emp.name,
          days: [...new Set(restViolationDays)],
          severity: 'medium',
          description: 'Less than 8 hours rest between night and morning shift',
          suggestions: [
            { dayIndex: restViolationDays[1], time: '14:00-22:00', type: 'evening' },
            { dayIndex: restViolationDays[1] + 1, time: '09:00-17:00', type: 'morning' }
          ]
        });
      }

      // Overtime conflict (>40h per week)
      if (totalHours > 40) {
        const overtimeDays = Object.keys(empSchedule)
          .map(Number)
          .filter(d => empSchedule[d] && empSchedule[d]!.type !== 'off');
        detected.push({
          id: `conflict-${conflictId++}`,
          type: 'overtime',
          employeeId: emp.id,
          employeeName: emp.name,
          days: overtimeDays,
          severity: 'medium',
          description: `${Math.round(totalHours)}h scheduled (exceeds 40h limit)`,
          suggestions: [
            { dayIndex: overtimeDays[overtimeDays.length - 1], time: '', type: 'morning' }
          ]
        });
      }
    });

    return detected;
  }, [schedule]);

  const conflictCount = conflicts.length;

  // Check if a specific employee-day has a conflict
  const hasConflict = (employeeId: string, dayIndex: number) => {
    return conflicts.some(c => c.employeeId === employeeId && c.days.includes(dayIndex));
  };

  const getConflictType = (employeeId: string, dayIndex: number): 'high' | 'medium' | null => {
    const conflict = conflicts.find(c => c.employeeId === employeeId && c.days.includes(dayIndex));
    return conflict ? conflict.severity : null;
  };

  // Handle conflict resolution
  const handleResolveConflict = (conflict: Conflict) => {
    setSelectedConflict(conflict);
    setShowResolutionModal(true);
  };

  const applySuggestion = (suggestion: { dayIndex: number; time: string; type: 'morning' | 'evening' | 'night' }) => {
    if (!selectedConflict) return;

    const newSchedule = JSON.parse(JSON.stringify(schedule));
    
    // Clear conflicting days
    selectedConflict.days.forEach(day => {
      if (selectedConflict.type === 'overtime' && day === suggestion.dayIndex) {
        // For overtime, remove the last shift
        newSchedule[selectedConflict.employeeId][day] = null;
      } else if (selectedConflict.type === 'rest-violation') {
        // For rest violation, replace the problematic shift
        if (day === suggestion.dayIndex) {
          newSchedule[selectedConflict.employeeId][day] = {
            time: suggestion.time,
            type: suggestion.type
          };
        }
      } else if (selectedConflict.type === 'double-booking') {
        // For double-booking, move to suggested day
        newSchedule[selectedConflict.employeeId][selectedConflict.days[0]] = null;
        newSchedule[selectedConflict.employeeId][suggestion.dayIndex] = {
          time: suggestion.time,
          type: suggestion.type
        };
      }
    });

    setSchedule(newSchedule);
    setShowResolutionModal(false);
    setSelectedConflict(null);
    showToastMessage('Conflict resolved successfully!');
  };

  // -----------------------------------------------------------------
  // Conflict Resolution Modal
  // -----------------------------------------------------------------
  const ConflictResolutionModal = () => {
    if (!showResolutionModal || !selectedConflict) return null;

    const emp = employees.find(e => e.id === selectedConflict.employeeId);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setShowResolutionModal(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative bg-[#142236] border border-white/[0.07] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modalIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 md:p-6 border-b border-white/[0.07]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedConflict.severity === 'high' 
                    ? 'bg-[#E8604C]/20' 
                    : 'bg-[#F5A623]/20'
                }`}>
                  <i className={`ri-alert-line text-xl ${
                    selectedConflict.severity === 'high' 
                      ? 'text-[#E8604C]' 
                      : 'text-[#F5A623]'
                  }`}></i>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-['Syne'] font-semibold text-[#F0EDE8]">
                    Resolve Conflict
                  </h2>
                  <p className="text-xs md:text-sm text-[#7A94AD]">{emp?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowResolutionModal(false)}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <i className="ri-close-line text-lg md:text-xl"></i>
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            {/* Conflict Description */}
            <div className={`p-4 rounded-lg border ${
              selectedConflict.severity === 'high'
                ? 'bg-[#E8604C]/10 border-[#E8604C]/20'
                : 'bg-[#F5A623]/10 border-[#F5A623]/20'
            }`}>
              <div className="flex items-start gap-3">
                <i className={`ri-error-warning-line text-lg flex-shrink-0 ${
                  selectedConflict.severity === 'high' 
                    ? 'text-[#E8604C]' 
                    : 'text-[#F5A623]'
                }`}></i>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#F0EDE8] mb-1 capitalize">
                    {selectedConflict.type.replace('-', ' ')}
                  </div>
                  <div className="text-xs text-[#7A94AD]">
                    {selectedConflict.description}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedConflict.days.map(d => (
                      <span key={d} className="px-2 py-0.5 bg-white/[0.05] rounded text-[10px] text-[#F0EDE8]">
                        {days[d].short} {days[d].date}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <h3 className="text-sm font-semibold text-[#7A94AD] uppercase tracking-wider mb-3">
                Suggested Solutions
              </h3>
              <div className="space-y-2">
                {selectedConflict.suggestions.map((suggestion, idx) => {
                  const colors = getShiftColor(suggestion.type);
                  return (
                    <button
                      key={idx}
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full flex items-center gap-3 p-3 bg-[#0A1628] hover:bg-[#1A2E45] border border-white/[0.07] hover:border-[#F5A623]/30 rounded-lg transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium text-[#F0EDE8] mb-1">
                          {selectedConflict.type === 'overtime' 
                            ? 'Remove shift' 
                            : `Move to ${days[suggestion.dayIndex].full}`}
                        </div>
                        {suggestion.time && (
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-medium"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              {suggestion.time}
                            </span>
                            <span className="text-xs text-[#7A94AD] capitalize">{suggestion.type} shift</span>
                          </div>
                        )}
                      </div>
                      <i className="ri-arrow-right-line text-[#7A94AD] group-hover:text-[#F5A623] transition-colors"></i>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 border-t border-white/[0.07]">
            <button
              onClick={() => setShowResolutionModal(false)}
              className="w-full px-4 py-2.5 bg-[#0A1628] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#0D1B2A] transition-colors whitespace-nowrap cursor-pointer text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------
  // Conflict Panel (Collapsible Right Drawer)
  // -----------------------------------------------------------------
  const ConflictPanel = () => (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-[#142236] border-l border-white/[0.07] z-40 transition-transform duration-300 ease-in-out ${
        conflictPanelOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{
        background: 'linear-gradient(180deg, #142236 0%, #0D1B2A 100%)'
      }}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <i className="ri-alert-line text-[#E8604C] text-xl"></i>
          <h3 className="text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Conflicts</h3>
          {conflictCount > 0 && (
            <span className="px-2 py-0.5 bg-[#E8604C] text-white text-xs font-semibold rounded-full">
              {conflictCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setConflictPanelOpen(!conflictPanelOpen)}
          className="w-8 h-8 flex items-center justify-center text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] rounded-lg transition-all cursor-pointer"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Conflict List */}
      <div className="overflow-y-auto h-[calc(100%-4rem)] p-4 space-y-3">
        {conflicts.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-checkbox-circle-line text-4xl text-[#4ECBA0] mb-3"></i>
            <div className="text-sm font-medium text-[#F0EDE8] mb-1">No Conflicts</div>
            <div className="text-xs text-[#7A94AD]">All shifts are properly scheduled</div>
          </div>
        ) : (
          conflicts.map(conflict => {
            const emp = employees.find(e => e.id === conflict.employeeId);
            return (
              <div
                key={conflict.id}
                className={`p-4 rounded-lg border transition-all ${
                  conflict.severity === 'high'
                    ? 'bg-[#E8604C]/10 border-[#E8604C]/20'
                    : 'bg-[#F5A623]/10 border-[#F5A623]/20'
                }`}
              >
                {/* Employee Info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${emp?.color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                    {emp?.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#F0EDE8] truncate">{emp?.name}</div>
                    <div className="text-xs text-[#7A94AD] capitalize">{conflict.type.replace('-', ' ')}</div>
                  </div>
                  <i className={`ri-alert-line text-lg ${
                    conflict.severity === 'high' ? 'text-[#E8604C]' : 'text-[#F5A623]'
                  }`}></i>
                </div>

                {/* Description */}
                <div className="text-xs text-[#7A94AD] mb-3">
                  {conflict.description}
                </div>

                {/* Affected Days */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {conflict.days.map(d => (
                    <span
                      key={d}
                      className={`px-2 py-0.5 bg-white/[0.05] rounded text-[10px] font-medium ${
                        conflict.severity === 'high'
                          ? 'bg-[#E8604C]/20 text-[#E8604C]'
                          : 'bg-[#F5A623]/20 text-[#F5A623]'
                      }`}
                    >
                      {days[d].short} {days[d].date}
                    </span>
                  ))}
                </div>

                {/* Resolve Button */}
                <button
                  onClick={() => handleResolveConflict(conflict)}
                  className="w-full px-3 py-2 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors text-xs whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-tools-line mr-1"></i>Resolve
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // -----------------------------------------------------------------
  // Conflict Toggle Button (Fixed)
  // -----------------------------------------------------------------
  const ConflictToggleButton = () => (
    <button
      onClick={() => setConflictPanelOpen(!conflictPanelOpen)}
      className={`fixed top-20 lg:top-7 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all z-30 cursor-pointer ${
        conflictCount > 0
          ? 'bg-[#E8604C] hover:bg-[#D14F38] text-white'
          : 'bg-[#142236] border border-white/[0.07] text-[#7A94AD] hover:text-[#F0EDE8]'
      }`}
      aria-label="Toggle conflict panel"
    >
      <i className="ri-alert-line text-xl"></i>
      {conflictCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#E8604C] text-xs font-semibold rounded-full flex items-center justify-center">
          {conflictCount}
        </span>
      )}
    </button>
  );

  // -----------------------------------------------------------------
  // Render helpers – each returns a JSX fragment.
  // -----------------------------------------------------------------
  const renderMobileDayList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setCurrentWeekOffset(prev => prev - 1)}
          className="w-10 h-10 flex items-center justify-center text-[#F0EDE8] hover:bg-[#142236] rounded-lg transition-colors"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <div className="text-center">
          <div className="text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Feb 15–21</div>
          <div className="text-xs text-[#7A94AD]">Week View</div>
        </div>
        <button
          onClick={() => setCurrentWeekOffset(prev => prev + 1)}
          className="w-10 h-10 flex items-center justify-center text-[#F0EDE8] hover:bg-[#142236] rounded-lg transition-colors"
        >
          <i className="ri-arrow-right-line text-xl"></i>
        </button>
      </div>

      {days.map((day, dayIndex) => {
        const workingEmployees = employees.filter(emp => schedule[emp.id][dayIndex]);

        return (
          <div key={dayIndex} className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="sticky top-0 bg-[#142236] border-b border-white/[0.07] px-4 py-3 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-['Syne'] font-semibold text-[#F0EDE8]">{day.full}</div>
                  <div className="text-xs text-[#7A94AD] mt-0.5">{workingEmployees.length} shifts scheduled</div>
                </div>
                <button
                  onClick={() => handleCellClick(employees[0].id, dayIndex)}
                  className="px-3 py-1.5 bg-[#142236] border border-[#F5A623] text-[#F5A623] text-xs font-medium rounded-lg hover:bg-[#F5A623]/10 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-add-line text-2xl text-[#7A94AD]"></i>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {workingEmployees.length > 0 ? (
                workingEmployees.map(emp => {
                  const shift = schedule[emp.id][dayIndex];
                  if (!shift) return null;
                  const colors = getShiftColor(shift.type);

                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleCellClick(emp.id, dayIndex)}
                      className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg hover:bg-[#1A2E45] transition-colors cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                        {emp.initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#F0EDE8]">{emp.name}</div>
                        <div className="text-xs text-[#7A94AD] mt-0.5 capitalize">{shift.type} shift</div>
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-lg text-xs font-['JetBrains_Mono'] font-medium"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {shift.type === 'off' ? 'Day Off' : shift.time}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <i className="ri-calendar-close-line text-3xl text-[#7A94AD]/50 mb-2"></i>
                  <div className="text-sm text-[#7A94AD]">No shifts scheduled</div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button
        onClick={handlePublish}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-30 cursor-pointer"
        style={{ animation: 'fadeIn 0.3s ease' }}
      >
        <i className="ri-send-plane-fill text-xl"></i>
      </button>
    </div>
  );

  const renderMobileMonthView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={handlePrevMonth}
          className="w-10 h-10 flex items-center justify-center text-[#F0EDE8] hover:bg-[#142236] rounded-lg transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <div className="text-center">
          <div className="text-lg font-['Syne'] font-semibold text-[#F0EDE8]">{monthNames[currentMonth]} {currentYear}</div>
          <div className="text-xs text-[#7A94AD]">Month View</div>
        </div>
        <button
          onClick={handleNextMonth}
          className="w-10 h-10 flex items-center justify-center text-[#F0EDE8] hover:bg-[#142236] rounded-lg transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-line text-xl"></i>
        </button>
      </div>

      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayLabels.map(dl => (
            <div key={dl} className="text-center text-[10px] font-semibold text-[#7A94AD] py-1">{dl}</div>
          ))}
        </div>
        {monthData.weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="h-10"></div>;
              const dayShifts = getMonthDayShifts(day);
              const activeShifts = dayShifts.filter(s => s.shift.type !== 'off');
              const isSelected = selectedMonthDay === day;
              const isToday = day === 15 && currentMonth === 1 && currentYear === 2025;
              return (
                <button
                  key={di}
                  onClick={() => setSelectedMonthDay(isSelected ? null : day)}
                  className={`h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F5A623] text-[#0A1628]'
                      : isToday
                      ? 'bg-[#F5A623]/15 text-[#F5A623]'
                      : 'hover:bg-[#1A2E45] text-[#F0EDE8]'
                  }`}
                >
                  <span className="text-xs font-medium">{day}</span>
                  {activeShifts.length > 0 && (
                    <div className="flex gap-0.5">
                      {activeShifts.slice(0, 3).map((s, si) => (
                        <div
                          key={si}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: isSelected ? '#0A1628' : getShiftDotColor(s.shift.type) }}
                        ></div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {selectedMonthDay && (
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl overflow-hidden" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="sticky top-0 bg-[#142236] border-b border-white/[0.07] px-4 py-3 z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-['Syne'] font-semibold text-[#F0EDE8]">
                  {monthNames[currentMonth]} {selectedMonthDay}, {currentYear}
                </div>
                <div className="text-xs text-[#7A94AD] mt-0.5">
                  {getMonthDayShifts(selectedMonthDay).length} shifts
                </div>
              </div>
              <button
                onClick={() => setSelectedMonthDay(null)}
                className="w-8 h-8 flex items-center justify-center text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {getMonthDayShifts(selectedMonthDay).map(({ employee: emp, shift }) => {
              const colors = getShiftColor(shift.type);
              return (
                <div key={emp.id} className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                    {emp.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#F0EDE8]">{emp.name}</div>
                    <div className="text-xs text-[#7A94AD] mt-0.5 capitalize">{shift.type} shift</div>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-xs font-['JetBrains_Mono'] font-medium"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {shift.type === 'off' ? 'Day Off' : shift.time}
                  </div>
                </div>
              );
            })}
            {getMonthDayShifts(selectedMonthDay).length === 0 && (
              <div className="text-center py-8">
                <i className="ri-calendar-close-line text-3xl text-[#7A94AD]/50 mb-2"></i>
                <div className="text-sm text-[#7A94AD]">No shifts scheduled</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------
  // Month grid view (desktop)
  // -----------------------------------------------------------------
  const renderMonthGrid = () => {
    // Calculate active shifts for the selected day
    const activeShifts = selectedMonthDay 
      ? getMonthDayShifts(selectedMonthDay).filter(s => s.shift.type !== 'off')
      : [];

    return (
      <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
        <div className="flex-1 bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {dayLabels.map(dl => (
              <div key={dl} className="text-center text-xs font-semibold text-[#7A94AD] py-2">{dl}</div>
            ))}
          </div>

          {/* Calendar Weeks */}
          {monthData.weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 md:gap-2">
              {week.map((day, di) => {
                if (!day) {
                  return <div key={di} className="min-h-[90px] md:min-h-[110px]"></div>;
                }
                const dayShifts = getMonthDayShifts(day);
                const activeShifts = dayShifts.filter(s => s.shift.type !== 'off');
                const isSelected = selectedMonthDay === day;
                const isToday = day === 15 && currentMonth === 1 && currentYear === 2025;
                const isWeekend = di >= 5;

                return (
                  <div
                    key={di}
                    onClick={() => setSelectedMonthDay(isSelected ? null : day)}
                    className={`min-h-[90px] md:min-h-[110px] rounded-lg p-1.5 md:p-2 border transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-[#F5A623] bg-[#F5A623]/5'
                        : isToday
                        ? 'bg-[#F5A623]/15 text-[#F5A623]'
                        : isWeekend
                        ? 'border-white/[0.04] bg-[#0D1B2A]/50 hover:border-white/[0.1] hover:bg-[#1A2E45]/50'
                        : 'border-white/[0.04] hover:border-white/[0.1] hover:bg-[#1A2E45]/30'
                    }`}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs md:text-sm font-semibold ${
                        isSelected ? 'text-[#F5A623]' : isToday ? 'text-[#F5A623]' : 'text-[#F0EDE8]'
                      }`}>
                        {day}
                      </span>
                      {activeShifts.length > 0 && (
                        <span className="text-[9px] md:text-[10px] text-[#7A94AD] font-medium">{activeShifts.length} shifts</span>
                      )}
                    </div>

                    {/* Shift Indicators */}
                    <div className="space-y-0.5 md:space-y-1">
                      {activeShifts.slice(0, 3).map((s, si) => {
                        const colors = getShiftColor(s.shift.type);
                        return (
                          <div
                            key={si}
                            className="flex items-center gap-1 rounded px-1 py-0.5"
                            style={{ backgroundColor: `${colors.bg}20` }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: colors.bg }}
                            ></div>
                            <span className="text-[8px] md:text-[10px] font-medium text-[#F0EDE8] truncate">{s.employee.initial}</span>
                            {s.shift.type !== 'off' && (
                              <span className="text-[7px] md:text-[9px] font-['JetBrains_Mono'] text-[#7A94AD] truncate hidden md:inline">
                                {s.shift.time.split('-')[0]}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {activeShifts.length > 3 && (
                        <div className="text-[8px] md:text-[10px] text-[#7A94AD] pl-1">+{activeShifts.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Day Detail Side Panel */}
        {selectedMonthDay && (
          <div className="hidden xl:block w-80 bg-[#142236] border border-white/[0.07] rounded-xl p-6 space-y-4" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-['Syne'] font-semibold text-[#F0EDE8]">
                {monthNames[currentMonth]} {selectedMonthDay}
              </h3>
              <button
                onClick={() => setSelectedMonthDay(null)}
                className="w-8 h-8 flex items-center justify-center text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Day Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                <div className="text-lg font-['JetBrains_Mono'] font-semibold text-[#F0EDE8]">
                  {activeShifts.filter(s => s.shift.type !== 'off').length}
                </div>
                <div className="text-[10px] text-[#7A94AD] mt-0.5">Active Shifts</div>
              </div>
              <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                <div className="text-lg font-['JetBrains_Mono'] font-semibold text-[#F0EDE8]">
                  {activeShifts.filter(s => s.shift.type === 'off').length}
                </div>
                <div className="text-[10px] text-[#7A94AD] mt-0.5">Days Off</div>
              </div>
            </div>

            {/* Shift Type Legend */}
            <div className="flex flex-wrap gap-2">
              {['morning', 'evening', 'night', 'off'].map(type => {
                const count = activeShifts.filter(s => s.shift.type === type).length;
                if (count === 0) return null;
                const colors = getShiftColor(type);
                return (
                  <div key={type} className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: `${colors.bg}15` }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.bg }}></div>
                    <span className="text-[10px] text-[#F0EDE8] capitalize">{type}</span>
                    <span className="text-[10px] text-[#7A94AD]">({count})</span>
                  </div>
                );
              })}
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activeShifts.map(({ employee: emp, shift }) => {
                const colors = getShiftColor(shift.type);
                return (
                  <div key={emp.id} className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg hover:bg-[#1A2E45] transition-colors">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                      {emp.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#F0EDE8] truncate">{emp.name}</div>
                      <div className="text-xs text-[#7A94AD] capitalize">{shift.type}</div>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded-md text-[10px] font-['JetBrains_Mono'] font-medium flex-shrink-0"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {shift.type === 'off' ? 'Off' : shift.time}
                    </div>
                  </div>
                );
              })}
              {activeShifts.length === 0 && (
                <div className="text-center py-8">
                  <i className="ri-calendar-close-line text-3xl text-[#7A94AD]/50 mb-2"></i>
                  <div className="text-sm text-[#7A94AD]">No shifts scheduled</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tablet Bottom Sheet for Month Day Detail */}
        {selectedMonthDay && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 xl:hidden"
              onClick={() => setSelectedMonthDay(null)}
            ></div>
            <div
              className="fixed bottom-0 left-0 right-0 xl:hidden bg-[#142236] border-t border-white/[0.07] rounded-t-2xl p-4 md:p-6 z-50 max-h-[75vh] overflow-y-auto"
              style={{ animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="flex justify-center mb-3">
                <div className="w-12 h-1 bg-[#7A94AD]/30 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-['Syne'] font-semibold text-[#F0EDE8]">
                  {monthNames[currentMonth]} {selectedMonthDay}, {currentYear}
                </h3>
                <button
                  onClick={() => setSelectedMonthDay(null)}
                  className="w-8 h-8 flex items-center justify-center text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-lg font-['JetBrains_Mono'] font-semibold text-[#4ECBA0]">
                    {activeShifts.filter(s => s.shift.type === 'morning').length}
                  </div>
                  <div className="text-[10px] text-[#7A94AD]">Morning</div>
                </div>
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-lg font-['JetBrains_Mono'] font-semibold text-[#F5A623]">
                    {activeShifts.filter(s => s.shift.type === 'evening').length}
                  </div>
                  <div className="text-[10px] text-[#7A94AD]">Evening</div>
                </div>
                <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                  <div className="text-lg font-['JetBrains_Mono'] font-semibold text-[#E8604C]">
                    {activeShifts.filter(s => s.shift.type === 'night').length}
                  </div>
                  <div className="text-[10px] text-[#7A94AD]">Night</div>
                </div>
              </div>

              <div className="space-y-2">
                {activeShifts.map(({ employee: emp, shift }) => {
                  const colors = getShiftColor(shift.type);
                  return (
                    <div key={emp.id} className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                        {emp.initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#F0EDE8]">{emp.name}</div>
                        <div className="text-xs text-[#7A94AD] capitalize">{shift.type} shift</div>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-md text-xs font-['JetBrains_Mono'] font-medium flex-shrink-0"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {shift.type === 'off' ? 'Day Off' : shift.time}
                      </div>
                    </div>
                  );
                })}
                {activeShifts.length === 0 && (
                  <div className="text-center py-8">
                    <i className="ri-calendar-close-line text-3xl text-[#7A94AD]/50 mb-2"></i>
                    <div className="text-sm text-[#7A94AD]">No shifts scheduled</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // -----------------------------------------------------------------
  // Desktop grid (week view)
  // -----------------------------------------------------------------
  const renderDesktopGrid = () => (
    <>
      <div className="flex-1 bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="min-w-[700px]" role="grid">
          <table className="w-full">
            <thead>
              <tr role="row">
                <th className="text-left text-xs md:text-sm font-semibold text-[#7A94AD] pb-3 md:pb-4 pr-3 md:pr-4 sticky left-0 bg-[#142236] z-10">
                  Employee
                </th>
                {days.map((day, idx) => (
                  <th key={idx} className="text-center text-xs md:text-sm font-semibold text-[#7A94AD] pb-3 md:pb-4 px-1 md:px-2 min-w-[100px] md:min-w-[120px]" role="columnheader">
                    <div>{day.short} {day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const hasRowConflict = conflicts.some(c => c.employeeId === employee.id);
                return (
                  <tr 
                    key={employee.id} 
                    className={`border-t border-white/[0.07] transition-colors ${
                      hasRowConflict ? 'bg-[#E8604C]/5' : ''
                    }`} 
                    role="row"
                  >
                    <td className="py-2 md:py-3 pr-3 md:pr-4 sticky left-0 bg-[#142236] z-10" role="rowheader">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br ${employee.color} flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0`}>
                          {employee.initial}
                        </div>
                        <span className="text-[#F0EDE8] text-sm font-medium hidden md:inline" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {employee.name}
                        </span>
                      </div>
                    </td>
                    {days.map((day, dayIndex) => {
                      const shift = schedule[employee.id][dayIndex];
                      const colors = shift ? getShiftColor(shift.type) : null;
                      const isGenerated = shift?.isGenerated && !shift?.isConfirmed;
                      const isDragOver = dragOverCell?.employeeId === employee.id && dragOverCell?.dayIndex === dayIndex;
                      const isValidDrop = isDragOver && isValidDropTarget(employee.id, dayIndex);
                      const isConflict = isDragOver && isConflictingDrop(employee.id, dayIndex);
                      const cellHasConflict = hasConflict(employee.id, dayIndex);
                      const conflictSeverity = getConflictType(employee.id, dayIndex);
                      
                      return (
                        <td 
                          key={dayIndex} 
                          className="py-2 md:py-3 px-1 md:px-2" 
                          role="gridcell" 
                          tabIndex={0}
                          onDragOver={(e) => handleDragOver(e, employee.id, dayIndex)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, employee.id, dayIndex)}
                        >
                          {shift ? (
                            <div
                              draggable={shift.type !== 'off'}
                              onDragStart={(e) => handleDragStart(e, employee.id, dayIndex, shift)}
                              onDragEnd={handleDragEnd}
                              onClick={() => handleCellClick(employee.id, dayIndex)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCellClick(employee.id, dayIndex)}
                              className={`rounded-lg p-1.5 md:p-2 text-center transition-all hover:brightness-110 relative ${
                                shift.type !== 'off' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                              } ${
                                isGenerated ? 'ring-2 ring-[#9333EA] ring-offset-2 ring-offset-[#142236]' : ''
                              } ${
                                isDragOver && isValidDrop && !isConflict ? 'ring-2 ring-[#F5A623] ring-dashed animate-pulse' : ''
                              } ${
                                isDragOver && isConflict ? 'ring-2 ring-[#E8604C] ring-dashed animate-pulse' : ''
                              } ${
                                cellHasConflict && conflictSeverity === 'high' ? 'ring-2 ring-[#E8604C]' : ''
                              } ${
                                cellHasConflict && conflictSeverity === 'medium' ? 'ring-2 ring-[#F5A623]' : ''
                              }`}
                              style={{
                                backgroundColor: colors!.bg,
                                color: colors!.text
                              }}
                              aria-label={`${employee.name}, ${day}, ${shift ? shift.time : 'No shift'}`}
                            >
                              {shift.type === 'off' ? (
                                <span className="text-[10px] md:text-xs font-medium">Day Off</span>
                              ) : (
                                <span className="text-[10px] md:text-xs font-['JetBrains_Mono'] font-medium">{shift.time}</span>
                              )}
                              {isGenerated && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#9333EA] rounded-full border-2 border-[#142236]"></div>
                              )}
                              {cellHasConflict && (
                                <div className="absolute -top-1 -left-1 w-4 h-4 flex items-center justify-center">
                                  <i className={`ri-alert-fill text-xs ${
                                    conflictSeverity === 'high' ? 'text-[#E8604C]' : 'text-[#F5A623]'
                                  }`}></i>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              onClick={() => handleCellClick(employee.id, dayIndex)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCellClick(employee.id, dayIndex)}
                              onDragOver={(e) => handleDragOver(e, employee.id, dayIndex)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, employee.id, dayIndex)}
                              className={`rounded-lg p-1.5 md:p-2 border border-dashed transition-all cursor-pointer group ${
                                isDragOver && isValidDrop && !isConflict
                                  ? 'border-[#F5A623] bg-[#F5A623]/10 animate-pulse'
                                  : isDragOver && isConflict
                                  ? 'border-[#E8604C] bg-[#E8604C]/10 animate-pulse'
                                  : 'border-white/[0.1] hover:border-[#F5A623] hover:bg-[#F5A623]/5'
                              }`}
                              aria-label={`Add shift for ${employee.name} on ${day.full}`}
                            >
                              <div className="text-[#7A94AD] opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-center">
                                <i className="ri-add-line text-2xl text-[#7A94AD]"></i>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Desktop Shift Editor Panel */}
      {selectedCell && (
        <div className="hidden xl:block w-80 bg-[#142236] border border-white/[0.07] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Edit Shift</h3>
            <button
              onClick={() => setSelectedCell(null)}
              className="w-8 h-8 flex items-center justify-center text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer"
              aria-label="Close editor"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#7A94AD] mb-2">Employee</label>
            <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
              {(() => {
                const emp = employees.find(e => e.id === selectedCell.employee);
                return (
                  <>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${emp?.color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                      {emp?.initial}
                    </div>
                    <span className="text-sm text-[#F0EDE8]">{emp?.name}</span>
                  </>
                );
              })()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#7A94AD] mb-2">Date</label>
            <input
              type="text"
              value={selectedCell.day}
              readOnly
              className="w-full px-4 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">Start Time</label>
              <input
                type="time"
                defaultValue="09:00"
                className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono']"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">End Time</label>
              <input
                type="time"
                defaultValue="17:00"
                className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono']"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#7A94AD] mb-2">Shift Type</label>
            <select className="w-full px-4 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm cursor-pointer">
              <option>Morning (08:00-16:00)</option>
              <option>Evening (14:00-22:00)</option>
              <option>Night (16:00-00:00)</option>
              <option>Day Off</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#7A94AD] mb-2">Notes</label>
            <textarea
              rows={3}
              placeholder="Add any notes about this shift..."
              className="w-full px-4 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm resize-none"
            ></textarea>
          </div>

          <div className="flex items-center gap-2 p-3 bg-[#E8604C]/10 border border-[#E8604C]/20 rounded-lg">
            <i className="ri-alert-line text-[#E8604C] text-sm md:text-base"></i>
            <span className="text-[10px] md:text-xs text-[#E8604C]">Overlapping shift detected</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveShift}
              className="flex-1 px-4 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-save-line mr-2"></i>Save
            </button>
            <button
              onClick={handleDeleteShift}
              className="px-4 py-2.5 bg-[#E8604C]/10 hover:bg-[#E8604C]/20 text-[#E8604C] font-medium rounded-lg transition-colors cursor-pointer"
              aria-label="Delete shift"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      )}

      <SwapConfirmationToast />
      <DayOffReplacementModal />

      {/* Success Toast */}
      {showToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#4ECBA0] text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3"
          style={{ animation: 'slideDown 0.3s ease' }}
        >
          <i className="ri-checkbox-circle-fill text-xl"></i>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Bottom Bar */}
      {renderBottomBar()}
    </>
  );

  // -----------------------------------------------------------------
  // Mobile/Tablet Bottom Sheet (week view)
  // -----------------------------------------------------------------
  const renderMobileBottomSheet = () => (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 xl:hidden"
        onClick={() => setSelectedCell(null)}
      ></div>

      <div
        className="fixed bottom-0 left-0 right-0 xl:hidden bg-[#142236] border-t border-white/[0.07] rounded-t-2xl p-4 md:p-6 space-y-3 md:space-y-4 z-50 max-h-[85vh] overflow-y-auto"
        style={{
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-1 bg-[#7A94AD]/30 rounded-full"></div>
        </div>

        <div className="flex items-center justify-between mb-2 md:mb-4">
          <h3 className="text-base md:text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Edit Shift</h3>
          <button
            onClick={() => setSelectedCell(null)}
            className="w-8 h-8 flex items-center justify-center text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#7A94AD] mb-2">Employee</label>
          <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
            {(() => {
              const emp = employees.find(e => e.id === selectedCell?.employee);
              return (
                <>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${emp?.color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                    {emp?.initial}
                  </div>
                  <span className="text-sm text-[#F0EDE8]">{emp?.name}</span>
                </>
              );
            })()}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#7A94AD] mb-2">Date</label>
          <input
            type="text"
            value={selectedCell?.day ?? ""}
            readOnly
            className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div>
            <label className="block text-sm font-medium text-[#7A94AD] mb-2">Start Time</label>
            <input
              type="time"
              defaultValue="09:00"
              className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-xs md:text-sm font-['JetBrains_Mono']"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7A94AD] mb-2">End Time</label>
            <input
              type="time"
              defaultValue="17:00"
              className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-xs md:text-sm font-['JetBrains_Mono']"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#7A94AD] mb-2">Shift Type</label>
          <select className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm cursor-pointer">
            <option>Morning (08:00-16:00)</option>
            <option>Evening (14:00-22:00)</option>
            <option>Night (16:00-00:00)</option>
            <option>Day Off</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#7A94AD] mb-2">Notes</label>
          <textarea
            rows={3}
            placeholder="Add any notes about this shift..."
            className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm resize-none"
          ></textarea>
        </div>

        <div className="flex items-center gap-2 p-2 bg-[#E8604C]/10 border border-[#E8604C]/20 rounded-lg">
          <i className="ri-alert-line text-[#E8604C] text-sm"></i>
          <span className="text-[10px] text-[#E8604C]">Overlapping shift detected</span>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSaveShift}
            className="flex-1 px-3 py-2 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-save-line mr-1"></i>Save
          </button>
          <button
            onClick={handleDeleteShift}
            className="px-3 py-2 bg-[#E8604C]/10 hover:bg-[#E8604C]/20 text-[#E8604C] font-medium rounded-lg transition-colors cursor-pointer"
            aria-label="Delete shift"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
    </>
  );

  // -----------------------------------------------------------------
  // Bottom bar
  // -----------------------------------------------------------------
  const renderBottomBar = () => {
    const overtimeConflict = conflicts.find(c => c.type === 'overtime');
    const isOvertime = overtimeConflict !== undefined;
    
    return (
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-[#7A94AD]">
            {viewMode === 'week' ? 'Total hours this week' : `Total hours in ${monthNames[currentMonth]}`}
          </span>
          <span className={`text-xl md:text-2xl font-['JetBrains_Mono'] font-semibold transition-colors ${
            isOvertime ? 'text-[#E8604C]' : 'text-[#F0EDE8]'
          }`}>
            {viewMode === 'week' ? totalHours : animatedMonthHours}h
            {isOvertime && (
              <i className="ri-alert-fill text-base ml-2"></i>
            )}
          </span>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------
  // Main content selector
  // -----------------------------------------------------------------
  const renderMainContent = () => {
    return viewMode === 'month'
      ? mobileView === 'list'
        ? renderMobileMonthView()
        : renderMonthGrid()
      : mobileView === 'list'
        ? renderMobileDayList()
        : (
          <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
            {renderDesktopGrid()}
          </div>
        );
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Toast Notification */}
      {showToast && (
        <div 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#4ECBA0] text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slideDown"
          role="alert"
          aria-live="assertive"
        >
          <i className="ri-checkbox-circle-fill text-xl"></i>
          <span style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Schedule published! Employees notified.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#142236] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-['Syne'] font-bold text-[#F0EDE8] mb-1">Schedule Builder</h1>
            <p className="text-sm md:text-base text-[#7A94AD]">
              {viewMode === 'week' ? 'Plan and manage employee shifts' : `${monthNames[currentMonth]} ${currentYear} — Monthly Overview`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex bg-[#142236] border border-white/[0.07] rounded-lg p-1 col-span-2 sm:col-span-1">
              <button
                onClick={() => { setViewMode('week'); setSelectedMonthDay(null); }}
                className={`flex-1 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-[#F5A623] text-[#0A1628]'
                    : 'text-[#7A94AD] hover:text-[#F0EDE8]'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => { setViewMode('month'); setSelectedCell(null); }}
                className={`flex-1 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-[#F5A623] text-[#0A1628]'
                    : 'text-[#7A94AD] hover:text-[#F0EDE8]'
                }`}
              >
                Month
              </button>
            </div>

            <button
              onClick={() => viewMode === 'month' ? handlePrevMonth() : setCurrentWeekOffset(prev => prev - 1)}
              className="hidden md:flex items-center justify-center px-3 md:px-4 py-2 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors whitespace-nowrap text-xs md:text-sm cursor-pointer"
            >
              <i className="ri-arrow-left-line mr-1 md:mr-2"></i>Prev
            </button>

            <button
              onClick={() => viewMode === 'month' ? handleNextMonth() : setCurrentWeekOffset(prev => prev + 1)}
              className="hidden md:flex items-center justify-center px-3 md:px-4 py-2 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors whitespace-nowrap text-xs md:text-sm cursor-pointer"
            >
              Next<i className="ri-arrow-right-line ml-1 md:ml-2"></i>
            </button>

            <select className="px-3 md:px-4 py-2 md:py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors cursor-pointer text-xs md:text-sm col-span-2 sm:col-span-1">
              <option>All Employees</option>
              <option>Downtown Branch</option>
              <option>Westside Branch</option>
            </select>

            {viewMode === 'week' && (
              <>
                <button
                  onClick={() => setShowAutoScheduleModal(true)}
                  className="hidden md:flex items-center justify-center px-3 md:px-4 py-2 bg-[#142236] border border-[#9333EA] text-[#9333EA] rounded-lg hover:bg-[#9333EA]/10 transition-colors whitespace-nowrap text-xs md:text-sm cursor-pointer"
                >
                  <i className="ri-flashlight-line mr-1 md:mr-2"></i>
                  <span className="hidden sm:inline">Auto-Schedule</span>
                  <span className="sm:hidden">Auto</span>
                </button>

                {generatedShiftsCount > 0 && (
                  <>
                    <button
                      onClick={confirmAllShifts}
                      className="hidden md:flex items-center justify-center px-3 md:px-4 py-2 bg-[#4ECBA0] hover:bg-[#3BA886] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap text-xs md:text-sm cursor-pointer"
                    >
                      <i className="ri-checkbox-circle-line mr-1 md:mr-2"></i>
                      Confirm All ({generatedShiftsCount})
                    </button>
                    {scheduleHistory.length > 0 && (
                      <button
                        onClick={undoSchedule}
                        className="hidden md:flex items-center justify-center px-3 md:px-4 py-2 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors whitespace-nowrap text-xs md:text-sm cursor-pointer"
                      >
                        <i className="ri-arrow-go-back-line mr-1 md:mr-2"></i>Undo
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            <button className="hidden md:flex items-center justify-center px-3 md:px-4 py-2 bg-[#142236] border border-[#F5A623] text-[#F5A623] rounded-lg hover:bg-[#F5A623]/10 transition-colors whitespace-nowrap text-xs md:text-sm cursor-pointer">
              <i className="ri-save-line mr-1 md:mr-2"></i>
              <span className="hidden sm:inline">Save Template</span>
              <span className="sm:hidden">Save</span>
            </button>

            <button
              onClick={handlePublish}
              className="hidden md:flex items-center justify-center px-4 md:px-6 py-2 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap text-xs md:text-sm cursor-pointer"
            >
              <i className={`ri-send-plane-fill ${isPublishing ? 'animate-spin' : ''}`}></i>
              <span className="hidden sm:inline">Publish Schedule</span>
              <span className="sm:hidden">Publish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderMainContent()}

      {/* Mobile/Tablet Bottom Sheet Modal */}
      {selectedCell && mobileView === 'grid' && viewMode === 'week' && renderMobileBottomSheet()}

      {/* Auto-Schedule Modal */}
      {showAutoScheduleModal && <AutoScheduleModal />}

      {/* Conflict Panel */}
      <ConflictPanel />

      {/* Conflict Toggle Button */}
      <ConflictToggleButton />

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal />

      {/* Shift Editor - Desktop (Side Panel) */}
      {showEditor && selectedCell && !isMobile && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => {
              setShowEditor(false);
              setSelectedCell(null);
            }}
            aria-hidden="true"
          ></div>
          <div 
            className="fixed right-0 top-0 h-full w-[400px] bg-[#142236] border-l border-[rgba(255,255,255,0.07)] z-50 p-6 overflow-y-auto shadow-2xl animate-slideInRight"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
            <div className="w-12 h-1.5 bg-[#7A94AD]/30 rounded-full mx-auto mb-6"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Edit Shift</h3>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setSelectedCell(null);
                }}
                className="w-8 h-8 flex items-center justify-center text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer"
                aria-label="Close editor"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">Employee</label>
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                {(() => {
                  const emp = employees.find(e => e.id === selectedCell.employee);
                  return (
                    <>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${emp?.color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                        {emp?.initial}
                      </div>
                      <span className="text-sm text-[#F0EDE8]">{emp?.name}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">Date</label>
              <input
                type="text"
                value={selectedCell.day}
                readOnly
                className="w-full px-4 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#7A94AD] mb-2">Start Time</label>
                <input
                  type="time"
                  defaultValue="09:00"
                  className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono']"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#7A94AD] mb-2">End Time</label>
                <input
                  type="time"
                  defaultValue="17:00"
                  className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono']"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">Shift Type</label>
              <select className="w-full px-4 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm cursor-pointer">
                <option>Morning (08:00-16:00)</option>
                <option>Evening (14:00-22:00)</option>
                <option>Night (16:00-00:00)</option>
                <option>Day Off</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">Notes</label>
              <textarea
                rows={3}
                placeholder="Add any notes about this shift..."
                className="w-full px-4 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm resize-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-2 p-3 bg-[#E8604C]/10 border border-[#E8604C]/20 rounded-lg">
              <i className="ri-alert-line text-[#E8604C] text-sm md:text-base"></i>
              <span className="text-[10px] md:text-xs text-[#E8604C]">Overlapping shift detected</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveShift}
                className="flex-1 px-4 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-save-line mr-2"></i>Save
              </button>
              <button
                onClick={handleDeleteShift}
                className="px-4 py-2.5 bg-[#E8604C]/10 hover:bg-[#E8604C]/20 text-[#E8604C] font-medium rounded-lg transition-colors cursor-pointer"
                aria-label="Delete shift"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Shift Editor - Mobile (Bottom Sheet) */}
      {showEditor && selectedCell && isMobile && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => {
              setShowEditor(false);
              setSelectedCell(null);
            }}
            aria-hidden="true"
          ></div>
          <div 
            className="fixed bottom-0 left-0 right-0 bg-[#142236] rounded-t-3xl z-50 p-6 max-h-[65vh] overflow-y-auto shadow-2xl animate-slideUp"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
            <div className="w-12 h-1 bg-[#7A94AD]/30 rounded-full mx-auto mb-6"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Edit Shift</h3>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setSelectedCell(null);
                }}
                className="w-8 h-8 flex items-center justify-center text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer"
                aria-label="Close editor"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">Employee</label>
              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg">
                {(() => {
                  const emp = employees.find(e => e.id === selectedCell.employee);
                  return (
                    <>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${emp?.color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                        {emp?.initial}
                      </div>
                      <span className="text-sm text-[#F0EDE8]">{emp?.name}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">Date</label>
              <input
                type="text"
                value={selectedCell.day}
                readOnly
                className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#7A94AD] mb-2">Start Time</label>
                <input
                  type="time"
                  defaultValue="09:00"
                  className="w-full px-2 py-2 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono']"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#7A94AD] mb-2">End Time</label>
                <input
                  type="time"
                  defaultValue="17:00"
                  className="w-full px-2 py-2 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm font-['JetBrains_Mono']"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">Shift Type</label>
              <select className="w-full px-3 py-2 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm cursor-pointer">
                <option>Morning (08:00-16:00)</option>
                <option>Evening (14:00-22:00)</option>
                <option>Night (16:00-00:00)</option>
                <option>Day Off</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A94AD] mb-2">Notes</label>
              <textarea
                rows={3}
                placeholder="Add any notes about this shift..."
                className="w-full px-3 py-2 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm resize-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-2 p-2 bg-[#E8604C]/10 border border-[#E8604C]/20 rounded-lg">
              <i className="ri-alert-line text-[#E8604C] text-sm"></i>
              <span className="text-[10px] text-[#E8604C]">Overlapping shift detected</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveShift}
                className="flex-1 px-3 py-2 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-save-line mr-1"></i>Save
              </button>
              <button
                onClick={handleDeleteShift}
                className="px-3 py-2 bg-[#E8604C]/10 hover:bg-[#E8604C]/20 text-[#E8604C] font-medium rounded-lg transition-colors cursor-pointer"
                aria-label="Delete shift"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </>
      )}

      <SwapConfirmationToast />
      <DayOffReplacementModal />

      {/* Bottom Bar */}
      {renderBottomBar()}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to   { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease; }
        .animate-slideDown { animation: slideDown 0.3s ease; }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
        .animate-modalIn { animation: modalIn 0.2s ease-out; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
