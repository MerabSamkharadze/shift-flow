export type {
  Database,
  Json,
  UserRole,
  ScheduleStatus,
  SwapType,
  SwapStatus,
  NotificationType,
} from "./database.types"

import type { Database } from "./database.types"

type Tables = Database["public"]["Tables"]

// ─── Row types ────────────────────────────────────────────────────────────────

export type Company = Tables["companies"]["Row"]
export type UserProfile = Tables["users"]["Row"]
export type Group = Tables["groups"]["Row"]
export type ShiftTemplate = Tables["shift_templates"]["Row"]
export type GroupMember = Tables["group_members"]["Row"]
export type Schedule = Tables["schedules"]["Row"]
export type Shift = Tables["shifts"]["Row"]
export type ShiftSwap = Tables["shift_swaps"]["Row"]
export type Notification = Tables["notifications"]["Row"]
export type ActivityLog = Tables["activity_logs"]["Row"]

// ─── Insert types ─────────────────────────────────────────────────────────────

export type UserProfileInsert = Tables["users"]["Insert"]
export type GroupInsert = Tables["groups"]["Insert"]
export type ShiftTemplateInsert = Tables["shift_templates"]["Insert"]
export type GroupMemberInsert = Tables["group_members"]["Insert"]
export type ScheduleInsert = Tables["schedules"]["Insert"]
export type ShiftInsert = Tables["shifts"]["Insert"]
export type ShiftSwapInsert = Tables["shift_swaps"]["Insert"]
export type NotificationInsert = Tables["notifications"]["Insert"]
export type ActivityLogInsert = Tables["activity_logs"]["Insert"]

// ─── Update types ─────────────────────────────────────────────────────────────

export type UserProfileUpdate = Tables["users"]["Update"]
export type GroupUpdate = Tables["groups"]["Update"]
export type ShiftTemplateUpdate = Tables["shift_templates"]["Update"]
export type ScheduleUpdate = Tables["schedules"]["Update"]
export type ShiftUpdate = Tables["shifts"]["Update"]
export type ShiftSwapUpdate = Tables["shift_swaps"]["Update"]

// ─── Enriched / joined types ──────────────────────────────────────────────────

export type ShiftWithUser = Shift & {
  user: Pick<UserProfile, "id" | "first_name" | "last_name" | "email">
}

export type ShiftWithSwap = Shift & {
  shift_swaps: ShiftSwap[]
}

export type ShiftSwapWithDetails = ShiftSwap & {
  shift: Shift
  requester: Pick<UserProfile, "id" | "first_name" | "last_name">
  recipient: Pick<UserProfile, "id" | "first_name" | "last_name"> | null
}

export type GroupWithTemplates = Group & {
  shift_templates: ShiftTemplate[]
}

export type GroupWithMembers = Group & {
  members: UserProfile[]
  shift_templates: ShiftTemplate[]
}

export type ScheduleWithShifts = Schedule & {
  shifts: ShiftWithUser[]
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** The authenticated user + their profile row */
export type AuthUser = {
  id: string
  email: string
  profile: UserProfile
}
