"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useAnalytics } from "@/lib/analytics/provider";

/**
 * A `next/link` that records which call to action was used.
 *
 * Page views alone cannot answer the question the SEO work exists to answer —
 * which page turns a visitor into a customer. `location` is what makes that
 * readable: "hero", "pricing:pro", "use-case:restaurant" and so on, so a funnel
 * can be split by the page and the button that started it.
 *
 * Capture is a no-op unless analytics is configured and consent was granted, so
 * this is safe to use anywhere — including on pages a crawler will hit.
 */
type TrackedLinkProps = ComponentProps<typeof Link> & {
  /** Where this CTA lives, e.g. `hero`, `pricing:starter`, `use-case:immobilier`. */
  location: string;
};

export function TrackedLink({ location, onClick, ...props }: TrackedLinkProps) {
  const { capture } = useAnalytics();

  return (
    <Link
      {...props}
      onClick={(e) => {
        capture("cta_clicked", { location, href: String(props.href) });
        onClick?.(e);
      }}
    />
  );
}
