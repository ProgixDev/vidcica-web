"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/provider";

// Route error boundary (AC-15 error state): plain-language message + recovery.
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="flex min-h-[60dvh] w-full flex-1 items-center justify-center">
      <EmptyState
        title={t("dashboard.errorTitle")}
        description={t("dashboard.errorDescription")}
        action={<Button onClick={reset}>{t("common.retry")}</Button>}
      />
    </div>
  );
}
