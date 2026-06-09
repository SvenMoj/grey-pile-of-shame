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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
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
      armies: {
        Row: {
          created_at: string
          game: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversion_evidence_photos: {
        Row: {
          caption: string | null
          conversion_id: string
          created_at: string
          id: string
          photo_url: string
        }
        Insert: {
          caption?: string | null
          conversion_id: string
          created_at?: string
          id?: string
          photo_url: string
        }
        Update: {
          caption?: string | null
          conversion_id?: string
          created_at?: string
          id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_evidence_photos_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "conversions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversions: {
        Row: {
          confidence: number
          created_at: string
          disputed_count: number
          id: string
          notes: string | null
          paint_a_id: string
          paint_b_id: string
          source_type: string
          source_url: string | null
          updated_at: string
          verified_count: number
        }
        Insert: {
          confidence: number
          created_at?: string
          disputed_count?: number
          id?: string
          notes?: string | null
          paint_a_id: string
          paint_b_id: string
          source_type: string
          source_url?: string | null
          updated_at?: string
          verified_count?: number
        }
        Update: {
          confidence?: number
          created_at?: string
          disputed_count?: number
          id?: string
          notes?: string | null
          paint_a_id?: string
          paint_b_id?: string
          source_type?: string
          source_url?: string | null
          updated_at?: string
          verified_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversions_paint_a_id_fkey"
            columns: ["paint_a_id"]
            isOneToOne: false
            referencedRelation: "paints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_paint_b_id_fkey"
            columns: ["paint_b_id"]
            isOneToOne: false
            referencedRelation: "paints"
            referencedColumns: ["id"]
          },
        ]
      }
      miniature_items: {
        Row: {
          created_at: string
          display_name: string
          faction: string | null
          game: string | null
          id: string
          image_url: string | null
          kit_id: string | null
          painted_at: string | null
          point_value: number | null
          state: string
          unit_id: string | null
          unit_size: number
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          display_name: string
          faction?: string | null
          game?: string | null
          id?: string
          image_url?: string | null
          kit_id?: string | null
          painted_at?: string | null
          point_value?: number | null
          state?: string
          unit_id?: string | null
          unit_size?: number
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          faction?: string | null
          game?: string | null
          id?: string
          image_url?: string | null
          kit_id?: string | null
          painted_at?: string | null
          point_value?: number | null
          state?: string
          unit_id?: string | null
          unit_size?: number
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "miniature_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      paints: {
        Row: {
          b: number | null
          brand: string
          created_at: string
          discontinued_date: string | null
          g: number | null
          hex: string | null
          id: string
          lab_a: number | null
          lab_b: number | null
          lab_l: number | null
          name: string
          r: number | null
          range: string | null
          size_ml: number | null
          sku_code: string | null
          status: string
          type: string | null
          updated_at: string
          version: number
        }
        Insert: {
          b?: number | null
          brand: string
          created_at?: string
          discontinued_date?: string | null
          g?: number | null
          hex?: string | null
          id: string
          lab_a?: number | null
          lab_b?: number | null
          lab_l?: number | null
          name: string
          r?: number | null
          range?: string | null
          size_ml?: number | null
          sku_code?: string | null
          status?: string
          type?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          b?: number | null
          brand?: string
          created_at?: string
          discontinued_date?: string | null
          g?: number | null
          hex?: string | null
          id?: string
          lab_a?: number | null
          lab_b?: number | null
          lab_l?: number | null
          name?: string
          r?: number | null
          range?: string | null
          size_ml?: number | null
          sku_code?: string | null
          status?: string
          type?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deletion_requested_at: string | null
          display_name: string | null
          hidden_brands: string[]
          id: string
          instagram_handle: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          hidden_brands?: string[]
          id: string
          instagram_handle?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          hidden_brands?: string[]
          id?: string
          instagram_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          project_id: string
          sort_order: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          project_id: string
          sort_order: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          project_id?: string
          sort_order?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_recipes: {
        Row: {
          area: string
          created_at: string
          id: string
          note: string | null
          project_id: string
          recipe_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          note?: string | null
          project_id: string
          recipe_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          note?: string | null
          project_id?: string
          recipe_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_recipes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          author_user_id: string
          body: string | null
          created_at: string
          faction: string | null
          game: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_user_id: string
          body?: string | null
          created_at?: string
          faction?: string | null
          game?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          body?: string | null
          created_at?: string
          faction?: string | null
          game?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipe_applications: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          miniature_item_id: string
          recipe_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          miniature_item_id: string
          recipe_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          miniature_item_id?: string
          recipe_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_applications_miniature_item_id_fkey"
            columns: ["miniature_item_id"]
            isOneToOne: false
            referencedRelation: "miniature_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_applications_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          recipe_id: string
          sort_order: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          recipe_id: string
          sort_order: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          recipe_id?: string
          sort_order?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_images_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_step_paints: {
        Row: {
          created_at: string
          hex: string | null
          id: string
          paint_id: string | null
          position: number
          ratio: number
          step_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hex?: string | null
          id?: string
          paint_id?: string | null
          position: number
          ratio?: number
          step_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hex?: string | null
          id?: string
          paint_id?: string | null
          position?: number
          ratio?: number
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_step_paints_paint_id_fkey"
            columns: ["paint_id"]
            isOneToOne: false
            referencedRelation: "paints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_step_paints_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "recipe_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          area_note: string | null
          created_at: string
          id: string
          recipe_id: string
          role: string
          step_order: number
          technique_note: string | null
          updated_at: string
        }
        Insert: {
          area_note?: string | null
          created_at?: string
          id?: string
          recipe_id: string
          role: string
          step_order: number
          technique_note?: string | null
          updated_at?: string
        }
        Update: {
          area_note?: string | null
          created_at?: string
          id?: string
          recipe_id?: string
          role?: string
          step_order?: number
          technique_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          author_user_id: string
          created_at: string
          description: string | null
          id: string
          source_type: string | null
          source_url: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_user_id: string
          created_at?: string
          description?: string | null
          id?: string
          source_type?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
          source_type?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          email_verified_at: string | null
          id: string
          notes: string | null
          paint_a_id: string
          paint_b_id: string
          photo_url: string | null
          reviewed_at: string | null
          status: string
          submitter_email: string
        }
        Insert: {
          created_at?: string
          email_verified_at?: string | null
          id?: string
          notes?: string | null
          paint_a_id: string
          paint_b_id: string
          photo_url?: string | null
          reviewed_at?: string | null
          status?: string
          submitter_email: string
        }
        Update: {
          created_at?: string
          email_verified_at?: string | null
          id?: string
          notes?: string | null
          paint_a_id?: string
          paint_b_id?: string
          photo_url?: string | null
          reviewed_at?: string | null
          status?: string
          submitter_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_paint_a_id_fkey"
            columns: ["paint_a_id"]
            isOneToOne: false
            referencedRelation: "paints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_paint_b_id_fkey"
            columns: ["paint_b_id"]
            isOneToOne: false
            referencedRelation: "paints"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          army_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          army_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          army_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_army_id_fkey"
            columns: ["army_id"]
            isOneToOne: false
            referencedRelation: "armies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_paints: {
        Row: {
          added_at: string
          catalog_paint_id: string | null
          custom_brand: string | null
          custom_hex: string | null
          custom_name: string | null
          id: string
          quantity: number
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          catalog_paint_id?: string | null
          custom_brand?: string | null
          custom_hex?: string | null
          custom_name?: string | null
          id?: string
          quantity?: number
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          catalog_paint_id?: string | null
          custom_brand?: string | null
          custom_hex?: string | null
          custom_name?: string | null
          id?: string
          quantity?: number
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_paints_catalog_paint_id_fkey"
            columns: ["catalog_paint_id"]
            isOneToOne: false
            referencedRelation: "paints"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      brand_overview: {
        Args: never
        Returns: {
          brand: string
          paint_count: number
          range_count: number
          sample_hexes: string[]
        }[]
      }
      brand_pair_conversion_counts: {
        Args: never
        Returns: {
          brand_a: string
          brand_b: string
          n: number
        }[]
      }
      paint_brands: { Args: never; Returns: string[] }
      paints_by_brand: {
        Args: { p_brand: string }
        Returns: {
          b: number | null
          brand: string
          created_at: string
          discontinued_date: string | null
          g: number | null
          hex: string | null
          id: string
          lab_a: number | null
          lab_b: number | null
          lab_l: number | null
          name: string
          r: number | null
          range: string | null
          size_ml: number | null
          sku_code: string | null
          status: string
          type: string | null
          updated_at: string
          version: number
        }[]
        SetofOptions: {
          from: "*"
          to: "paints"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      reorder_recipe_images: {
        Args: { p_ordered_ids: string[]; p_recipe_id: string }
        Returns: undefined
      }
      reorder_recipe_steps: {
        Args: { p_ordered_ids: string[]; p_recipe_id: string }
        Returns: undefined
      }
      save_recipe_steps: {
        Args: { p_recipe_id: string; p_steps: Json }
        Returns: undefined
      }
      search_paints: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          brand: string
          hex: string
          id: string
          name: string
          range: string
        }[]
      }
      search_recipes: {
        Args: { result_limit?: number; search_query?: string }
        Returns: {
          author_user_id: string
          cover_image_url: string
          id: string
          step_count: number
          title: string
          visibility: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
