"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteCampaign, duplicateCampaign } from "../actions";
import { type Campaign, type CampaignStatus } from "@/lib/vidcica/campaign";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";

/** Statuses safe to delete — mirrors the server guard in actions.ts. */
const DELETABLE: readonly CampaignStatus[] = ["brouillon", "terminee", "rejected"];

/**
 * Manage a campaign: Duplicate (clone → draft) + Delete (drafts/ended only, with an
 * inline confirm). Live campaigns show an honest "pause + end first" note instead of a
 * delete control. Both call RLS-scoped server actions; the server re-guards.
 */
export function CampaignManageControls({
  campaign,
}: {
  campaign: Pick<Campaign, "id" | "status">;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, setPending] = useState<"duplicate" | "delete" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const canDelete = DELETABLE.includes(campaign.status);

  async function onDuplicate() {
    setPending("duplicate");
    setErrorKey(null);
    const out = await duplicateCampaign({ id: campaign.id });
    setPending(null);
    if (out.ok) {
      router.push(`/ads/${out.id}`);
      return;
    }
    setErrorKey(out.errorKey);
  }

  async function onDelete() {
    setPending("delete");
    setErrorKey(null);
    const out = await deleteCampaign({ id: campaign.id });
    setPending(null);
    setConfirming(false);
    if (out.ok) {
      router.push("/ads");
      router.refresh();
      return;
    }
    setErrorKey(out.errorKey);
  }

  return (
    <section className="flex flex-col gap-4" data-testid="campaign-manage">
      <h2 className="text-xl font-semibold tracking-tight">{t("ads.manage.title")}</h2>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => void onDuplicate()}
          disabled={pending !== null}
          data-testid="duplicate-btn"
        >
          {pending === "duplicate" ? t("ads.manage.duplicating") : t("ads.manage.duplicate")}
        </Button>

        {canDelete && !confirming ? (
          <Button
            variant="ghost"
            onClick={() => setConfirming(true)}
            disabled={pending !== null}
            data-testid="delete-btn"
          >
            {t("common.delete")}
          </Button>
        ) : null}
      </div>

      <div className="text-muted-foreground flex max-w-xl flex-col gap-1 text-[13px] leading-relaxed">
        <p>{t("ads.manage.duplicateNote")}</p>
        {!canDelete ? <p data-testid="delete-blocked">{t("ads.manage.deleteBlocked")}</p> : null}
      </div>

      {canDelete && confirming ? (
        <div className="bg-card flex flex-col gap-4 rounded-lg p-5" data-testid="delete-confirm">
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-semibold">{t("ads.manage.confirmDeleteTitle")}</p>
            <p className="text-muted-foreground text-[13px] leading-relaxed">
              {t("ads.manage.confirmDeleteBody")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              onClick={() => void onDelete()}
              disabled={pending !== null}
              data-testid="delete-confirm-btn"
            >
              {pending === "delete" ? t("ads.manage.deleting") : t("common.delete")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={pending !== null}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      {errorKey ? (
        <p role="alert" className="text-destructive text-[13px]" data-testid="manage-error">
          {t(errorKey)}
        </p>
      ) : null}
    </section>
  );
}
