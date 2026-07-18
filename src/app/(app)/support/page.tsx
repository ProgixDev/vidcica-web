import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupportTabs } from "@/features/support";
import { PageHeader } from "@/components/app-shell";

export const metadata = { title: "Aide & support" };
export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/support");

  return (
    <>
      <PageHeader
        title="Aide & support"
        subtitle="Une question ? Discute avec Lia ou écris-nous directement."
      />
      <div className="w-full max-w-3xl">
        <SupportTabs />
      </div>
    </>
  );
}
