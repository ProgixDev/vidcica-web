import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountActions } from "@/features/auth";
import { PageHeader } from "@/components/app-shell";

export const metadata = { title: "Profil" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Defence in depth — middleware already guards /account.
  if (!user) redirect("/sign-in");

  return (
    <>
      <PageHeader title="Profil" subtitle={user.email ?? undefined} />
      <div className="w-full max-w-3xl">
        <AccountActions />
      </div>
    </>
  );
}
