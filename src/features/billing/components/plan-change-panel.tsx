"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/i18n/provider";
import type { PlanPreview, SubscriptionView } from "@/lib/vidcica/billing";
import { TIERS, type Plan } from "@/lib/vidcica/tiers";
import { formatBillingDate, formatCents } from "../format";

const POPUP = "width=520,height=760";

export type PlanPanel =
  | { kind: "loading"; plan: Plan }
  | { kind: "upgrade"; preview: Extract<PlanPreview, { kind: "upgrade" }>; requestId: string }
  | { kind: "downgrade"; preview: Extract<PlanPreview, { kind: "downgrade" }>; requestId: string }
  | { kind: "cancel"; requestId: string }
  | { kind: "action"; url: string; plan: Plan }
  | { kind: "activating"; plan: Plan };

/**
 * The confirmation shown before a subscriber's plan changes (owner's decision,
 * 2026-10-18: the exact amount before any charge). Inline, like the Boost
 * Activate confirmation. The 3-D Secure step opens Stripe's invoice page from
 * the button's own click, so no popup blocker gets in the way.
 */
export function PlanChangePanel({
  panel,
  sub,
  busy,
  onConfirm,
  onClose,
  onActionOpened,
}: {
  panel: PlanPanel;
  sub: SubscriptionView;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onActionOpened: (popup: Window | null) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const label = (p: Plan) => t(TIERS[p].labelKey);
  const current = sub.plan ? label(sub.plan) : "";

  const actions = (confirmKey: Parameters<typeof t>[0], testId: string) => (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onConfirm} disabled={busy} data-testid={testId}>
        {busy ? t("billing.change.working") : t(confirmKey)}
      </Button>
      <Button variant="ghost" onClick={onClose} disabled={busy}>
        {t("common.cancel")}
      </Button>
    </div>
  );

  let body: ReactNode = null;
  if (panel.kind === "loading") {
    body = <p className="text-muted-foreground text-[15px]">{t("billing.change.loading")}</p>;
  } else if (panel.kind === "activating") {
    body = <p className="text-[15px]">{t("billing.change.activating")}</p>;
  } else if (panel.kind === "upgrade") {
    const p = panel.preview;
    body = (
      <>
        <h3 className="text-[17px] font-semibold">
          {t("billing.change.upgradeTitle", { plan: label(p.plan) })}
        </h3>
        <p
          className="text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums"
          data-testid="change-due-today"
        >
          {t("billing.change.upgradeToday", {
            amount: formatCents(p.dueToday, p.currency, locale),
          })}
        </p>
        <div className="text-muted-foreground flex flex-col gap-1.5 text-[15px] leading-relaxed">
          <p>
            {t("billing.change.upgradeExplain", {
              date: formatBillingDate(sub.periodEnd, locale),
              monthly:
                p.monthly !== null
                  ? formatCents(p.monthly, p.currency, locale)
                  : `${TIERS[p.plan].priceEUR} €`,
            })}
          </p>
          <p>
            {p.card?.last4
              ? t("billing.change.upgradeCard", { brand: p.card.brand ?? "", last4: p.card.last4 })
              : t("billing.change.upgradeCardDefault")}
          </p>
          <p>{t("billing.change.upgradeCredits")}</p>
          {p.dropsDowngrade ? <p>{t("billing.change.dropsDowngrade")}</p> : null}
          {p.resumesCancellation ? <p>{t("billing.change.resumesCancellation")}</p> : null}
        </div>
        {actions("billing.change.confirmPay", "change-confirm")}
      </>
    );
  } else if (panel.kind === "downgrade") {
    const p = panel.preview;
    body = (
      <>
        <h3 className="text-[17px] font-semibold">
          {t("billing.change.upgradeTitle", { plan: label(p.plan) })}
        </h3>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          {t("billing.change.downgradeExplain", {
            current,
            date: formatBillingDate(p.effectiveAt, locale),
            plan: label(p.plan),
            price: TIERS[p.plan].priceEUR,
          })}
        </p>
        {actions("billing.change.confirmDowngrade", "change-confirm")}
      </>
    );
  } else if (panel.kind === "cancel") {
    body = (
      <>
        <h3 className="text-[17px] font-semibold">{t("billing.change.cancelTitle")}</h3>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          {t("billing.change.cancelExplain", {
            current,
            date: formatBillingDate(sub.periodEnd, locale),
          })}
        </p>
        {actions("billing.change.confirmCancel", "cancel-confirm")}
      </>
    );
  } else if (panel.kind === "action") {
    body = (
      <>
        <h3 className="text-[17px] font-semibold">{t("billing.change.actionTitle")}</h3>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          {t("billing.change.actionBody")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onActionOpened(window.open(panel.url, "vidcica-checkout", POPUP))}
            data-testid="change-action"
          >
            {t("billing.change.actionButton")}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </div>
      </>
    );
  }

  return (
    <div
      className="bg-card flex flex-col gap-4 rounded-lg p-6"
      data-testid="plan-change-panel"
      aria-live="polite"
    >
      {body}
    </div>
  );
}
