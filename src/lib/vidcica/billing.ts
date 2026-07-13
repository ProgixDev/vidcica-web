/**
 * Web billing client. Subscribe drives the existing `create-checkout-session`;
 * manage drives `create-portal-session`. Entitlement (`profiles.tier`) is written
 * by the live `stripe-webhook` — never by the client.
 *
 * `create-checkout-session` hard-codes its Stripe return URL to `vidcica://`
 * (mobile), so — like the 003 OAuth connect — the web opens Checkout in a popup
 * and DETECTS the upgrade by polling `profiles.tier` (the webhook writes it
 * server-side before the popup's return). No backend change.
 *
 * The checkout orchestration is dependency-injected (`runCheckout`) so
 * detect / cancelled / not-configured are unit-testable without a browser.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";
import { planRank, type Plan } from "@/lib/vidcica/tiers";

type DB = SupabaseClient<Database>;
const SUPABASE_URL = clientEnv.NEXT_PUBLIC_SUPABASE_URL;

export type CheckoutOutcome =
  | { ok: true }
  | {
      ok: false;
      reason: "cancelled" | "not_configured" | "unauthenticated" | "timeout" | "error";
      message?: string;
    };

export type PopupHandle = { readonly closed: boolean; close: () => void };

export type CheckoutDeps = {
  start: () => Promise<
    { ok: true; url: string } | { ok: false; reason: "not_configured" | "error"; message?: string }
  >;
  navigate: (url: string) => void;
  /** True once the entitlement has reached (or passed) the purchased plan. */
  hasUpgraded: () => Promise<boolean>;
  wait: (ms: number) => Promise<void>;
  now: () => number;
};

export type RunOpts = { timeoutMs?: number; pollMs?: number; signal?: AbortSignal };

/** Pure orchestration over an already-open popup — mirrors runNetworkOAuth. */
export async function runCheckout(
  deps: CheckoutDeps,
  popup: PopupHandle | null,
  opts: RunOpts = {},
): Promise<CheckoutOutcome> {
  if (!popup) return { ok: false, reason: "error", message: "Popup bloquée par le navigateur." };
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const pollMs = opts.pollMs ?? 2_000;

  const started = await deps.start();
  if (!started.ok) {
    popup.close();
    return { ok: false, reason: started.reason, message: started.message };
  }
  deps.navigate(started.url);

  const t0 = deps.now();
  while (deps.now() - t0 < timeoutMs) {
    if (opts.signal?.aborted) {
      popup.close();
      return { ok: false, reason: "cancelled" };
    }
    if (await deps.hasUpgraded()) {
      popup.close();
      return { ok: true };
    }
    if (popup.closed) {
      return (await deps.hasUpgraded()) ? { ok: true } : { ok: false, reason: "cancelled" };
    }
    await deps.wait(pollMs);
  }
  popup.close();
  return { ok: false, reason: "timeout" };
}

async function token(supabase: DB): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Subscribe to `plan`. `popup` MUST be opened synchronously in the click handler. */
export async function startCheckout(
  supabase: DB,
  plan: Plan,
  popup: Window | null,
  opts: RunOpts = {},
): Promise<CheckoutOutcome> {
  const handle: PopupHandle | null = popup
    ? {
        get closed() {
          return popup.closed;
        },
        close: () => popup.close(),
      }
    : null;

  const deps: CheckoutDeps = {
    start: async () => {
      const t = await token(supabase);
      if (!t) return { ok: false, reason: "error", message: "unauthenticated" };
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
          method: "POST",
          headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        if (res.status === 503) return { ok: false, reason: "not_configured" };
        const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !body.url) {
          return { ok: false, reason: "error", message: body.error ?? `HTTP ${res.status}` };
        }
        return { ok: true, url: body.url };
      } catch (e) {
        return { ok: false, reason: "error", message: (e as Error).message };
      }
    },
    navigate: (url) => {
      try {
        if (popup) popup.location.href = url;
      } catch {
        // cross-origin once on Stripe — expected.
      }
    },
    hasUpgraded: async () => {
      const { data } = await supabase.from("profiles").select("tier").maybeSingle();
      return !!data && planRank(data.tier as Plan) >= planRank(plan);
    },
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    now: () => Date.now(),
  };

  return runCheckout(deps, handle, opts);
}

export type PortalOutcome =
  | { ok: true }
  | {
      ok: false;
      reason: "no_customer" | "not_configured" | "unauthenticated" | "error";
      message?: string;
    };

/** Open the Stripe Billing Portal in the pre-opened popup. */
export async function openBillingPortal(
  supabase: DB,
  popup: Window | null,
): Promise<PortalOutcome> {
  if (!popup) return { ok: false, reason: "error", message: "Popup bloquée." };
  const t = await token(supabase);
  if (!t) {
    popup.close();
    return { ok: false, reason: "unauthenticated" };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
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
    return { ok: true };
  } catch (e) {
    popup.close();
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}
