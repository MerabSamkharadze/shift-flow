import type { UserRole } from "./database.types"

// ─── User profile as passed to dashboard ─────────────────────────────────────

export type DashboardUser = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  role: UserRole
  company_id: string
}

// ─── Per-view data shapes ────────────────────────────────────────────────────

export type DashboardViewData = {
  groups: { id: string; name: string; color: string }[]
  employeeCount: number
  publishedCount: number
  pendingSwaps: {
    id: string
    shift_id: string
    from_user_id: string
    to_user_id: string | null
    accepted_by: string | null
    requested_at: string | null
  }[]
  pendingCount: number
  scheduleGroupMap: Record<string, string>
  groupNameMap: Record<string, string>
  groupColorMap: Record<string, string>
  shiftDateMap: Record<string, string>
  todayShifts: {
    id: string
    schedule_id: string
    date: string
    start_time: string
    end_time: string
    assigned_to: string | null
  }[]
  weekShifts: {
    id: string
    schedule_id: string
    date: string
    start_time: string
    end_time: string
    assigned_to: string | null
  }[]
  userNameMap: Record<string, string>
  today: string
  shiftsThisWeek: number
  monthlyHours: number
}

export type EmployeesViewData = {
  employees: {
    id: string
    first_name: string
    last_name: string
    email: string
    is_active: boolean
    created_at: string
  }[]
}

export type ScheduleViewData = {
  groups: { id: string; name: string; color: string }[]
  members: { id: string; firstName: string; lastName: string }[]
  templates: { id: string; name: string; startTime: string; endTime: string; color: string }[]
  schedule: { id: string; status: string } | null
  shifts: {
    id: string
    userId: string
    date: string
    startTime: string
    endTime: string
    templateId: string | null
    notes: string | null
    extraHours: number | null
    extraHoursNotes: string | null
  }[]
  prevScheduleExists: boolean
}

export type ShiftTemplatesViewData = {
  groups: { id: string; name: string; color: string; shift_templates: { id: string }[]; group_members: { id: string }[] }[]
  templates: { id: string; name: string; start_time: string; end_time: string; color: string | null }[]
  selectedGroupId: string | null
}

export type MarketplaceViewData = {
  swaps: {
    id: string
    type: string
    status: string
    createdAt: string
    managerNote: string | null
    shiftDate: string
    shiftStart: string
    shiftEnd: string
    groupName: string
    requesterName: string
    recipientName: string | null
  }[]
}

export type MonthlyReportViewData = {
  rows: {
    employeeName: string
    regularHours: number
    extraHours: number
  }[]
  month: string
}

export type HoursSummaryViewData = {
  employees: {
    id: string
    name: string
    totalHours: number
    extraHours: number
    shiftCount: number
  }[]
  month: string
}

export type ManagersViewData = {
  managers: {
    id: string
    first_name: string
    last_name: string
    email: string
    is_active: boolean
    must_change_password: boolean
    created_at: string
  }[]
}

// ─── Discriminated union for viewData prop ───────────────────────────────────

export type ViewDataMap = {
  dashboard: DashboardViewData
  employees: EmployeesViewData
  "schedule-builder": ScheduleViewData
  "shift-templates": ShiftTemplatesViewData
  marketplace: MarketplaceViewData
  "monthly-report": MonthlyReportViewData
  "hours-summary": HoursSummaryViewData
  managers: ManagersViewData
  notifications: null
  settings: null
  billing: null
  branches: null
}

export type ViewName = keyof ViewDataMap
