import "server-only";
import { createClient } from "@/lib/supabase/server";
import { type Plan } from "@/lib/vidcica/tiers";

export type Entitlement = { plan: Plan; credits: number };

/** The signed-in user's current plan (`profiles.tier`, webhook-written) and
 *  credit balance (`credits_accounts.balance`) — both RLS-scoped read-own. */
export async function getMyEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const [{ data: profile }, { data: account }] = await Promise.all([
    supabase.from("profiles").select("tier").maybeSingle(),
    supabase.from("credits_accounts").select("balance").maybeSingle(),
  ]);
  const plan = (profile?.tier as Plan | undefined) ?? "free";
  const credits = account?.balance ?? 0;
  return { plan, credits };
}
