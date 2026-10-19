import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isPlatformId, rowToNetwork, type Network } from "@/lib/vidcica/network";

// platform_metadata carries the Meta connect reason, the chosen Page and the
// shared Pages (no secrets: tokens live in their own columns, never selected).
const NETWORK_COLUMNS =
  "id, platform, name, handle, avatar_url, connected, needs_reconnect, publishes_enabled, last_sync, followers, platform_metadata";

/** All of the signed-in user's network rows (RLS-scoped). One per platform.
 *  Rows of a removed platform (Threads) are skipped. */
export async function listMyNetworks(): Promise<Network[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("networks").select(NETWORK_COLUMNS).order("platform");
  if (error || !data) return [];
  return data
    .filter((r) => isPlatformId(r.platform))
    .map((r) => rowToNetwork(r as Parameters<typeof rowToNetwork>[0]));
}
