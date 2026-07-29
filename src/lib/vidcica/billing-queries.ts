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

/** A one-time credit pack the user can buy (credit_products where plan is null). */
export type CreditPack = { credits: number; priceEur: number; label: string };

/** List the purchasable credit packs, cheapest first. Reads `credit_products`
 *  (RLS exposes only plan-null packs to authenticated). */
export async function listCreditPacks(): Promise<CreditPack[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_products")
    .select("credits, price_eur, label")
    .is("plan", null)
    .order("credits", { ascending: true });
  if (error || !data) return [];
  return data
    .filter((r) => typeof r.price_eur === "number" && r.credits > 0)
    .map((r) => ({
      credits: r.credits,
      priceEur: r.price_eur as number,
      label: r.label ?? `${r.credits} crédits`,
    }));
}
