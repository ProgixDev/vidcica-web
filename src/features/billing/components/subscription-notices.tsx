"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/i18n/provider";
import type { SubscriptionView } from "@/lib/vidcica/billing";
import { TIERS } from "@/lib/vidcica/tiers";
import { formatBillingDate } from "../format";

const POPUP = "width=520,height=760";

/**
 * What a subscriber must know before changing anything: a payment waiting for
 * their bank, a failed renewal, a scheduled downgrade (with "Keep"), a
 * scheduled cancellation (with "Resume").
 */
export function SubscriptionNotices({
  sub,
  busy,
  onKeep,
  onResume,
  onManageCard,
}: {
  sub: SubscriptionView;
  busy: boolean;
  onKeep: () => void;
  onResume: () => void;
  onManageCard: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const date = (iso: string) => formatBillingDate(iso, locale);
  const current = sub.plan ? t(TIERS[sub.plan].labelKey) : "";
  const pendingUrl = sub.paymentPending?.url;

  const notices: { key: string; text: string; action?: ReactNode }[] = [];
  if (pendingUrl) {
    notices.push({
      key: "payment-pending",
      text: t("billing.sub.paymentPending"),
      action: (
        <Button
          size="sm"
          // Opened by the click itself, so no popup blocker gets in the way.
          onClick={() => window.open(pendingUrl, "vidcica-checkout", POPUP)}
          data-testid="sub-pay-pending"
        >
          {t("billing.change.actionButton")}
        </Button>
      ),
    });
  }
  if (sub.status === "past_due" || sub.status === "unpaid") {
    notices.push({
      key: "payment-issue",
      text: t("billing.sub.paymentIssue"),
      action: (
        <Button size="sm" variant="secondary" onClick={onManageCard} disabled={busy}>
          {t("billing.cardAndInvoices")}
        </Button>
      ),
    });
  }
  if (sub.pending?.plan) {
    notices.push({
      key: "pending",
      text: t("billing.sub.pending", {
        plan: t(TIERS[sub.pending.plan].labelKey),
        date: date(sub.pending.at),
      }),
      action: (
        <Button
          size="sm"
          variant="secondary"
          onClick={onKeep}
          disabled={busy}
          data-testid="sub-keep"
        >
          {t("billing.sub.keep", { plan: current })}
        </Button>
      ),
    });
  }
  if (sub.cancelAt) {
    notices.push({
      key: "cancel-at",
      text: t("billing.sub.cancelAt", { date: date(sub.cancelAt) }),
      action: (
        <Button
          size="sm"
          variant="secondary"
          onClick={onResume}
          disabled={busy}
          data-testid="sub-resume"
        >
          {t("billing.sub.resume")}
        </Button>
      ),
    });
  }
  if (notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-3" data-testid="subscription-notices">
      {notices.map((n) => (
        <div
          key={n.key}
          className="bg-warning-subtle flex flex-wrap items-center justify-between gap-3 rounded-lg px-5 py-4"
          data-testid={`notice-${n.key}`}
        >
          <p className="text-[15px] leading-relaxed">{n.text}</p>
          {n.action}
        </div>
      ))}
    </div>
  );
}
