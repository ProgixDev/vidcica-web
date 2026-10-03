"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import { ResetPasswordSchema, isWeakPasswordError } from "../schema";

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
      setError(
        isWeakPasswordError(updateError.message) ? t("auth.errWeakPassword") : updateError.message,
      );
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
        className="text-muted-foreground flex w-full max-w-sm flex-col items-center gap-3 py-8 text-[15px]"
        data-testid="reset-password-checking"
      >
        {t("auth.resetVerifying")}
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <div
        className="flex w-full max-w-sm flex-col items-center gap-3 text-center"
        data-testid="reset-password-invalid"
      >
        <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.03em]">
          {t("auth.resetInvalidTitle")}
        </h2>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          {t("auth.resetInvalidBody")}
        </p>
        <Link href="/forgot-password" className="mt-5 w-full rounded-full">
          <Button size="lg" className="w-full">
            {t("auth.resetRequestNew")}
          </Button>
        </Link>
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground mt-2 text-[13px] underline underline-offset-2"
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
        <div className="bg-success-subtle text-success mb-3 flex size-12 items-center justify-center rounded-full">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.03em]">
          {t("auth.resetDoneTitle")}
        </h2>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          {t("auth.resetDoneBody")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5">
      <div className="mb-3 flex flex-col gap-3">
        <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.03em]">
          {t("auth.resetTitle")}
        </h2>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          {t("auth.resetSubtitle")}
        </p>
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
          data-testid="reset-password-confirm"
        />
      </div>
      <label className="text-muted-foreground flex items-center gap-2.5 text-[13px]">
        <input
          type="checkbox"
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
          className="accent-primary size-4"
          data-testid="reset-password-show"
        />
        {t("auth.resetShowPassword")}
      </label>
      {error ? (
        <p role="alert" className="text-destructive text-[13px]">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        variant="brand"
        size="lg"
        className="w-full"
        data-testid="reset-password-submit"
      >
        {pending ? t("auth.resetSaving") : t("auth.resetSubmit")}
      </Button>
    </form>
  );
}
