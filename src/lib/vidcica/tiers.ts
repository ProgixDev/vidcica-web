/**
 * Canonical subscription-tier matrix for the web — the single source of truth
 * for plan label / price / monthly credits / headline features. Ported from
 * ClipFlow/src/lib/tiers.ts (values kept in lockstep; the server's
 * `create-checkout-session` + `stripe-webhook` own the actual pricing/grant).
 */
import type { MessageKey } from "@/lib/i18n";

export type Plan = "free" | "starter" | "pro" | "studio";

export type TierDef = {
  id: Plan;
  label: string;
  /** i18n key for the plan label (render with `t(labelKey)`). */
  labelKey: MessageKey;
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
  /** i18n keys for the headline features (render each with `t(key)`). */
  highlightKeys: MessageKey[];
};

export const TIERS: Readonly<Record<Plan, TierDef>> = {
  free: {
    id: "free",
    label: "Gratuit",
    labelKey: "tiers.free.label",
    priceEUR: 0,
    monthlyCredits: 20,
    maxLengthSec: 15,
    maxQuality: "720p",
    highlights: ["20 crédits / mois", "Vidéos jusqu’à 15 s", "Banque d’images (sans voix)"],
    highlightKeys: ["tiers.free.h1", "tiers.free.h2", "tiers.free.h3"],
  },
  starter: {
    id: "starter",
    label: "Starter",
    labelKey: "tiers.starter.label",
    priceEUR: 25,
    monthlyCredits: 150,
    maxLengthSec: 30,
    maxQuality: "720p",
    highlights: ["150 crédits / mois", "Voix off IA + sous-titres", "Jusqu’à 30 s · 3 réseaux"],
    highlightKeys: ["tiers.starter.h1", "tiers.starter.h2", "tiers.starter.h3"],
  },
  pro: {
    id: "pro",
    label: "Pro",
    labelKey: "tiers.pro.label",
    priceEUR: 45,
    monthlyCredits: 300,
    maxLengthSec: 60,
    maxQuality: "1080p",
    highlights: ["300 crédits / mois", "1080p · jusqu’à 60 s", "Programmation · analytics · pubs"],
    highlightKeys: ["tiers.pro.h1", "tiers.pro.h2", "tiers.pro.h3"],
  },
  studio: {
    id: "studio",
    label: "Studio",
    labelKey: "tiers.studio.label",
    priceEUR: 99,
    monthlyCredits: 600,
    maxLengthSec: 60,
    maxQuality: "1080p",
    highlights: ["600 crédits / mois", "Bibliothèque illimitée", "Support dédié"],
    highlightKeys: ["tiers.studio.h1", "tiers.studio.h2", "tiers.studio.h3"],
  },
};

export const ORDERED_TIERS: ReadonlyArray<Plan> = ["free", "starter", "pro", "studio"];

/** Current entitlement (kept here, not in the server-only queries module, so the
 *  client paywall can import the type without touching `server-only`). */
export type Entitlement = { plan: Plan; credits: number };

/** Coerce an untrusted tier string (from the DB) to a known plan; unknown → free. */
export function toPlan(tier: string | null | undefined): Plan {
  return (ORDERED_TIERS as readonly string[]).includes(tier ?? "") ? (tier as Plan) : "free";
}

export const tierDef = (plan: Plan): TierDef => TIERS[plan];

/** Rank for upgrade/downgrade comparisons (free < starter < pro < studio). */
export function planRank(plan: Plan): number {
  return ORDERED_TIERS.indexOf(plan);
}

/** A plan the caller can self-checkout into: a paid tier above their current one. */
export function isUpgrade(current: Plan, target: Plan): boolean {
  return TIERS[target].priceEUR > 0 && planRank(target) > planRank(current);
}
