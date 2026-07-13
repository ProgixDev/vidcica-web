import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyLead } from "@/lib/vidcica/leads-queries";
import { LeadDetail, LeadsStoreProvider } from "@/features/leads";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/leads/${id}`);

  const lead = await getMyLead(id);
  if (!lead) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <Link href="/leads" className="text-muted-foreground hover:text-foreground text-sm">
        ← Mes prospects
      </Link>
      <LeadsStoreProvider userId={user.id} initial={[lead]}>
        <LeadDetail id={id} fallback={lead} />
      </LeadsStoreProvider>
    </main>
  );
}
