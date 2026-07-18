import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { listMyCampaigns } from "@/lib/vidcica/ads-queries";
import { CampaignList } from "@/features/ads";
import { PageHeader } from "@/components/app-shell";

export const metadata = { title: "Publicités" };
export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/ads");

  const campaigns = await listMyCampaigns();

  return (
    <>
      <PageHeader
        title="Publicités"
        subtitle="Transformez vos vidéos en campagnes Facebook et Instagram et suivez leurs performances."
        actions={
          <Link
            href="/ads/new"
            className={buttonVariants({ size: "sm", className: "rounded-full" })}
          >
            Booster une vidéo
          </Link>
        }
      />
      <div className="w-full max-w-3xl">
        <CampaignList userId={user.id} initial={campaigns} />
      </div>
    </>
  );
}
