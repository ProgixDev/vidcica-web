"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";

// Local copies (features must not import each other — mirrors auth's schema).
const PhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Numéro au format international (+33…)"),
});
const OtpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code contient 6 chiffres"),
});

type Step = "request" | "verify" | "done";

/**
 * Change the account phone number. Supabase phone-change is OTP-based: calling
 * updateUser({ phone }) sends an SMS code, which the user then confirms with
 * verifyOtp({ type: "phone_change" }). Mirrors the two-step request → verify UX
 * of the sign-in phone-otp-form.
 */
export function ChangePhoneForm({ currentPhone }: { currentPhone: string | null }) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function requestChange(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = PhoneSchema.safeParse({ phone });
    if (!parsed.success) {
      setError(t("security.phone.errInvalid"));
      return;
    }
    if (currentPhone && parsed.data.phone === currentPhone.trim()) {
      setError(t("security.phone.errSame"));
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ phone: parsed.data.phone });
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSubmittedPhone(parsed.data.phone);
    setStep("verify");
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = OtpSchema.safeParse({ code });
    if (!parsed.success) {
      setError(t("security.phone.errCode"));
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      phone: submittedPhone,
      token: parsed.data.code,
      type: "phone_change",
    });
    setPending(false);
    if (err) {
      setError(t("security.phone.errCode"));
      return;
    }
    setStep("done");
    router.refresh();
  }

  if (step === "done") {
    return (
      <div
        className="border-success/40 bg-success/10 flex flex-col gap-1.5 rounded-2xl border p-4"
        role="status"
        data-testid="security-phone-done"
      >
        <p className="text-sm font-semibold">{t("security.phone.successTitle")}</p>
        <p className="text-muted-foreground text-sm">
          {t("security.phone.successBody", { phone: submittedPhone })}
        </p>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={verify} className="flex flex-col gap-4" data-testid="security-phone-verify">
        <p className="text-muted-foreground text-sm">
          {t("security.phone.codeSentTo", { phone: submittedPhone })}{" "}
          <button
            type="button"
            className="text-foreground underline underline-offset-2"
            onClick={() => {
              setStep("request");
              setCode("");
              setError(null);
            }}
            data-testid="security-phone-edit"
          >
            {t("security.phone.editPhone")}
          </button>
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sec-phone-code">{t("security.phone.codeLabel")}</Label>
          <Input
            id="sec-phone-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            data-testid="security-phone-code-input"
          />
        </div>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={pending || code.length < 6}
          className="self-start rounded-full"
          data-testid="security-phone-verify-submit"
        >
          {pending ? t("common.sending") : t("security.phone.verifyCta")}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={requestChange}
      className="flex flex-col gap-4"
      data-testid="security-phone-form"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sec-current-phone">{t("security.phone.currentLabel")}</Label>
        <Input
          id="sec-current-phone"
          value={
            currentPhone && currentPhone.trim().length > 0 ? currentPhone : t("security.phone.none")
          }
          readOnly
          disabled
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sec-new-phone">{t("security.phone.newLabel")}</Label>
        <Input
          id="sec-new-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+33 6 12 34 56 78"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          data-testid="security-phone-input"
        />
      </div>
      <p className="text-muted-foreground text-xs">{t("security.phone.note")}</p>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending || phone.trim().length === 0}
        className="self-start rounded-full"
        data-testid="security-phone-submit"
      >
        {pending ? t("common.sending") : t("security.phone.cta")}
      </Button>
    </form>
  );
}
