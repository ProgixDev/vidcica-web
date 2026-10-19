import type { CreditPack } from "@/lib/vidcica/billing-queries";

/** What a pack card shows, derived once from the credit_products rows. */
export type PackView = {
  credits: number;
  /** Price in cents (credit_products.price_eur is whole euros). */
  priceCents: number;
  /** Price of one credit, in cents, rounded to the cent shown. */
  unitCents: number;
  /** Saving per credit against the smallest pack, in whole percent; null under 5 %. */
  savePct: number | null;
  /** The middle pack is marked "Populaire" when there are several. */
  popular: boolean;
};

const MIN_SAVING_PCT = 5;

export function packViews(packs: readonly CreditPack[]): PackView[] {
  const sorted = [...packs].sort((a, b) => a.credits - b.credits);
  const base = sorted[0] ? sorted[0].priceEur / sorted[0].credits : 0;
  const popularIndex = sorted.length > 1 ? Math.floor(sorted.length / 2) : -1;
  return sorted.map((pack, i) => {
    const unit = pack.priceEur / pack.credits;
    const save = base > 0 ? Math.round((1 - unit / base) * 100) : 0;
    return {
      credits: pack.credits,
      priceCents: Math.round(pack.priceEur * 100),
      unitCents: Math.round(unit * 100),
      savePct: save >= MIN_SAVING_PCT ? save : null,
      popular: i === popularIndex,
    };
  });
}
