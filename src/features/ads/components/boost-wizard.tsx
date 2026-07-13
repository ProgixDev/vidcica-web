"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OBJECTIVE_LABEL,
  SUPPORTED_OBJECTIVES,
  type BoostDraft,
  type SupportedObjective,
} from "@/lib/vidcica/campaign";
import { BOOST_STEPS, isDraftReady } from "../store";
import { useBoostStore } from "../provider";

export type VideoOption = { id: string; title: string };

const COUNTRIES: [string, string][] = [
  ["FR", "France"],
  ["BE", "Belgique"],
  ["CH", "Suisse"],
  ["LU", "Luxembourg"],
  ["CA", "Canada"],
];

const STEP_TITLE: Record<(typeof BOOST_STEPS)[number], string> = {
  video: "Vidéo à booster",
  objective: "Objectif",
  audience: "Audience",
  budget: "Budget",
  review: "Vérification",
};

export function BoostWizard({ videos }: { videos: VideoOption[] }) {
  const phase = useBoostStore((s) => s.phase);
  const init = useBoostStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (phase === "checking") {
    return (
      <div className="flex flex-col gap-3" data-testid="boost-checking">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (phase === "created") return <BoostDone />;
  if (videos.length === 0) return <NoVideos />;

  return <BoostForm videos={videos} />;
}

function NoVideos() {
  return (
    <EmptyState
      className="py-16"
      title="Aucune vidéo prête à booster"
      description="Créez et générez une vidéo, puis revenez la transformer en publicité."
      action={
        <Link href="/create" className={buttonVariants()}>
          Créer une vidéo
        </Link>
      }
    />
  );
}

function BoostDone() {
  const launched = useBoostStore((s) => s.launched);
  const campaignId = useBoostStore((s) => s.campaignId);
  return (
    <EmptyState
      className="py-16"
      title={launched ? "Campagne créée (en révision)" : "Brouillon enregistré"}
      description={
        launched
          ? "Votre campagne a été créée en pause chez Meta. Activez-la pour lancer la diffusion (dépense réelle)."
          : "Votre brouillon est enregistré. Vous pourrez le lancer une fois la publicité disponible sur votre compte."
      }
      action={
        <Link href={campaignId ? `/ads/${campaignId}` : "/ads"} className={buttonVariants()}>
          {launched ? "Voir la campagne" : "Voir mes campagnes"}
        </Link>
      }
    />
  );
}

function BoostForm({ videos }: { videos: VideoOption[] }) {
  const phase = useBoostStore((s) => s.phase);
  const step = useBoostStore((s) => s.step);
  const setStep = useBoostStore((s) => s.setStep);
  const draft = useBoostStore((s) => s.draft);
  const setDraft = useBoostStore((s) => s.setDraft);
  const error = useBoostStore((s) => s.error);
  const submit = useBoostStore((s) => s.submit);
  const saveDraft = useBoostStore((s) => s.saveDraft);
  const campaignId = useBoostStore((s) => s.campaignId);

  const draftOnly = phase === "draftOnly";
  const creating = phase === "creating";
  const key = BOOST_STEPS[step] ?? "video";
  const isLast = step === BOOST_STEPS.length - 1;

  function next() {
    if (!isLast) setStep(step + 1);
  }

  return (
    <div className="flex flex-col gap-5" data-testid="boost-wizard">
      {draftOnly ? (
        <div
          className="border-warning/40 bg-warning/10 text-foreground rounded-lg border p-3 text-xs"
          data-testid="boost-draft-banner"
        >
          La publicité n’est pas encore active sur votre compte. Vous pouvez préparer et enregistrer
          un brouillon — vous le lancerez une fois votre compte publicitaire Facebook connecté.
        </div>
      ) : null}

      <ol
        className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs"
        aria-label="Étapes"
      >
        {BOOST_STEPS.map((s, i) => (
          <li key={s} className={i === step ? "text-foreground font-medium" : undefined}>
            {i + 1}. {STEP_TITLE[s]}
          </li>
        ))}
      </ol>

      <Card className="flex flex-col gap-4 p-5">
        {key === "video" ? <VideoStep videos={videos} draft={draft} setDraft={setDraft} /> : null}
        {key === "objective" ? <ObjectiveStep draft={draft} setDraft={setDraft} /> : null}
        {key === "audience" ? <AudienceStep draft={draft} setDraft={setDraft} /> : null}
        {key === "budget" ? <BudgetStep draft={draft} setDraft={setDraft} /> : null}
        {key === "review" ? <ReviewStep draft={draft} videos={videos} /> : null}
      </Card>

      {error ? (
        <p role="alert" className="text-destructive text-sm" data-testid="boost-error">
          {error}
          {campaignId ? (
            <>
              {" "}
              <Link href={`/ads/${campaignId}`} className="underline">
                Voir le brouillon
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0 || creating}>
          Précédent
        </Button>
        {isLast ? (
          draftOnly ? (
            <Button
              onClick={() => void saveDraft()}
              disabled={!isDraftReady(draft) || creating}
              data-testid="boost-save-draft"
            >
              {creating ? "Enregistrement…" : "Enregistrer le brouillon"}
            </Button>
          ) : (
            <Button
              onClick={() => void submit()}
              disabled={!isDraftReady(draft) || creating}
              data-testid="boost-submit"
            >
              {creating ? "Création…" : "Créer la campagne"}
            </Button>
          )
        ) : (
          <Button onClick={next} disabled={!stepValid(key, draft)} data-testid="boost-next">
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}

function stepValid(key: (typeof BOOST_STEPS)[number], draft: BoostDraft): boolean {
  switch (key) {
    case "video":
      return draft.videoId.length > 0 && draft.name.trim().length > 0;
    case "audience":
      return draft.countries.length > 0 && draft.ageMax >= draft.ageMin;
    case "budget":
      return draft.budgetMode === "total" ? draft.budgetTotal > 0 : draft.budgetDaily > 0;
    default:
      return true;
  }
}

type StepProps = {
  draft: BoostDraft;
  setDraft: (patch: Partial<BoostDraft>) => void;
};

function VideoStep({ videos, draft, setDraft }: StepProps & { videos: VideoOption[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bw-video">Vidéo</Label>
        <Select
          id="bw-video"
          data-testid="bw-video"
          value={draft.videoId}
          onChange={(e) => {
            const v = videos.find((x) => x.id === e.target.value);
            setDraft({
              videoId: e.target.value,
              name: draft.name || (v ? `Boost — ${v.title}` : draft.name),
            });
          }}
        >
          <option value="">Choisir une vidéo…</option>
          {videos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bw-name">Nom de la campagne</Label>
        <Input
          id="bw-name"
          data-testid="bw-name"
          value={draft.name}
          onChange={(e) => setDraft({ name: e.target.value })}
          placeholder="Ma campagne"
        />
      </div>
    </div>
  );
}

function ObjectiveStep({ draft, setDraft }: StepProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">Que voulez-vous obtenir ?</legend>
      {SUPPORTED_OBJECTIVES.map((o) => (
        <label key={o} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="objective"
            value={o}
            checked={draft.objective === o}
            onChange={() => setDraft({ objective: o as SupportedObjective })}
            data-testid={`bw-objective-${o}`}
          />
          {OBJECTIVE_LABEL[o]}
        </label>
      ))}
    </fieldset>
  );
}

function AudienceStep({ draft, setDraft }: StepProps) {
  function toggleCountry(code: string, on: boolean) {
    const set = new Set(draft.countries);
    if (on) set.add(code);
    else set.delete(code);
    setDraft({ countries: [...set] });
  }
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Pays</legend>
        <div className="flex flex-wrap gap-3">
          {COUNTRIES.map(([code, name]) => (
            <label key={code} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={draft.countries.includes(code)}
                onChange={(e) => toggleCountry(code, e.target.checked)}
                data-testid={`bw-country-${code}`}
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bw-agemin">Âge min.</Label>
          <Input
            id="bw-agemin"
            type="number"
            min={13}
            max={65}
            value={draft.ageMin}
            onChange={(e) => setDraft({ ageMin: Number(e.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bw-agemax">Âge max.</Label>
          <Input
            id="bw-agemax"
            type="number"
            min={13}
            max={65}
            value={draft.ageMax}
            onChange={(e) => setDraft({ ageMax: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bw-gender">Genre</Label>
        <Select
          id="bw-gender"
          value={draft.gender}
          onChange={(e) => setDraft({ gender: e.target.value as StepProps["draft"]["gender"] })}
        >
          <option value="tous">Tous</option>
          <option value="hommes">Hommes</option>
          <option value="femmes">Femmes</option>
        </Select>
      </div>
    </div>
  );
}

function BudgetStep({ draft, setDraft }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bw-budgetmode">Type de budget</Label>
        <Select
          id="bw-budgetmode"
          value={draft.budgetMode}
          onChange={(e) =>
            setDraft({ budgetMode: e.target.value as StepProps["draft"]["budgetMode"] })
          }
        >
          <option value="quotidien">Quotidien</option>
          <option value="total">Total (durée limitée)</option>
        </Select>
      </div>
      {draft.budgetMode === "total" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bw-budget-total">Budget total (€)</Label>
          <Input
            id="bw-budget-total"
            data-testid="bw-budget-total"
            type="number"
            min={1}
            value={draft.budgetTotal}
            onChange={(e) => setDraft({ budgetTotal: Number(e.target.value) })}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bw-budget-daily">Budget quotidien (€)</Label>
          <Input
            id="bw-budget-daily"
            data-testid="bw-budget-daily"
            type="number"
            min={1}
            value={draft.budgetDaily}
            onChange={(e) => setDraft({ budgetDaily: Number(e.target.value) })}
          />
        </div>
      )}
    </div>
  );
}

function ReviewStep({ draft, videos }: { draft: StepProps["draft"]; videos: VideoOption[] }) {
  const video = videos.find((v) => v.id === draft.videoId);
  const rows: [string, string][] = [
    ["Vidéo", video?.title ?? "—"],
    ["Nom", draft.name],
    ["Objectif", OBJECTIVE_LABEL[draft.objective]],
    ["Pays", draft.countries.join(", ")],
    ["Âge", `${draft.ageMin}–${draft.ageMax}`],
    ["Genre", draft.gender],
    [
      "Budget",
      draft.budgetMode === "total" ? `${draft.budgetTotal} € total` : `${draft.budgetDaily} €/jour`,
    ],
  ];
  return (
    <dl className="flex flex-col gap-2 text-sm" data-testid="bw-review">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right font-medium">{v}</dd>
        </div>
      ))}
      <p className="text-muted-foreground mt-2 text-xs">
        La campagne est créée en pause. Aucune dépense tant que vous ne l’activez pas.
      </p>
    </dl>
  );
}
