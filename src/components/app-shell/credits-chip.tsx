"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { useCreditsRealtime } from "@/lib/vidcica/use-credits-realtime";

/**
 * Live credit balance, mirroring the mobile app's CreditsChip: `{credits} /
 * {monthly} crédits`, danger-tinted under 20 % of the monthly grant, links to
 * billing. Seeded server-side, kept live over the credits_accounts channel.
 */
export function CreditsChip({
  userId,
  initial,
  monthlyCredits,
  variant = "chip",
  className,
}: {
  userId: string;
  initial: number;
  monthlyCredits: number;
  /** `chip` = compact pill (topbar) · `card` = sidebar block with gauge. */
  variant?: "chip" | "card";
  className?: string;
}) {
  const t = useT();
  const credits = useCreditsRealtime(userId, initial);
  const low = monthlyCredits > 0 && credits / monthlyCredits < 0.2;

  if (variant === "chip") {
    return (
      <Link
        href="/billing"
        data-testid="shell-credits-chip"
        className={cn(
          "flex h-10 items-center rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition-colors",
          low
            ? "bg-destructive-subtle text-destructive"
            : "bg-secondary text-foreground hover:bg-accent",
          className,
        )}
      >
        {t("chrome.creditsCount", { count: credits })}
      </Link>
    );
  }

  const pct = monthlyCredits > 0 ? Math.min(100, Math.round((credits / monthlyCredits) * 100)) : 0;
  return (
    <Link
      href="/billing"
      data-testid="shell-credits-card"
      className={cn(
        "bg-secondary hover:bg-accent flex flex-col gap-2.5 rounded-md p-4 transition-colors",
        className,
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-[13px] font-medium">
          {t("chrome.creditsLabel")}
        </span>
        <span className={cn("text-[15px] font-semibold", low && "text-destructive")}>
          {credits}
          {monthlyCredits > 0 ? (
            <span className="text-muted-foreground font-normal"> / {monthlyCredits}</span>
          ) : null}
        </span>
      </div>
      {monthlyCredits > 0 ? (
        <div className="bg-accent h-1 overflow-hidden rounded-full" aria-hidden>
          <div
            className={cn("h-full rounded-full", low ? "bg-destructive" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
      <span className="text-muted-foreground text-xs">
        {low ? t("chrome.lowBalance") : t("chrome.manageOffer")}
      </span>
    </Link>
  );
}
