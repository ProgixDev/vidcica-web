"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/provider";

export default function AdsError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="flex min-h-[50dvh] w-full items-center justify-center">
      <EmptyState
        title={t("ads.error.listTitle")}
        description={t("ads.error.description")}
        action={<Button onClick={reset}>{t("common.retry")}</Button>}
      />
    </div>
  );
}
