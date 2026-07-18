"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignInForm } from "./sign-in-form";
import { PhoneOtpForm } from "./phone-otp-form";
import { GoogleButton } from "./google-button";

type Method = "email" | "phone";

/**
 * Sign-in with the same methods as the mobile app: email + password, phone +
 * SMS code, or Google OAuth — all against the same Supabase project, so one
 * account works everywhere.
 */
export function AuthPanel() {
  const [method, setMethod] = useState<Method>("email");
  const oauthFailed = useSearchParams().get("error") === "oauth";

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <div
        role="tablist"
        aria-label="Méthode de connexion"
        className="bg-muted grid grid-cols-2 gap-1 rounded-full p-1"
      >
        {(["email", "phone"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={method === m}
            onClick={() => setMethod(m)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              method === m
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "email" ? "E-mail" : "Téléphone"}
          </button>
        ))}
      </div>
      {method === "email" ? <SignInForm /> : <PhoneOtpForm />}

      {/* Divider + Google — same alternative-provider block as the app */}
      <div className="flex items-center gap-3" aria-hidden>
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          ou
        </span>
        <span className="bg-border h-px flex-1" />
      </div>
      <GoogleButton />
      {oauthFailed ? (
        <p role="alert" className="text-destructive text-center text-sm">
          La connexion Google n’a pas abouti. Réessaie ou utilise l’e-mail.
        </p>
      ) : null}
    </div>
  );
}
