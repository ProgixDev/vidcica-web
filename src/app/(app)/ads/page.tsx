import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { listMyCampaigns } from "@/lib/vidcica/ads-queries";
import { CampaignList } from "@/features/ads";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("ads.title") };
}
export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/ads");

  const campaigns = await listMyCampaigns();

  return (
    <>
      <PageHeader
        title={t("ads.title")}
        subtitle={t("ads.subtitle")}
        actions={
          <Link
            href="/ads/new"
            className={buttonVariants({ size: "sm", className: "rounded-full" })}
          >
            {t("ads.boostVideo")}
          </Link>
        }
      />
      <div className="w-full max-w-3xl">
        <CampaignList userId={user.id} initial={campaigns} />
      </div>
    </>
  );
}
