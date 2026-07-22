"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import { ForgotPasswordSchema } from "../schema";

/**
 * Password-recovery request — mirrors the mobile forgot-password screen.
 * `resetPasswordForEmail` sends a link back to `/reset-password` (browser
 * client, so the PKCE code_verifier lives in this browser's storage). On
 * success we swap to an honest "check your inbox" state with a resend.
 */
export function ForgotPasswordForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function sendReset(target: string) {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;
    return supabase.auth.resetPasswordForEmail(target, { redirectTo });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.errInvalidEmail"));
      return;
    }
    setError(null);
    setPending(true);
    const { error: resetError } = await sendReset(parsed.data.email);
    setPending(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <div
        className="flex w-full max-w-sm flex-col items-center gap-4 text-center"
        data-testid="forgot-password-sent"
      >
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="m4 8 8 5 8-5M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">{t("auth.forgotSentTitle")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("auth.forgotSentBody", { email: sentTo })}
          </p>
          <p className="text-muted-foreground text-xs">{t("auth.forgotCheckSpam")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="rounded-full"
          disabled={pending}
          data-testid="forgot-password-resend"
          onClick={async () => {
            setPending(true);
            await sendReset(sentTo);
            setPending(false);
          }}
        >
          {pending ? t("common.sending") : t("auth.forgotResend")}
        </Button>
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
        >
          {t("auth.forgotBackToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-lg font-semibold tracking-tight">{t("auth.forgotTitle")}</h2>
        <p className="text-muted-foreground text-xs">{t("auth.forgotSubtitle")}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forgot-email">{t("auth.emailLabel")}</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-foreground/5 h-10"
          data-testid="forgot-password-email"
        />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="rounded-full"
        data-testid="forgot-password-submit"
      >
        {pending ? t("common.sending") : t("auth.forgotSubmit")}
      </Button>
      <Link
        href="/sign-in"
        className="text-muted-foreground hover:text-foreground text-center text-xs underline underline-offset-2"
      >
        {t("common.back")}
      </Link>
    </form>
  );
}
