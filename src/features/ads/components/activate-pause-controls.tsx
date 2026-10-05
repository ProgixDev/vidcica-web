"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { adsErrorKey, setCampaignStatus, type StatusOutcome } from "@/lib/vidcica/ads";
import { isLaunched, type Campaign } from "@/lib/vidcica/campaign";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";

/** DI'd for tests; defaults to the real edge client. */
export type SetStatusFn = (id: string, action: "activate" | "pause") => Promise<StatusOutcome>;

const realSetStatus: SetStatusFn = (id, action) => setCampaignStatus(createClient(), id, action);

/**
 * Activate (real spend, behind a confirmation) / pause a created Meta campaign.
 * `set-campaign-status` enforces the server-side monthly spend cap; its errors are
 * surfaced in the page's language. A brouillon (not yet created on Meta) shows a note.
 */
export function ActivatePauseControls({
  campaign,
  onSetStatus = realSetStatus,
}: {
  campaign: Pick<Campaign, "id" | "status" | "externalCampaignId">;
  onSetStatus?: SetStatusFn;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function run(action: "activate" | "pause") {
    setPending(true);
    setErrorKey(null);
    const out = await onSetStatus(campaign.id, action);
    setPending(false);
    setConfirming(false);
    if (out.ok) {
      router.refresh();
      return;
    }
    setErrorKey(adsErrorKey(out.reason));
  }

  if (!isLaunched(campaign)) {
    return (
      <p
        className="text-muted-foreground text-[13px] leading-relaxed"
        data-testid="campaign-draft-note"
      >
        {t("ads.activate.draftNote")}
      </p>
    );
  }

  if (campaign.status === "terminee" || campaign.status === "rejected") {
    return null;
  }

  const canActivate = campaign.status === "in_review" || campaign.status === "en_pause";

  return (
    <div className="flex flex-col items-start gap-3" data-testid="activate-pause">
      {campaign.status === "active" ? (
        <Button
          variant="secondary"
          onClick={() => void run("pause")}
          disabled={pending}
          data-testid="pause-btn"
        >
          {pending ? "…" : t("ads.activate.pause")}
        </Button>
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
            {t("ads.activate.confirmAfter")}
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

      {errorKey ? (
        <p role="alert" className="text-destructive text-[13px]" data-testid="activate-error">
          {t(errorKey)}
        </p>
      ) : null}
    </div>
  );
}
