"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import { ResetPasswordSchema } from "../schema";

type Phase = "checking" | "ready" | "invalid" | "done";

/**
 * New-password form reached from the recovery e-mail link — mirrors the mobile
 * reset-password screen. The browser Supabase client (PKCE, detectSessionInUrl)
 * establishes a short-lived recovery session from the link; we wait for it via
 * `onAuthStateChange` + `getSession`. On submit we `updateUser({ password })`
 * then send the user to the dashboard with their new password active.
 */
export function ResetPasswordForm() {
  const t = useT();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const settled = useRef(false);

  // Establish the recovery session from the email link. The link carries a PKCE
  // code (or token_hash) the browser client auto-exchanges; we just watch for a
  // session to appear. If none lands (expired/consumed link, or a cross-device
  // open where the verifier isn't in this browser), show the honest error.
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const ready = () => {
      if (!mounted || settled.current) return;
      settled.current = true;
      setPhase("ready");
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) ready();
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) ready();
    });

    const timer = setTimeout(() => {
      if (mounted && !settled.current) {
        settled.current = true;
        setPhase("invalid");
      }
    }, 2500);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = ResetPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("common.error"));
      return;
    }
    setError(null);
    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setPending(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPhase("done");
    // Session is already active with the new password — go straight in.
    setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 900);
  }

  if (phase === "checking") {
    return (
      <div
        className="text-muted-foreground flex w-full max-w-sm flex-col items-center gap-3 py-8 text-sm"
        data-testid="reset-password-checking"
      >
        {t("auth.resetVerifying")}
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <div
        className="flex w-full max-w-sm flex-col items-center gap-4 text-center"
        data-testid="reset-password-invalid"
      >
        <h2 className="text-lg font-semibold tracking-tight">{t("auth.resetInvalidTitle")}</h2>
        <p className="text-muted-foreground text-sm">{t("auth.resetInvalidBody")}</p>
        <Link href="/forgot-password" className="w-full max-w-xs">
          <Button variant="secondary" className="w-full rounded-full">
            {t("auth.resetRequestNew")}
          </Button>
        </Link>
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
        >
          {t("auth.forgotBackToSignIn")}
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div
        className="flex w-full max-w-sm flex-col items-center gap-3 py-6 text-center"
        data-testid="reset-password-done"
      >
        <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{t("auth.resetDoneTitle")}</h2>
        <p className="text-muted-foreground text-sm">{t("auth.resetDoneBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-lg font-semibold tracking-tight">{t("auth.resetTitle")}</h2>
        <p className="text-muted-foreground text-xs">{t("auth.resetSubtitle")}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-password">{t("auth.resetNewPassword")}</Label>
        <Input
          id="reset-password"
          type={show ? "text" : "password"}
          placeholder={t("auth.passwordPlaceholder")}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-foreground/5 h-10"
          data-testid="reset-password-input"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-confirm">{t("auth.resetConfirmPassword")}</Label>
        <Input
          id="reset-confirm"
          type={show ? "text" : "password"}
          placeholder={t("auth.passwordPlaceholder")}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="bg-foreground/5 h-10"
          data-testid="reset-password-confirm"
        />
      </div>
      <label className="text-muted-foreground flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
          className="accent-primary size-3.5"
          data-testid="reset-password-show"
        />
        {t("auth.resetShowPassword")}
      </label>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="rounded-full"
        data-testid="reset-password-submit"
      >
        {pending ? t("auth.resetSaving") : t("auth.resetSubmit")}
      </Button>
    </form>
  );
}
