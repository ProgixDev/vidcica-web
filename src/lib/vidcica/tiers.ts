/**
 * Canonical subscription-tier matrix for the web — the single source of truth
 * for plan label / price / monthly credits / headline features. Ported from
 * ClipFlow/src/lib/tiers.ts (values kept in lockstep; the server's
 * `create-checkout-session` + `stripe-webhook` own the actual pricing/grant).
 */
export type Plan = "free" | "starter" | "pro" | "studio";

export type TierDef = {
  id: Plan;
  label: string;
  /** Monthly price in EUR (0 = free). */
  priceEUR: number;
  /** Credits granted each month. */
  monthlyCredits: number;
  /** Max video length the composer offers (seconds). */
  maxLengthSec: number;
  /** Quality cap. */
  maxQuality: "720p" | "1080p";
  /** Headline features for the plan card (French). */
  highlights: string[];
};

export const TIERS: Readonly<Record<Plan, TierDef>> = {
  free: {
    id: "free",
    label: "Gratuit",
    priceEUR: 0,
    monthlyCredits: 20,
    maxLengthSec: 15,
    maxQuality: "720p",
    highlights: ["20 crédits / mois", "Vidéos jusqu’à 15 s", "Banque d’images (sans voix)"],
  },
  starter: {
    id: "starter",
    label: "Starter",
    priceEUR: 25,
    monthlyCredits: 150,
    maxLengthSec: 30,
    maxQuality: "720p",
    highlights: ["150 crédits / mois", "Voix off IA + sous-titres", "Jusqu’à 30 s · 3 réseaux"],
  },
  pro: {
    id: "pro",
    label: "Pro",
    priceEUR: 45,
    monthlyCredits: 300,
    maxLengthSec: 60,
    maxQuality: "1080p",
    highlights: ["300 crédits / mois", "1080p · jusqu’à 60 s", "Programmation · analytics · pubs"],
  },
  studio: {
    id: "studio",
    label: "Studio",
    priceEUR: 99,
    monthlyCredits: 600,
    maxLengthSec: 60,
    maxQuality: "1080p",
    highlights: ["600 crédits / mois", "Bibliothèque illimitée", "Support dédié"],
  },
};

export const ORDERED_TIERS: ReadonlyArray<Plan> = ["free", "starter", "pro", "studio"];

export const tierDef = (plan: Plan): TierDef => TIERS[plan];

/** Rank for upgrade/downgrade comparisons (free < starter < pro < studio). */
export function planRank(plan: Plan): number {
  return ORDERED_TIERS.indexOf(plan);
}

/** A plan the caller can self-checkout into: a paid tier above their current one. */
export function isUpgrade(current: Plan, target: Plan): boolean {
  return TIERS[target].priceEUR > 0 && planRank(target) > planRank(current);
}
