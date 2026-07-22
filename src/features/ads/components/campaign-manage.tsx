"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteCampaign, duplicateCampaign } from "../actions";
import { type Campaign, type CampaignStatus } from "@/lib/vidcica/campaign";
import { useT } from "@/lib/i18n/provider";

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
  const [error, setError] = useState<string | null>(null);

  const canDelete = DELETABLE.includes(campaign.status);

  async function onDuplicate() {
    setPending("duplicate");
    setError(null);
    const out = await duplicateCampaign({ id: campaign.id });
    setPending(null);
    if (out.ok) {
      router.push(`/ads/${out.id}`);
      return;
    }
    setError(out.message);
  }

  async function onDelete() {
    setPending("delete");
    setError(null);
    const out = await deleteCampaign({ id: campaign.id });
    setPending(null);
    setConfirming(false);
    if (out.ok) {
      router.push("/ads");
      router.refresh();
      return;
    }
    setError(out.message);
  }

  return (
    <Card className="flex flex-col gap-3 p-5" data-testid="campaign-manage">
      <h2 className="text-sm font-medium">{t("ads.manage.title")}</h2>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => void onDuplicate()}
          disabled={pending !== null}
          data-testid="duplicate-btn"
        >
          {pending === "duplicate" ? t("ads.manage.duplicating") : t("ads.manage.duplicate")}
        </Button>

        {canDelete && !confirming ? (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirming(true)}
            disabled={pending !== null}
            data-testid="delete-btn"
          >
            {t("common.delete")}
          </Button>
        ) : null}
      </div>

      <p className="text-muted-foreground text-xs">{t("ads.manage.duplicateNote")}</p>

      {!canDelete ? (
        <p className="text-muted-foreground text-xs" data-testid="delete-blocked">
          {t("ads.manage.deleteBlocked")}
        </p>
      ) : null}

      {canDelete && confirming ? (
        <div
          className="border-destructive/40 bg-destructive/10 flex flex-col gap-2 rounded-lg border p-3"
          data-testid="delete-confirm"
        >
          <p className="text-sm font-medium">{t("ads.manage.confirmDeleteTitle")}</p>
          <p className="text-muted-foreground text-xs">{t("ads.manage.confirmDeleteBody")}</p>
          <div className="flex gap-2">
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

      {error ? (
        <p role="alert" className="text-destructive text-sm" data-testid="manage-error">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
