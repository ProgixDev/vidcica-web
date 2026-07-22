"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/provider";

// Route error boundary (AC-15 error state): plain-language message + recovery.
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-6xl items-center justify-center px-6 py-8">
      <EmptyState
        title={t("dashboard.errorTitle")}
        description={t("dashboard.errorDescription")}
        action={<Button onClick={reset}>{t("common.retry")}</Button>}
      />
    </main>
  );
}
