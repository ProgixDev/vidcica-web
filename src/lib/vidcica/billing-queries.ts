import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toPlan, type Entitlement } from "@/lib/vidcica/tiers";

export type { Entitlement };

/** The signed-in user's current plan (`profiles.tier`, webhook-written) and
 *  credit balance (`credits_accounts.balance`) — both RLS-scoped read-own.
 *  `tier` is validated at this trust boundary before it reaches the UI. */
export async function getMyEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const [{ data: profile }, { data: account }] = await Promise.all([
    supabase.from("profiles").select("tier").maybeSingle(),
    supabase.from("credits_accounts").select("balance").maybeSingle(),
  ]);
  return { plan: toPlan(profile?.tier), credits: account?.balance ?? 0 };
}
