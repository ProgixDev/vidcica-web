import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMyLeads } from "@/lib/vidcica/leads-queries";
import { LeadsList, LeadsStoreProvider } from "@/features/leads";
import { PageHeader } from "@/components/app-shell";

export const metadata = { title: "Prospects" };
export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/leads");

  const leads = await listMyLeads();

  return (
    <>
      <PageHeader
        title="Prospects"
        subtitle="Suivez les prospects captés par vos campagnes et relancez-les au bon moment."
        actions={
          <Link href="/ads" className="text-muted-foreground hover:text-foreground text-sm">
            Mes publicités →
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
