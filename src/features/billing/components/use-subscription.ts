"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { planStatus, type SubscriptionView } from "@/lib/vidcica/billing";

/**
 * The person's live Stripe subscription (change-plan `status`). Skipped for the
 * Free plan: a Free account has no live subscription to show. `sub` stays null
 * for an account given a plan by hand, which has none either.
 */
export function useSubscription(enabled: boolean) {
  const [loading, setLoading] = useState(enabled);
  const [sub, setSub] = useState<SubscriptionView | null>(null);

  // The first read sets state only once the request answers, and not after
  // unmount (same pattern as enable-push-banner.tsx).
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void (async () => {
      const out = await planStatus(createClient());
      if (!active) return;
      setSub(out.ok ? out.subscription : null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [enabled]);

  const reload = useCallback(async () => {
    setLoading(true);
    const out = await planStatus(createClient());
    setSub(out.ok ? out.subscription : null);
    setLoading(false);
  }, []);

  return { loading, sub, reload };
}
