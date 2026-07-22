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
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
          low
            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
            : "border-border text-foreground hover:bg-accent",
          className,
        )}
      >
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", low ? "bg-destructive" : "bg-primary")}
        />
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
        "border-border bg-card hover:border-foreground/20 flex flex-col gap-2 rounded-md border p-3 transition-colors",
        className,
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          {t("chrome.creditsLabel")}
        </span>
        <span className={cn("text-sm font-semibold", low && "text-destructive")}>
          {credits}
          <span className="text-muted-foreground font-normal"> / {monthlyCredits}</span>
        </span>
      </div>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden>
        <div
          className={cn("h-full rounded-full", low ? "bg-destructive" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground text-[11px]">
        {low ? t("chrome.lowBalance") : t("chrome.manageOffer")}
      </span>
    </Link>
  );
}
