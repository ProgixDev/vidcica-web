"use client";

// Adapted from packs/payments-stripe/src/ui/paywall.tsx — expanded into the real
// plan-comparison paywall and wired to Vidcica's edge functions.
//
// Since 2026-10-18 (payments plan):
//   - People without a subscription buy through Stripe Checkout (a popup); the
//     outcome never says "failed" for a payment that went through (`pending`).
//   - A subscriber changes plan through change-plan, never a second Checkout
//     (the server would refuse it): an upgrade shows the exact amount due today
//     before anything is charged; a downgrade is scheduled for the end of the
//     paid month and can be undone; cancelling keeps the plan until then.
//   - "Carte et factures" opens Stripe's portal for the card and invoices only.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  applyPlanChange,
  cancelSubscription,
  keepCurrentPlan,
  openBillingPortal,
  previewPlanChange,
  resumeSubscription,
  startCheckout,
  waitForPlan,
  type PlanCallError,
} from "@/lib/vidcica/billing";
import {
  ORDERED_TIERS,
  TIERS,
  isUpgrade,
  planRank,
  type Entitlement,
  type Plan,
} from "@/lib/vidcica/tiers";
import { useCreditsRealtime } from "@/lib/vidcica/use-credits-realtime";
import { useLocale, useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { formatBillingDate } from "../format";
import { PlanChangePanel, type PlanPanel } from "./plan-change-panel";
import { SubscriptionNotices } from "./subscription-notices";
import { useSubscription } from "./use-subscription";

const POPUP = "width=520,height=760";

type Notice = { tone: "info" | "error"; text: string };

const CHANGE_ERRORS: Record<string, MessageKey> = {
  payment_issue: "billing.change.err.paymentIssue",
  card_required: "billing.change.err.cardRequired",
  cancel_scheduled: "billing.change.err.cancelScheduled",
  multiple_subscriptions: "billing.change.err.multiple",
  already_applied: "billing.change.err.alreadyApplied",
};

function newRequestId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function Paywall({
  userId,
  entitlement,
  returnStatus,
}: {
  userId: string;
  entitlement: Entitlement;
  /** `?status=` from /checkout/return when Stripe ran in this tab (no popup). */
  returnStatus?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const current = entitlement.plan;
  const credits = useCreditsRealtime(userId, entitlement.credits);
  const { sub, loading: subLoading, reload } = useSubscription(current !== "free");
  const [pendingPlan, setPendingPlan] = useState<Plan | "portal" | null>(null);
  const [panel, setPanel] = useState<PlanPanel | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(
    returnStatus === "success" ? { tone: "info", text: t("billing.checkoutPending") } : null,
  );

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const label = (p: Plan) => t(TIERS[p].labelKey);
  const date = (iso: string) => formatBillingDate(iso, locale);

  function changeError(out: PlanCallError): Notice {
    const key = CHANGE_ERRORS[out.reason] ?? "billing.change.err.generic";
    return { tone: "error", text: t(key) };
  }

  // ── People without a subscription: Checkout ───────────────────────────
  async function subscribe(plan: Plan) {
    const popup = typeof window !== "undefined" ? window.open("", "vidcica-checkout", POPUP) : null;
    const controller = new AbortController();
    abortRef.current = controller;
    setPendingPlan(plan);
    setNotice(null);
    const out = await startCheckout(createClient(), plan, popup, { signal: controller.signal });
    if (controller.signal.aborted) return;
    setPendingPlan(null);
    if (out.ok) {
      router.refresh();
      return;
    }
    if (out.reason === "pending") setNotice({ tone: "info", text: t("billing.checkoutPending") });
    else if (out.reason === "has_subscription") {
      setNotice({ tone: "info", text: t("billing.hasSubscription") });
      void reload();
    } else if (out.reason === "not_configured")
      setNotice({ tone: "error", text: t("billing.checkoutUnavailable") });
    else if (out.reason === "error")
      setNotice({ tone: "error", text: t("billing.checkoutFailed") });
  }

  // ── Subscribers: change-plan ──────────────────────────────────────────
  async function startChange(plan: Exclude<Plan, "free">, note?: Notice) {
    setNotice(note ?? null);
    setPanel({ kind: "loading", plan });
    const out = await previewPlanChange(createClient(), plan);
    if (!out.ok) {
      setPanel(out.url ? { kind: "action", url: out.url, plan } : null);
      if (!out.url) setNotice(changeError(out));
      return;
    }
    const p = out.preview;
    if (p.kind === "upgrade") setPanel({ kind: "upgrade", preview: p, requestId: newRequestId() });
    else if (p.kind === "downgrade")
      setPanel({ kind: "downgrade", preview: p, requestId: newRequestId() });
    else {
      setPanel(null);
      await keep();
    }
  }

  async function confirm() {
    if (!panel || busy) return;
    const supabase = createClient();
    setBusy(true);
    if (panel.kind === "cancel") {
      const out = await cancelSubscription(supabase, panel.requestId);
      setBusy(false);
      setPanel(null);
      if (!out.ok) return setNotice(changeError(out));
      setNotice({
        tone: "info",
        text: t("billing.change.cancelScheduled", {
          date: date(out.result.at ?? sub?.periodEnd ?? new Date().toISOString()),
        }),
      });
      await reload();
      return;
    }
    if (panel.kind !== "upgrade" && panel.kind !== "downgrade") return setBusy(false);
    const out = await applyPlanChange(supabase, panel.preview, panel.requestId);
    setBusy(false);
    if (!out.ok) {
      if (out.reason === "quote_expired" && panel.kind === "upgrade") {
        // The price or the period moved since the quote: quote again.
        await startChange(panel.preview.plan, {
          tone: "info",
          text: t("billing.change.quoteUpdated"),
        });
        return;
      }
      if (out.url) return setPanel({ kind: "action", url: out.url, plan: panel.preview.plan });
      // The same confirmation is still running (another tab, a retry): wait for
      // its outcome rather than reporting a failure.
      if (out.reason === "in_progress") {
        if (panel.kind === "upgrade") return activate(panel.preview.plan);
        setPanel(null);
        return reload();
      }
      setPanel(null);
      return setNotice(changeError(out));
    }
    const target = panel.preview.plan;
    if (out.result.kind === "action_required" && out.result.url) {
      setPanel({ kind: "action", url: out.result.url, plan: target });
      return;
    }
    if (out.result.kind === "upgraded") return activate(target);
    setPanel(null);
    if (out.result.kind === "scheduled") {
      setNotice({
        tone: "info",
        text: t("billing.change.scheduled", {
          plan: label(target),
          date: date(out.result.effectiveAt ?? sub?.periodEnd ?? ""),
        }),
      });
    }
    await reload();
  }

  /** The payment went through: wait for the webhook to switch the plan. */
  async function activate(plan: Plan, timeoutMs?: number) {
    setPanel({ kind: "activating", plan });
    const controller = new AbortController();
    abortRef.current = controller;
    const done = await waitForPlan(createClient(), plan, { timeoutMs, signal: controller.signal });
    if (controller.signal.aborted) return;
    setPanel(null);
    setNotice({
      tone: "info",
      text: done
        ? t("billing.change.upgraded", { plan: label(plan) })
        : t("billing.checkoutPending"),
    });
    await reload();
    router.refresh();
  }

  async function keep() {
    setBusy(true);
    const out = await keepCurrentPlan(createClient());
    setBusy(false);
    if (!out.ok) return setNotice(changeError(out));
    setNotice({ tone: "info", text: t("billing.change.kept", { plan: label(current) }) });
    await reload();
  }

  async function resume() {
    setBusy(true);
    const out = await resumeSubscription(createClient(), newRequestId());
    setBusy(false);
    if (!out.ok) return setNotice(changeError(out));
    setNotice({ tone: "info", text: t("billing.change.resumed") });
    await reload();
  }

  async function manage() {
    const popup = typeof window !== "undefined" ? window.open("", "vidcica-portal", POPUP) : null;
    setPendingPlan("portal");
    setNotice(null);
    const out = await openBillingPortal(createClient(), popup);
    setPendingPlan(null);
    if (!out.ok) {
      if (out.reason === "no_customer")
        setNotice({ tone: "error", text: t("billing.portalNoCustomer") });
      else if (out.reason === "not_configured")
        setNotice({ tone: "error", text: t("billing.portalUnavailable") });
      else setNotice({ tone: "error", text: t("billing.portalFailed") });
      return;
    }
    // The card may have changed: re-read once the person is done.
    void out.closed.then(() => {
      void reload();
      router.refresh();
    });
  }

  // One filled action in the grid: the next tier up is the ink pill, the rest pale.
  const nextUp = ORDERED_TIERS.find((id) => isUpgrade(current, id));

  function cardAction(id: Plan) {
    const tier = TIERS[id];
    if (id === current)
      return <p className="text-muted-foreground text-[13px]">{t("billing.yourPlan")}</p>;
    if (sub) {
      if (id === "free") {
        if (sub.cancelAt)
          return <p className="text-muted-foreground text-[13px]">{t("billing.basePlan")}</p>;
        return (
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => setPanel({ kind: "cancel", requestId: newRequestId() })}
            disabled={busy || panel !== null || !!sub.paymentPending}
            data-testid="cancel-subscription"
          >
            {t("billing.change.cancelAction")}
          </Button>
        );
      }
      return (
        <Button
          className="w-full"
          variant={planRank(id) > planRank(current) && id === nextUp ? "default" : "secondary"}
          onClick={() => void startChange(id)}
          disabled={busy || panel !== null || !sub.changeable}
          data-testid={`change-${id}`}
        >
          {t("billing.upgradeTo", { plan: t(tier.labelKey) })}
        </Button>
      );
    }
    if (isUpgrade(current, id)) {
      return (
        <Button
          className="w-full"
          variant={id === nextUp ? "default" : "secondary"}
          onClick={() => void subscribe(id)}
          disabled={pendingPlan !== null || subLoading}
          data-testid={`subscribe-${id}`}
        >
          {pendingPlan === id
            ? t("billing.redirecting")
            : t("billing.upgradeTo", { plan: t(tier.labelKey) })}
        </Button>
      );
    }
    return (
      <p className="text-muted-foreground text-[13px]">
        {tier.priceEUR === 0 ? t("billing.basePlan") : t("billing.includedInPlan")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10" data-testid="paywall">
      {/* Current plan + live credits — a quiet summary strip, one pale action. */}
      <div className="bg-card flex flex-wrap items-center justify-between gap-x-10 gap-y-5 rounded-lg p-6">
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[13px]">{t("billing.currentPlan")}</span>
            <span
              className="text-2xl leading-tight font-semibold tracking-[-0.02em]"
              data-testid="current-plan"
            >
              {t(TIERS[current].labelKey)}
            </span>
            {sub && !sub.cancelAt ? (
              <span className="text-muted-foreground text-[13px]" data-testid="renews-on">
                {t("billing.sub.renews", { date: date(sub.periodEnd) })}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[13px]">
              {t("billing.creditsThisMonth")}
            </span>
            <span
              className="text-2xl leading-tight font-semibold tracking-[-0.02em] tabular-nums"
              data-testid="credits-balance"
            >
              {credits}
            </span>
          </div>
        </div>
        {current !== "free" ? (
          <Button variant="secondary" size="sm" onClick={manage} disabled={pendingPlan !== null}>
            {pendingPlan === "portal" ? t("billing.opening") : t("billing.cardAndInvoices")}
          </Button>
        ) : null}
      </div>

      {notice ? (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={cn(
            "rounded-md px-4 py-3 text-[13px] font-semibold",
            notice.tone === "error" ? "bg-destructive-subtle text-destructive" : "bg-card",
          )}
          data-testid="billing-notice"
        >
          {notice.text}
        </p>
      ) : null}

      {sub ? (
        <SubscriptionNotices
          sub={sub}
          busy={busy}
          onKeep={() => void keep()}
          onResume={() => void resume()}
          onManageCard={manage}
        />
      ) : null}

      {panel && sub ? (
        <PlanChangePanel
          panel={panel}
          sub={sub}
          busy={busy}
          onConfirm={() => void confirm()}
          onClose={() => setPanel(null)}
          onActionOpened={() =>
            void activate(panel.kind === "action" ? panel.plan : current, 15 * 60_000)
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ORDERED_TIERS.map((id) => {
          const tier = TIERS[id];
          const isCurrent = id === current;
          return (
            <div
              key={id}
              data-testid={`plan-${id}`}
              className={cn(
                "flex flex-col gap-6 rounded-lg p-6",
                // The marked plan is one neutral step deeper — never a border or glow.
                isCurrent ? "bg-accent" : "bg-card",
              )}
            >
              <div className="flex flex-col gap-3">
                <div className="flex min-h-6 items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold">{t(tier.labelKey)}</span>
                  {isCurrent ? <Badge variant="brand">{t("billing.currentBadge")}</Badge> : null}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl leading-none font-semibold tracking-[-0.03em] tabular-nums">
                    {tier.priceEUR} €
                  </span>
                  <span className="text-muted-foreground text-[13px]">{t("billing.perMonth")}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5 text-[15px] leading-snug">
                {tier.highlightKeys.map((k) => (
                  <li key={k} className="flex items-start gap-2.5">
                    <CheckIcon />
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex min-h-10 items-center">{cardAction(id)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground mt-0.5 size-4 shrink-0"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
