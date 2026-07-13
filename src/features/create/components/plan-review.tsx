"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EnqueueGenerationFailReason } from "@/lib/vidcica/generation";
import { useCreateStore } from "../provider";

/** Blocked reason → plain-language message + the right recovery (AC-11). */
function BlockedNotice({ reason }: { reason: EnqueueGenerationFailReason }) {
  const billing = { label: "Voir les offres", href: "/billing" };
  const map: Record<EnqueueGenerationFailReason, { msg: string; action?: typeof billing }> = {
    insufficient_credits: { msg: "Crédits insuffisants pour lancer ce rendu.", action: billing },
    model_locked: { msg: "Ce modèle n’est pas inclus dans votre offre.", action: billing },
    daily_cap: { msg: "Limite quotidienne atteinte. Réessayez demain." },
    not_live: { msg: "La génération est momentanément indisponible. Réessayez plus tard." },
    disabled: { msg: "La génération est désactivée pour le moment." },
    in_progress: { msg: "Un rendu est déjà en cours pour cette vidéo." },
    no_plan: { msg: "Le plan est invalide. Revenez en arrière et régénérez-le." },
    image_not_supported: { msg: "Ce modèle ne prend pas en charge l’image de départ." },
    unauthenticated: { msg: "Votre session a expiré. Reconnectez-vous." },
    error: { msg: "Une erreur est survenue. Réessayez." },
  };
  const { msg, action } = map[reason];
  return (
    <div role="alert" className="border-destructive/40 flex flex-col gap-3 rounded-lg border p-4">
      <p className="text-sm">{msg}</p>
      {action ? (
        <Link href={action.href} className={buttonVariants({ variant: "default" })}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function PlanReview() {
  const plan = useCreateStore((s) => s.plan);
  const phase = useCreateStore((s) => s.phase);
  const blockedReason = useCreateStore((s) => s.blockedReason);
  const confirmEnqueue = useCreateStore((s) => s.confirmEnqueue);
  const backToEdit = useCreateStore((s) => s.backToEdit);

  if (!plan) return null;
  const enqueuing = phase === "enqueuing";

  return (
    <div className="flex w-full flex-col gap-5" data-testid="plan-review">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">{plan.title}</h2>
        <p className="text-muted-foreground text-sm">{plan.description}</p>
        {plan.hashtags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {plan.hashtags.map((h) => (
              <Badge key={h} variant="outline">
                {h}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <ol className="flex flex-col gap-2">
        {plan.segments.map((seg) => (
          <li key={seg.index} className="bg-card flex gap-3 rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground shrink-0 font-mono text-xs">
              {String(seg.index + 1).padStart(2, "0")}
            </span>
            <span>{seg.narration_fr}</span>
          </li>
        ))}
      </ol>

      {phase === "blocked" && blockedReason ? <BlockedNotice reason={blockedReason} /> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => void confirmEnqueue()}
          disabled={enqueuing}
          data-testid="enqueue-btn"
        >
          {enqueuing ? "Lancement…" : "Lancer la génération"}
        </Button>
        <Button variant="ghost" onClick={backToEdit} disabled={enqueuing}>
          Modifier
        </Button>
      </div>
    </div>
  );
}
