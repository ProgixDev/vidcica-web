"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { adsErrorMessage, setCampaignStatus, type StatusOutcome } from "@/lib/vidcica/ads";
import { isLaunched, type Campaign } from "@/lib/vidcica/campaign";

/** DI'd for tests; defaults to the real edge client. */
export type SetStatusFn = (id: string, action: "activate" | "pause") => Promise<StatusOutcome>;

const realSetStatus: SetStatusFn = (id, action) => setCampaignStatus(createClient(), id, action);

/**
 * Activate (real spend, behind a confirmation) / pause a created Meta campaign.
 * `set-campaign-status` enforces the server-side monthly spend cap; its errors are
 * surfaced as French messages. A brouillon (not yet created on Meta) shows a note.
 */
export function ActivatePauseControls({
  campaign,
  onSetStatus = realSetStatus,
}: {
  campaign: Pick<Campaign, "id" | "status" | "externalCampaignId">;
  onSetStatus?: SetStatusFn;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "activate" | "pause") {
    setPending(true);
    setError(null);
    const out = await onSetStatus(campaign.id, action);
    setPending(false);
    setConfirming(false);
    if (out.ok) {
      router.refresh();
      return;
    }
    setError(adsErrorMessage(out.reason));
  }

  if (!isLaunched(campaign)) {
    return (
      <p className="text-muted-foreground text-xs" data-testid="campaign-draft-note">
        Ce brouillon n’a pas encore été créé chez Meta. La publicité doit être disponible sur votre
        compte (compte publicitaire + Page Facebook) pour le lancer.
      </p>
    );
  }

  if (campaign.status === "terminee" || campaign.status === "rejected") {
    return null;
  }

  const canActivate = campaign.status === "in_review" || campaign.status === "en_pause";

  return (
    <div className="flex flex-col gap-2" data-testid="activate-pause">
      {campaign.status === "active" ? (
        <Button
          variant="outline"
          onClick={() => void run("pause")}
          disabled={pending}
          data-testid="pause-btn"
        >
          {pending ? "…" : "Mettre en pause"}
        </Button>
      ) : canActivate && !confirming ? (
        <Button onClick={() => setConfirming(true)} disabled={pending} data-testid="activate-btn">
          Activer la campagne
        </Button>
      ) : canActivate && confirming ? (
        <div
          className="border-warning/40 bg-warning/10 flex flex-col gap-2 rounded-lg border p-3"
          data-testid="activate-confirm"
        >
          <p className="text-sm">
            L’activation lance la diffusion et engage une <strong>dépense réelle</strong> selon
            votre budget. Confirmer ?
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => void run("activate")}
              disabled={pending}
              data-testid="activate-confirm-btn"
            >
              {pending ? "Activation…" : "Confirmer l’activation"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              Annuler
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-destructive text-sm" data-testid="activate-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
