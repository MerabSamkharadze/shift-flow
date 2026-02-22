export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "manager" | "employee"

export type ScheduleStatus = "draft" | "published" | "locked" | "archived"

export type SwapType = "direct" | "public"

export type SwapStatus =
  | "pending_employee"
  | "accepted_by_employee"
  | "pending_manager"
  | "approved"
  | "rejected_by_employee"
  | "rejected_by_manager"
  | "cancelled"
  | "expired"

export type ShiftStatus = "scheduled" | "completed" | "cancelled" | "pending_swap"

export type NotificationType =
  | "swap_request_received"
  | "swap_request_accepted"
  | "swap_request_rejected"
  | "swap_approved"
  | "swap_rejected_by_manager"
  | "public_swap_available"
  | "schedule_changed"
  | "new_schedule_published"

// ─── Database ─────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }

      users: {
        Row: {
          id: string
          company_id: string
          role: UserRole
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          must_change_password: boolean
          created_by: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          company_id: string
          role: UserRole
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          must_change_password?: boolean
          created_by?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          role?: UserRole
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          must_change_password?: boolean
          created_by?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }

      groups: {
        Row: {
          id: string
          company_id: string
          manager_id: string
          name: string
          color: string
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          manager_id: string
          name: string
          color?: string
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          manager_id?: string
          name?: string
          color?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_manager_id_fkey"
            columns: ["manager_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          assigned_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          assigned_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          assigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      shift_templates: {
        Row: {
          id: string
          group_id: string
          name: string
          start_time: string // "HH:MM:SS"
          end_time: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          start_time: string
          end_time: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          start_time?: string
          end_time?: string
          color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_templates_group_id_fkey"
            columns: ["group_id"]
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }

      schedules: {
        Row: {
          id: string
          company_id: string
          manager_id: string
          group_id: string
          week_start_date: string // "YYYY-MM-DD"
          week_end_date: string
          status: ScheduleStatus
          copied_from_schedule_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          manager_id: string
          group_id: string
          week_start_date: string
          week_end_date: string
          status?: ScheduleStatus
          copied_from_schedule_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          manager_id?: string
          group_id?: string
          week_start_date?: string
          week_end_date?: string
          status?: ScheduleStatus
          copied_from_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_group_id_fkey"
            columns: ["group_id"]
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_manager_id_fkey"
            columns: ["manager_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      shifts: {
        Row: {
          id: string
          schedule_id: string
          group_id: string
          assigned_to: string
          date: string // "YYYY-MM-DD"
          start_time: string // "HH:MM:SS"
          end_time: string
          shift_template_id: string | null
          is_manually_adjusted: boolean | null
          original_start_time: string | null
          original_end_time: string | null
          status: ShiftStatus
          notes: string | null
          created_by: string
          modified_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          group_id: string
          assigned_to: string
          date: string
          start_time: string
          end_time: string
          shift_template_id?: string | null
          is_manually_adjusted?: boolean | null
          original_start_time?: string | null
          original_end_time?: string | null
          status?: ShiftStatus
          notes?: string | null
          created_by: string
          modified_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          group_id?: string
          assigned_to?: string
          date?: string
          start_time?: string
          end_time?: string
          shift_template_id?: string | null
          is_manually_adjusted?: boolean | null
          original_start_time?: string | null
          original_end_time?: string | null
          status?: ShiftStatus
          notes?: string | null
          modified_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_schedule_id_fkey"
            columns: ["schedule_id"]
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_group_id_fkey"
            columns: ["group_id"]
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_shift_template_id_fkey"
            columns: ["shift_template_id"]
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }

      shift_swaps: {
        Row: {
          id: string
          shift_id: string
          from_user_id: string
          to_user_id: string | null      // direct: intended recipient; public: null
          type: SwapType
          status: SwapStatus
          accepted_by: string | null     // set when public swap is claimed
          approved_by: string | null     // set when manager approves
          manager_notes: string | null
          company_id: string | null
          requested_at: string | null
          employee_responded_at: string | null
          manager_responded_at: string | null
          deadline: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          shift_id: string
          from_user_id: string
          to_user_id?: string | null
          type: SwapType
          status?: SwapStatus
          accepted_by?: string | null
          approved_by?: string | null
          manager_notes?: string | null
          company_id?: string | null
          requested_at?: string | null
          employee_responded_at?: string | null
          manager_responded_at?: string | null
          deadline: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          shift_id?: string
          from_user_id?: string
          to_user_id?: string | null
          type?: SwapType
          status?: SwapStatus
          accepted_by?: string | null
          approved_by?: string | null
          manager_notes?: string | null
          company_id?: string | null
          employee_responded_at?: string | null
          manager_responded_at?: string | null
          deadline?: string
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_swaps_shift_id_fkey"
            columns: ["shift_id"]
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_from_user_id_fkey"
            columns: ["from_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_to_user_id_fkey"
            columns: ["to_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_accepted_by_fkey"
            columns: ["accepted_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          read: boolean | null
          related_shift_id: string | null
          related_swap_id: string | null
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          read?: boolean | null
          related_shift_id?: string | null
          related_swap_id?: string | null
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          message?: string
          read?: boolean | null
          related_shift_id?: string | null
          related_swap_id?: string | null
          action_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      activity_logs: {
        Row: {
          id: string
          company_id: string
          user_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          old_value: Json | null
          new_value: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }

    Views: Record<string, never>

    Functions: {
      get_my_company_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
    }

    Enums: {
      user_role: UserRole
      schedule_status: ScheduleStatus
      swap_type: SwapType
      swap_status: SwapStatus
      shift_status: ShiftStatus
      notification_type: NotificationType
    }
  }
}
