"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/redirect";
import { useT } from "@/lib/i18n/provider";
import { CredentialsSchema, SignupEnrichmentSchema } from "../schema";

/**
 * Email + password sign-in / sign-up. Copy mirrors the mobile app's auth
 * strings (ClipFlow i18n `auth.*` — app voice, tutoiement). The browser
 * Supabase client sets the auth cookies; the middleware keeps the session
 * fresh and guards protected routes.
 *
 * Sign-up mode additionally captures an optional niche + audience once (the
 * mobile onboarding's profile-setup step). We attach them to the signup
 * `user_metadata` (so they survive an email-confirmation round-trip) and, when
 * a session is available immediately, also write them to the `profiles` row.
 */
export function SignInForm() {
  const t = useT();
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next"), "/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Best-effort profile enrichment right after a signup that already has a
   *  session (email confirmation disabled / auto-confirm). RLS scopes the
   *  update to the caller's own row; failures are non-fatal (the values still
   *  ride along in user_metadata for a confirmation-gated flow). */
  async function persistEnrichment(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    fields: { niche: string; audience: string },
  ) {
    if (!fields.niche && !fields.audience) return;
    const patch: { niche?: string; audience?: string } = {};
    if (fields.niche) patch.niche = fields.niche;
    if (fields.audience) patch.audience = fields.audience;
    await supabase.from("profiles").update(patch).eq("id", userId);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = CredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.errCredentialsRequired"));
      return;
    }
    setError(null);
    setPending(true);
    const supabase = createClient();

    if (mode === "sign-in") {
      const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
      setPending(false);
      if (authError) {
        setError(authError.message);
        return;
      }
      router.replace(next);
      router.refresh();
      return;
    }

    // Sign-up — validate + normalise the optional enrichment, then carry it in
    // user_metadata so nothing is lost if email confirmation is required.
    const enrichment = SignupEnrichmentSchema.safeParse({ niche, audience });
    const meta = enrichment.success ? enrichment.data : { niche: "", audience: "" };
    const { data, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { niche: meta.niche, audience: meta.audience },
      },
    });
    if (authError) {
      setPending(false);
      setError(authError.message);
      return;
    }
    if (data.session && data.user) {
      await persistEnrichment(supabase, data.user.id, meta);
    }
    setPending(false);
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-lg font-semibold tracking-tight">
          {mode === "sign-in" ? t("auth.signInTitle") : t("auth.signUpTitle")}
        </h2>
        <p className="text-muted-foreground text-xs">
          {mode === "sign-in" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-email">{t("auth.emailLabel")}</Label>
        <Input
          id="auth-email"
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-foreground/5 h-10"
          data-testid="sign-in-email"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="auth-password">{t("auth.passwordLabel")}</Label>
          {mode === "sign-in" ? (
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
              data-testid="sign-in-forgot-link"
            >
              {t("auth.forgotLink")}
            </Link>
          ) : null}
        </div>
        <Input
          id="auth-password"
          type="password"
          placeholder={t("auth.passwordPlaceholder")}
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-foreground/5 h-10"
          data-testid="sign-in-password"
        />
      </div>

      {/* Sign-up only: lightweight profile capture (optional). */}
      {mode === "sign-up" ? (
        <div className="border-border/60 flex flex-col gap-4 rounded-xl border border-dashed p-3">
          <p className="text-muted-foreground text-[11px]">{t("auth.signUpProfileHint")}</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-niche">{t("profile.nicheLabel")}</Label>
            <Input
              id="auth-niche"
              type="text"
              placeholder={t("profile.nichePlaceholder")}
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="bg-foreground/5 h-10"
              data-testid="sign-up-niche"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-audience">{t("profile.audienceLabel")}</Label>
            <Textarea
              id="auth-audience"
              placeholder={t("profile.audiencePlaceholder")}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="bg-foreground/5 min-h-16"
              data-testid="sign-up-audience"
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="rounded-full"
        data-testid="sign-in-submit"
      >
        {mode === "sign-in"
          ? pending
            ? t("auth.signingIn")
            : t("auth.signInAction")
          : pending
            ? t("auth.signingUp")
            : t("auth.signUpAction")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="rounded-full"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        data-testid="sign-in-toggle-mode"
      >
        {mode === "sign-in" ? t("auth.switchToSignUp") : t("auth.switchToSignIn")}
      </Button>
    </form>
  );
}
