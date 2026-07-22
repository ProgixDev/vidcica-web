"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/provider";
import { signOut, deleteAccount } from "../actions";

/**
 * Sign-out + the required account-deletion path. Deletion is irreversible, so it
 * is gated behind a typed-word confirmation (the user must type the localized
 * SUPPRIMER/DELETE keyword) before the destructive action runs as a server
 * action (service-role admin delete).
 */
export function AccountActions() {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [word, setWord] = useState("");

  const keyword = t("auth.deleteConfirmWord");
  const matches = word.trim().toUpperCase() === keyword.toUpperCase();

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(() => signOut())}
        data-testid="account-sign-out"
      >
        {t("auth.signOut")}
      </Button>

      {confirming ? (
        <div className="border-destructive/40 bg-destructive/5 flex flex-col gap-2 rounded-2xl border p-4">
          <Label htmlFor="delete-confirm">{t("auth.deleteConfirmPrompt", { word: keyword })}</Label>
          <Input
            id="delete-confirm"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={keyword}
            autoComplete="off"
            autoCapitalize="characters"
            aria-label={t("auth.deleteConfirmPrompt", { word: keyword })}
            data-testid="account-delete-input"
            className="bg-foreground/5 h-10"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                setWord("");
              }}
              data-testid="account-delete-cancel"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={pending || !matches}
              onClick={() =>
                startTransition(() => {
                  void deleteAccount();
                })
              }
              data-testid="account-delete-confirm"
            >
              {t("auth.deleteAccount")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => setConfirming(true)}
          data-testid="account-delete"
        >
          {t("auth.deleteAccount")}
        </Button>
      )}

      <p className="text-muted-foreground text-sm">{t("auth.deleteAccountHint")}</p>
    </div>
  );
}
