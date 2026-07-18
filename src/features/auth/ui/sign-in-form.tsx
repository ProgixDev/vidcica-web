"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/redirect";
import { CredentialsSchema } from "../schema";

/**
 * Email + password sign-in / sign-up. Copy mirrors the mobile app's auth
 * strings (ClipFlow i18n `auth.*` — app voice, tutoiement). The browser
 * Supabase client sets the auth cookies; the middleware keeps the session
 * fresh and guards protected routes.
 */
export function SignInForm() {
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
      setError(parsed.error.issues[0]?.message ?? "Email et mot de passe requis.");
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
          {mode === "sign-in" ? "Connexion" : "Créer un compte"}
        </h2>
        <p className="text-muted-foreground text-xs">
          {mode === "sign-in"
            ? "Connecte-toi pour reprendre où tu t’étais arrêté."
            : "Quelques secondes suffisent pour créer tes premières vidéos."}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-email">Adresse e-mail</Label>
        <Input
          id="auth-email"
          type="email"
          placeholder="toi@exemple.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-password">Mot de passe</Label>
        <Input
          id="auth-password"
          type="password"
          placeholder="Minimum 8 caractères"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
            ? "Connexion…"
            : "Se connecter"
          : pending
            ? "Création…"
            : "Créer mon compte"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="rounded-full"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in"
          ? "Pas encore de compte ? Créer un compte"
          : "Déjà un compte ? Se connecter"}
      </Button>
    </form>
  );
}
