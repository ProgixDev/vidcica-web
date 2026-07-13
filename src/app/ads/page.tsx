import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { listMyCampaigns } from "@/lib/vidcica/ads-queries";
import { CampaignList } from "@/features/ads";

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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Publicités</h1>
        <Link href="/ads/new" className={buttonVariants({ size: "sm" })}>
          Booster une vidéo
        </Link>
      </header>
      <p className="text-muted-foreground text-sm">
        Transformez vos vidéos en campagnes Facebook et Instagram et suivez leurs performances.
      </p>
      <CampaignList userId={user.id} initial={campaigns} />
    </main>
  );
}
