/**
 * Analytics consent — opt-in, stored per browser.
 *
 * The primary market is French, so CNIL/GDPR rules apply: audience measurement
 * that sets identifiers needs consent *before* it runs. Nothing loads until the
 * visitor says yes, and "no" is remembered so the banner stops asking.
 */
export const CONSENT_KEY = "vidcica.analytics-consent";

export type Consent = "granted" | "denied";

/** Read the stored choice. Any storage failure (private mode, blocked cookies)
 *  reads as "no choice yet" rather than throwing on a public page. */
export function readConsent(): Consent | null {
  try {
    const v = globalThis.localStorage?.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: Consent): void {
  try {
    globalThis.localStorage?.setItem(CONSENT_KEY, value);
  } catch {
    // Storage unavailable — the choice simply isn't remembered; never crash.
  }
}

/**
 * Whether the banner should be shown: only when analytics is actually
 * configured and the visitor has not answered yet. With no key, there is
 * nothing to consent to, so asking would be noise.
 */
export function shouldAskConsent(isConfigured: boolean, stored: Consent | null): boolean {
  return isConfigured && stored === null;
}

/** Whether analytics may run right now. */
export function analyticsAllowed(isConfigured: boolean, stored: Consent | null): boolean {
  return isConfigured && stored === "granted";
}

// --- Subscription, so React can read this as an external store ---------------

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to consent changes: our own writes, and other tabs via `storage`. */
export function subscribeConsent(onChange: Listener): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY) onChange();
  };
  globalThis.addEventListener?.("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    globalThis.removeEventListener?.("storage", onStorage);
  };
}

/** Write a choice and tell every subscriber. */
export function setConsent(value: Consent): void {
  writeConsent(value);
  for (const l of listeners) l();
}

/** Server snapshot: the server cannot know the choice, so it renders as if
 *  unanswered — and the banner waits for hydration before showing, which keeps
 *  the server and client markup identical. */
export const serverConsentSnapshot = (): Consent | null => null;
