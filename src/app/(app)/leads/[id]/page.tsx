import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyLead } from "@/lib/vidcica/leads-queries";
import { LeadDetail, LeadsStoreProvider } from "@/features/leads";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/leads/${id}`);

  const lead = await getMyLead(id);
  if (!lead) notFound();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Link href="/leads" className="text-muted-foreground hover:text-foreground text-sm">
        {t("leads.backToLeads")}
      </Link>
      <LeadsStoreProvider userId={user.id} initial={[lead]}>
        <LeadDetail id={id} fallback={lead} />
      </LeadsStoreProvider>
    </div>
  );
}
