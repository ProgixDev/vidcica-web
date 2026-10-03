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
        className="flex w-full max-w-sm flex-col items-center gap-6 text-center"
        data-testid="forgot-password-sent"
      >
        <div className="bg-secondary text-foreground flex size-12 items-center justify-center rounded-full">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="m4 8 8 5 8-5M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.03em]">
            {t("auth.forgotSentTitle")}
          </h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            {t("auth.forgotSentBody", { email: sentTo })}
          </p>
          <p className="text-muted-foreground text-[13px]">{t("auth.forgotCheckSpam")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
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
          className="text-muted-foreground hover:text-foreground text-[13px] underline underline-offset-2"
        >
          {t("auth.forgotBackToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5">
      <div className="mb-3 flex flex-col gap-3">
        <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.03em]">
          {t("auth.forgotTitle")}
        </h2>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          {t("auth.forgotSubtitle")}
        </p>
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
          data-testid="forgot-password-email"
        />
      </div>
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
        data-testid="forgot-password-submit"
      >
        {pending ? t("common.sending") : t("auth.forgotSubmit")}
      </Button>
      <Link
        href="/sign-in"
        className="text-muted-foreground hover:text-foreground text-center text-[13px] underline underline-offset-2"
      >
        {t("common.back")}
      </Link>
    </form>
  );
}
