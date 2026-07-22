import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMyLeads } from "@/lib/vidcica/leads-queries";
import { LeadsList, LeadsStoreProvider } from "@/features/leads";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("leads.metaTitle") };
}

export default async function LeadsPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/leads");

  const leads = await listMyLeads();

  return (
    <>
      <PageHeader
        title={t("leads.title")}
        subtitle={t("leads.subtitle")}
        actions={
          <Link href="/ads" className="text-muted-foreground hover:text-foreground text-sm">
            {t("leads.myAds")}
          </Link>
        }
      />
      <div className="w-full max-w-3xl">
        <LeadsStoreProvider userId={user.id} initial={leads}>
          <LeadsList />
        </LeadsStoreProvider>
      </div>
    </>
  );
}
