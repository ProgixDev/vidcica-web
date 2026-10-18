"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  adsErrorText,
  createAdCampaign,
  setCampaignStatus,
  type CreateCampaignOutcome,
  type StatusOutcome,
} from "@/lib/vidcica/ads";
import { formatAdDate, isLaunched, TOTAL_RUN_DAYS, type Campaign } from "@/lib/vidcica/campaign";
import { useLocale, useT } from "@/lib/i18n/provider";

/** DI'd for tests; defaults to the real edge client. */
export type SetStatusFn = (id: string, action: "activate" | "pause") => Promise<StatusOutcome>;
export type LaunchFn = (id: string) => Promise<CreateCampaignOutcome>;

const realSetStatus: SetStatusFn = (id, action) => setCampaignStatus(createClient(), id, action);
const realLaunch: LaunchFn = (id) => createAdCampaign(createClient(), id);

/** A failure, as the text to show plus where to fix it when that's elsewhere. */
type Problem = { text: string; link?: { href: string; label: string; external?: boolean } };

/**
 * Launch a saved draft on Meta (paused), then Activate (real spend, behind a
 * confirmation) or Pause it.
 *
 * - Pause is always offered for a running campaign, whatever the plan: stopping
 *   spend must never depend on a subscription. If Meta refuses, the answer
 *   carries a link to pause it in Ads Manager.
 * - Launching and activating need a plan with Boost (`canBoost`); the server
 *   enforces it too (`plan_required`).
 * - `set-campaign-status` enforces the monthly cap and the minimum in the ad
 *   account's currency; their amounts are shown in that currency.
 * - The confirmation says how long the campaign will spend. A daily budget has
 *   no end date on Meta: it runs every day until paused. A total budget runs
 *   TOTAL_RUN_DAYS from its first activation; once activated, `endDate` holds
 *   that end, and a resume says when it stops.
 */
export function ActivatePauseControls({
  campaign,
  canBoost = true,
  onSetStatus = realSetStatus,
  onLaunch = realLaunch,
}: {
  campaign: Pick<Campaign, "id" | "status" | "externalCampaignId" | "budgetMode" | "endDate">;
  /** The plan includes Boost (Pro/Studio). */
  canBoost?: boolean;
  onSetStatus?: SetStatusFn;
  onLaunch?: LaunchFn;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const moneyLocale = locale === "en" ? "en-CA" : "fr-FR";

  function explain(out: {
    reason: string;
    minDaily?: number;
    cap?: number;
    projected?: number;
    currency?: string;
    adsManagerUrl?: string;
  }): Problem {
    const text = adsErrorText(t, out, moneyLocale);
    if (out.reason === "plan_required") {
      return { text, link: { href: "/billing", label: t("ads.plan.cta") } };
    }
    if (out.reason === "pause_in_ads_manager" && out.adsManagerUrl) {
      return {
        text,
        link: { href: out.adsManagerUrl, label: t("ads.openAdsManager"), external: true },
      };
    }
    return { text };
  }

  async function run(action: "activate" | "pause") {
    setPending(true);
    setProblem(null);
    const out = await onSetStatus(campaign.id, action);
    setPending(false);
    setConfirming(false);
    if (out.ok) {
      router.refresh();
      return;
    }
    setProblem(explain(out));
  }

  async function launch() {
    setPending(true);
    setProblem(null);
    const out = await onLaunch(campaign.id);
    setPending(false);
    if (out.ok) {
      router.refresh();
      return;
    }
    setProblem(explain(out));
  }

  const problemView = problem ? (
    <p role="alert" className="text-destructive text-[13px]" data-testid="activate-error">
      {problem.text}
      {problem.link ? (
        <>
          {" "}
          {problem.link.external ? (
            <a
              href={problem.link.href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-4"
            >
              {problem.link.label}
            </a>
          ) : (
            <Link href={problem.link.href} className="font-semibold underline underline-offset-4">
              {problem.link.label}
            </Link>
          )}
        </>
      ) : null}
    </p>
  ) : null;

  const planNote = (
    <p
      className="text-muted-foreground text-[13px] leading-relaxed"
      data-testid="campaign-plan-note"
    >
      {t("ads.plan.activateNote")}{" "}
      <Link href="/billing" className="text-foreground font-semibold underline underline-offset-4">
        {t("ads.plan.cta")}
      </Link>
    </p>
  );

  if (!isLaunched(campaign)) {
    // A saved draft: it can be launched from here (created PAUSED on Meta).
    const launchable = campaign.status === "brouillon";
    return (
      <div className="flex flex-col items-start gap-3">
        <p
          className="text-muted-foreground text-[13px] leading-relaxed"
          data-testid="campaign-draft-note"
        >
          {launchable && canBoost ? t("ads.launch.note") : t("ads.activate.draftNote")}
        </p>
        {launchable && canBoost ? (
          <Button onClick={() => void launch()} disabled={pending} data-testid="launch-btn">
            {pending ? t("ads.creating") : t("ads.launch.button")}
          </Button>
        ) : null}
        {launchable && !canBoost ? planNote : null}
        {problemView}
      </div>
    );
  }

  if (campaign.status === "terminee") return null;

  const canActivate = campaign.status === "in_review" || campaign.status === "en_pause";
  // A `rejected` campaign (Meta's WITH_ISSUES or a disapproved ad) can still be
  // delivering: keep a Pause for it.
  const canPause = campaign.status === "active" || campaign.status === "rejected";

  return (
    <div className="flex flex-col items-start gap-3" data-testid="activate-pause">
      {canPause ? (
        <Button
          variant="secondary"
          onClick={() => void run("pause")}
          disabled={pending}
          data-testid="pause-btn"
        >
          {pending ? "…" : t("ads.activate.pause")}
        </Button>
      ) : canActivate && !canBoost ? (
        planNote
      ) : canActivate && !confirming ? (
        <Button onClick={() => setConfirming(true)} disabled={pending} data-testid="activate-btn">
          {t("ads.activate.activate")}
        </Button>
      ) : canActivate && confirming ? (
        <div
          className="bg-warning-subtle flex w-full flex-col gap-4 rounded-lg p-5"
          data-testid="activate-confirm"
        >
          <p className="text-[15px] leading-relaxed">
            {t("ads.activate.confirmBefore")}{" "}
            <strong className="font-semibold">{t("ads.activate.confirmBold")}</strong>{" "}
            {t("ads.activate.confirmAfter")}{" "}
            {campaign.budgetMode === "total" ? (
              <span data-testid="activate-confirm-total">
                {campaign.endDate
                  ? t("ads.activate.confirmTotalEnds", {
                      date: formatAdDate(campaign.endDate, locale),
                    })
                  : t("ads.activate.confirmTotalStart", { days: TOTAL_RUN_DAYS })}
              </span>
            ) : (
              <span data-testid="activate-confirm-daily">{t("ads.activate.confirmDaily")}</span>
            )}{" "}
            {t("ads.activate.confirmQuestion")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void run("activate")}
              disabled={pending}
              data-testid="activate-confirm-btn"
            >
              {pending ? t("ads.activate.activating") : t("ads.activate.confirmActivate")}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      {problemView}
    </div>
  );
}
