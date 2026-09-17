"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useAnalytics } from "@/lib/analytics/provider";
import { useT } from "@/lib/i18n/provider";

/**
 * Asks once, then never again. Rendered only when analytics is configured and
 * the visitor has not answered — so with no PostHog key it never appears.
 *
 * Deliberately not a modal: it must not block the page for a visitor who
 * arrived from a search result, and both choices are one click away (a banner
 * where refusing is harder than accepting is not valid consent).
 */
export function ConsentBanner() {
  const { askConsent, setConsent } = useAnalytics();
  const t = useT();

  if (!askConsent) return null;

  return (
    <div
      role="dialog"
      aria-label={t("consent.title")}
      className="fixed inset-x-0 bottom-0 z-50 p-4"
    >
      <div className="border-border bg-card mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-lg border p-5 shadow-lg sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-sm font-medium">{t("consent.title")}</p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {t("consent.body")}{" "}
            <Link href="/privacy" className="hover:text-foreground underline">
              {t("consent.learnMore")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
          >
            {t("consent.decline")}
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
          >
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
