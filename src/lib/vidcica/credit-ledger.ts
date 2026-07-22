/**
 * Credit-ledger domain: type + row mapper + reason classifier. Shared (the
 * server-only query maps rows here; the client credits view renders them).
 * Ported from ClipFlow's credit-history model (app/billing/credits.tsx) onto the
 * real `public.credit_ledger` audit table (append-only, one row per grant/debit).
 *
 * The DB `reason` is free text written by the edge functions
 * (`video_generation`, `stripe_invoice_paid`, `stripe_pack`, `refund_*`, …); we
 * fold it into a small, translatable category so the UI stays honest about what
 * each movement was without inventing labels.
 */
import type { MessageKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

export type CreditLedgerRow = Database["public"]["Tables"]["credit_ledger"]["Row"];

/** Coarse, user-facing bucket for a raw ledger `reason`. */
export type LedgerReasonCategory =
  | "subscription"
  | "generation"
  | "refund"
  | "topup"
  | "adjustment";

export type CreditLedgerEntry = {
  id: string;
  /** Signed movement: > 0 grant/refund, < 0 debit. */
  delta: number;
  /** Raw DB reason (kept for the video seam / debugging). */
  reason: string;
  category: LedgerReasonCategory;
  videoId?: string;
  createdAt: string;
};

/**
 * Fold a raw `reason` into a category. Order matters: `refund_*` reasons also
 * contain "generation", and `stripe_pack` also contains "stripe", so the more
 * specific tests run first.
 */
export function classifyReason(reason: string): LedgerReasonCategory {
  const r = reason.toLowerCase();
  if (r.startsWith("refund")) return "refund";
  if (r.includes("pack") || r === "topup" || r.includes("top_up")) return "topup";
  if (r.includes("generation") || r === "consume") return "generation";
  if (
    r.includes("invoice") ||
    r.includes("subscription") ||
    r.startsWith("stripe") ||
    r.startsWith("revenuecat") ||
    r === "grant"
  ) {
    return "subscription";
  }
  return "adjustment";
}

export function rowToLedgerEntry(r: CreditLedgerRow): CreditLedgerEntry {
  return {
    id: r.id,
    delta: r.delta,
    reason: r.reason,
    category: classifyReason(r.reason),
    videoId: r.video_id ?? undefined,
    createdAt: r.created_at,
  };
}

/** Category → i18n label key (render with `t(LEDGER_REASON_KEY[category])`). */
export const LEDGER_REASON_KEY: Record<LedgerReasonCategory, MessageKey> = {
  subscription: "billing.ledger.reason.subscription",
  generation: "billing.ledger.reason.generation",
  refund: "billing.ledger.reason.refund",
  topup: "billing.ledger.reason.topup",
  adjustment: "billing.ledger.reason.adjustment",
};
