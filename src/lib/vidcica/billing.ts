/**
 * Web billing client. Subscribe and credit packs drive `create-checkout-session`;
 * card and invoices drive `create-portal-session`; a subscriber's plan changes
 * drive `change-plan`. Entitlement (`profiles.tier`) and credits are written by
 * `stripe-webhook`, never by the client.
 *
 * Since 2026-10-18 (payments plan, vidcica commit 0e1ee8d onward):
 *   - Checkout and the portal open in a popup, opened synchronously in the click
 *     handler. Each call sends `returnOrigin`; the server allowlists it, and
 *     Stripe sends the popup to `/checkout/return`. That page broadcasts its
 *     status on the `vidcica:billing` BroadcastChannel (and to the opener), then
 *     closes itself.
 *   - A checkout never reports a false failure. "success" from the return page
 *     means "paid, keep polling" (the webhook is asynchronous); if the plan
 *     still isn't visible after a while, the outcome is `pending` ("payment
 *     received, activating"). A popup that reports `closed` keeps being polled
 *     for a grace period: a bank's 3-D Secure page can make an open popup look
 *     closed.
 *   - A credit pack counts as bought when a new `stripe_pack` ledger row appears,
 *     not when the balance rises (credits spent meanwhile would hide it).
 *   - A subscriber never goes through Checkout again (the server answers
 *     `has_subscription`): plan changes go through `change-plan`.
 *
 * The checkout orchestration is dependency-injected (`runCheckout`) so it is
 * unit-testable without a browser.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";
import { planRank, type Plan } from "@/lib/vidcica/tiers";

type DB = SupabaseClient<Database>;
const SUPABASE_URL = clientEnv.NEXT_PUBLIC_SUPABASE_URL;

/** Channel the return page broadcasts on (same origin, any window). */
export const BILLING_CHANNEL = "vidcica:billing";
/** What `/checkout/return` reports. */
export const RETURN_STATUSES = ["success", "cancel", "portal", "has_subscription"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export type CheckoutOutcome =
  | { ok: true }
  | {
      ok: false;
      reason: "pending" | "cancelled" | "has_subscription" | "not_configured" | "error";
      message?: string;
    };

export type PopupHandle = { readonly closed: boolean; close: () => void };

type StartResult =
  | { ok: true; url: string }
  | { ok: false; reason: "not_configured" | "has_subscription" | "error"; message?: string };

export type CheckoutDeps = {
  start: () => Promise<StartResult>;
  navigate: (url: string) => void;
  /** True once the purchase shows on the account (plan reached, pack row). */
  hasUpgraded: () => Promise<boolean>;
  /** The latest status the return page reported, or null. */
  returnStatus: () => ReturnStatus | null;
  wait: (ms: number) => Promise<void>;
  now: () => number;
};

export type RunOpts = {
  pollMs?: number;
  /** How long a "closed" popup keeps being polled before counting as cancelled. */
  closedGraceMs?: number;
  /** After a reported payment, how long to wait for the account to show it. */
  confirmMs?: number;
  /** A popup left open this long stops the wait (outcome `pending`). */
  maxOpenMs?: number;
  signal?: AbortSignal;
};

/** Pure orchestration over an already-open popup. */
export async function runCheckout(
  deps: CheckoutDeps,
  popup: PopupHandle | null,
  opts: RunOpts = {},
): Promise<CheckoutOutcome> {
  if (!popup) return { ok: false, reason: "error", message: "popup_blocked" };
  const pollMs = opts.pollMs ?? 2_000;
  const closedGraceMs = opts.closedGraceMs ?? 15_000;
  const confirmMs = opts.confirmMs ?? 90_000;
  const maxOpenMs = opts.maxOpenMs ?? 20 * 60_000;

  const started = await deps.start();
  if (!started.ok) {
    popup.close();
    return { ok: false, reason: started.reason, message: started.message };
  }
  deps.navigate(started.url);

  const t0 = deps.now();
  let paidAt: number | null = null;
  let closedAt: number | null = null;
  for (;;) {
    if (opts.signal?.aborted) {
      popup.close();
      return { ok: false, reason: "cancelled" };
    }
    if (await deps.hasUpgraded()) {
      popup.close();
      return { ok: true };
    }
    const status = deps.returnStatus();
    if (status === "cancel") {
      popup.close();
      return { ok: false, reason: "cancelled" };
    }
    if (status === "has_subscription") {
      popup.close();
      return { ok: false, reason: "has_subscription" };
    }
    const now = deps.now();
    if (status === "success" && paidAt === null) paidAt = now;
    if (paidAt !== null && now - paidAt >= confirmMs) return { ok: false, reason: "pending" };
    if (popup.closed && closedAt === null) closedAt = now;
    if (closedAt !== null && paidAt === null && now - closedAt >= closedGraceMs) {
      return (await deps.hasUpgraded()) ? { ok: true } : { ok: false, reason: "cancelled" };
    }
    if (now - t0 >= maxOpenMs) {
      popup.close();
      return { ok: false, reason: "pending" };
    }
    await deps.wait(pollMs);
  }
}

/** Listen for the return page while a checkout runs. */
export function listenBillingReturn(): { latest: () => ReturnStatus | null; close: () => void } {
  let latest: ReturnStatus | null = null;
  const accept = (data: unknown) => {
    const parsed = returnMessage.safeParse(data);
    if (parsed.success) latest = parsed.data.status;
  };
  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(BILLING_CHANNEL);
    channel.onmessage = (e) => accept(e.data);
  }
  const onMessage = (e: MessageEvent) => {
    if (e.origin === window.location.origin) accept(e.data);
  };
  if (typeof window !== "undefined") window.addEventListener("message", onMessage);
  return {
    latest: () => latest,
    close: () => {
      channel?.close();
      if (typeof window !== "undefined") window.removeEventListener("message", onMessage);
    },
  };
}

const returnMessage = z.object({
  type: z.literal(BILLING_CHANNEL),
  status: z.enum(RETURN_STATUSES),
});

async function token(supabase: DB): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function returnOrigin(): string | undefined {
  return typeof window !== "undefined" ? window.location.origin : undefined;
}

async function startSession(supabase: DB, body: Record<string, unknown>): Promise<StartResult> {
  const t = await token(supabase);
  if (!t) return { ok: false, reason: "error", message: "unauthenticated" };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, returnOrigin: returnOrigin() }),
    });
    if (res.status === 503) return { ok: false, reason: "not_configured" };
    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.status === 409 && json.error === "has_subscription") {
      return { ok: false, reason: "has_subscription" };
    }
    if (!res.ok || !json.url) {
      return { ok: false, reason: "error", message: json.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, url: json.url };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}

function handleOf(popup: Window | null): PopupHandle | null {
  return popup
    ? {
        get closed() {
          return popup.closed;
        },
        close: () => popup.close(),
      }
    : null;
}

function navigateIn(popup: Window | null) {
  return (url: string) => {
    try {
      if (popup) popup.location.href = url;
    } catch {
      // cross-origin once on Stripe — expected.
    }
  };
}

const realTime = {
  wait: (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
  now: () => Date.now(),
};

/** Subscribe to `plan` (people without a subscription). `popup` MUST be opened
 *  synchronously in the click handler. */
export async function startCheckout(
  supabase: DB,
  plan: Plan,
  popup: Window | null,
  opts: RunOpts = {},
): Promise<CheckoutOutcome> {
  const listener = listenBillingReturn();
  try {
    return await runCheckout(
      {
        start: () => startSession(supabase, { plan }),
        navigate: navigateIn(popup),
        hasUpgraded: async () => {
          const { data } = await supabase.from("profiles").select("tier").maybeSingle();
          return !!data && planRank(data.tier as Plan) >= planRank(plan);
        },
        returnStatus: listener.latest,
        ...realTime,
      },
      handleOf(popup),
      opts,
    );
  } finally {
    listener.close();
  }
}

/** The newest `stripe_pack` ledger row id, or null. */
async function latestPackGrant(supabase: DB): Promise<string | null> {
  const { data } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("reason", "stripe_pack")
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0] as { id?: string } | undefined)?.id ?? null;
}

/** Buy a one-time credit pack (`packCredits` = the pack's credit count). It
 *  counts as bought when a `stripe_pack` ledger row newer than the one seen
 *  before opening appears. `popup` MUST be opened synchronously in the click
 *  handler. */
export async function startCreditCheckout(
  supabase: DB,
  packCredits: number,
  popup: Window | null,
  opts: RunOpts = {},
): Promise<CheckoutOutcome> {
  const before = await latestPackGrant(supabase);
  const listener = listenBillingReturn();
  try {
    return await runCheckout(
      {
        start: () => startSession(supabase, { packCredits }),
        navigate: navigateIn(popup),
        hasUpgraded: async () => {
          const now = await latestPackGrant(supabase);
          return now !== null && now !== before;
        },
        returnStatus: listener.latest,
        ...realTime,
      },
      handleOf(popup),
      opts,
    );
  } finally {
    listener.close();
  }
}

export type PortalOutcome =
  | { ok: true; closed: Promise<void> }
  | {
      ok: false;
      reason: "no_customer" | "not_configured" | "unauthenticated" | "error";
      message?: string;
    };

/** Open the Stripe customer portal (card, invoices) in the pre-opened popup.
 *  `closed` resolves when the person is done (popup closed or back on
 *  /checkout/return), so the caller can re-read the page. */
export async function openBillingPortal(
  supabase: DB,
  popup: Window | null,
): Promise<PortalOutcome> {
  if (!popup) return { ok: false, reason: "error", message: "popup_blocked" };
  const t = await token(supabase);
  if (!t) {
    popup.close();
    return { ok: false, reason: "unauthenticated" };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ returnOrigin: returnOrigin() }),
    });
    if (res.status === 503) {
      popup.close();
      return { ok: false, reason: "not_configured" };
    }
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.status === 400 && body.error === "no_customer") {
      popup.close();
      return { ok: false, reason: "no_customer" };
    }
    if (!res.ok || !body.url) {
      popup.close();
      return { ok: false, reason: "error", message: body.error ?? `HTTP ${res.status}` };
    }
    popup.location.href = body.url;
    return { ok: true, closed: whenDone(popup) };
  } catch (e) {
    popup.close();
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}

/** Resolves when the popup closes or the return page reports `portal`. */
function whenDone(popup: Window): Promise<void> {
  const listener = listenBillingReturn();
  return new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (popup.closed || listener.latest() === "portal") {
        clearInterval(timer);
        listener.close();
        resolve();
      }
    }, 1_000);
  });
}

// ── Plan changes (change-plan) ─────────────────────────────────────────

const planSchema = z.enum(["starter", "pro", "studio"]);

const subscriptionSchema = z.object({
  id: z.string(),
  plan: planSchema.nullable(),
  status: z.string(),
  periodEnd: z.string(),
  cancelAt: z.string().nullable(),
  pending: z.object({ plan: planSchema.nullable(), at: z.string() }).nullable(),
  paymentPending: z.object({ url: z.string().url() }).nullable(),
  card: z
    .object({ brand: z.string().nullable(), last4: z.string().nullable(), type: z.string() })
    .nullable(),
  currency: z.string(),
  monthly: z.number().nullable(),
  changeable: z.boolean(),
});
export type SubscriptionView = z.infer<typeof subscriptionSchema>;

const previewSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("upgrade"),
    plan: planSchema,
    currency: z.string(),
    dueToday: z.number(),
    monthly: z.number().nullable(),
    prorationDate: z.number(),
    quotedFrom: z.string().nullable(),
    card: subscriptionSchema.shape.card,
    dropsDowngrade: z.boolean(),
    resumesCancellation: z.boolean(),
  }),
  z.object({
    kind: z.literal("downgrade"),
    plan: planSchema,
    effectiveAt: z.string(),
    currency: z.string(),
  }),
  z.object({ kind: z.literal("keep"), plan: planSchema }),
]);
export type PlanPreview = z.infer<typeof previewSchema>;

const applySchema = z.object({
  kind: z.enum(["upgraded", "action_required", "scheduled", "kept", "cancel_scheduled", "resumed"]),
  plan: planSchema.nullable().optional(),
  url: z.string().url().nullable().optional(),
  effectiveAt: z.string().optional(),
  at: z.string().optional(),
});
export type PlanChangeResult = z.infer<typeof applySchema>;

export type PlanCallError = { ok: false; reason: string; url?: string };

async function callChangePlan(
  supabase: DB,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: unknown } | PlanCallError> {
  const t = await token(supabase);
  if (!t) return { ok: false, reason: "unauthenticated" };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/change-plan`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 503) return { ok: false, reason: "not_configured" };
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        reason: typeof json.error === "string" ? json.error : `http_${res.status}`,
        ...(typeof json.url === "string" ? { url: json.url } : {}),
      };
    }
    return { ok: true, data: json };
  } catch (e) {
    console.warn("[billing] change-plan unreachable:", (e as Error).message);
    return { ok: false, reason: "network" };
  }
}

/** The person's live Stripe subscription, or null (none, or a plan given by hand). */
export async function planStatus(
  supabase: DB,
): Promise<{ ok: true; subscription: SubscriptionView | null } | PlanCallError> {
  const out = await callChangePlan(supabase, { action: "status" });
  if (!out.ok) return out;
  const parsed = z.object({ subscription: subscriptionSchema.nullable() }).safeParse(out.data);
  return parsed.success
    ? { ok: true, subscription: parsed.data.subscription }
    : { ok: false, reason: "bad_response" };
}

/** What a change to `plan` costs or when it takes effect. */
export async function previewPlanChange(
  supabase: DB,
  plan: Exclude<Plan, "free">,
): Promise<{ ok: true; preview: PlanPreview } | PlanCallError> {
  const out = await callChangePlan(supabase, { action: "preview", plan });
  if (!out.ok) return out;
  const parsed = previewSchema.safeParse(out.data);
  return parsed.success
    ? { ok: true, preview: parsed.data }
    : { ok: false, reason: "bad_response" };
}

async function mutate(
  supabase: DB,
  body: Record<string, unknown>,
): Promise<{ ok: true; result: PlanChangeResult } | PlanCallError> {
  const out = await callChangePlan(supabase, body);
  if (!out.ok) return out;
  const parsed = applySchema.safeParse(out.data);
  return parsed.success ? { ok: true, result: parsed.data } : { ok: false, reason: "bad_response" };
}

/** Confirm a previewed change. `requestId` is made when the confirmation opens,
 *  so a double click sends the same change once. */
export function applyPlanChange(
  supabase: DB,
  preview: PlanPreview,
  requestId: string,
): Promise<{ ok: true; result: PlanChangeResult } | PlanCallError> {
  return preview.kind === "upgrade"
    ? mutate(supabase, {
        action: "apply",
        plan: preview.plan,
        prorationDate: preview.prorationDate,
        quotedFrom: preview.quotedFrom,
        requestId,
      })
    : preview.kind === "downgrade"
      ? mutate(supabase, { action: "apply", plan: preview.plan, requestId })
      : mutate(supabase, { action: "keep" });
}

export const keepCurrentPlan = (supabase: DB) => mutate(supabase, { action: "keep" });
export const cancelSubscription = (supabase: DB, requestId: string) =>
  mutate(supabase, { action: "cancel", requestId });
export const resumeSubscription = (supabase: DB, requestId: string) =>
  mutate(supabase, { action: "resume", requestId });

/** Poll until the account's plan reaches `plan` (the webhook is asynchronous). */
export async function waitForPlan(
  supabase: DB,
  plan: Plan,
  opts: { timeoutMs?: number; pollMs?: number; signal?: AbortSignal } = {},
): Promise<boolean> {
  const deadline = Date.now() + (opts.timeoutMs ?? 90_000);
  while (Date.now() < deadline) {
    if (opts.signal?.aborted) return false;
    const { data } = await supabase.from("profiles").select("tier").maybeSingle();
    if (data && planRank(data.tier as Plan) >= planRank(plan)) return true;
    await new Promise((r) => setTimeout(r, opts.pollMs ?? 2_000));
  }
  return false;
}
