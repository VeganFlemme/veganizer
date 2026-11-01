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
      category_factors: {
        Row: {
          category: string
          high: number | null
          id: number
          indicator_id: string
          low: number | null
          notes: string | null
          source_id: string
          unit_basis: string
          value: number
        }
        Insert: {
          category: string
          high?: number | null
          id?: never
          indicator_id: string
          low?: number | null
          notes?: string | null
          source_id: string
          unit_basis: string
          value: number
        }
        Update: {
          category?: string
          high?: number | null
          id?: never
          indicator_id?: string
          low?: number | null
          notes?: string | null
          source_id?: string
          unit_basis?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_factors_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_factors_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_ingredients: {
        Row: {
          dish_id: string
          food_code: string
          grams: number
          note: string | null
        }
        Insert: {
          dish_id: string
          food_code: string
          grams: number
          note?: string | null
        }
        Update: {
          dish_id?: string
          food_code?: string
          grams?: number
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dish_animal_impacts"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dish_impacts"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dish_nutrients"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dish_prices"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_ingredients_food_code_fkey"
            columns: ["food_code"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["code"]
          },
        ]
      }
      dish_pairs: {
        Row: {
          animal_dish_id: string
          id: string
          is_published: boolean
          rationale: string | null
          variant: string | null
          vegan_dish_id: string
        }
        Insert: {
          animal_dish_id: string
          id?: string
          is_published?: boolean
          rationale?: string | null
          variant?: string | null
          vegan_dish_id: string
        }
        Update: {
          animal_dish_id?: string
          id?: string
          is_published?: boolean
          rationale?: string | null
          variant?: string | null
          vegan_dish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_pairs_animal_dish_id_fkey"
            columns: ["animal_dish_id"]
            isOneToOne: false
            referencedRelation: "dish_animal_impacts"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_pairs_animal_dish_id_fkey"
            columns: ["animal_dish_id"]
            isOneToOne: false
            referencedRelation: "dish_impacts"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_pairs_animal_dish_id_fkey"
            columns: ["animal_dish_id"]
            isOneToOne: false
            referencedRelation: "dish_nutrients"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_pairs_animal_dish_id_fkey"
            columns: ["animal_dish_id"]
            isOneToOne: false
            referencedRelation: "dish_prices"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_pairs_animal_dish_id_fkey"
            columns: ["animal_dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_pairs_vegan_dish_id_fkey"
            columns: ["vegan_dish_id"]
            isOneToOne: false
            referencedRelation: "dish_animal_impacts"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_pairs_vegan_dish_id_fkey"
            columns: ["vegan_dish_id"]
            isOneToOne: false
            referencedRelation: "dish_impacts"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_pairs_vegan_dish_id_fkey"
            columns: ["vegan_dish_id"]
            isOneToOne: false
            referencedRelation: "dish_nutrients"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_pairs_vegan_dish_id_fkey"
            columns: ["vegan_dish_id"]
            isOneToOne: false
            referencedRelation: "dish_prices"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "dish_pairs_vegan_dish_id_fkey"
            columns: ["vegan_dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean
          kind: string
          name_fr: string
          prep_minutes: number | null
          servings: number
          slug: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          kind: string
          name_fr: string
          prep_minutes?: number | null
          servings?: number
          slug: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          name_fr?: string
          prep_minutes?: number | null
          servings?: number
          slug?: string
        }
        Relationships: []
      }
      error_reports: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          message: string
          page: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          message: string
          page: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          message?: string
          page?: string
          status?: string
        }
        Relationships: []
      }
      food_impact_ingredients: {
        Row: {
          food_code: string
          indicator_id: string
          ingredient: string
          source_id: string
          value_per_kg: number
        }
        Insert: {
          food_code: string
          indicator_id: string
          ingredient: string
          source_id: string
          value_per_kg: number
        }
        Update: {
          food_code?: string
          indicator_id?: string
          ingredient?: string
          source_id?: string
          value_per_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_impact_ingredients_food_code_fkey"
            columns: ["food_code"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "food_impact_ingredients_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_impact_ingredients_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      food_impacts: {
        Row: {
          dqr: number | null
          food_code: string
          high_per_kg: number | null
          indicator_id: string
          low_per_kg: number | null
          source_id: string
          value_per_kg: number
        }
        Insert: {
          dqr?: number | null
          food_code: string
          high_per_kg?: number | null
          indicator_id: string
          low_per_kg?: number | null
          source_id: string
          value_per_kg: number
        }
        Update: {
          dqr?: number | null
          food_code?: string
          high_per_kg?: number | null
          indicator_id?: string
          low_per_kg?: number | null
          source_id?: string
          value_per_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_impacts_food_code_fkey"
            columns: ["food_code"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "food_impacts_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_impacts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      food_nutrients: {
        Row: {
          food_code: string
          nutrient_id: string
          qualifier: string | null
          source_id: string
          value_per_100g: number | null
        }
        Insert: {
          food_code: string
          nutrient_id: string
          qualifier?: string | null
          source_id: string
          value_per_100g?: number | null
        }
        Update: {
          food_code?: string
          nutrient_id?: string
          qualifier?: string | null
          source_id?: string
          value_per_100g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_nutrients_food_code_fkey"
            columns: ["food_code"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "food_nutrients_nutrient_id_fkey"
            columns: ["nutrient_id"]
            isOneToOne: false
            referencedRelation: "nutrients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_nutrients_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          animal_category: string | null
          ciqual_code: string | null
          code: string
          food_group: string | null
          food_subgroup: string | null
          iarc_meat: string | null
          is_animal: boolean
          name_en: string | null
          name_fr: string
          source_id: string | null
          state: string | null
          state_inferred: boolean
        }
        Insert: {
          animal_category?: string | null
          ciqual_code?: string | null
          code: string
          food_group?: string | null
          food_subgroup?: string | null
          iarc_meat?: string | null
          is_animal?: boolean
          name_en?: string | null
          name_fr: string
          source_id?: string | null
          state?: string | null
          state_inferred?: boolean
        }
        Update: {
          animal_category?: string | null
          ciqual_code?: string | null
          code?: string
          food_group?: string | null
          food_subgroup?: string | null
          iarc_meat?: string | null
          is_animal?: boolean
          name_en?: string | null
          name_fr?: string
          source_id?: string | null
          state?: string | null
          state_inferred?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "foods_ciqual_code_fkey"
            columns: ["ciqual_code"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "foods_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          description: string | null
          higher_is_better: boolean
          horizon: string | null
          id: string
          name_fr: string
          pillar: string
          scale: string | null
          unit: string
        }
        Insert: {
          description?: string | null
          higher_is_better?: boolean
          horizon?: string | null
          id: string
          name_fr: string
          pillar: string
          scale?: string | null
          unit: string
        }
        Update: {
          description?: string | null
          higher_is_better?: boolean
          horizon?: string | null
          id?: string
          name_fr?: string
          pillar?: string
          scale?: string | null
          unit?: string
        }
        Relationships: []
      }
      monetization_factors: {
        Row: {
          eur_per_unit: number
          indicator_id: string
          method: string
          source_id: string
          year: number
        }
        Insert: {
          eur_per_unit: number
          indicator_id: string
          method: string
          source_id: string
          year: number
        }
        Update: {
          eur_per_unit?: number
          indicator_id?: string
          method?: string
          source_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monetization_factors_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monetization_factors_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      monetization_rules: {
        Row: {
          cap_year: number
          growth_rate: number
          indicator_id: string
          method: string
          notes: string | null
          source_id: string
          start_year: number
        }
        Insert: {
          cap_year: number
          growth_rate: number
          indicator_id: string
          method: string
          notes?: string | null
          source_id: string
          start_year: number
        }
        Update: {
          cap_year?: number
          growth_rate?: number
          indicator_id?: string
          method?: string
          notes?: string | null
          source_id?: string
          start_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monetization_rules_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monetization_rules_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrient_references: {
        Row: {
          kind: string
          nutrient_id: string
          population: string
          source_id: string
          unit: string
          value: number
        }
        Insert: {
          kind: string
          nutrient_id: string
          population: string
          source_id: string
          unit: string
          value: number
        }
        Update: {
          kind?: string
          nutrient_id?: string
          population?: string
          source_id?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "nutrient_references_nutrient_id_fkey"
            columns: ["nutrient_id"]
            isOneToOne: false
            referencedRelation: "nutrients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrient_references_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrients: {
        Row: {
          category: string | null
          id: string
          name_fr: string
          unit: string
        }
        Insert: {
          category?: string | null
          id: string
          name_fr: string
          unit: string
        }
        Update: {
          category?: string | null
          id?: string
          name_fr?: string
          unit?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          external_id: string | null
          food_code: string | null
          id: number
          observed_on: string | null
          off_barcode: string | null
          per: string
          price_eur: number
          region: string | null
          source_id: string
        }
        Insert: {
          external_id?: string | null
          food_code?: string | null
          id?: never
          observed_on?: string | null
          off_barcode?: string | null
          per: string
          price_eur: number
          region?: string | null
          source_id: string
        }
        Update: {
          external_id?: string | null
          food_code?: string | null
          id?: never
          observed_on?: string | null
          off_barcode?: string | null
          per?: string
          price_eur?: number
          region?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_food_code_fkey"
            columns: ["food_code"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "prices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          accessed_on: string | null
          commercial_use: boolean | null
          id: string
          license: string
          name: string
          notes: string | null
          publisher: string | null
          share_alike: boolean
          url: string | null
          version: string | null
        }
        Insert: {
          accessed_on?: string | null
          commercial_use?: boolean | null
          id: string
          license: string
          name: string
          notes?: string | null
          publisher?: string | null
          share_alike?: boolean
          url?: string | null
          version?: string | null
        }
        Update: {
          accessed_on?: string | null
          commercial_use?: boolean | null
          id?: string
          license?: string
          name?: string
          notes?: string | null
          publisher?: string | null
          share_alike?: boolean
          url?: string | null
          version?: string | null
        }
        Relationships: []
      }
      swap_commitments: {
        Row: {
          id: string
          pair_id: string
          started_on: string
          times_per_week: number
          user_id: string
        }
        Insert: {
          id?: string
          pair_id: string
          started_on?: string
          times_per_week: number
          user_id?: string
        }
        Update: {
          id?: string
          pair_id?: string
          started_on?: string
          times_per_week?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_commitments_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "dish_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dish_animal_impacts: {
        Row: {
          dish_id: string | null
          high_per_serving: number | null
          indicator_id: string | null
          low_per_serving: number | null
          per_serving: number | null
          slug: string | null
          source_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_factors_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_factors_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_impacts: {
        Row: {
          dish_id: string | null
          high_per_serving: number | null
          indicator_id: string | null
          low_per_serving: number | null
          mass_coverage: number | null
          per_serving: number | null
          slug: string | null
          source_id: string | null
          worst_dqr: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_impacts_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_impacts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_nutrients: {
        Row: {
          dish_id: string | null
          mass_coverage: number | null
          nutrient_id: string | null
          per_serving: number | null
          slug: string | null
          source_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_nutrients_nutrient_id_fkey"
            columns: ["nutrient_id"]
            isOneToOne: false
            referencedRelation: "nutrients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_nutrients_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_prices: {
        Row: {
          dish_id: string | null
          high_per_serving: number | null
          low_per_serving: number | null
          mass_coverage: number | null
          per_serving: number | null
          slug: string | null
          source_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      food_prices: {
        Row: {
          first_observed_on: string | null
          food_code: string | null
          last_observed_on: string | null
          max_eur_per_kg: number | null
          median_eur_per_kg: number | null
          min_eur_per_kg: number | null
          observations: number | null
          source_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_food_code_fkey"
            columns: ["food_code"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "prices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
