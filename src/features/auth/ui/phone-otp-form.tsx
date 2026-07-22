"use client";

import { useEffect, useReducer, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/redirect";
import { useT } from "@/lib/i18n/provider";
import { OtpSchema, PhoneSchema } from "../schema";
import { initialOtpState, otpReducer } from "../otp-flow";

/** Small hardcoded list of common dial codes (id keeps +1 entries distinct). */
const COUNTRIES = [
  { id: "FR", dial: "+33", label: "🇫🇷 France +33" },
  { id: "BE", dial: "+32", label: "🇧🇪 Belgique +32" },
  { id: "CH", dial: "+41", label: "🇨🇭 Suisse +41" },
  { id: "CA", dial: "+1", label: "🇨🇦 Canada +1" },
  { id: "US", dial: "+1", label: "🇺🇸 USA +1" },
  { id: "GB", dial: "+44", label: "🇬🇧 UK +44" },
  { id: "DE", dial: "+49", label: "🇩🇪 Allemagne +49" },
  { id: "ES", dial: "+34", label: "🇪🇸 Espagne +34" },
  { id: "IT", dial: "+39", label: "🇮🇹 Italie +39" },
  { id: "MA", dial: "+212", label: "🇲🇦 Maroc +212" },
  { id: "TN", dial: "+216", label: "🇹🇳 Tunisie +216" },
  { id: "DZ", dial: "+213", label: "🇩🇿 Algérie +213" },
] as const;

const RESEND_COOLDOWN_SECONDS = 30;

/** Compose an E.164 number from a dial code + the national part the user typed. */
function toE164(dial: string, national: string): string {
  const digits = national.replace(/\D/g, "").replace(/^0+/, "");
  return `${dial}${digits}`;
}

/**
 * Phone-OTP sign-in — the same identity users have on mobile (Supabase
 * signInWithOtp / verifyOtp over SMS). Two steps: request a code, then verify.
 */
export function PhoneOtpForm() {
  const t = useT();
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next"), "/dashboard");
  const [state, dispatch] = useReducer(otpReducer, initialOtpState);
  const [dial, setDial] = useState<string>(COUNTRIES[0].dial);
  const [national, setNational] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Tick the resend cooldown down to zero once per second while it is active.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    const parsed = PhoneSchema.safeParse({ phone: toE164(dial, national) });
    if (!parsed.success) {
      dispatch({
        type: "requestErr",
        message: parsed.error.issues[0]?.message ?? t("auth.errInvalidPhone"),
      });
      return;
    }
    dispatch({ type: "requestStart", phone: parsed.data.phone });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: parsed.data.phone });
    if (error) {
      dispatch({ type: "requestErr", message: error.message });
      return;
    }
    dispatch({ type: "requestOk" });
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function resendCode() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: state.phone });
    setResending(false);
    if (error) {
      dispatch({ type: "verifyErr", message: error.message });
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    const parsed = OtpSchema.safeParse({ code });
    if (!parsed.success) {
      dispatch({
        type: "verifyErr",
        message: parsed.error.issues[0]?.message ?? t("auth.errInvalidCode"),
      });
      return;
    }
    dispatch({ type: "verifyStart" });
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: state.phone,
      token: parsed.data.code,
      type: "sms",
    });
    if (error) {
      dispatch({ type: "verifyErr", message: error.message });
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (state.step === "phone") {
    return (
      <form onSubmit={requestCode} className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="otp-phone">{t("auth.phoneLabel")}</Label>
          <div className="flex gap-2">
            <Select
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              aria-label={t("auth.countryLabel")}
              data-testid="otp-country"
              className="h-10 w-auto max-w-[10rem] flex-none"
            >
              {COUNTRIES.map((c) => (
                <option key={c.id} value={c.dial}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Input
              id="otp-phone"
              type="tel"
              inputMode="tel"
              placeholder="6 12 34 56 78"
              autoComplete="tel-national"
              value={national}
              onChange={(e) => setNational(e.target.value)}
              aria-label={t("auth.phoneLabel")}
              data-testid="otp-phone"
              className="bg-foreground/5 h-10 flex-1"
            />
          </div>
        </div>
        {state.error ? (
          <p role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={state.pending} data-testid="otp-request">
          {state.pending ? t("auth.sendingCode") : t("auth.requestCode")}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="flex w-full max-w-sm flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        {t("auth.codeSentTo", { phone: state.phone })}{" "}
        <button
          type="button"
          className="text-foreground underline underline-offset-2"
          onClick={() => dispatch({ type: "editPhone" })}
          data-testid="otp-edit-phone"
        >
          {t("auth.editPhone")}
        </button>
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otp-code">{t("auth.codeLabel")}</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label={t("auth.codeLabel")}
          data-testid="otp-code"
          className="bg-foreground/5 h-10"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={state.pending} data-testid="otp-verify">
        {state.pending ? t("auth.verifying") : t("auth.signInAction")}
      </Button>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-70"
        onClick={resendCode}
        disabled={cooldown > 0 || resending}
        data-testid="otp-resend"
      >
        {resending
          ? t("auth.sendingCode")
          : cooldown > 0
            ? t("auth.resendIn", { n: String(cooldown) })
            : t("auth.resendCode")}
      </button>
    </form>
  );
}
