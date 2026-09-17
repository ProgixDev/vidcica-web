"use client";

import { useEffect } from "react";
import { useAnalytics } from "@/lib/analytics/provider";

/**
 * Reports an error caught by a boundary.
 *
 * A separate component so `global-error.tsx` can stay dependency-light: it
 * renders its own `<html>`/`<body>` and runs when the root layout itself has
 * failed, so importing providers there would risk the error page failing too.
 * Rendered inside the boundary, it only needs the hook to no-op safely — which
 * `useAnalytics` does outside a provider.
 */
export function ErrorReporter({ error }: { error: unknown }) {
  const { captureException } = useAnalytics();

  useEffect(() => {
    captureException(error);
  }, [error, captureException]);

  return null;
}
