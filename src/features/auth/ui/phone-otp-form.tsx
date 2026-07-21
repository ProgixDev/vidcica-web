"use client";

import { useReducer, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/redirect";
import { OtpSchema, PhoneSchema } from "../schema";
import { initialOtpState, otpReducer } from "../otp-flow";

/**
 * Phone-OTP sign-in — the same identity users have on mobile (Supabase
 * signInWithOtp / verifyOtp over SMS). Two steps: request a code, then verify.
 */
export function PhoneOtpForm() {
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next"), "/dashboard");
  const [state, dispatch] = useReducer(otpReducer, initialOtpState);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    const parsed = PhoneSchema.safeParse({ phone });
    if (!parsed.success) {
      dispatch({
        type: "requestErr",
        message: parsed.error.issues[0]?.message ?? "Numéro invalide",
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
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    const parsed = OtpSchema.safeParse({ code });
    if (!parsed.success) {
      dispatch({ type: "verifyErr", message: parsed.error.issues[0]?.message ?? "Code invalide" });
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
          <Label htmlFor="otp-phone">Numéro de téléphone</Label>
          <Input
            id="otp-phone"
            type="tel"
            inputMode="tel"
            placeholder="+33 6 12 34 56 78"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-label="Numéro de téléphone"
            className="bg-foreground/5 h-10"
          />
        </div>
        {state.error ? (
          <p role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={state.pending}>
          {state.pending ? "Envoi…" : "Recevoir un code"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="flex w-full max-w-sm flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Code envoyé au {state.phone}.{" "}
        <button
          type="button"
          className="text-foreground underline underline-offset-2"
          onClick={() => dispatch({ type: "editPhone" })}
        >
          Modifier
        </button>
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otp-code">Code à 6 chiffres</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Code à 6 chiffres"
          className="bg-foreground/5 h-10"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={state.pending}>
        {state.pending ? "Vérification…" : "Se connecter"}
      </Button>
    </form>
  );
}
