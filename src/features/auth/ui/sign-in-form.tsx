"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/redirect";
import { useT } from "@/lib/i18n/provider";
import { CredentialsSchema } from "../schema";

/**
 * Email + password sign-in / sign-up. Copy mirrors the mobile app's auth
 * strings (ClipFlow i18n `auth.*` — app voice, tutoiement). The browser
 * Supabase client sets the auth cookies; the middleware keeps the session
 * fresh and guards protected routes.
 */
export function SignInForm() {
  const t = useT();
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next"), "/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
    const { error: authError } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword(parsed.data)
        : await supabase.auth.signUp(parsed.data);
    setPending(false);
    if (authError) {
      setError(authError.message);
      return;
    }
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
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-password">{t("auth.passwordLabel")}</Label>
        <Input
          id="auth-password"
          type="password"
          placeholder={t("auth.passwordPlaceholder")}
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-foreground/5 h-10"
        />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="rounded-full">
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
      >
        {mode === "sign-in" ? t("auth.switchToSignUp") : t("auth.switchToSignIn")}
      </Button>
    </form>
  );
}
