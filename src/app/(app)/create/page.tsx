import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { CreateStoreProvider, CreateFlow } from "@/features/create";
import { PageHeader } from "@/components/app-shell";

export const metadata = { title: "Créer une vidéo" };
export const dynamic = "force-dynamic";

/** The composer page — accepts a prefill from the dashboard QuickComposer
 *  (`?prompt=…&kind=idea|script`) and seeds the create store with it. */
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string; kind?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/create");

  const [entitlement, params] = await Promise.all([getMyEntitlement(), searchParams]);
  const kind = params.kind === "script" ? "script" : params.kind === "idea" ? "idea" : undefined;
  const prompt = typeof params.prompt === "string" ? params.prompt.slice(0, 5000) : undefined;

  return (
    <>
      <PageHeader
        title="Créer une vidéo"
        subtitle="Décris ton idée ou colle ton script — l’IA s’occupe du montage, de la voix et des sous-titres."
      />
      <CreateStoreProvider initial={{ ...(kind ? { kind } : {}), ...(prompt ? { prompt } : {}) }}>
        <CreateFlow credits={entitlement.credits} />
      </CreateStoreProvider>
    </>
  );
}
