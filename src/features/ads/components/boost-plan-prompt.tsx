"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/provider";

/**
 * Shown instead of the Boost wizard on plans without Boost (Free, Starter).
 * The server refuses a launch or an activation on those plans anyway
 * (`plan_required`), so saying it first spares five steps for nothing.
 */
export function BoostPlanPrompt() {
  const t = useT();
  return (
    <EmptyState
      className="py-16"
      title={t("ads.plan.title")}
      description={t("ads.plan.description")}
      action={
        <Link href="/billing" className={buttonVariants()} data-testid="boost-plan-upgrade">
          {t("ads.plan.cta")}
        </Link>
      }
    />
  );
}
