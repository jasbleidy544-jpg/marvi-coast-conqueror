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
      check_ins: {
        Row: {
          created_at: string
          id: string
          user_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badge: string | null
          brand_name: string | null
          brand_tagline: string | null
          created_at: string
          display_name: string
          handle: string | null
          id: string
          total_tons: number
          updated_at: string
          zones_owned: number
        }
        Insert: {
          avatar_url?: string | null
          badge?: string | null
          brand_name?: string | null
          brand_tagline?: string | null
          created_at?: string
          display_name: string
          handle?: string | null
          id: string
          total_tons?: number
          updated_at?: string
          zones_owned?: number
        }
        Update: {
          avatar_url?: string | null
          badge?: string | null
          brand_name?: string | null
          brand_tagline?: string | null
          created_at?: string
          display_name?: string
          handle?: string | null
          id?: string
          total_tons?: number
          updated_at?: string
          zones_owned?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          kilos: number
          notes: string | null
          photo_url: string | null
          user_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kilos: number
          notes?: string | null
          photo_url?: string | null
          user_id: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kilos?: number
          notes?: string | null
          photo_url?: string | null
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_adoptions: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          message: string | null
          sponsor_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          message?: string | null
          sponsor_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          message?: string | null
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_adoptions_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      zones: {
        Row: {
          conquered_with_tons: number | null
          created_at: string
          description: string | null
          guardian_id: string | null
          hazard_level: number
          id: string
          kind: Database["public"]["Enums"]["zone_kind"]
          last_visit: string | null
          lat: number
          lng: number
          meters: number
          name: string
          radius_m: number
          status: Database["public"]["Enums"]["zone_status"]
          streak: number
          total_tons_collected: number
        }
        Insert: {
          conquered_with_tons?: number | null
          created_at?: string
          description?: string | null
          guardian_id?: string | null
          hazard_level?: number
          id?: string
          kind?: Database["public"]["Enums"]["zone_kind"]
          last_visit?: string | null
          lat: number
          lng: number
          meters: number
          name: string
          radius_m?: number
          status?: Database["public"]["Enums"]["zone_status"]
          streak?: number
          total_tons_collected?: number
        }
        Update: {
          conquered_with_tons?: number | null
          created_at?: string
          description?: string | null
          guardian_id?: string | null
          hazard_level?: number
          id?: string
          kind?: Database["public"]["Enums"]["zone_kind"]
          last_visit?: string | null
          lat?: number
          lng?: number
          meters?: number
          name?: string
          radius_m?: number
          status?: Database["public"]["Enums"]["zone_status"]
          streak?: number
          total_tons_collected?: number
        }
        Relationships: [
          {
            foreignKeyName: "zones_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_in_zone: {
        Args: { _lat?: number; _lng?: number; _zone_id: string }
        Returns: Json
      }
      claim_territory: {
        Args: {
          _kind?: string
          _lat: number
          _lng: number
          _name: string
          _radius_m?: number
        }
        Returns: Json
      }
      conquer_zone: { Args: { _zone_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      haversine_m: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      report_cleanup: {
        Args: {
          _kilos: number
          _lat?: number
          _lng?: number
          _notes: string
          _photo_url: string
          _zone_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "guardian" | "sponsor" | "admin"
      zone_kind: "coastal" | "urban" | "rural"
      zone_status: "critical" | "vulnerable" | "protected"
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
      app_role: ["guardian", "sponsor", "admin"],
      zone_kind: ["coastal", "urban", "rural"],
      zone_status: ["critical", "vulnerable", "protected"],
    },
  },
} as const
