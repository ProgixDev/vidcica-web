/**
 * Server-side, RLS-scoped reads for the analytics surface. Analytics derives
 * entirely from data already owned by other domains (videos, networks,
 * campaigns, leads), so this module only assembles that bundle — every select is
 * RLS-scoped to `user_id = auth.uid()`, no explicit user filter needed.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { listMyNetworks } from "@/lib/vidcica/networks-queries";
import { listMyCampaigns } from "@/lib/vidcica/ads-queries";
import type { Video } from "@/lib/vidcica/video";
import type { Network } from "@/lib/vidcica/network";
import type { Campaign } from "@/lib/vidcica/campaign";

/** Lightweight count of the caller's leads (RLS-scoped) — the overview needs the
 *  number, not the rows. */
export async function countMyLeads(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true });
  if (error || count == null) return 0;
  return count;
}

export type AnalyticsBundle = {
  videos: Video[];
  networks: Network[];
  campaigns: Campaign[];
  leadsCount: number;
};

/** Everything the analytics screens derive from, fetched in parallel (RLS-scoped). */
export async function getAnalyticsBundle(): Promise<AnalyticsBundle> {
  const [videos, networks, campaigns, leadsCount] = await Promise.all([
    listMyVideos(),
    listMyNetworks(),
    listMyCampaigns(),
    countMyLeads(),
  ]);
  return { videos, networks, campaigns, leadsCount };
}
