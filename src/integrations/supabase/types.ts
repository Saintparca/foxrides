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
          route_polyline: string | null
          status: Database["public"]["Enums"]["ride_status"]
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
          route_polyline?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
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
          route_polyline?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
