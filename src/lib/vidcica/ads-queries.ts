/**
 * Server-side, RLS-scoped reads for the ads surface. Run in Server Components via
 * the cookie-session server client — RLS restricts every row to `user_id =
 * auth.uid()`, so no explicit user filter is needed.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToCampaign, type Campaign } from "@/lib/vidcica/campaign";

/** Columns the ads UI needs — keep in sync with rowToCampaign. */
const CAMPAIGN_COLUMNS =
  "id, name, objective, status, budget_mode, budget_daily, budget_total, start_date, end_date, video_id, title, primary_text, cta, url, gender, age_min, age_max, countries, external_campaign_id, last_error, budget_spent, reach, impressions, clicks, conversions, leads, cpm, ctr, cpc, metrics_updated_at, created_at, updated_at";

/** All of the signed-in user's campaigns, newest first (RLS-scoped). */
export async function listMyCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => rowToCampaign(r as Parameters<typeof rowToCampaign>[0]));
}

/** One campaign by id, or null if it isn't the caller's (RLS filters it out). */
export async function getMyCampaign(id: string): Promise<Campaign | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToCampaign(data as Parameters<typeof rowToCampaign>[0]);
}
