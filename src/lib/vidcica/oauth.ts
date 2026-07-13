/**
 * Web OAuth orchestrator for connecting a social network.
 *
 * The existing `oauth-start` returns the provider authorize URL; `oauth-callback`
 * exchanges + persists the token SERVER-SIDE, then 302s to `vidcica://` (a mobile
 * scheme a browser can't follow). So on web we open the authorize URL in a popup
 * and — since the token is saved before that redirect — DETECT success by reading
 * the `networks` row (poll while the popup is open). No backend change.
 *
 * The orchestration is dependency-injected (`runNetworkOAuth`) so cancel /
 * not-configured / detect are unit-testable without a browser (spec AC-2/3/4).
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

type PopupHandle = { closed: boolean; close: () => void };

export type OAuthDeps = {
  /** Get the provider authorize URL (or a not-configured/err signal). */
  start: () => Promise<
    | { ok: true; url: string }
    | { ok: false; reason: "platform_not_configured" | "error"; message?: string }
  >;
  openPopup: (url: string) => PopupHandle | null;
  /** True once the target network row is connected (and not needing reconnect). */
  isConnected: () => Promise<boolean>;
  wait: (ms: number) => Promise<void>;
  now: () => number;
};

/** Pure orchestration: start → popup → poll-detect. Injected deps make it testable. */
export async function runNetworkOAuth(
  deps: OAuthDeps,
  opts: { timeoutMs?: number; pollMs?: number } = {},
): Promise<OAuthOutcome> {
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const pollMs = opts.pollMs ?? 2_000;

  const started = await deps.start();
  if (!started.ok) return { ok: false, reason: started.reason, message: started.message };

  const popup = deps.openPopup(started.url);
  if (!popup) return { ok: false, reason: "error", message: "Popup bloquée par le navigateur." };

  const t0 = deps.now();
  while (deps.now() - t0 < timeoutMs) {
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

/** Real entry point: build deps from the Supabase client + the browser. */
export async function startNetworkOAuth(supabase: DB, platform: PlatformId): Promise<OAuthOutcome> {
  const provider = platformToProvider(platform);
  if (!provider) return { ok: false, reason: "platform_not_configured" };

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
    openPopup: (url) =>
      typeof window === "undefined"
        ? null
        : window.open(url, "vidcica-oauth", "width=600,height=720"),
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

  return runNetworkOAuth(deps);
}
