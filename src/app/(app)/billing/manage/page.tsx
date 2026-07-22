import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { tierDef } from "@/lib/vidcica/tiers";
import { ManagePortalButton } from "@/features/billing";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("billing.manage.metaTitle") };
}
export const dynamic = "force-dynamic";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-success size-3.5"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default async function ManageSubscriptionPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/billing/manage");

  const entitlement = await getMyEntitlement();
  const tier = tierDef(entitlement.plan);
  const isFree = entitlement.plan === "free";

  return (
    <>
      <PageHeader title={t("billing.manage.title")} subtitle={t("billing.manage.subtitle")} />

      <div className="flex w-full max-w-2xl flex-col gap-6">
        {/* Current plan hero — plan name is the headline, price alongside. */}
        <Card className="flex flex-col gap-3 p-5" data-testid="manage-hero">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
            {t("billing.manage.currentLabel")}
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight" data-testid="manage-plan">
              {t(tier.labelKey)}
            </span>
            {tier.priceEUR > 0 ? (
              <span className="text-muted-foreground text-sm">
                {tier.priceEUR} € {t("billing.perMonth")}
              </span>
            ) : (
              <Badge variant="muted">{t("billing.manage.freeBadge")}</Badge>
            )}
          </div>
          {isFree ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("billing.manage.freeBody")}
            </p>
          ) : null}
        </Card>

        {/* Included features — real values from the tier matrix. */}
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
            {t("billing.manage.includedTitle")}
          </h2>
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2.5">
              <span className="bg-success/15 flex size-5 shrink-0 items-center justify-center rounded-full">
                <CheckIcon />
              </span>
              <span className="text-sm">
                {t("billing.manage.creditsPerMonth", { credits: tier.monthlyCredits })}
              </span>
            </div>
            {tier.highlightKeys.map((k) => (
              <div key={k} className="flex items-center gap-2.5">
                <span className="bg-success/15 flex size-5 shrink-0 items-center justify-center rounded-full">
                  <CheckIcon />
                </span>
                <span className="text-sm">{t(k)}</span>
              </div>
            ))}
          </Card>
        </section>

        {/* Invoices & payment — honest: managed in the Stripe portal. */}
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
            {t("billing.manage.invoicesTitle")}
          </h2>
          <Card className="flex flex-col gap-4 p-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {isFree ? t("billing.manage.freeInvoicesNote") : t("billing.manage.invoicesNote")}
            </p>
            {isFree ? (
              <Link
                href="/billing"
                className={cn(buttonVariants(), "w-fit")}
                data-testid="manage-upgrade"
              >
                {t("common.upgrade")}
              </Link>
            ) : (
              <ManagePortalButton />
            )}
          </Card>
        </section>

        <p className="text-muted-foreground px-1 text-center text-xs leading-relaxed">
          {t("billing.manage.footerNote")}
        </p>
      </div>
    </>
  );
}
