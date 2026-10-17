export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      care_game_rounds: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          initial_order: number[]
          kind: string
          rewarded_finds: number[]
          size: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          initial_order?: number[]
          kind: string
          rewarded_finds?: number[]
          size?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          initial_order?: number[]
          kind?: string
          rewarded_finds?: number[]
          size?: number
          user_id?: string
        }
        Relationships: []
      }
      code_redemptions: {
        Row: {
          code_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "organization_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          expiration_date: string
          id: string
          is_active: boolean
          max_uses: number
          organization_name: string
          owner_user_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          expiration_date: string
          id?: string
          is_active?: boolean
          max_uses?: number
          organization_name: string
          owner_user_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          expiration_date?: string
          id?: string
          is_active?: boolean
          max_uses?: number
          organization_name?: string
          owner_user_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      point_credits: {
        Row: {
          created_at: string
          id: string
          points: number
          reference: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reference: string
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reference?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          daily_care_claimed: boolean
          full_energy_bonus: boolean
          last_care_claim_date: string | null
          last_energy_drain: string
          monere_energy: number
          tokens: number
          user_id: string
        }
        Insert: {
          daily_care_claimed?: boolean
          full_energy_bonus?: boolean
          last_care_claim_date?: string | null
          last_energy_drain?: string
          monere_energy?: number
          tokens?: number
          user_id: string
        }
        Update: {
          daily_care_claimed?: boolean
          full_energy_bonus?: boolean
          last_care_claim_date?: string | null
          last_energy_drain?: string
          monere_energy?: number
          tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      token_credits: {
        Row: {
          created_at: string
          id: string
          reference: string
          source: string
          tokens: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reference: string
          source: string
          tokens: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reference?: string
          source?: string
          tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      user_properties: {
        Row: {
          active_property: string
          unlocked_properties: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active_property?: string
          unlocked_properties?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active_property?: string
          unlocked_properties?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      care_apply: { Args: { p_action?: string }; Returns: Json }
      care_finish_round: {
        Args: { p_proof: Json; p_round: string }
        Returns: Json
      }
      care_full_bonus: { Args: never; Returns: number }
      care_reward_find: {
        Args: { p_round: string; p_spot: number }
        Returns: Json
      }
      care_start_round: {
        Args: { p_kind: string; p_size?: number }
        Returns: Json
      }
      is_premium: { Args: { check_env: string }; Returns: boolean }
      redeem_org_code: {
        Args: { p_code: string }
        Returns: {
          ok: boolean
          organization_name: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
