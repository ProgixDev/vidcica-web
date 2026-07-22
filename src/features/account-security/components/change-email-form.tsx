"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";

const EmailSchema = z.object({ email: z.string().trim().email() });

/**
 * Change the account e-mail. Supabase sends a confirmation link to BOTH the
 * current and the new address; the change only applies once the link in the NEW
 * inbox is clicked — so there is no OTP step here (unlike phone change).
 */
export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = EmailSchema.safeParse({ email });
    if (!parsed.success) {
      setError(t("security.email.errInvalid"));
      return;
    }
    const next = parsed.data.email.toLowerCase();
    if (next === currentEmail.trim().toLowerCase()) {
      setError(t("security.email.errSame"));
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ email: next });
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSentTo(next);
  }

  if (sentTo) {
    return (
      <div
        className="border-success/40 bg-success/10 flex flex-col gap-1.5 rounded-2xl border p-4"
        role="status"
        data-testid="security-email-sent"
      >
        <p className="text-sm font-semibold">{t("security.email.sentTitle")}</p>
        <p className="text-muted-foreground text-sm">
          {t("security.email.sentBody", { email: sentTo })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" data-testid="security-email-form">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sec-current-email">{t("security.email.currentLabel")}</Label>
        <Input id="sec-current-email" value={currentEmail} readOnly disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sec-new-email">{t("security.email.newLabel")}</Label>
        <Input
          id="sec-new-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("security.email.placeholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          data-testid="security-email-input"
        />
      </div>
      <p className="text-muted-foreground text-xs">{t("security.email.note")}</p>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending || email.trim().length === 0}
        className="self-start rounded-full"
        data-testid="security-email-submit"
      >
        {pending ? t("common.sending") : t("security.email.cta")}
      </Button>
    </form>
  );
}
