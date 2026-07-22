import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { SupportTabs } from "@/features/support";
import { listMyTickets } from "@/lib/vidcica/support-queries";
import { PageHeader } from "@/components/app-shell";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("support.metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/support");

  const [t, tickets] = await Promise.all([getT(), listMyTickets()]);

  return (
    <>
      <PageHeader title={t("support.title")} subtitle={t("support.subtitle")} />
      <div className="w-full max-w-3xl">
        <SupportTabs tickets={tickets} />
      </div>
    </>
  );
}
