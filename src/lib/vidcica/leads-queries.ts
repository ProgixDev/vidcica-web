/**
 * Server-side, RLS-scoped reads for the leads CRM. Run in Server Components via the
 * cookie-session server client — RLS restricts every row to `user_id = auth.uid()`.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToLead, type Lead } from "@/lib/vidcica/lead";

const LEAD_COLUMNS =
  "id, campaign_id, campaign_name, first_name, last_name, email, phone, city, captured_at, score, score_bucket, status, notes, interactions";

/** The signed-in user's leads, newest capture first (RLS-scoped). */
export async function listMyLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .order("captured_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => rowToLead(r as Parameters<typeof rowToLead>[0]));
}

/** One lead by id, or null if it isn't the caller's (RLS filters it out). */
export async function getMyLead(id: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToLead(data as Parameters<typeof rowToLead>[0]);
}
