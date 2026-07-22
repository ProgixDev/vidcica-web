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
  CAMPAIGN_OBJECTIVE_KEY,
  SUPPORTED_OBJECTIVES,
  type BoostDraft,
  type CampaignGender,
  type SupportedObjective,
} from "@/lib/vidcica/campaign";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { BOOST_STEPS, isDraftReady } from "../store";
import { useBoostStore } from "../provider";

export type VideoOption = { id: string; title: string };

const COUNTRIES: [string, MessageKey][] = [
  ["FR", "ads.country.FR"],
  ["BE", "ads.country.BE"],
  ["CH", "ads.country.CH"],
  ["LU", "ads.country.LU"],
  ["CA", "ads.country.CA"],
];

const GENDER_KEY: Record<CampaignGender, MessageKey> = {
  tous: "ads.gender.tous",
  hommes: "ads.gender.hommes",
  femmes: "ads.gender.femmes",
};

const STEP_TITLE: Record<(typeof BOOST_STEPS)[number], MessageKey> = {
  video: "ads.step.video",
  objective: "ads.step.objective",
  audience: "ads.step.audience",
  budget: "ads.step.budget",
  review: "ads.step.review",
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
  const t = useT();
  return (
    <EmptyState
      className="py-16"
      title={t("ads.noVideos.title")}
      description={t("ads.noVideos.description")}
      action={
        <Link href="/create" className={buttonVariants()}>
          {t("ads.createVideo")}
        </Link>
      }
    />
  );
}

function BoostDone() {
  const t = useT();
  const launched = useBoostStore((s) => s.launched);
  const campaignId = useBoostStore((s) => s.campaignId);
  return (
    <EmptyState
      className="py-16"
      title={launched ? t("ads.done.launchedTitle") : t("ads.done.draftTitle")}
      description={launched ? t("ads.done.launchedDescription") : t("ads.done.draftDescription")}
      action={
        <Link href={campaignId ? `/ads/${campaignId}` : "/ads"} className={buttonVariants()}>
          {launched ? t("ads.done.viewCampaign") : t("ads.done.viewCampaigns")}
        </Link>
      }
    />
  );
}

function BoostForm({ videos }: { videos: VideoOption[] }) {
  const t = useT();
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
          {t("ads.draftBanner")}
        </div>
      ) : null}

      <ol
        className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs"
        aria-label={t("ads.stepsAria")}
      >
        {BOOST_STEPS.map((s, i) => (
          <li key={s} className={i === step ? "text-foreground font-medium" : undefined}>
            {i + 1}. {t(STEP_TITLE[s])}
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
                {t("ads.viewDraft")}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0 || creating}>
          {t("common.previous")}
        </Button>
        {isLast ? (
          draftOnly ? (
            <Button
              onClick={() => void saveDraft()}
              disabled={!isDraftReady(draft) || creating}
              data-testid="boost-save-draft"
            >
              {creating ? t("ads.saving") : t("ads.saveDraft")}
            </Button>
          ) : (
            <Button
              onClick={() => void submit()}
              disabled={!isDraftReady(draft) || creating}
              data-testid="boost-submit"
            >
              {creating ? t("ads.creating") : t("ads.createCampaign")}
            </Button>
          )
        ) : (
          <Button onClick={next} disabled={!stepValid(key, draft)} data-testid="boost-next">
            {t("common.next")}
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
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bw-video">{t("ads.field.video")}</Label>
        <Select
          id="bw-video"
          data-testid="bw-video"
          value={draft.videoId}
          onChange={(e) => {
            const v = videos.find((x) => x.id === e.target.value);
            setDraft({
              videoId: e.target.value,
              name: draft.name || (v ? t("ads.boostName", { title: v.title }) : draft.name),
            });
          }}
        >
          <option value="">{t("ads.chooseVideo")}</option>
          {videos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bw-name">{t("ads.field.name")}</Label>
        <Input
          id="bw-name"
          data-testid="bw-name"
          value={draft.name}
          onChange={(e) => setDraft({ name: e.target.value })}
          placeholder={t("ads.namePlaceholder")}
        />
      </div>
    </div>
  );
}

function ObjectiveStep({ draft, setDraft }: StepProps) {
  const t = useT();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{t("ads.objectiveLegend")}</legend>
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
          {t(CAMPAIGN_OBJECTIVE_KEY[o])}
        </label>
      ))}
    </fieldset>
  );
}

function AudienceStep({ draft, setDraft }: StepProps) {
  const t = useT();
  function toggleCountry(code: string, on: boolean) {
    const set = new Set(draft.countries);
    if (on) set.add(code);
    else set.delete(code);
    setDraft({ countries: [...set] });
  }
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("ads.field.countries")}</legend>
        <div className="flex flex-wrap gap-3">
          {COUNTRIES.map(([code, nameKey]) => (
            <label key={code} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={draft.countries.includes(code)}
                onChange={(e) => toggleCountry(code, e.target.checked)}
                data-testid={`bw-country-${code}`}
              />
              {t(nameKey)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bw-agemin">{t("ads.field.ageMin")}</Label>
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
          <Label htmlFor="bw-agemax">{t("ads.field.ageMax")}</Label>
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
        <Label htmlFor="bw-gender">{t("ads.field.gender")}</Label>
        <Select
          id="bw-gender"
          value={draft.gender}
          onChange={(e) => setDraft({ gender: e.target.value as StepProps["draft"]["gender"] })}
        >
          <option value="tous">{t("ads.gender.tous")}</option>
          <option value="hommes">{t("ads.gender.hommes")}</option>
          <option value="femmes">{t("ads.gender.femmes")}</option>
        </Select>
      </div>
    </div>
  );
}

function BudgetStep({ draft, setDraft }: StepProps) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bw-budgetmode">{t("ads.field.budgetMode")}</Label>
        <Select
          id="bw-budgetmode"
          value={draft.budgetMode}
          onChange={(e) =>
            setDraft({ budgetMode: e.target.value as StepProps["draft"]["budgetMode"] })
          }
        >
          <option value="quotidien">{t("ads.budgetMode.daily")}</option>
          <option value="total">{t("ads.budgetMode.total")}</option>
        </Select>
      </div>
      {draft.budgetMode === "total" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bw-budget-total">{t("ads.field.budgetTotal")}</Label>
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
          <Label htmlFor="bw-budget-daily">{t("ads.field.budgetDaily")}</Label>
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
  const t = useT();
  const video = videos.find((v) => v.id === draft.videoId);
  const rows: [string, string][] = [
    [t("ads.review.video"), video?.title ?? "—"],
    [t("ads.review.name"), draft.name],
    [t("ads.review.objective"), t(CAMPAIGN_OBJECTIVE_KEY[draft.objective])],
    [t("ads.review.countries"), draft.countries.join(", ")],
    [t("ads.review.age"), `${draft.ageMin}–${draft.ageMax}`],
    [t("ads.review.gender"), t(GENDER_KEY[draft.gender])],
    [
      t("ads.review.budget"),
      draft.budgetMode === "total"
        ? t("ads.budgetTotalValue", { amount: draft.budgetTotal })
        : t("ads.budgetDailyValue", { amount: draft.budgetDaily }),
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
      <p className="text-muted-foreground mt-2 text-xs">{t("ads.review.note")}</p>
    </dl>
  );
}
