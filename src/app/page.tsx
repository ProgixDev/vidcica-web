import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";
import { FaqAccordion } from "@/components/faq-accordion";
import { HeaderCta } from "@/components/header-cta";
import { LandingAmbience } from "@/components/landing-ambience";
import { LandingVideo } from "@/components/landing-video";
import { LanguageToggle } from "@/components/language-toggle";
import { Reveal } from "@/components/reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { ORDERED_TIERS, TIERS } from "@/lib/vidcica/tiers";
import { getT } from "@/lib/i18n/server";
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

const PLATFORMS = ["Instagram", "TikTok", "YouTube Shorts", "Facebook", "LinkedIn", "Threads"];

const SHOWCASE: { clip: ReturnType<typeof clip>; chip: MessageKey; caption: MessageKey }[] = [
  {
    clip: clip("clip-restaurant"),
    chip: "landing.showcase.1.chip",
    caption: "landing.showcase.1.caption",
  },
  {
    clip: clip("clip-boutique"),
    chip: "landing.showcase.2.chip",
    caption: "landing.showcase.2.caption",
  },
  {
    clip: clip("clip-sport"),
    chip: "landing.showcase.3.chip",
    caption: "landing.showcase.3.caption",
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

const USE_CASES: { img: string; title: MessageKey; body: MessageKey }[] = [
  {
    img: "/media/use-restaurant.jpg",
    title: "landing.useCase.restaurant.title",
    body: "landing.useCase.restaurant.body",
  },
  {
    img: "/media/use-immo.jpg",
    title: "landing.useCase.immo.title",
    body: "landing.useCase.immo.body",
  },
  {
    img: "/media/use-coach.jpg",
    title: "landing.useCase.coach.title",
    body: "landing.useCase.coach.body",
  },
  {
    img: "/media/use-ecom.jpg",
    title: "landing.useCase.ecom.title",
    body: "landing.useCase.ecom.body",
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

function FeatureIcon({ path, circles }: { path?: string; circles?: [number, number, number][] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4.5"
      aria-hidden
    >
      {path ? <path d={path} /> : null}
      {circles?.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  );
}

const FEATURES: {
  title: MessageKey;
  body: MessageKey;
  icon: { path?: string; circles?: [number, number, number][] };
}[] = [
  {
    title: "landing.feature.script.title",
    body: "landing.feature.script.body",
    icon: { path: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" },
  },
  {
    title: "landing.feature.voice.title",
    body: "landing.feature.voice.body",
    icon: {
      path: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v1a7 7 0 0 1-14 0v-1M12 18v4",
    },
  },
  {
    title: "landing.feature.subtitles.title",
    body: "landing.feature.subtitles.body",
    icon: {
      path: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM7 15h4m2 0h4M7 11h2m2 0h6",
    },
  },
  {
    title: "landing.feature.music.title",
    body: "landing.feature.music.body",
    icon: {
      path: "M9 18V5l12-2v13",
      circles: [
        [6, 18, 3],
        [18, 16, 3],
      ],
    },
  },
  {
    title: "landing.feature.publish.title",
    body: "landing.feature.publish.body",
    icon: {
      path: "m8.6 13.4 6.8 3.9M15.4 6.7l-6.8 3.9",
      circles: [
        [18, 5, 3],
        [6, 12, 3],
        [18, 19, 3],
      ],
    },
  },
  {
    title: "landing.feature.campaigns.title",
    body: "landing.feature.campaigns.body",
    icon: {
      circles: [
        [12, 12, 9],
        [12, 12, 5],
        [12, 12, 1],
      ],
    },
  },
];

const FAQ: { q: MessageKey; a: MessageKey }[] = [
  { q: "landing.faq.credits.q", a: "landing.faq.credits.a" },
  { q: "landing.faq.ownership.q", a: "landing.faq.ownership.a" },
  { q: "landing.faq.royaltyFree.q", a: "landing.faq.royaltyFree.a" },
  { q: "landing.faq.networks.q", a: "landing.faq.networks.a" },
  { q: "landing.faq.voiceLangs.q", a: "landing.faq.voiceLangs.a" },
  { q: "landing.faq.billing.q", a: "landing.faq.billing.a" },
];

function GlassChip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "border-border/60 bg-background/70 text-foreground/90 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small brand-tinted section label — adds structure + colour above headings. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-primary flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
      <span aria-hidden className="bg-primary h-px w-6" />
      {children}
    </span>
  );
}

export default async function Home() {
  const t = await getT();
  const faqItems = FAQ.map((f) => ({ q: t(f.q), a: t(f.a) }));
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <LandingAmbience />
      <script
        type="application/ld+json"
        // Static, app-controlled data — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" aria-label={t("landing.nav.homeAria")}>
            <BrandLockup />
          </Link>
          <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
            <a href="#exemples" className="hover:text-foreground transition-colors">
              {t("landing.nav.examples")}
            </a>
            <a href="#fonctionnalites" className="hover:text-foreground transition-colors">
              {t("landing.nav.features")}
            </a>
            <a href="#tarifs" className="hover:text-foreground transition-colors">
              {t("landing.nav.pricing")}
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden rounded-full sm:inline-flex",
              )}
            >
              {t("landing.nav.signIn")}
            </Link>
            <HeaderCta />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[780px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--primary), transparent 72%)" }}
          />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pt-14 pb-20 lg:grid-cols-[1fr_auto] lg:gap-20">
            <div className="flex max-w-2xl flex-col items-start gap-6">
              <Reveal onMount y={10}>
                <span className="bg-accent text-accent-foreground inline-block rounded-full px-3 py-1 text-xs font-medium">
                  {t("landing.hero.badge")}
                </span>
              </Reveal>
              <Reveal onMount delay={0.08}>
                <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
                  {t("landing.hero.title")}
                </h1>
              </Reveal>
              <Reveal onMount delay={0.16}>
                <p className="text-muted-foreground max-w-xl text-base leading-relaxed text-pretty">
                  {t("landing.hero.subtitle")}
                </p>
              </Reveal>
              <Reveal onMount delay={0.24}>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Link
                    href="/sign-in"
                    className={cn(buttonVariants({ size: "lg" }), "rounded-full px-7")}
                  >
                    {t("landing.hero.cta")}
                  </Link>
                  <a
                    href="#exemples"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    {t("landing.hero.seeExamples")}
                  </a>
                </div>
              </Reveal>
              <Reveal onMount delay={0.32}>
                <p className="text-muted-foreground/80 flex flex-wrap gap-x-2 gap-y-1 pt-4 text-xs">
                  <span className="text-foreground/70 font-medium">
                    {t("landing.hero.publishOn")}
                  </span>
                  {PLATFORMS.map((p, i) => (
                    <span key={p}>
                      {p}
                      {i < PLATFORMS.length - 1 ? (
                        <span aria-hidden className="ml-2 opacity-50">
                          ·
                        </span>
                      ) : null}
                    </span>
                  ))}
                </p>
              </Reveal>
            </div>

            {/* Phone mockup with a real generated-style clip */}
            <Reveal
              onMount
              delay={0.2}
              y={24}
              className="relative mx-auto w-[240px] shrink-0 sm:w-[264px]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full opacity-25 blur-2xl"
                style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
              />
              <div className="border-border bg-card rounded-[40px] border p-2 shadow-2xl">
                <LandingVideo
                  src={HERO_CLIP.src}
                  poster={HERO_CLIP.poster}
                  className="aspect-9/16 w-full rounded-[32px] object-cover"
                />
              </div>
              <GlassChip className="absolute top-12 -left-16 hidden sm:inline-flex">
                {t("landing.hero.chipVoice")}
              </GlassChip>
              <GlassChip className="absolute -right-12 bottom-20 hidden sm:inline-flex">
                {t("landing.hero.chipSubtitles")}
              </GlassChip>
            </Reveal>
          </div>
        </section>

        {/* ---------- Stats band ---------- */}
        <section className="bg-secondary/50 relative border-y">
          <Reveal y={10}>
            <dl className="divide-border/70 mx-auto grid w-full max-w-6xl grid-cols-2 gap-y-8 px-6 py-10 sm:grid-cols-4 sm:divide-x">
              {STATS.map((s) => (
                <div key={s.value} className="flex flex-col gap-1 sm:px-6 sm:first:pl-0">
                  <dt className="text-muted-foreground order-2 text-xs">{t(s.label)}</dt>
                  <dd className="text-primary order-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {t(s.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* ---------- Showcase ---------- */}
        <section
          className="mx-auto w-full max-w-6xl px-6 py-20"
          id="exemples"
          aria-labelledby="exemples-h"
        >
          <Reveal className="mb-10 flex max-w-2xl flex-col gap-3">
            <Eyebrow>{t("landing.nav.examples")}</Eyebrow>
            <h2 id="exemples-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("landing.showcase.title")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("landing.showcase.subtitle")}
            </p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWCASE.map((item, i) => (
              <Reveal key={item.chip} delay={(i % 3) * 0.08}>
                <figure className="group flex flex-col gap-3">
                  <div className="border-border bg-card relative overflow-hidden rounded-lg border shadow-lg transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none">
                    <LandingVideo
                      src={item.clip.src}
                      poster={item.clip.poster}
                      className="aspect-9/16 w-full object-cover"
                    />
                    <GlassChip className="absolute bottom-3 left-3">{t(item.chip)}</GlassChip>
                  </div>
                  <figcaption className="text-muted-foreground px-1 text-xs leading-relaxed">
                    {t(item.caption)}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section
          className="bg-secondary/40 relative overflow-hidden border-y"
          id="fonctionnalites"
          aria-labelledby="features-h"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 right-0 h-96 w-[560px] rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--primary), transparent 70%)" }}
          />
          <div className="relative mx-auto w-full max-w-6xl px-6 py-20">
            <Reveal className="mb-10 flex max-w-2xl flex-col gap-3">
              <Eyebrow>{t("landing.nav.features")}</Eyebrow>
              <h2 id="features-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("landing.features.title")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("landing.features.subtitle")}
              </p>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <li key={f.title} className="min-w-0">
                  <Reveal
                    delay={(i % 3) * 0.08}
                    className="group bg-card/80 hover:border-primary/30 flex h-full flex-col gap-3 rounded-lg border p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none"
                  >
                    <span
                      className="text-primary ring-primary/15 flex size-10 items-center justify-center rounded-full ring-1 transition-transform ring-inset group-hover:scale-105 motion-reduce:transition-none"
                      style={{
                        background:
                          "linear-gradient(140deg, color-mix(in oklab, var(--primary) 22%, transparent), color-mix(in oklab, var(--primary) 6%, transparent))",
                      }}
                    >
                      <FeatureIcon {...f.icon} />
                    </span>
                    <h3 className="font-medium">{t(f.title)}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{t(f.body)}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Use cases ---------- */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20" aria-labelledby="metiers-h">
          <Reveal className="mb-10 flex max-w-2xl flex-col gap-3">
            <Eyebrow>{t("landing.useCases.eyebrow")}</Eyebrow>
            <h2 id="metiers-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("landing.useCases.title")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("landing.useCases.subtitle")}
            </p>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u, i) => (
              <li key={u.title} className="min-w-0">
                <Reveal
                  delay={(i % 4) * 0.07}
                  className="group border-border bg-card h-full overflow-hidden rounded-md border transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
                >
                  <div className="relative aspect-4/3 overflow-hidden">
                    <Image
                      src={u.img}
                      alt={t(u.title)}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 p-4">
                    <h3 className="text-sm font-medium">{t(u.title)}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{t(u.body)}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- How it works ---------- */}
        <section
          className="mx-auto w-full max-w-6xl px-6 py-20"
          id="comment"
          aria-labelledby="how-h"
        >
          <Reveal className="mb-10 flex flex-col gap-3">
            <Eyebrow>{t("landing.how.eyebrow")}</Eyebrow>
            <h2 id="how-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("landing.how.title")}
            </h2>
          </Reveal>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.n} className="min-w-0">
                <Reveal
                  delay={(i % 3) * 0.08}
                  className="group bg-card/80 hover:border-primary/30 relative flex h-full flex-col gap-3 overflow-hidden rounded-lg border p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none"
                >
                  <span
                    aria-hidden
                    className="text-primary/10 pointer-events-none absolute -top-3 right-2 text-7xl font-bold"
                  >
                    {s.n}
                  </span>
                  <span
                    className="text-primary-foreground flex size-9 items-center justify-center rounded-full text-sm font-semibold shadow-md ring-1 ring-white/20 ring-inset"
                    style={{
                      background:
                        "linear-gradient(140deg, var(--primary), color-mix(in oklab, var(--primary) 70%, black))",
                    }}
                    aria-hidden
                  >
                    {s.n}
                  </span>
                  <h3 className="font-medium">{t(s.title)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(s.body)}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Pricing ---------- */}
        <section
          className="bg-secondary/40 relative overflow-hidden border-y"
          id="tarifs"
          aria-labelledby="tarifs-h"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--primary), transparent 70%)" }}
          />
          <div className="relative mx-auto w-full max-w-6xl px-6 py-20">
            <Reveal className="mb-10 flex max-w-2xl flex-col gap-3">
              <Eyebrow>{t("landing.nav.pricing")}</Eyebrow>
              <h2 id="tarifs-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("landing.pricing.title")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("landing.pricing.subtitle")}
              </p>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ORDERED_TIERS.map((id, i) => {
                const tier = TIERS[id];
                const popular = id === "pro";
                return (
                  <Reveal
                    key={id}
                    delay={(i % 4) * 0.07}
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
                        <span className="text-3xl font-semibold tracking-tight">
                          {tier.priceEUR} €
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {t("landing.pricing.perMonth")}
                        </span>
                      </p>
                    </div>
                    <ul className="flex flex-1 flex-col gap-2">
                      {tier.highlightKeys.map((h) => (
                        <li key={h} className="text-muted-foreground flex gap-2 text-xs">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary mt-0.5 size-3 shrink-0"
                            aria-hidden
                          >
                            <path d="m4.5 12.5 5 5 10-11" />
                          </svg>
                          {t(h)}
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
              })}
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="mx-auto w-full max-w-3xl px-6 py-20" id="faq" aria-labelledby="faq-h">
          <Reveal className="mb-8 flex flex-col gap-3">
            <Eyebrow>FAQ</Eyebrow>
            <h2 id="faq-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("landing.faq.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <FaqAccordion items={faqItems} />
          </Reveal>
        </section>

        {/* ---------- CTA band — bright, friendly creative-team clip (Pexels 7413698) ---------- */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <Reveal className="border-border relative overflow-hidden rounded-lg border text-center shadow-xl">
            <LandingVideo
              src="/media/cta.mp4"
              poster="/media/cta.jpg"
              className="absolute inset-0 size-full object-cover"
            />
            {/* Scrim — the footage is bright, so keep the copy readable (AA). */}
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-b from-black/55 via-black/45 to-black/65"
            />
            <div className="relative z-10 px-8 py-16 sm:py-20">
              <h2 className="mx-auto max-w-xl text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
                {t("landing.ctaBand.title")}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80">
                {t("landing.ctaBand.subtitle")}
              </p>
              <div className="mt-7 flex justify-center">
                <Link
                  href="/sign-in"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
                >
                  {t("landing.pricing.startFree")}
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-10">
            <div className="flex max-w-xs flex-col gap-3">
              <BrandLockup />
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("landing.footer.tagline")}
              </p>
            </div>
            <nav
              className="flex flex-wrap gap-x-16 gap-y-8 text-sm"
              aria-label={t("landing.footer.aria")}
            >
              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("landing.footer.product")}
                </span>
                <a href="#exemples" className="hover:text-foreground text-muted-foreground">
                  {t("landing.nav.examples")}
                </a>
                <a href="#tarifs" className="hover:text-foreground text-muted-foreground">
                  {t("landing.nav.pricing")}
                </a>
                <a href="#faq" className="hover:text-foreground text-muted-foreground">
                  FAQ
                </a>
                <Link href="/sign-in" className="hover:text-foreground text-muted-foreground">
                  {t("landing.nav.signIn")}
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("landing.footer.legal")}
                </span>
                <Link href="/privacy" className="hover:text-foreground text-muted-foreground">
                  {t("landing.footer.privacy")}
                </Link>
                <Link href="/terms" className="hover:text-foreground text-muted-foreground">
                  {t("landing.footer.terms")}
                </Link>
                <Link
                  href="/mentions-legales"
                  className="hover:text-foreground text-muted-foreground"
                >
                  {t("landing.footer.legalNotice")}
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("landing.footer.contact")}
                </span>
                <a
                  href="mailto:support@vidcica.com"
                  className="hover:text-foreground text-muted-foreground"
                >
                  support@vidcica.com
                </a>
              </div>
            </nav>
          </div>
          <p className="text-muted-foreground/70 text-xs">{t("landing.footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
