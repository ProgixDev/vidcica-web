/**
 * Web OAuth orchestrator for connecting a social network.
 *
 * The existing `oauth-start` returns the provider authorize URL; `oauth-callback`
 * exchanges + persists the token SERVER-SIDE, then 302s to `vidcica://` (a mobile
 * scheme a browser can't follow). So on web we open a popup and — since the token
 * is saved before that redirect — DETECT success by reading the `networks` row
 * (poll while the popup is open). No backend change.
 *
 * IMPORTANT: the popup MUST be opened synchronously inside the click handler
 * (before any `await`), or the browser popup-blocks it. So the caller opens a
 * blank popup and hands the window in; the orchestrator navigates it to the
 * authorize URL once `oauth-start` resolves. The provider URL is server-issued
 * and points only at trusted IdPs — the reason we can keep the `opener` handle
 * (needed to poll `popup.closed`) rather than using `noopener`.
 *
 * Dependency-injected (`runNetworkOAuth`) so cancel / not-configured / detect /
 * abort are unit-testable without a browser (spec AC-2/3/4).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";
import { platformToProvider, type PlatformId } from "@/lib/vidcica/network";

type DB = SupabaseClient<Database>;
const SUPABASE_URL = clientEnv.NEXT_PUBLIC_SUPABASE_URL;

export type OAuthOutcome =
  | { ok: true }
  | {
      ok: false;
      reason: "cancelled" | "platform_not_configured" | "timeout" | "unauthenticated" | "error";
      message?: string;
    };

/** A live handle to the pre-opened popup (`closed` is read each poll). */
export type PopupHandle = { readonly closed: boolean; close: () => void };

export type OAuthDeps = {
  /** Get the provider authorize URL (or a not-configured/err signal). */
  start: () => Promise<
    | { ok: true; url: string }
    | { ok: false; reason: "platform_not_configured" | "error"; message?: string }
  >;
  /** Point the already-open popup at the authorize URL. */
  navigate: (url: string) => void;
  /** True once the target network row is connected (and not needing reconnect). */
  isConnected: () => Promise<boolean>;
  wait: (ms: number) => Promise<void>;
  now: () => number;
};

export type RunOpts = { timeoutMs?: number; pollMs?: number; signal?: AbortSignal };

/** Pure orchestration over an already-open popup. Injected deps make it testable. */
export async function runNetworkOAuth(
  deps: OAuthDeps,
  popup: PopupHandle | null,
  opts: RunOpts = {},
): Promise<OAuthOutcome> {
  if (!popup) return { ok: false, reason: "error", message: "Popup bloquée par le navigateur." };
  const timeoutMs = opts.timeoutMs ?? 120_000;
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
    if (await deps.isConnected()) {
      popup.close();
      return { ok: true };
    }
    if (popup.closed) {
      // Closed by the user — one last check for the connect-then-close race.
      return (await deps.isConnected()) ? { ok: true } : { ok: false, reason: "cancelled" };
    }
    await deps.wait(pollMs);
  }
  popup.close();
  return { ok: false, reason: "timeout" };
}

/**
 * Real entry point. `popup` MUST already be opened by the click handler
 * (`window.open("", "vidcica-oauth", …)`) so the browser doesn't block it.
 */
export async function startNetworkOAuth(
  supabase: DB,
  platform: PlatformId,
  popup: Window | null,
  opts: RunOpts = {},
): Promise<OAuthOutcome> {
  const provider = platformToProvider(platform);
  if (!provider) {
    popup?.close();
    return { ok: false, reason: "platform_not_configured" };
  }

  const handle: PopupHandle | null = popup
    ? {
        get closed() {
          return popup.closed;
        },
        close: () => popup.close(),
      }
    : null;

  const deps: OAuthDeps = {
    start: async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return { ok: false, reason: "error", message: "unauthenticated" };
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/oauth-start`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ platform: provider }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          authorizeUrl?: string;
          error?: string;
        };
        if (res.status === 503 && body.error === "platform_not_configured") {
          return { ok: false, reason: "platform_not_configured" };
        }
        if (!res.ok || !body.authorizeUrl) {
          return { ok: false, reason: "error", message: body.error ?? `HTTP ${res.status}` };
        }
        return { ok: true, url: body.authorizeUrl };
      } catch (e) {
        return { ok: false, reason: "error", message: (e as Error).message };
      }
    },
    navigate: (url) => {
      try {
        if (popup) popup.location.href = url;
      } catch {
        // cross-origin after the provider navigates — expected, ignore.
      }
    },
    isConnected: async () => {
      const { data } = await supabase
        .from("networks")
        .select("connected, needs_reconnect")
        .eq("platform", platform)
        .maybeSingle();
      return !!data && data.connected && !data.needs_reconnect;
    },
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    now: () => Date.now(),
  };

  return runNetworkOAuth(deps, handle, opts);
}
