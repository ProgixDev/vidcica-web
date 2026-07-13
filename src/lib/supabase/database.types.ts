// Types for the live Supabase project scoozakhhmowpzwotxgp, generated via the
// Supabase MCP (`generate_typescript_types`) on 2026-07-13 and reduced to the
// tables the web app currently uses (videos, generation_jobs, credits/billing).
// Regenerate/expand from the live schema when a new slice needs more tables —
// the MCP output is the source of truth.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ad_accounts: {
        Row: {
          ad_account_id: string;
          created_at: string;
          currency: string | null;
          name: string | null;
          page_id: string | null;
          page_name: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ad_account_id: string;
          created_at?: string;
          currency?: string | null;
          name?: string | null;
          page_id?: string | null;
          page_name?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ad_account_id?: string;
          created_at?: string;
          currency?: string | null;
          name?: string | null;
          page_id?: string | null;
          page_name?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
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
      billing_customers: {
        Row: {
          created_at: string;
          stripe_customer_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          stripe_customer_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          stripe_customer_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          ad_account_id: string | null;
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
          external_ad_id: string | null;
          external_adset_id: string | null;
          external_campaign_id: string | null;
          external_creative_id: string | null;
          external_video_id: string | null;
          gender: string | null;
          hook_id: string | null;
          id: string;
          impressions: number;
          impressions_series: number[] | null;
          interests: string[] | null;
          languages: string[] | null;
          last_error: string | null;
          leads: number | null;
          lookalike_percent: number | null;
          lookalike_source_id: string | null;
          metrics_updated_at: string | null;
          name: string;
          objective: string;
          page_id: string | null;
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
          ad_account_id?: string | null;
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
          external_ad_id?: string | null;
          external_adset_id?: string | null;
          external_campaign_id?: string | null;
          external_creative_id?: string | null;
          external_video_id?: string | null;
          gender?: string | null;
          hook_id?: string | null;
          id: string;
          impressions?: number;
          impressions_series?: number[] | null;
          interests?: string[] | null;
          languages?: string[] | null;
          last_error?: string | null;
          leads?: number | null;
          lookalike_percent?: number | null;
          lookalike_source_id?: string | null;
          metrics_updated_at?: string | null;
          name: string;
          objective: string;
          page_id?: string | null;
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
          ad_account_id?: string | null;
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
          external_ad_id?: string | null;
          external_adset_id?: string | null;
          external_campaign_id?: string | null;
          external_creative_id?: string | null;
          external_video_id?: string | null;
          gender?: string | null;
          hook_id?: string | null;
          id?: string;
          impressions?: number;
          impressions_series?: number[] | null;
          interests?: string[] | null;
          languages?: string[] | null;
          last_error?: string | null;
          leads?: number | null;
          lookalike_percent?: number | null;
          lookalike_source_id?: string | null;
          metrics_updated_at?: string | null;
          name?: string;
          objective?: string;
          page_id?: string | null;
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
      credit_products: {
        Row: {
          created_at: string;
          credits: number;
          label: string | null;
          plan: string | null;
          product_id: string;
        };
        Insert: {
          created_at?: string;
          credits: number;
          label?: string | null;
          plan?: string | null;
          product_id: string;
        };
        Update: {
          created_at?: string;
          credits?: number;
          label?: string | null;
          plan?: string | null;
          product_id?: string;
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
      publish_jobs: {
        Row: {
          as_short: boolean;
          attempts: number;
          created_at: string;
          external_post_id: string | null;
          external_post_url: string | null;
          id: string;
          last_error: string | null;
          platform: string;
          post_deleted_at: string | null;
          provider_ref: string | null;
          scheduled_for: string;
          status: string;
          updated_at: string;
          user_id: string;
          video_id: string;
        };
        Insert: {
          as_short?: boolean;
          attempts?: number;
          created_at?: string;
          external_post_id?: string | null;
          external_post_url?: string | null;
          id?: string;
          last_error?: string | null;
          platform: string;
          post_deleted_at?: string | null;
          provider_ref?: string | null;
          scheduled_for?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
          video_id: string;
        };
        Update: {
          as_short?: boolean;
          attempts?: number;
          created_at?: string;
          external_post_id?: string | null;
          external_post_url?: string | null;
          id?: string;
          last_error?: string | null;
          platform?: string;
          post_deleted_at?: string | null;
          provider_ref?: string | null;
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
          tier: string;
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
          tier?: string;
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
          tier?: string;
          updated_at?: string;
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
      consume_credits: {
        Args: { p_amount: number; p_reason: string; p_video_id?: string };
        Returns: number;
      };
      grant_credits: {
        Args: { p_amount: number; p_reason: string; p_user: string; p_video_id?: string };
        Returns: number;
      };
    };
    Enums: {
      account_status: "active" | "pending_deletion" | "suspended";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
