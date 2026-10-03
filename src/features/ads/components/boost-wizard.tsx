"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "@/components/motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CAMPAIGN_OBJECTIVE_KEY,
  SUPPORTED_OBJECTIVES,
  type BoostDraft,
  type CampaignGender,
  type SupportedObjective,
} from "@/lib/vidcica/campaign";
import { useLocale, useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/lib/i18n";
import { BOOST_STEPS, gateCurrency, isDraftReady } from "../store";
import { useBoostStore } from "../provider";

export type VideoOption = { id: string; title: string };

/** Money formatted in the AD ACCOUNT's currency, not a hardcoded euro sign.
 *  A CAD account genuinely spends CAD, so showing "€" would misstate what a
 *  campaign costs. Intl also gets the locale's placement/separators right. */
function useMoney() {
  const locale = useLocale();
  const gate = useBoostStore((s) => s.gate);
  const currency = gateCurrency(gate);
  return {
    currency,
    format: (amount: number) =>
      new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-FR", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(Number.isFinite(amount) ? amount : 0),
  };
}

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
      <div className="flex flex-col gap-6" data-testid="boost-checking">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-56 w-full rounded-lg" />
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
  // Forward steps enter from the right, back steps from the left, so the motion
  // matches the mental model of moving through a form. The store sets this on
  // each transition (see BoostState.dir).
  const dir = useBoostStore((s) => s.dir);

  const draftOnly = phase === "draftOnly";
  const creating = phase === "creating";
  const key = BOOST_STEPS[step] ?? "video";
  const isLast = step === BOOST_STEPS.length - 1;

  function next() {
    if (!isLast) setStep(step + 1);
  }

  return (
    <div className="flex flex-col gap-6" data-testid="boost-wizard">
      {draftOnly ? (
        <div
          className="bg-warning-subtle text-warning rounded-md px-5 py-4 text-[13px] leading-relaxed"
          data-testid="boost-draft-banner"
        >
          {t("ads.draftBanner")}
        </div>
      ) : null}

      <Stepper step={step} onSelect={setStep} />

      {/* mode="wait" so the outgoing step finishes before the next arrives —
          crossfading two forms of different heights makes the card jump. */}
      <Card className="overflow-hidden p-6">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <m.div
            key={key}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.6 }}
            className="flex flex-col gap-5"
          >
            {key === "video" ? (
              <VideoStep videos={videos} draft={draft} setDraft={setDraft} />
            ) : null}
            {key === "objective" ? <ObjectiveStep draft={draft} setDraft={setDraft} /> : null}
            {key === "audience" ? <AudienceStep draft={draft} setDraft={setDraft} /> : null}
            {key === "budget" ? <BudgetStep draft={draft} setDraft={setDraft} /> : null}
            {key === "review" ? <ReviewStep draft={draft} videos={videos} /> : null}
          </m.div>
        </AnimatePresence>
      </Card>

      {error ? (
        <p role="alert" className="text-destructive text-[13px]" data-testid="boost-error">
          {error}
          {campaignId ? (
            <>
              {" "}
              <Link
                href={`/ads/${campaignId}`}
                className="font-semibold underline underline-offset-4"
              >
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

/**
 * Step indicator: a thin progress line and the step names as quiet text.
 * Completed steps stay clickable so a user can jump back and correct something
 * without walking the whole wizard again; steps ahead are disabled because they
 * may not be valid yet.
 */
function Stepper({ step, onSelect }: { step: number; onSelect: (i: number) => void }) {
  const t = useT();
  const pct = ((step + 1) / BOOST_STEPS.length) * 100;

  return (
    <nav
      aria-label={t("ads.stepsAria")}
      data-testid="boost-stepper"
      className="flex flex-col gap-3"
    >
      <Progress value={pct} label={t("ads.stepsAria")} className="h-1" />
      <ol className="flex flex-wrap gap-x-5 gap-y-1">
        {BOOST_STEPS.map((s, i) => {
          const current = i === step;
          const reachable = i <= step;
          return (
            <li key={s} className={cn(!current && "hidden sm:block")}>
              <button
                type="button"
                onClick={() => reachable && onSelect(i)}
                disabled={!reachable}
                aria-current={current ? "step" : undefined}
                data-testid={`boost-step-${s}`}
                className={cn(
                  "focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-1.5 rounded-full text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  current && "text-foreground font-semibold",
                  !current && reachable && "text-foreground hover:underline",
                  !reachable && "text-muted-foreground",
                  reachable ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span className="tabular-nums">
                  {i + 1}
                  <span className="sm:hidden">/{BOOST_STEPS.length}</span>
                </span>
                {t(STEP_TITLE[s])}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Shared look of a selectable tile/chip whose native input covers it invisibly. */
const CHOICE_FOCUS =
  "has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-card has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2";

function CheckMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-foreground shrink-0"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
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
      <div className="flex flex-col gap-2">
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
      <legend className="mb-3 text-[13px] font-semibold">{t("ads.objectiveLegend")}</legend>
      {SUPPORTED_OBJECTIVES.map((o) => {
        const selected = draft.objective === o;
        return (
          <label
            key={o}
            className={cn(
              CHOICE_FOCUS,
              "relative flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-md px-4 text-[15px] font-medium transition-colors",
              selected ? "bg-secondary" : "hover:bg-accent",
            )}
          >
            <input
              type="radio"
              name="objective"
              value={o}
              checked={selected}
              onChange={() => setDraft({ objective: o as SupportedObjective })}
              data-testid={`bw-objective-${o}`}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            {t(CAMPAIGN_OBJECTIVE_KEY[o])}
            {selected ? <CheckMark /> : null}
          </label>
        );
      })}
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
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col">
        <legend className="mb-3 text-[13px] font-semibold">{t("ads.field.countries")}</legend>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map(([code, nameKey]) => {
            const checked = draft.countries.includes(code);
            return (
              <label
                key={code}
                className={cn(
                  CHOICE_FOCUS,
                  "relative inline-flex h-10 cursor-pointer items-center rounded-full px-4 text-sm font-semibold transition-colors",
                  checked
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-accent",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggleCountry(code, e.target.checked)}
                  data-testid={`bw-country-${code}`}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {t(nameKey)}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-2">
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
      <div className="flex flex-col gap-2">
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
  const { currency, format } = useMoney();
  const amount = draft.budgetMode === "total" ? draft.budgetTotal : draft.budgetDaily;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="bw-budget-total">{t("ads.field.budgetTotal", { currency })}</Label>
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="bw-budget-daily">{t("ads.field.budgetDaily", { currency })}</Label>
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

      {/* Restate the amount in the ad account's own currency. The number the
          user types is sent to Meta in THAT currency, so seeing it formatted
          removes any doubt about what is actually being spent. */}
      <m.p
        key={`${draft.budgetMode}-${amount}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="text-muted-foreground text-[13px] tabular-nums"
        data-testid="bw-budget-preview"
      >
        {draft.budgetMode === "total"
          ? t("ads.budgetTotalValue", { amount: format(amount) })
          : t("ads.budgetDailyValue", { amount: format(amount) })}
      </m.p>
    </div>
  );
}

function ReviewStep({ draft, videos }: { draft: StepProps["draft"]; videos: VideoOption[] }) {
  const t = useT();
  const { format } = useMoney();
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
        ? t("ads.budgetTotalValue", { amount: format(draft.budgetTotal) })
        : t("ads.budgetDailyValue", { amount: format(draft.budgetDaily) }),
    ],
  ];
  return (
    <dl className="divide-border flex flex-col divide-y" data-testid="bw-review">
      {rows.map(([k, v], i) => (
        <m.div
          key={k}
          className="flex items-baseline justify-between gap-6 py-3 first:pt-0"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          // Staggered so the summary reads top-to-bottom as it lands, which
          // encourages actually checking it before spending money.
          transition={{ delay: i * 0.04, duration: 0.22, ease: "easeOut" }}
        >
          <dt className="text-muted-foreground shrink-0 text-[13px]">{k}</dt>
          <dd className="min-w-0 text-right text-[15px] font-semibold break-words">{v}</dd>
        </m.div>
      ))}
      <p className="text-muted-foreground pt-4 text-[13px] leading-relaxed">
        {t("ads.review.note")}
      </p>
    </dl>
  );
}
