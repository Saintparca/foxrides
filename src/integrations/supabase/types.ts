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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          activation_fee: number
          base_fare: number
          cancel_fee: number
          comfort_multiplier: number
          driver_share: number
          id: boolean
          min_fare: number
          per_km: number
          per_min: number
          updated_at: string
          weekly_fee: number
        }
        Insert: {
          activation_fee?: number
          base_fare?: number
          cancel_fee?: number
          comfort_multiplier?: number
          driver_share?: number
          id?: boolean
          min_fare?: number
          per_km?: number
          per_min?: number
          updated_at?: string
          weekly_fee?: number
        }
        Update: {
          activation_fee?: number
          base_fare?: number
          cancel_fee?: number
          comfort_multiplier?: number
          driver_share?: number
          id?: boolean
          min_fare?: number
          per_km?: number
          per_min?: number
          updated_at?: string
          weekly_fee?: number
        }
        Relationships: []
      }
      driver_locations: {
        Row: {
          driver_id: string
          heading: number | null
          lat: number
          lng: number
          updated_at: string
        }
        Insert: {
          driver_id: string
          heading?: number | null
          lat: number
          lng: number
          updated_at?: string
        }
        Update: {
          driver_id?: string
          heading?: number | null
          lat?: number
          lng?: number
          updated_at?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          activation_paid: boolean
          approval_status: Database["public"]["Enums"]["driver_approval_status"]
          country: string
          created_at: string
          id: string
          insurance_url: string | null
          is_approved: boolean
          is_available: boolean
          last_weekly_payment_at: string | null
          license_number: string
          license_url: string | null
          omang_url: string | null
          profile_pic_url: string | null
          rejection_reason: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_plate: string
          vehicle_reg_url: string | null
          vehicle_year: number | null
        }
        Insert: {
          activation_paid?: boolean
          approval_status?: Database["public"]["Enums"]["driver_approval_status"]
          country?: string
          created_at?: string
          id: string
          insurance_url?: string | null
          is_approved?: boolean
          is_available?: boolean
          last_weekly_payment_at?: string | null
          license_number: string
          license_url?: string | null
          omang_url?: string | null
          profile_pic_url?: string | null
          rejection_reason?: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_plate: string
          vehicle_reg_url?: string | null
          vehicle_year?: number | null
        }
        Update: {
          activation_paid?: boolean
          approval_status?: Database["public"]["Enums"]["driver_approval_status"]
          country?: string
          created_at?: string
          id?: string
          insurance_url?: string | null
          is_approved?: boolean
          is_available?: boolean
          last_weekly_payment_at?: string | null
          license_number?: string
          license_url?: string | null
          omang_url?: string | null
          profile_pic_url?: string | null
          rejection_reason?: string | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_plate?: string
          vehicle_reg_url?: string | null
          vehicle_year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          times_used: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          times_used?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          times_used?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          code_id: string
          created_at: string
          id: string
          ride_id: string | null
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          ride_id?: string | null
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          ride_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          cancellation_fee: number
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          dest_lat: number | null
          dest_lng: number | null
          destination_address: string
          distance_km: number
          driver_id: string | null
          driver_lat: number | null
          driver_lng: number | null
          driver_loc_updated_at: string | null
          duration_min: number | null
          eta_at: string | null
          fare: number
          id: string
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          rating: number | null
          rating_comment: string | null
          ride_class: string
          route_polyline: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["ride_status"]
          stops: Json
        }
        Insert: {
          cancellation_fee?: number
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          dest_lat?: number | null
          dest_lng?: number | null
          destination_address: string
          distance_km: number
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          driver_loc_updated_at?: string | null
          duration_min?: number | null
          eta_at?: string | null
          fare: number
          id?: string
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rating?: number | null
          rating_comment?: string | null
          ride_class?: string
          route_polyline?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          stops?: Json
        }
        Update: {
          cancellation_fee?: number
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          dest_lat?: number | null
          dest_lng?: number | null
          destination_address?: string
          distance_km?: number
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          driver_loc_updated_at?: string | null
          duration_min?: number | null
          eta_at?: string | null
          fare?: number
          id?: string
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rating?: number | null
          rating_comment?: string | null
          ride_class?: string
          route_polyline?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          stops?: Json
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          address: string
          created_at: string
          id: string
          kind: string
          label: string
          lat: number | null
          lng: number | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          kind?: string
          label: string
          lat?: number | null
          lng?: number | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          kind?: string
          label?: string
          lat?: number | null
          lng?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          driver_id: string
          id: string
          note: string | null
          processed_at: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          driver_id: string
          id?: string
          note?: string | null
          processed_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          driver_id?: string
          id?: string
          note?: string | null
          processed_at?: string | null
          status?: string
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
      app_role: "customer" | "driver" | "admin"
      driver_approval_status: "pending" | "approved" | "rejected" | "suspended"
      ride_status:
        | "requested"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
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
  public: {
    Enums: {
      app_role: ["customer", "driver", "admin"],
      driver_approval_status: ["pending", "approved", "rejected", "suspended"],
      ride_status: [
        "requested",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
