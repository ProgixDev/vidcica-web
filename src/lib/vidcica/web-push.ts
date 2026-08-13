/**
 * Browser-side Web Push mechanics: register the service worker, request
 * permission, and manage the PushSubscription. The mirror of the mobile app's
 * src/lib/push.ts (Expo tokens) — same idea, the Web Push protocol instead.
 *
 * This layer is pure browser API and returns the subscription payload; PERSISTING
 * it (the server action) is the notifications feature's job, so this stays free of
 * feature imports (lib must not depend on features). Everything is
 * capability-guarded and best-effort — it returns a typed reason, never throws.
 */
import { clientEnv } from "@/core/env.client";

export type PushPermission = "granted" | "denied" | "default" | "unsupported";

/** A browser PushSubscription flattened to what the server needs to store + push. */
export type BrowserSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
};

export type SubscribeResult =
  | { ok: true; subscription: BrowserSubscription }
  | { ok: false; reason: "unsupported" | "denied" | "no_key" | "error" };

const SW_URL = "/sw.js";

/** True when this browser can do Web Push at all (SW + PushManager + Notification). */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Whether a VAPID key is configured — push is unavailable (not just un-granted)
 *  without it, so the UI hides the control. */
export function isPushConfigured(): boolean {
  return clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length > 0;
}

export function getPermission(): PushPermission {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission as PushPermission;
}

/** Is this browser currently subscribed (SW registered + a live PushSubscription)? */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    if (!reg) return false;
    return !!(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}

/**
 * Register the SW, ask permission (must be called from a user gesture), subscribe,
 * and return the subscription payload for the caller to persist. Idempotent —
 * reuses an existing subscription. Returns a typed reason on failure.
 */
export async function subscribeBrowser(): Promise<SubscribeResult> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  if (!isPushConfigured()) return { ok: false, reason: "no_key" };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "denied" };

    const reg = await navigator.serviceWorker.register(SW_URL);
    await navigator.serviceWorker.ready;

    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast: the bytes are a valid BufferSource; TS's DOM lib narrows to
        // ArrayBuffer-backed views and rejects the generic Uint8Array otherwise.
        applicationServerKey: urlBase64ToUint8Array(
          clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        ) as BufferSource,
      }));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: "error" };
    }
    return {
      ok: true,
      subscription: {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 512) : undefined,
      },
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Unsubscribe this browser locally. Returns the endpoint that was removed (for
 *  the caller to delete server-side), or null if there was nothing to remove. */
export async function unsubscribeBrowser(): Promise<{ endpoint: string | null }> {
  if (!isPushSupported()) return { endpoint: null };
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (!sub) return { endpoint: null };
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    return { endpoint };
  } catch {
    return { endpoint: null };
  }
}

/** VAPID keys are base64url; PushManager wants a Uint8Array of the raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
