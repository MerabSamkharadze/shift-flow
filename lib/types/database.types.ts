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
  | "pending"
  | "accepted"
  | "approved"
  | "rejected"
  | "expired"

export type NotificationType =
  | "swap_requested"
  | "swap_accepted"
  | "swap_rejected"
  | "swap_approved"
  | "swap_expired"
  | "schedule_published"
  | "schedule_locked"
  | "shift_reminder"

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
          first_name: string
          last_name: string
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
          first_name: string
          last_name: string
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
          first_name?: string
          last_name?: string
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
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          manager_id: string
          name: string
          color?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          manager_id?: string
          name?: string
          color?: string
          description?: string | null
          updated_at?: string
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

      shift_templates: {
        Row: {
          id: string
          group_id: string
          name: string
          start_time: string // "HH:MM:SS"
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          start_time: string
          end_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          start_time?: string
          end_time?: string
          updated_at?: string
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

      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          joined_at?: string
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

      schedules: {
        Row: {
          id: string
          group_id: string
          week_start: string // "YYYY-MM-DD"
          week_end: string
          status: ScheduleStatus
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          week_start: string
          week_end: string
          status?: ScheduleStatus
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          week_start?: string
          week_end?: string
          status?: ScheduleStatus
          created_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_group_id_fkey"
            columns: ["group_id"]
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      shifts: {
        Row: {
          id: string
          schedule_id: string
          user_id: string
          template_id: string | null
          date: string // "YYYY-MM-DD"
          start_time: string // "HH:MM:SS"
          end_time: string
          is_manually_adjusted: boolean
          original_start_time: string | null
          original_end_time: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          user_id: string
          template_id?: string | null
          date: string
          start_time: string
          end_time: string
          is_manually_adjusted?: boolean
          original_start_time?: string | null
          original_end_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          user_id?: string
          template_id?: string | null
          date?: string
          start_time?: string
          end_time?: string
          is_manually_adjusted?: boolean
          original_start_time?: string | null
          original_end_time?: string | null
          notes?: string | null
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
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_template_id_fkey"
            columns: ["template_id"]
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }

      shift_swaps: {
        Row: {
          id: string
          shift_id: string
          requester_id: string
          recipient_id: string | null
          type: SwapType
          status: SwapStatus
          deadline: string // ISO timestamp
          manager_id: string | null
          manager_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          requester_id: string
          recipient_id?: string | null
          type: SwapType
          status?: SwapStatus
          deadline: string
          manager_id?: string | null
          manager_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shift_id?: string
          requester_id?: string
          recipient_id?: string | null
          type?: SwapType
          status?: SwapStatus
          deadline?: string
          manager_id?: string | null
          manager_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swaps_shift_id_fkey"
            columns: ["shift_id"]
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_requester_id_fkey"
            columns: ["requester_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_recipient_id_fkey"
            columns: ["recipient_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_manager_id_fkey"
            columns: ["manager_id"]
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
          body: string
          read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          body: string
          read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          body?: string
          read?: boolean
          metadata?: Json | null
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
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          action?: string
          details?: Json | null
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
      notification_type: NotificationType
    }
  }
}
