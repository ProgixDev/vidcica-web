import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";
import { LandingVideo } from "@/components/landing-video";
import { ThemeToggle } from "@/components/theme-toggle";
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

const SHOWCASE: { clip: ReturnType<typeof clip>; chip: string; caption: string }[] = [
  {
    clip: clip("clip-restaurant"),
    chip: "Voix off IA",
    caption: "Une voix naturelle, générée à partir de votre script.",
  },
  {
    clip: clip("clip-boutique"),
    chip: "Sous-titres animés",
    caption: "Incrustés automatiquement, lisibles sans le son.",
  },
  {
    clip: clip("clip-sport"),
    chip: "Musique intégrée",
    caption: "Une ambiance choisie dans le catalogue, mixée sous la voix.",
  },
  {
    clip: bucketClip("welcome-1"),
    chip: "Script par IA",
    caption: "Partez d’une phrase : le script est écrit pour vous.",
  },
  {
    clip: bucketClip("welcome-2"),
    chip: "Séquences incluses",
    caption: "Une banque de séquences libres de droits, choisies par l’IA.",
  },
  {
    clip: bucketClip("welcome-3"),
    chip: "Prête à publier",
    caption: "Exportée en 9:16, publiée sur vos réseaux en un clic.",
  },
];

const USE_CASES: { img: string; title: string; body: string }[] = [
  {
    img: "/media/use-restaurant.jpg",
    title: "Restaurants & food",
    body: "Menus du jour, coulisses, plats signatures — des vidéos qui donnent faim.",
  },
  {
    img: "/media/use-immo.jpg",
    title: "Immobilier",
    body: "Chaque bien devient une visite vidéo publiée sur tous vos réseaux.",
  },
  {
    img: "/media/use-coach.jpg",
    title: "Coachs & sport",
    body: "Conseils, séances, transformations — un rendez-vous vidéo régulier.",
  },
  {
    img: "/media/use-ecom.jpg",
    title: "E-commerce",
    body: "Présentez vos produits en vidéo courte et boostez les meilleures en campagne.",
  },
];

const STATS: { value: string; label: string }[] = [
  { value: "≈ 3 min", label: "de l’idée à la vidéo finale" },
  { value: "6 réseaux", label: "publiés en un seul clic" },
  { value: "9:16", label: "format vertical natif" },
  { value: "FR · EN", label: "voix et sous-titres" },
];

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "1",
    title: "Décrivez votre idée",
    body: "Un script complet ou une simple phrase suffit. Choisissez le ton, le format et la voix.",
  },
  {
    n: "2",
    title: "L’IA monte la vidéo",
    body: "Séquences, voix off, sous-titres et musique — assemblés au format vertical, prêts à poster.",
  },
  {
    n: "3",
    title: "Publiez et amplifiez",
    body: "Diffusez sur tous vos réseaux, puis boostez la vidéo en campagne Meta et suivez vos prospects.",
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
  title: string;
  body: string;
  icon: { path?: string; circles?: [number, number, number][] };
}[] = [
  {
    title: "Script écrit par IA",
    body: "Partez d’une idée : l’IA propose un script accrocheur, que vous ajustez librement.",
    icon: { path: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" },
  },
  {
    title: "Voix off naturelle",
    body: "Des voix réalistes en français et en anglais, générées pour chaque vidéo.",
    icon: {
      path: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v1a7 7 0 0 1-14 0v-1M12 18v4",
    },
  },
  {
    title: "Sous-titres animés",
    body: "Incrustés image par image, stylés et lisibles — même sans le son.",
    icon: {
      path: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM7 15h4m2 0h4M7 11h2m2 0h6",
    },
  },
  {
    title: "Musique d’ambiance",
    body: "Un catalogue de titres libres de droits, mixés sous la voix automatiquement.",
    icon: {
      path: "M9 18V5l12-2v13",
      circles: [
        [6, 18, 3],
        [18, 16, 3],
      ],
    },
  },
  {
    title: "Publication multi-réseaux",
    body: "Instagram, TikTok, YouTube Shorts, Facebook, LinkedIn, Threads — en un clic.",
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
    title: "Campagnes et prospects",
    body: "Boostez une vidéo en campagne Meta et suivez les prospects qu’elle génère.",
    icon: {
      circles: [
        [12, 12, 9],
        [12, 12, 5],
        [12, 12, 1],
      ],
    },
  },
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

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" aria-label="Vidcica — accueil">
            <BrandLockup />
          </Link>
          <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
            <a href="#exemples" className="hover:text-foreground transition-colors">
              Exemples
            </a>
            <a href="#fonctionnalites" className="hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#comment" className="hover:text-foreground transition-colors">
              Comment ça marche
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden rounded-full sm:inline-flex",
              )}
            >
              Se connecter
            </Link>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4")}
            >
              Commencer
            </Link>
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
              <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium">
                Studio vidéo IA
              </span>
              <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
                Transformez un script en vidéo courte — publiée partout, automatiquement.
              </h1>
              <p className="text-muted-foreground max-w-xl text-base leading-relaxed text-pretty">
                Vidcica génère des vidéos verticales à partir de vos idées — voix, sous-titres,
                musique — puis les publie sur vos réseaux pendant que vous préparez la suivante.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href="/sign-in"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-full px-7")}
                >
                  Créer ma première vidéo
                </Link>
                <a href="#exemples" className="text-muted-foreground hover:text-foreground text-sm">
                  Voir des exemples →
                </a>
              </div>
              <p className="text-muted-foreground/80 flex flex-wrap gap-x-2 gap-y-1 pt-4 text-xs">
                <span className="text-foreground/70 font-medium">Publie sur</span>
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
            </div>

            {/* Phone mockup with a real generated-style clip */}
            <div className="relative mx-auto w-[240px] shrink-0 sm:w-[264px]">
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
                Voix off générée
              </GlassChip>
              <GlassChip className="absolute -right-12 bottom-20 hidden sm:inline-flex">
                Sous-titres auto
              </GlassChip>
            </div>
          </div>
        </section>

        {/* ---------- Stats band ---------- */}
        <section className="bg-secondary/50 border-y">
          <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-6 py-10 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.value} className="flex flex-col gap-1">
                <dt className="text-muted-foreground order-2 text-xs">{s.label}</dt>
                <dd className="order-1 text-2xl font-semibold tracking-tight">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- Showcase ---------- */}
        <section
          className="mx-auto w-full max-w-6xl px-6 py-20"
          id="exemples"
          aria-labelledby="exemples-h"
        >
          <div className="mb-10 flex max-w-2xl flex-col gap-3">
            <h2 id="exemples-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Des vidéos prêtes à poster, pas des brouillons.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Chaque rendu sort au format vertical 9:16 avec la voix, les sous-titres et la musique
              déjà en place — il ne reste qu’à publier.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWCASE.map((item) => (
              <figure key={item.chip} className="group flex flex-col gap-3">
                <div className="border-border bg-card relative overflow-hidden rounded-lg border shadow-lg transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none">
                  <LandingVideo
                    src={item.clip.src}
                    poster={item.clip.poster}
                    className="aspect-9/16 w-full object-cover"
                  />
                  <GlassChip className="absolute bottom-3 left-3">{item.chip}</GlassChip>
                </div>
                <figcaption className="text-muted-foreground px-1 text-xs leading-relaxed">
                  {item.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section
          className="bg-secondary/40 border-y"
          id="fonctionnalites"
          aria-labelledby="features-h"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="mb-10 flex max-w-2xl flex-col gap-3">
              <h2 id="features-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Tout le studio, dans un seul outil.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                De l’écriture du script à la campagne publicitaire, Vidcica couvre toute la chaîne
                de la vidéo courte.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <li
                  key={f.title}
                  className="bg-card flex flex-col gap-3 rounded-md border p-5 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
                >
                  <span className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
                    <FeatureIcon {...f.icon} />
                  </span>
                  <h3 className="font-medium">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Use cases ---------- */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20" aria-labelledby="metiers-h">
          <div className="mb-10 flex max-w-2xl flex-col gap-3">
            <h2 id="metiers-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Pensé pour votre métier.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Peu importe votre activité : si vos clients sont sur les réseaux, Vidcica vous y rend
              visible chaque semaine.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u) => (
              <li
                key={u.title}
                className="group border-border bg-card overflow-hidden rounded-md border transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
              >
                <div className="relative aspect-4/3 overflow-hidden">
                  <Image
                    src={u.img}
                    alt={u.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-4">
                  <h3 className="text-sm font-medium">{u.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{u.body}</p>
                </div>
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
          <h2 id="how-h" className="mb-10 text-2xl font-semibold tracking-tight sm:text-3xl">
            Comment ça marche
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="bg-card flex flex-col gap-3 rounded-md border p-5 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
              >
                <span
                  className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-sm font-semibold"
                  aria-hidden
                >
                  {s.n}
                </span>
                <h3 className="font-medium">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- CTA band ---------- */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="border-border bg-card relative overflow-hidden rounded-lg border px-8 py-14 text-center shadow-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[480px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
            />
            <h2 className="mx-auto max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Votre prochaine vidéo est à trois minutes.
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed">
              Décrivez l’idée — Vidcica écrit, monte, sous-titre et publie pour vous.
            </p>
            <div className="mt-7 flex justify-center">
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
              >
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-10">
            <div className="flex max-w-xs flex-col gap-3">
              <BrandLockup />
              <p className="text-muted-foreground text-sm leading-relaxed">
                Des vidéos courtes générées par IA, publiées automatiquement sur tous vos réseaux.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-16 gap-y-8 text-sm" aria-label="Pied de page">
              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Produit
                </span>
                <a href="#exemples" className="hover:text-foreground text-muted-foreground">
                  Exemples
                </a>
                <a href="#fonctionnalites" className="hover:text-foreground text-muted-foreground">
                  Fonctionnalités
                </a>
                <Link href="/sign-in" className="hover:text-foreground text-muted-foreground">
                  Se connecter
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Légal
                </span>
                <Link href="/privacy" className="hover:text-foreground text-muted-foreground">
                  Confidentialité
                </Link>
                <Link href="/terms" className="hover:text-foreground text-muted-foreground">
                  Conditions
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Contact
                </span>
                <a
                  href="mailto:hello@vidcica.com"
                  className="hover:text-foreground text-muted-foreground"
                >
                  hello@vidcica.com
                </a>
              </div>
            </nav>
          </div>
          <p className="text-muted-foreground/70 text-xs">© 2026 Vidcica. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
