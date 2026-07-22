"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { signOut, deleteAccount } from "../actions";

/**
 * Sign-out + the required account-deletion path. Deletion is irreversible, so it
 * is confirmed first and runs as a server action (service-role admin delete).
 */
export function AccountActions() {
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(() => signOut())}
      >
        {t("auth.signOut")}
      </Button>
      <Button
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (window.confirm(t("auth.deleteAccountConfirm"))) {
            startTransition(() => {
              void deleteAccount();
            });
          }
        }}
      >
        {t("auth.deleteAccount")}
      </Button>
      <p className="text-muted-foreground text-sm">{t("auth.deleteAccountHint")}</p>
    </div>
  );
}
