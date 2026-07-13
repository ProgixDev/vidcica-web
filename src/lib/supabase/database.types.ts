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
