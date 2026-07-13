import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const PLATFORMS = ["Instagram", "TikTok", "YouTube Shorts", "Facebook", "LinkedIn", "X", "Threads"];

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

function Wordmark() {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <span aria-hidden className="bg-primary inline-block size-3 rounded-full" />
      Vidcica
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Wordmark />
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
          >
            Se connecter
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-16 px-6 py-16">
        <section className="flex max-w-2xl flex-col items-start gap-6">
          <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium">
            Studio vidéo IA
          </span>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            Transformez un script en vidéo courte — publiée partout, automatiquement.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base leading-relaxed text-pretty">
            Vidcica génère des vidéos verticales à partir de vos idées — voix, sous-titres, musique
            — puis les publie sur vos réseaux pendant que vous préparez la suivante.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }), "px-7")}>
              Commencer
            </Link>
            <Link href="/sign-in" className="text-muted-foreground hover:text-foreground text-sm">
              J’ai déjà un compte →
            </Link>
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
        </section>

        <section className="flex flex-col gap-6" aria-labelledby="how">
          <h2
            id="how"
            className="text-muted-foreground text-sm font-medium tracking-wide uppercase"
          >
            Comment ça marche
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="bg-card flex flex-col gap-2 rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
              >
                <span className="text-primary text-2xl font-semibold" aria-hidden>
                  {s.n}
                </span>
                <h3 className="font-medium">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm">
        <Wordmark />
        <nav className="text-muted-foreground flex items-center gap-4 text-xs">
          <Link href="/privacy" className="hover:text-foreground">
            Confidentialité
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Conditions
          </Link>
          <a href="mailto:hello@vidcica.com" className="hover:text-foreground">
            Contact
          </a>
        </nav>
      </footer>
    </div>
  );
}
