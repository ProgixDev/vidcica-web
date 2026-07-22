"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/provider";

export default function NotificationsError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-2xl items-center justify-center px-6 py-8">
      <EmptyState
        title={t("notifications.errorTitle")}
        description={t("notifications.errorDescription")}
        action={<Button onClick={reset}>{t("common.retry")}</Button>}
      />
    </main>
  );
}
