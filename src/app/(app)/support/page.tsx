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

const TAB_VALUES = ["faq", "guides", "tutorials", "contact", "chat"] as const;

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/support");

  const [t, tickets, params] = await Promise.all([getT(), listMyTickets(), searchParams]);
  // Deep-link a tab, e.g. the Lia bubble's handoff → /support?tab=contact.
  const initialTab = (TAB_VALUES as readonly string[]).includes(params.tab ?? "")
    ? (params.tab as (typeof TAB_VALUES)[number])
    : undefined;

  return (
    <>
      <PageHeader title={t("support.title")} subtitle={t("support.subtitle")} />
      <div className="w-full max-w-3xl">
        <SupportTabs tickets={tickets} initialTab={initialTab} />
      </div>
    </>
  );
}
