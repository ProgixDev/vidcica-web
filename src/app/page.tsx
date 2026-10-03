import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LogoMark } from "@/components/brand";
import { FaqAccordion } from "@/components/faq-accordion";
import { LandingVideo } from "@/components/landing-video";
import { PricingCards } from "@/components/pricing-cards";
import { Reveal } from "@/components/reveal";
import { ShowcaseVideo } from "@/components/showcase-video";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/routing";
import { FAQ_ITEMS } from "@/lib/marketing/faq";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { TrackedLink } from "@/components/tracked-link";
import { FEATURES } from "@/lib/marketing/features";
import { USE_CASES } from "@/lib/marketing/use-cases";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import type { Metadata, ResolvingMetadata } from "next";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Landing media — Pexels footage/photos (free license), transcoded small and
 * self-hosted in /public/media so it ships on our own CDN (no hotlinking).
 * The `welcome-*` clips reuse the mobile app's onboarding assets, already
 * hosted on the Supabase `app-assets` public bucket (ClipFlow media.ts).
 */
const clip = (name: string) => ({
  src: `/media/${name}.mp4`,
  poster: `/media/${name}.jpg`,
});

const BUCKET_BASE =
  "https://scoozakhhmowpzwotxgp.supabase.co/storage/v1/object/public/app-assets/onboarding";

const bucketClip = (name: string) => ({
  src: `${BUCKET_BASE}/${name}.mp4`,
  poster: `${BUCKET_BASE}/${name}.jpg`,
});

const HERO_CLIP = clip("hero");

// Only what a public user can actually publish to today — keep in sync with
// PUBLISHING_PLATFORMS in lib/vidcica/network.ts. Instagram/Facebook/Threads
// return here once Meta approves.
const PLATFORMS = ["TikTok", "YouTube Shorts", "LinkedIn"];

/**
 * The first three cards are REAL Vidcica renders pulled from the production
 * `videos` bucket (trimmed + re-encoded for the web), so each one actually
 * demonstrates the claim printed under it: an ElevenLabs voiceover, the
 * burned-in animated subtitles, and the catalog music bed. They carry audio and
 * a sound toggle. The remaining three stay silent stock B-roll — their claims
 * (script, footage, 9:16 export) are visual, not audible.
 */
const SHOWCASE: {
  clip: ReturnType<typeof clip>;
  chip: MessageKey;
  caption: MessageKey;
  sound?: boolean;
}[] = [
  {
    clip: clip("proof-voice"),
    chip: "landing.showcase.1.chip",
    caption: "landing.showcase.1.caption",
    sound: true,
  },
  {
    clip: clip("proof-subtitles"),
    chip: "landing.showcase.2.chip",
    caption: "landing.showcase.2.caption",
    sound: true,
  },
  {
    clip: clip("proof-music"),
    chip: "landing.showcase.3.chip",
    caption: "landing.showcase.3.caption",
    sound: true,
  },
  {
    clip: bucketClip("welcome-1"),
    chip: "landing.showcase.4.chip",
    caption: "landing.showcase.4.caption",
  },
  {
    clip: bucketClip("welcome-2"),
    chip: "landing.showcase.5.chip",
    caption: "landing.showcase.5.caption",
  },
  {
    clip: bucketClip("welcome-3"),
    chip: "landing.showcase.6.chip",
    caption: "landing.showcase.6.caption",
  },
];

const STATS: { value: MessageKey; label: MessageKey }[] = [
  { value: "landing.stat.1.value", label: "landing.stat.1.label" },
  { value: "landing.stat.2.value", label: "landing.stat.2.label" },
  { value: "landing.stat.3.value", label: "landing.stat.3.label" },
  { value: "landing.stat.4.value", label: "landing.stat.4.label" },
];

const STEPS: { n: string; title: MessageKey; body: MessageKey }[] = [
  {
    n: "1",
    title: "landing.step.1.title",
    body: "landing.step.1.body",
  },
  {
    n: "2",
    title: "landing.step.2.title",
    body: "landing.step.2.body",
  },
  {
    n: "3",
    title: "landing.step.3.title",
    body: "landing.step.3.body",
  },
];

/** Solid pill laid over media — opaque, so it needs no blur or border. */
function MediaChip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "bg-background text-foreground rounded-full px-3 py-1.5 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Section heading — one title, one optional muted lead. No eyebrow. */
function SectionHead({
  id,
  title,
  lead,
  className,
}: {
  id: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn("mb-12 flex max-w-2xl flex-col gap-4", className)}>
      <h2
        id={id}
        className="text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-4xl"
      >
        {title}
      </h2>
      {lead ? (
        <p className="text-muted-foreground text-base leading-relaxed text-pretty">{lead}</p>
      ) : null}
    </Reveal>
  );
}

/**
 * The homepage carries the head keywords (docs/marketing/mots-cles.md §A,
 * keywords-en.md §A). Without its own metadata it fell back to the layout's
 * bare "Vidcica" title and French description, including on /en. Social tags
 * keep the layout's type, URL and locale; only the wording changes.
 */
export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const t = await getT();
  const title = t("landing.meta.title");
  const description = t("landing.meta.description");
  const { openGraph, twitter } = await parent;
  return {
    title: { absolute: title },
    description,
    openGraph: { ...(openGraph as Metadata["openGraph"]), title, description },
    twitter: { ...(twitter as Metadata["twitter"]), title, description },
  };
}

export default async function Home() {
  const t = await getT();
  const locale = await getLocale();
  const faqItems = FAQ_ITEMS.map((f) => ({ q: t(f.q), a: t(f.a) }));

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <MarketingHeader t={t} locale={locale} />

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-10 pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16 lg:pb-28">
          <div className="flex flex-col items-start gap-7">
            <Reveal onMount y={10}>
              <p className="text-muted-foreground text-[15px] font-medium">
                {t("landing.hero.badge")}
              </p>
            </Reveal>
            <Reveal onMount delay={0.08}>
              <h1 className="text-[40px] leading-[1.05] font-semibold tracking-[-0.04em] sm:text-[56px]">
                {t("landing.hero.title")}
              </h1>
            </Reveal>
            <Reveal onMount delay={0.16}>
              <p className="text-muted-foreground max-w-xl text-lg leading-relaxed text-pretty">
                {t("landing.hero.subtitle")}
              </p>
            </Reveal>
            <Reveal onMount delay={0.24}>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <TrackedLink
                  href="/sign-in"
                  location="hero"
                  className={buttonVariants({ variant: "brand", size: "lg" })}
                >
                  {t("landing.hero.cta")}
                </TrackedLink>
                <a href="#exemples" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                  {t("landing.hero.seeExamples")}
                </a>
              </div>
            </Reveal>
            <Reveal onMount delay={0.32}>
              <p className="text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 pt-2 text-[13px]">
                <span>{t("landing.hero.publishOn")}</span>
                {PLATFORMS.map((p, i) => (
                  <span key={p} className="text-foreground font-medium">
                    {p}
                    {i < PLATFORMS.length - 1 ? (
                      <span aria-hidden className="text-muted-foreground ml-2 font-normal">
                        ·
                      </span>
                    ) : null}
                  </span>
                ))}
              </p>
            </Reveal>
          </div>

          {/* The one atmospheric field of this view; the clip is composited above the grain. */}
          <Reveal onMount delay={0.2} y={24}>
            <div className="field-contre-jour grain flex items-center justify-center rounded-lg px-8 py-12 sm:py-14">
              <div className="relative w-[220px] sm:w-[248px]">
                <LandingVideo
                  src={HERO_CLIP.src}
                  poster={HERO_CLIP.poster}
                  className="aspect-9/16 w-full rounded-lg object-cover"
                />
                <MediaChip className="absolute top-8 -left-10 hidden sm:inline-flex">
                  {t("landing.hero.chipVoice")}
                </MediaChip>
                <MediaChip className="absolute -right-10 bottom-14 hidden sm:inline-flex">
                  {t("landing.hero.chipSubtitles")}
                </MediaChip>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------- Stats ---------- */}
        <section className="mx-auto w-full max-w-6xl px-6">
          <Reveal y={10}>
            <dl className="bg-card grid grid-cols-2 gap-x-6 gap-y-8 rounded-lg p-8 sm:grid-cols-4 sm:p-10">
              {STATS.map((s) => (
                <div key={s.value} className="flex flex-col gap-1.5">
                  <dt className="text-muted-foreground order-2 text-[13px] leading-snug">
                    {t(s.label)}
                  </dt>
                  <dd className="order-1 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                    {t(s.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* ---------- Showcase ---------- */}
        <section
          className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28"
          id="exemples"
          aria-labelledby="exemples-h"
        >
          <SectionHead
            id="exemples-h"
            title={t("landing.showcase.title")}
            lead={t("landing.showcase.subtitle")}
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
            {SHOWCASE.map((item, i) => (
              <Reveal key={item.chip} delay={(i % 3) * 0.08}>
                <figure className="flex flex-col gap-3">
                  <div className="bg-card relative overflow-hidden rounded-md">
                    {item.sound ? (
                      <ShowcaseVideo
                        src={item.clip.src}
                        poster={item.clip.poster}
                        className="aspect-9/16 w-full object-cover"
                        soundOnLabel={t("landing.showcase.soundOn")}
                        soundOffLabel={t("landing.showcase.soundOff")}
                      />
                    ) : (
                      <LandingVideo
                        src={item.clip.src}
                        poster={item.clip.poster}
                        className="aspect-9/16 w-full object-cover"
                      />
                    )}
                    <MediaChip className="absolute bottom-3 left-3">{t(item.chip)}</MediaChip>
                  </div>
                  <figcaption className="text-muted-foreground text-[13px] leading-relaxed">
                    {t(item.caption)}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section
          className="mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-28"
          id="fonctionnalites"
          aria-labelledby="features-h"
        >
          <SectionHead
            id="features-h"
            title={t("landing.features.title")}
            lead={t("landing.features.subtitle")}
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="min-w-0">
                <Reveal
                  delay={(i % 3) * 0.08}
                  className="bg-card flex h-full flex-col gap-3 rounded-lg p-7"
                >
                  <FeatureIcon {...f.icon} />
                  <h3 className="mt-3 text-[17px] font-semibold tracking-tight">{t(f.title)}</h3>
                  <p className="text-muted-foreground text-[15px] leading-relaxed">{t(f.body)}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Use cases ---------- */}
        <section
          className="mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-28"
          aria-labelledby="metiers-h"
        >
          <SectionHead
            id="metiers-h"
            title={t("landing.useCases.title")}
            lead={t("landing.useCases.subtitle")}
          />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {USE_CASES.map((u, i) => (
              <li key={u.slug} className="min-w-0">
                <Reveal delay={(i % 4) * 0.07} className="h-full">
                  <Link
                    href={localizedPath(`/cas-usage/${u.slug}`, locale)}
                    className="group focus-visible:ring-ring focus-visible:ring-offset-background flex h-full flex-col gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
                  >
                    <div className="bg-card relative aspect-4/5 overflow-hidden rounded-md">
                      <Image
                        src={u.img}
                        alt={t(u.cardTitle)}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[15px] font-semibold">{t(u.cardTitle)}</h3>
                      <p className="text-muted-foreground text-[13px] leading-relaxed">
                        {t(u.cardBody)}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- How it works ---------- */}
        <section
          className="mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-28"
          id="comment"
          aria-labelledby="how-h"
        >
          <SectionHead id="how-h" title={t("landing.how.title")} />
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.n} className="min-w-0">
                <Reveal delay={(i % 3) * 0.08} className="flex h-full flex-col gap-3">
                  <span
                    className="text-muted-foreground text-5xl font-semibold tracking-[-0.04em]"
                    aria-hidden
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">{t(s.title)}</h3>
                  <p className="text-muted-foreground text-[15px] leading-relaxed">{t(s.body)}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Pricing ---------- */}
        <section
          className="mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-28"
          id="tarifs"
          aria-labelledby="tarifs-h"
        >
          <SectionHead
            id="tarifs-h"
            title={t("landing.pricing.title")}
            lead={t("landing.pricing.subtitle")}
          />
          <PricingCards t={t} />
        </section>

        {/* ---------- FAQ ---------- */}
        <section
          className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-20 sm:pb-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16"
          id="faq"
          aria-labelledby="faq-h"
        >
          <SectionHead id="faq-h" title={t("landing.faq.title")} className="mb-0" />
          <Reveal delay={0.08}>
            <FaqAccordion items={faqItems} />
          </Reveal>
        </section>

        {/* ---------- Closing CTA — copy on an opaque surface, the field beside it ---------- */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <Reveal className="bg-card grid overflow-hidden rounded-lg lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="flex flex-col items-start gap-5 p-8 sm:p-14">
              <h2 className="max-w-xl text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-5xl sm:leading-[1.05]">
                {t("landing.ctaBand.title")}
              </h2>
              <p className="text-muted-foreground max-w-md text-base leading-relaxed">
                {t("landing.ctaBand.subtitle")}
              </p>
              <TrackedLink
                href="/sign-in"
                location="cta-band"
                className={cn(buttonVariants({ variant: "brand", size: "lg" }), "mt-2")}
              >
                {t("landing.pricing.startFree")}
              </TrackedLink>
            </div>
            <div
              aria-hidden
              className="field-aube grain flex min-h-48 items-center justify-center lg:min-h-full"
            >
              <LogoMark className="text-foreground size-20 sm:size-28" />
            </div>
          </Reveal>
        </section>
      </main>

      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
