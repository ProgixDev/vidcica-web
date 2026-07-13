// INTERIM types — copied from ClipFlow/src/types/database.types.ts (generated
// from the SAME project scoozakhhmowpzwotxgp). TODO: regenerate from the live DB
// once the Supabase MCP/CLI is authorized:
//   supabase gen types typescript --project-id scoozakhhmowpzwotxgp > src/lib/supabase/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          age_max: number | null;
          age_min: number | null;
          audience_breakdown: Json | null;
          audience_mode: string | null;
          behaviours: string[] | null;
          budget_daily: number | null;
          budget_mode: string | null;
          budget_spent: number;
          budget_total: number;
          cities: string[] | null;
          clicks: number;
          conversions: number | null;
          countries: string[] | null;
          cpc: number | null;
          cpm: number;
          created_at: string;
          cta: string | null;
          ctr: number;
          description: string | null;
          end_date: string | null;
          gender: string | null;
          hook_id: string | null;
          id: string;
          impressions: number;
          impressions_series: number[] | null;
          interests: string[] | null;
          languages: string[] | null;
          leads: number | null;
          lookalike_percent: number | null;
          lookalike_source_id: string | null;
          name: string;
          objective: string;
          pixel_enabled: boolean | null;
          pixel_event: string | null;
          placements: string[] | null;
          primary_text: string | null;
          reach: number;
          spend_series: number[] | null;
          start_date: string;
          status: string;
          title: string | null;
          updated_at: string;
          url: string | null;
          user_id: string;
          utm: Json | null;
          video_id: string | null;
          workspace_id: string | null;
        };
        Insert: {
          age_max?: number | null;
          age_min?: number | null;
          audience_breakdown?: Json | null;
          audience_mode?: string | null;
          behaviours?: string[] | null;
          budget_daily?: number | null;
          budget_mode?: string | null;
          budget_spent?: number;
          budget_total?: number;
          cities?: string[] | null;
          clicks?: number;
          conversions?: number | null;
          countries?: string[] | null;
          cpc?: number | null;
          cpm?: number;
          created_at?: string;
          cta?: string | null;
          ctr?: number;
          description?: string | null;
          end_date?: string | null;
          gender?: string | null;
          hook_id?: string | null;
          id: string;
          impressions?: number;
          impressions_series?: number[] | null;
          interests?: string[] | null;
          languages?: string[] | null;
          leads?: number | null;
          lookalike_percent?: number | null;
          lookalike_source_id?: string | null;
          name: string;
          objective: string;
          pixel_enabled?: boolean | null;
          pixel_event?: string | null;
          placements?: string[] | null;
          primary_text?: string | null;
          reach?: number;
          spend_series?: number[] | null;
          start_date: string;
          status: string;
          title?: string | null;
          updated_at?: string;
          url?: string | null;
          user_id: string;
          utm?: Json | null;
          video_id?: string | null;
          workspace_id?: string | null;
        };
        Update: {
          age_max?: number | null;
          age_min?: number | null;
          audience_breakdown?: Json | null;
          audience_mode?: string | null;
          behaviours?: string[] | null;
          budget_daily?: number | null;
          budget_mode?: string | null;
          budget_spent?: number;
          budget_total?: number;
          cities?: string[] | null;
          clicks?: number;
          conversions?: number | null;
          countries?: string[] | null;
          cpc?: number | null;
          cpm?: number;
          created_at?: string;
          cta?: string | null;
          ctr?: number;
          description?: string | null;
          end_date?: string | null;
          gender?: string | null;
          hook_id?: string | null;
          id?: string;
          impressions?: number;
          impressions_series?: number[] | null;
          interests?: string[] | null;
          languages?: string[] | null;
          leads?: number | null;
          lookalike_percent?: number | null;
          lookalike_source_id?: string | null;
          name?: string;
          objective?: string;
          pixel_enabled?: boolean | null;
          pixel_event?: string | null;
          placements?: string[] | null;
          primary_text?: string | null;
          reach?: number;
          spend_series?: number[] | null;
          start_date?: string;
          status?: string;
          title?: string | null;
          updated_at?: string;
          url?: string | null;
          user_id?: string;
          utm?: Json | null;
          video_id?: string | null;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_ledger: {
        Row: {
          created_at: string;
          delta: number;
          id: string;
          reason: string;
          user_id: string;
          video_id: string | null;
        };
        Insert: {
          created_at?: string;
          delta: number;
          id?: string;
          reason: string;
          user_id: string;
          video_id?: string | null;
        };
        Update: {
          created_at?: string;
          delta?: number;
          id?: string;
          reason?: string;
          user_id?: string;
          video_id?: string | null;
        };
        Relationships: [];
      };
      credits_accounts: {
        Row: {
          balance: number;
          created_at: string;
          daily_count: number;
          daily_window_start: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          created_at?: string;
          daily_count?: number;
          daily_window_start?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          daily_count?: number;
          daily_window_start?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      generation_jobs: {
        Row: {
          attempts: number;
          charged_credits: number;
          created_at: string;
          external_refs: Json;
          id: string;
          last_error: string | null;
          provider: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          video_id: string;
        };
        Insert: {
          attempts?: number;
          charged_credits?: number;
          created_at?: string;
          external_refs?: Json;
          id?: string;
          last_error?: string | null;
          provider?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          video_id: string;
        };
        Update: {
          attempts?: number;
          charged_credits?: number;
          created_at?: string;
          external_refs?: Json;
          id?: string;
          last_error?: string | null;
          provider?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generation_jobs_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          campaign_id: string;
          campaign_name: string;
          captured_at: string;
          city: string | null;
          created_at: string;
          email: string;
          first_name: string;
          form_answers: Json | null;
          id: string;
          interactions: Json;
          last_name: string;
          notes: Json;
          phone: string;
          score: number;
          score_bucket: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          campaign_id: string;
          campaign_name: string;
          captured_at: string;
          city?: string | null;
          created_at?: string;
          email: string;
          first_name: string;
          form_answers?: Json | null;
          id: string;
          interactions?: Json;
          last_name: string;
          notes?: Json;
          phone: string;
          score?: number;
          score_bucket?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          campaign_id?: string;
          campaign_name?: string;
          captured_at?: string;
          city?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string;
          form_answers?: Json | null;
          id?: string;
          interactions?: Json;
          last_name?: string;
          notes?: Json;
          phone?: string;
          score?: number;
          score_bucket?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      networks: {
        Row: {
          access_token_ciphertext: string | null;
          avatar_url: string | null;
          connected: boolean;
          connected_at: string | null;
          created_at: string;
          external_user_id: string | null;
          external_username: string | null;
          followers: number | null;
          handle: string | null;
          id: string;
          last_sync: string | null;
          name: string;
          needs_reconnect: boolean;
          platform: string;
          platform_metadata: Json | null;
          publishes_enabled: boolean;
          refresh_token_ciphertext: string | null;
          scope: string | null;
          token_expires_at: string | null;
          updated_at: string;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          access_token_ciphertext?: string | null;
          avatar_url?: string | null;
          connected?: boolean;
          connected_at?: string | null;
          created_at?: string;
          external_user_id?: string | null;
          external_username?: string | null;
          followers?: number | null;
          handle?: string | null;
          id: string;
          last_sync?: string | null;
          name: string;
          needs_reconnect?: boolean;
          platform: string;
          platform_metadata?: Json | null;
          publishes_enabled?: boolean;
          refresh_token_ciphertext?: string | null;
          scope?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          access_token_ciphertext?: string | null;
          avatar_url?: string | null;
          connected?: boolean;
          connected_at?: string | null;
          created_at?: string;
          external_user_id?: string | null;
          external_username?: string | null;
          followers?: number | null;
          handle?: string | null;
          id?: string;
          last_sync?: string | null;
          name?: string;
          needs_reconnect?: boolean;
          platform?: string;
          platform_metadata?: Json | null;
          publishes_enabled?: boolean;
          refresh_token_ciphertext?: string | null;
          scope?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string;
          campaign_id: string | null;
          category: string;
          created_at: string;
          dedupe_key: string | null;
          id: string;
          lead_id: string | null;
          read: boolean;
          read_at: string | null;
          title: string;
          type: string;
          updated_at: string;
          user_id: string;
          video_id: string | null;
        };
        Insert: {
          body: string;
          campaign_id?: string | null;
          category: string;
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          lead_id?: string | null;
          read?: boolean;
          read_at?: string | null;
          title: string;
          type?: string;
          updated_at?: string;
          user_id: string;
          video_id?: string | null;
        };
        Update: {
          body?: string;
          campaign_id?: string | null;
          category?: string;
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          lead_id?: string | null;
          read?: boolean;
          read_at?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
          video_id?: string | null;
        };
        Relationships: [];
      };
      oauth_states: {
        Row: {
          code_verifier: string | null;
          created_at: string;
          platform: string;
          redirect_after: string | null;
          state: string;
          user_id: string;
        };
        Insert: {
          code_verifier?: string | null;
          created_at?: string;
          platform: string;
          redirect_after?: string | null;
          state: string;
          user_id: string;
        };
        Update: {
          code_verifier?: string | null;
          created_at?: string;
          platform?: string;
          redirect_after?: string | null;
          state?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"];
          audience: string;
          avatar_url: string | null;
          created_at: string;
          deletion_scheduled_at: string | null;
          display_name: string;
          id: string;
          locale: string;
          marketing_opt_in: boolean;
          niche: string;
          preferred_tone: string | null;
          updated_at: string;
        };
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"];
          audience?: string;
          avatar_url?: string | null;
          created_at?: string;
          deletion_scheduled_at?: string | null;
          display_name?: string;
          id: string;
          locale?: string;
          marketing_opt_in?: boolean;
          niche?: string;
          preferred_tone?: string | null;
          updated_at?: string;
        };
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"];
          audience?: string;
          avatar_url?: string | null;
          created_at?: string;
          deletion_scheduled_at?: string | null;
          display_name?: string;
          id?: string;
          locale?: string;
          marketing_opt_in?: boolean;
          niche?: string;
          preferred_tone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      publish_jobs: {
        Row: {
          attempts: number;
          created_at: string;
          external_post_id: string | null;
          external_post_url: string | null;
          id: string;
          last_error: string | null;
          platform: string;
          scheduled_for: string;
          status: string;
          updated_at: string;
          user_id: string;
          video_id: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          external_post_id?: string | null;
          external_post_url?: string | null;
          id?: string;
          last_error?: string | null;
          platform: string;
          scheduled_for?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
          video_id: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          external_post_id?: string | null;
          external_post_url?: string | null;
          id?: string;
          last_error?: string | null;
          platform?: string;
          scheduled_for?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publish_jobs_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      push_tokens: {
        Row: {
          created_at: string;
          device_name: string | null;
          platform: string | null;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_name?: string | null;
          platform?: string | null;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_name?: string | null;
          platform?: string | null;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          status: string;
          subject: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          message: string;
          status?: string;
          subject: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          status?: string;
          subject?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          approved: boolean | null;
          comments: number | null;
          created_at: string;
          credits_used: number | null;
          deleted_at: string | null;
          description: string | null;
          duration_sec: number;
          format: string;
          hashtags: string[];
          id: string;
          likes: number | null;
          music_mood: string | null;
          networks: string[];
          publish_failures: Json | null;
          published_at: string | null;
          scheduled_at: string | null;
          script: string;
          segments: Json | null;
          shares: number | null;
          status: string;
          style: string | null;
          subtitle_style: string | null;
          template_id: string | null;
          thumbnail_url: string;
          title: string;
          tone: string;
          updated_at: string;
          user_id: string;
          versions: Json | null;
          video_url: string | null;
          views: number | null;
          voice: string | null;
          workspace_id: string | null;
        };
        Insert: {
          approved?: boolean | null;
          comments?: number | null;
          created_at?: string;
          credits_used?: number | null;
          deleted_at?: string | null;
          description?: string | null;
          duration_sec?: number;
          format: string;
          hashtags?: string[];
          id: string;
          likes?: number | null;
          music_mood?: string | null;
          networks?: string[];
          publish_failures?: Json | null;
          published_at?: string | null;
          scheduled_at?: string | null;
          script?: string;
          segments?: Json | null;
          shares?: number | null;
          status: string;
          style?: string | null;
          subtitle_style?: string | null;
          template_id?: string | null;
          thumbnail_url: string;
          title: string;
          tone: string;
          updated_at?: string;
          user_id: string;
          versions?: Json | null;
          video_url?: string | null;
          views?: number | null;
          voice?: string | null;
          workspace_id?: string | null;
        };
        Update: {
          approved?: boolean | null;
          comments?: number | null;
          created_at?: string;
          credits_used?: number | null;
          deleted_at?: string | null;
          description?: string | null;
          duration_sec?: number;
          format?: string;
          hashtags?: string[];
          id?: string;
          likes?: number | null;
          music_mood?: string | null;
          networks?: string[];
          publish_failures?: Json | null;
          published_at?: string | null;
          scheduled_at?: string | null;
          script?: string;
          segments?: Json | null;
          shares?: number | null;
          status?: string;
          style?: string | null;
          subtitle_style?: string | null;
          template_id?: string | null;
          thumbnail_url?: string;
          title?: string;
          tone?: string;
          updated_at?: string;
          user_id?: string;
          versions?: Json | null;
          video_url?: string | null;
          views?: number | null;
          voice?: string | null;
          workspace_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cancel_account_deletion: { Args: never; Returns: undefined };
      consume_credits: {
        Args: { p_amount: number; p_reason: string; p_video_id?: string };
        Returns: number;
      };
      create_notification: {
        Args: {
          p_body: string;
          p_campaign_id?: string;
          p_category: string;
          p_dedupe_key?: string;
          p_lead_id?: string;
          p_title: string;
          p_type: string;
          p_user: string;
          p_video_id?: string;
        };
        Returns: undefined;
      };
      grant_credits: {
        Args: {
          p_amount: number;
          p_reason: string;
          p_user: string;
          p_video_id?: string;
        };
        Returns: number;
      };
      purge_expired_deletions: { Args: never; Returns: undefined };
      request_account_deletion: { Args: never; Returns: undefined };
    };
    Enums: {
      account_status: "active" | "pending_deletion" | "suspended";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "pending_deletion", "suspended"],
    },
  },
} as const;
