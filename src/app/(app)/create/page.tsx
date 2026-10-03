import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { getMyDraft } from "@/lib/vidcica/queries";
import { CreateStoreProvider, CreateFlow, draftPrefill } from "@/features/create";
import { PageHeader } from "@/components/app-shell";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("create.metaTitle") };
}
export const dynamic = "force-dynamic";

/** The composer page — accepts a prefill from the dashboard QuickComposer
 *  (`?prompt=…&kind=idea|script`) and seeds the create store with it.
 *  `?draft=<id>` continues one of the user's drafts: the composer is seeded
 *  from it and the render reuses its row (see enqueueAction). */
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string; kind?: string; draft?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/create");

  const [t, entitlement, params] = await Promise.all([getT(), getMyEntitlement(), searchParams]);
  const kind = params.kind === "script" ? "script" : params.kind === "idea" ? "idea" : undefined;
  const prompt = typeof params.prompt === "string" ? params.prompt.slice(0, 5000) : undefined;
  // Only the caller's own unrendered draft qualifies (RLS + status check).
  const draft = typeof params.draft === "string" ? await getMyDraft(params.draft) : null;
  const initial: ReturnType<typeof draftPrefill> = draft
    ? draftPrefill(draft)
    : { ...(kind ? { kind } : {}), ...(prompt ? { prompt } : {}) };

  return (
    <>
      <PageHeader title={t("create.headerTitle")} subtitle={t("create.headerSubtitle")} />
      <CreateStoreProvider initial={initial} draftId={draft?.id}>
        <CreateFlow credits={entitlement.credits} plan={entitlement.plan} />
      </CreateStoreProvider>
    </>
  );
}
