export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  audit: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          after: Json | null
          before: Json | null
          id: string
          ip: unknown
          metadata: Json
          occurred_at: string
          organization_id: string | null
          project_id: string | null
          request_id: string
          session_id: string | null
          source: string
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          after?: Json | null
          before?: Json | null
          id?: string
          ip?: unknown
          metadata?: Json
          occurred_at?: string
          organization_id?: string | null
          project_id?: string | null
          request_id: string
          session_id?: string | null
          source: string
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          after?: Json | null
          before?: Json | null
          id?: string
          ip?: unknown
          metadata?: Json
          occurred_at?: string
          organization_id?: string | null
          project_id?: string | null
          request_id?: string
          session_id?: string | null
          source?: string
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          revoked_at: string | null
          role: string
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          revoked_at?: string | null
          role: string
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          revoked_at?: string | null
          role?: string
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          job_title: string | null
          joined_at: string | null
          organization_id: string
          removal_reason: string | null
          removed_at: string | null
          role: string
          status: string
          suspended_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          job_title?: string | null
          joined_at?: string | null
          organization_id: string
          removal_reason?: string | null
          removed_at?: string | null
          role: string
          status?: string
          suspended_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          job_title?: string | null
          joined_at?: string | null
          organization_id?: string
          removal_reason?: string | null
          removed_at?: string | null
          role?: string
          status?: string
          suspended_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_ownership_transfers: {
        Row: {
          created_at: string
          expires_at: string
          from_user: string
          id: string
          initiated_at: string
          organization_id: string
          responded_at: string | null
          status: string
          to_user: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          from_user: string
          id?: string
          initiated_at?: string
          organization_id: string
          responded_at?: string | null
          status?: string
          to_user: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          from_user?: string
          id?: string
          initiated_at?: string
          organization_id?: string
          responded_at?: string | null
          status?: string
          to_user?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_ownership_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived_at: string | null
          created_at: string
          default_locale: string
          deletion_requested_at: string | null
          display_name: string
          id: string
          legal_name: string | null
          logo_url: string | null
          onboarding_status: string
          primary_domain: string | null
          requires_mfa: boolean
          slug: string
          status: string
          suspended_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          default_locale?: string
          deletion_requested_at?: string | null
          display_name: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          onboarding_status?: string
          primary_domain?: string | null
          requires_mfa?: boolean
          slug: string
          status?: string
          suspended_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          default_locale?: string
          deletion_requested_at?: string | null
          display_name?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          onboarding_status?: string
          primary_domain?: string | null
          requires_mfa?: boolean
          slug?: string
          status?: string
          suspended_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          density: string
          locale: string
          theme: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          density?: string
          locale?: string
          theme?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          density?: string
          locale?: string
          theme?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_status: string
          phone: string | null
          preferred_name: string | null
          recovery_codes_hash: string[]
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          onboarding_status?: string
          phone?: string | null
          preferred_name?: string | null
          recovery_codes_hash?: string[]
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_status?: string
          phone?: string | null
          preferred_name?: string | null
          recovery_codes_hash?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      user_security_events: {
        Row: {
          event_type: string
          id: string
          ip: unknown
          metadata: Json
          occurred_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          event_type: string
          id?: string
          ip?: unknown
          metadata?: Json
          occurred_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          event_type?: string
          id?: string
          ip?: unknown
          metadata?: Json
          occurred_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { raw_token: string }
        Returns: {
          membership_id: string
          organization_id: string
        }[]
      }
      archive_organization: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      cancel_organization_deletion: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      cancel_ownership_transfer: {
        Args: { target_transfer_id: string }
        Returns: undefined
      }
      change_member_role: {
        Args: { target_membership_id: string; target_role: string }
        Returns: undefined
      }
      complete_ownership_transfer: {
        Args: { target_transfer_id: string }
        Returns: undefined
      }
      consume_recovery_code_hash: {
        Args: { target_hash: string }
        Returns: boolean
      }
      create_invitation: {
        Args: {
          target_email: string
          target_organization_id: string
          target_role: string
        }
        Returns: {
          invitation_id: string
          token: string
        }[]
      }
      create_organization_with_owner: {
        Args: { target_display_name: string }
        Returns: string
      }
      current_user_id: { Args: never; Returns: string }
      database_health_check: { Args: never; Returns: boolean }
      ensure_profile: {
        Args: never
        Returns: {
          account_status: string
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_status: string
          phone: string | null
          preferred_name: string | null
          recovery_codes_hash: string[]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "user_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_invitation_preview: {
        Args: { raw_token: string }
        Returns: {
          invitation_email: string
          invitation_role: string
          invitation_state: string
          organization_name: string
        }[]
      }
      get_organization_audit: {
        Args: {
          before_time?: string
          result_limit?: number
          target_organization_id: string
        }
        Returns: Database["audit"]["Tables"]["audit_events"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "audit_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_organization_invitations: {
        Args: { target_organization_id: string }
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          role: string
          status: string
        }[]
      }
      get_organization_members: {
        Args: { target_organization_id: string }
        Returns: {
          display_name: string
          email: string
          job_title: string
          joined_at: string
          membership_id: string
          role: string
          status: string
          user_id: string
        }[]
      }
      has_org_permission: {
        Args: { permission: string; target_organization_id: string }
        Returns: boolean
      }
      has_org_role: {
        Args: { allowed_roles: string[]; target_organization_id: string }
        Returns: boolean
      }
      initiate_ownership_transfer: {
        Args: { target_organization_id: string; target_user_id: string }
        Returns: string
      }
      is_org_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_platform_support: { Args: never; Returns: boolean }
      leave_organization: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      platform_get_security_events: {
        Args: { reason: string; result_limit?: number }
        Returns: {
          event_type: string
          id: string
          ip: unknown
          metadata: Json
          occurred_at: string
          user_agent: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_security_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      platform_suspend_organization: {
        Args: { reason: string; target_organization_id: string }
        Returns: undefined
      }
      platform_suspend_user: {
        Args: { reason: string; target_user_id: string }
        Returns: undefined
      }
      reactivate_member: {
        Args: { target_membership_id: string }
        Returns: undefined
      }
      record_identity_event: {
        Args: { target_action: string; target_metadata?: Json }
        Returns: string
      }
      record_user_security_event: {
        Args: {
          target_event_type: string
          target_ip?: unknown
          target_metadata?: Json
          target_user_agent?: string
          target_user_id: string
        }
        Returns: string
      }
      remove_member: {
        Args: { target_membership_id: string }
        Returns: undefined
      }
      replace_recovery_code_hashes: {
        Args: { target_hashes: string[] }
        Returns: undefined
      }
      request_account_deletion: {
        Args: { confirmation: string }
        Returns: undefined
      }
      request_organization_deletion: {
        Args: { confirmation: string; target_organization_id: string }
        Returns: undefined
      }
      resend_invitation: {
        Args: { target_invitation_id: string }
        Returns: string
      }
      revoke_invitation: {
        Args: { target_invitation_id: string }
        Returns: undefined
      }
      slugify: { Args: { value: string }; Returns: string }
      suspend_member: {
        Args: { target_membership_id: string }
        Returns: undefined
      }
      update_organization_identity: {
        Args: {
          target_display_name: string
          target_locale: string
          target_organization_id: string
          target_timezone: string
        }
        Returns: undefined
      }
      write_audit_event: {
        Args: {
          p_action: string
          p_actor_id?: string
          p_actor_type: string
          p_after?: Json
          p_before?: Json
          p_ip?: unknown
          p_metadata?: Json
          p_organization_id?: string
          p_project_id?: string
          p_request_id: string
          p_session_id?: string
          p_source: string
          p_target_id?: string
          p_target_type: string
          p_user_agent?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  audit: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
