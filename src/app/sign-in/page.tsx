import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/features/auth";
import { BrandLockup, LogoMark } from "@/components/brand";
import { LandingVideo } from "@/components/landing-video";
import { Reveal } from "@/components/reveal";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Connexion" };

/**
 * Auth screen mirroring the mobile app's landing (logo mark, «Bienvenue sur
 * Vidcica», value chips, legal footer) — over a looping brand video like the
 * app's welcome carousel, with the form on a frosted-glass card.
 */
export default async function SignInPage() {
  // Already signed in (e.g. coming back after a Google OAuth round-trip) —
  // go straight to the app instead of showing the form again.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-hidden">
      {/* Video backdrop (the app's welcome-3 clip, hosted on app-assets) + scrim */}
      <LandingVideo
        src="https://scoozakhhmowpzwotxgp.supabase.co/storage/v1/object/public/app-assets/onboarding/welcome-3.mp4"
        poster="https://scoozakhhmowpzwotxgp.supabase.co/storage/v1/object/public/app-assets/onboarding/welcome-3.jpg"
        className="absolute inset-0 size-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-black/65 via-black/35 to-black/75"
      />

      {/* Top bar — wordmark back to the site */}
      <div className="relative z-10 flex w-full items-center justify-between px-6 py-4">
        <Link
          href="/"
          aria-label="Retour à l’accueil Vidcica"
          className="rounded-full border border-white/15 bg-black/30 px-3.5 py-1.5 text-white backdrop-blur-md transition-colors hover:bg-black/45"
        >
          <BrandLockup className="text-sm" />
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/15 bg-black/30 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md transition-colors hover:bg-black/45 hover:text-white"
        >
          ← Retour au site
        </Link>
      </div>

      {/* Glass auth card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <Reveal
          onMount
          y={18}
          className="bg-background/90 border-border/60 flex w-full max-w-md flex-col items-center gap-6 rounded-lg border p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-col items-center gap-3">
            <LogoMark className="size-16 object-contain" />
            <h1 className="text-xl font-semibold tracking-tight">Bienvenue sur Vidcica</h1>
            <p
              className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-widest uppercase"
              aria-label="IA avancée, multi-réseaux, analytics"
            >
              <span>IA avancée</span>
              <span aria-hidden className="bg-primary size-1 rounded-full" />
              <span>Multi-réseaux</span>
              <span aria-hidden className="bg-primary size-1 rounded-full" />
              <span>Analytics</span>
            </p>
          </div>

          <Suspense>
            <AuthPanel />
          </Suspense>

          <p className="text-muted-foreground text-center text-[11px] leading-relaxed">
            En continuant, vous acceptez les{" "}
            <Link href="/terms" className="hover:text-foreground underline underline-offset-2">
              Conditions d’utilisation
            </Link>{" "}
            et la{" "}
            <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">
              Politique de confidentialité
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </main>
  );
}
