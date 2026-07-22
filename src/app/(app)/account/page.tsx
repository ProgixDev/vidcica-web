import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { AccountActions } from "@/features/auth";
import { PageHeader } from "@/components/app-shell";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("account.metaTitle") };
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Defence in depth — middleware already guards /account.
  if (!user) redirect("/sign-in");

  const t = await getT();

  return (
    <>
      <PageHeader title={t("account.title")} subtitle={user.email ?? undefined} />
      <div className="w-full max-w-3xl">
        <AccountActions />
      </div>
    </>
  );
}
