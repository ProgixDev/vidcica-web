import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToNetwork, type Network } from "@/lib/vidcica/network";

const NETWORK_COLUMNS =
  "id, platform, name, handle, avatar_url, connected, needs_reconnect, publishes_enabled, last_sync, followers";

/** All of the signed-in user's network rows (RLS-scoped). One per platform. */
export async function listMyNetworks(): Promise<Network[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("networks").select(NETWORK_COLUMNS).order("platform");
  if (error || !data) return [];
  return data.map((r) => rowToNetwork(r as Parameters<typeof rowToNetwork>[0]));
}
