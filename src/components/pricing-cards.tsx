import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import type { TFunction } from "@/lib/i18n";
import { modelsUnlockedAt } from "@/lib/vidcica/models";
import { ORDERED_TIERS, TIERS, type Plan, type TierDef } from "@/lib/vidcica/tiers";
import { cn } from "@/lib/utils";

/**
 * Public pricing block: four plan cards plus a detailed comparison table.
 *
 * Everything renders from the canonical tier matrix (`lib/vidcica/tiers`) and
 * the live model catalog (`lib/vidcica/models`), so the page can never drift
 * from what the product actually sells — and we never advertise a model whose
 * adapter is not live.
 *
 * Server component: takes a bound `t` from the page rather than reading the
 * locale itself.
 */

/** Credits for one 30s AI render with the cheapest live model (Seedance, ×0.45):
 *  round(0.45 × max(12, round(30 × 0.8))) = 11. Mirrors lib/vidcica/models. */
const YARDSTICK_COST = 11;
/** The free plan grants no monthly credits (credits_accounts.balance defaults to
 *  0 and no migration grants free users anything recurring) — so its card shows
 *  a per-video price instead of a monthly volume. */
const FREE_IS_PAYG = true;

const Check = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

const Dash = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    className={className}
    aria-hidden
  >
    <path d="M6 12h12" />
  </svg>
);

/** Approximate monthly video output — the headline value line on each card. */
function videosPerMonth(tier: TierDef): number {
  return Math.floor(tier.monthlyCredits / YARDSTICK_COST);
}

const isPayg = (tier: TierDef): boolean => FREE_IS_PAYG && tier.monthlyCredits === 0;

function PlanCard({ id, index, t }: { id: Plan; index: number; t: TFunction }) {
  const tier = TIERS[id];
  const popular = id === "pro";
  const newModels = modelsUnlockedAt(id);
  const previous = ORDERED_TIERS[index - 1];

  return (
    <Reveal
      delay={(index % 4) * 0.07}
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-lg border p-5 transition-transform hover:-translate-y-1 motion-reduce:transition-none",
        popular
          ? "border-primary shadow-xl sm:-my-2 sm:py-7"
          : "border-border bg-card/80 shadow-sm backdrop-blur-sm",
      )}
      style={
        popular
          ? {
              background:
                "linear-gradient(160deg, color-mix(in oklab, var(--primary) 14%, var(--card)), var(--card))",
            }
          : undefined
      }
    >
      {popular ? (
        <span
          className="text-primary-foreground absolute -top-3 left-5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase shadow-md"
          style={{
            background:
              "linear-gradient(140deg, var(--primary), color-mix(in oklab, var(--primary) 72%, black))",
          }}
        >
          {t("landing.pricing.popular")}
        </span>
      ) : null}

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{t(tier.labelKey)}</h3>
        <p className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight">{tier.priceEUR} €</span>
          <span className="text-muted-foreground text-xs">{t("landing.pricing.perMonth")}</span>
        </p>
      </div>

      {/* Value line: what the monthly credits actually buy. */}
      <div className="border-border/70 flex flex-col gap-0.5 border-y py-3">
        <p className="text-primary text-sm font-semibold">
          {isPayg(tier)
            ? t("landing.pricing.freeValue")
            : t("landing.pricing.videosAi", { n: videosPerMonth(tier) })}
        </p>
        <p className="text-muted-foreground text-xs">
          {isPayg(tier)
            ? t("landing.pricing.freeSub")
            : t("landing.pricing.creditsPerMonth", { n: tier.monthlyCredits })}
        </p>
      </div>

      {/* Models unlocked at this tier — the detail buyers compare on. */}
      {newModels.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            {t("landing.pricing.modelsLabel")}
          </p>
          <ul className="flex flex-wrap gap-1">
            {newModels.map((m) => (
              <li
                key={m.id}
                className="border-primary/30 bg-primary/10 text-primary rounded-full border px-2 py-0.5 text-[10px] font-medium"
              >
                {t(m.labelKey)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="flex flex-1 flex-col gap-2">
        {previous ? (
          <li className="text-foreground/80 text-xs font-medium">
            {t("landing.pricing.includesPrev", { plan: t(TIERS[previous].labelKey) })}
          </li>
        ) : null}
        {tier.landingFeatureKeys.map((k) => (
          <li key={k} className="text-muted-foreground flex gap-2 text-xs">
            <Check className="text-primary mt-0.5 size-3 shrink-0" />
            {t(k)}
          </li>
        ))}
      </ul>

      <Link
        href="/sign-in"
        className={cn(
          buttonVariants({ variant: popular ? "default" : "outline", size: "sm" }),
          "rounded-full",
        )}
      >
        {tier.priceEUR === 0
          ? t("landing.pricing.startFree")
          : t("landing.pricing.choose", { plan: t(tier.labelKey) })}
      </Link>
    </Reveal>
  );
}

type Row = { labelKey: Parameters<TFunction>[0]; render: (tier: TierDef) => React.ReactNode };

function BoolCell({ on, t }: { on: boolean; t: TFunction }) {
  return on ? (
    <>
      <Check className="text-primary mx-auto size-4" />
      <span className="sr-only">{t("landing.pricing.included")}</span>
    </>
  ) : (
    <>
      <Dash className="text-muted-foreground/50 mx-auto size-4" />
      <span className="sr-only">{t("landing.pricing.notIncluded")}</span>
    </>
  );
}

function ComparisonTable({ t }: { t: TFunction }) {
  const unlimited = t("landing.pricing.unlimited");

  const rows: Row[] = [
    {
      labelKey: "landing.pricing.row.credits",
      render: (tier) => (isPayg(tier) ? t("landing.pricing.payg") : tier.monthlyCredits),
    },
    {
      labelKey: "landing.pricing.row.videos",
      render: (tier) =>
        isPayg(tier) ? (
          <Dash className="text-muted-foreground/50 mx-auto size-4" />
        ) : (
          videosPerMonth(tier)
        ),
    },
    {
      labelKey: "landing.pricing.row.models",
      render: (tier) =>
        modelsUnlockedAt(tier.id).length > 0
          ? modelsUnlockedAt(tier.id)
              .map((m) => t(m.labelKey))
              .join(" · ")
          : "—",
    },
    { labelKey: "landing.pricing.row.quality", render: (tier) => tier.maxQuality },
    {
      labelKey: "landing.pricing.row.length",
      render: (tier) => t("landing.pricing.seconds", { n: tier.maxLengthSec }),
    },
    {
      labelKey: "landing.pricing.row.voiceover",
      render: (tier) => <BoolCell on={tier.voiceover} t={t} />,
    },
    { labelKey: "landing.pricing.row.networks", render: (tier) => tier.networks },
    {
      labelKey: "landing.pricing.row.accounts",
      render: (tier) => (tier.accountsPerPlatform === -1 ? unlimited : tier.accountsPerPlatform),
    },
    {
      labelKey: "landing.pricing.row.library",
      render: (tier) =>
        tier.storageLimit === -1
          ? unlimited
          : t("landing.pricing.videosCount", { n: tier.storageLimit }),
    },
    {
      labelKey: "landing.pricing.row.scheduling",
      render: (tier) => <BoolCell on={tier.scheduling} t={t} />,
    },
    {
      labelKey: "landing.pricing.row.analytics",
      render: (tier) => t(`landing.pricing.analytics.${tier.analytics}`),
    },
    { labelKey: "landing.pricing.row.ads", render: (tier) => <BoolCell on={tier.ads} t={t} /> },
    {
      labelKey: "landing.pricing.row.brandKit",
      render: (tier) => <BoolCell on={tier.brandKit} t={t} />,
    },
    {
      labelKey: "landing.pricing.row.support",
      render: (tier) => t(`landing.pricing.support.${tier.support}`),
    },
  ];

  return (
    <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
      <table className="w-full min-w-3xl border-collapse text-left text-xs">
        <caption className="sr-only">{t("landing.pricing.compareCaption")}</caption>
        <thead>
          <tr className="border-border border-b">
            <th scope="col" className="text-muted-foreground py-3 pr-4 font-medium">
              {t("landing.pricing.planColumn")}
            </th>
            {ORDERED_TIERS.map((id) => (
              <th
                key={id}
                scope="col"
                className={cn(
                  "px-3 py-3 text-center font-semibold",
                  id === "pro" && "text-primary",
                )}
              >
                {t(TIERS[id].labelKey)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.labelKey} className="border-border/60 border-b last:border-0">
              <th
                scope="row"
                className="text-muted-foreground py-2.5 pr-4 font-normal whitespace-nowrap"
              >
                {t(row.labelKey)}
              </th>
              {ORDERED_TIERS.map((id) => (
                <td
                  key={id}
                  className={cn(
                    "px-3 py-2.5 text-center",
                    id === "pro" ? "bg-primary/5 font-medium" : "text-muted-foreground",
                  )}
                >
                  {row.render(TIERS[id])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PricingCards({ t }: { t: TFunction }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ORDERED_TIERS.map((id, i) => (
          <PlanCard key={id} id={id} index={i} t={t} />
        ))}
      </div>

      <Reveal className="mt-6">
        <p className="text-muted-foreground text-xs leading-relaxed">{t("landing.pricing.note")}</p>
      </Reveal>

      <Reveal className="mt-12 flex flex-col gap-4">
        <h3 className="text-base font-semibold tracking-tight">
          {t("landing.pricing.compareTitle")}
        </h3>
        <ComparisonTable t={t} />
      </Reveal>
    </>
  );
}
