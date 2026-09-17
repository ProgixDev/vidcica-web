"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { clientEnv } from "@/core/env.client";
import {
  analyticsAllowed,
  readConsent,
  serverConsentSnapshot,
  setConsent as persistConsent,
  shouldAskConsent,
  subscribeConsent,
  type Consent,
} from "./consent";

/**
 * Analytics, gated on consent.
 *
 * Nothing runs until two things are true: a PostHog key is configured, and the
 * visitor has said yes. Without a key the whole thing is inert — no script, no
 * banner — so deploying this before the account exists changes nothing.
 *
 * Page views are captured manually: the App Router does not reload on
 * navigation, so automatic capture would only ever see the first page.
 */
const isConfigured = () => clientEnv.NEXT_PUBLIC_POSTHOG_KEY.length > 0;

/**
 * The SDK is imported dynamically, and only once consent is granted: a static
 * import ships tens of kilobytes of analytics JavaScript to every visitor —
 * including the ones who declined and every crawler — which is exactly the page
 * weight the SEO work is trying to keep down.
 */
type PostHog = typeof import("posthog-js").default;

let sdk: PostHog | null = null;
let ready: Promise<PostHog> | null = null;

/**
 * Load and initialise exactly once, and hand back the same promise to every
 * caller.
 *
 * Loading and initialising were two steps before, which raced: the page-view
 * effect could resolve the module before the init effect had run `init()`, see
 * a not-yet-loaded SDK and skip silently — so the first page view of a session,
 * the one right after consent, was dropped and nothing was ever sent.
 */
function ensurePostHog(): Promise<PostHog> {
  ready ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(clientEnv.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: clientEnv.NEXT_PUBLIC_POSTHOG_HOST,
      // We capture page views ourselves (below) — autocapture would miss every
      // client-side navigation.
      capture_pageview: false,
      // No session recording: it would film people's video scripts and account
      // screens, which is not what they consented to.
      disable_session_recording: true,
      persistence: "localStorage+cookie",
      // Error tracking rides on the same SDK, project and consent — no second
      // vendor, and nothing captured from someone who declined.
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        // Console noise is not an error signal; it would bury the real ones.
        capture_console_errors: false,
      },
    });
    sdk = posthog;
    return posthog;
  });
  return ready;
}

/** True once hydrated. Read as an external store rather than an effect+setState,
 *  so the banner can wait for the client without a cascading render. */
const subscribeNothing = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

type AnalyticsValue = {
  /** Null until the visitor answers. */
  consent: Consent | null;
  askConsent: boolean;
  setConsent: (value: Consent) => void;
  /** Record a product event. A no-op unless analytics is allowed. */
  capture: (event: string, properties?: Record<string, unknown>) => void;
  /** Report a caught error (the boundaries use this). */
  captureException: (error: unknown) => void;
};

const AnalyticsContext = createContext<AnalyticsValue | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, serverConsentSnapshot);
  const hydrated = useHydrated();
  const pathname = usePathname();
  const allowed = hydrated && analyticsAllowed(isConfigured(), consent);

  // One page view per route change, once allowed. `ensurePostHog` does the
  // loading and the init, so there is nothing to sequence here.
  useEffect(() => {
    if (!allowed) return;
    const url = `${window.location.origin}${pathname}${window.location.search}`;
    void ensurePostHog().then((posthog) => {
      posthog.capture("$pageview", { $current_url: url });
    });
  }, [pathname, allowed]);

  const setConsent = useCallback((value: Consent) => {
    persistConsent(value);
    if (value === "denied" && sdk?.__loaded) {
      // Honour a withdrawal immediately: stop sending and drop the identifiers.
      sdk.opt_out_capturing();
      sdk.reset();
    }
  }, []);

  const capture = useCallback<AnalyticsValue["capture"]>(
    (event, properties) => {
      if (!allowed) return;
      void ensurePostHog().then((posthog) => posthog.capture(event, properties));
    },
    [allowed],
  );

  const captureException = useCallback(
    (error: unknown) => {
      if (!allowed) return;
      void ensurePostHog().then((posthog) => posthog.captureException(error));
    },
    [allowed],
  );

  const value = useMemo<AnalyticsValue>(
    () => ({
      consent,
      // Never render the banner during SSR: the server cannot know the stored
      // choice, so it would flash for people who already answered.
      askConsent: hydrated && shouldAskConsent(isConfigured(), consent),
      setConsent,
      capture,
      captureException,
    }),
    [consent, hydrated, setConsent, capture, captureException],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

/** Analytics API for components. Safe outside the provider (tests, stray mounts). */
export function useAnalytics(): AnalyticsValue {
  return (
    useContext(AnalyticsContext) ?? {
      consent: null,
      askConsent: false,
      setConsent: () => {},
      capture: () => {},
      captureException: () => {},
    }
  );
}
