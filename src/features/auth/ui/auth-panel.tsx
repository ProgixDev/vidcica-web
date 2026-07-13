"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SignInForm } from "./sign-in-form";
import { PhoneOtpForm } from "./phone-otp-form";

type Method = "email" | "phone";

/**
 * Sign-in with a method toggle: email + password OR phone + SMS code (the same
 * accounts as mobile). A lightweight segmented control keeps it dependency-free.
 */
export function AuthPanel() {
  const [method, setMethod] = useState<Method>("email");

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
    </div>
  );
}
