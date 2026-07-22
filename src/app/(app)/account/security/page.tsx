import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { ChangeEmailForm, ChangePhoneForm } from "@/features/account-security";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("security.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account/security");

  const t = await getT();
  const currentPhone = user.phone && user.phone.trim().length > 0 ? user.phone : null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <PageHeader
        title={t("security.title")}
        subtitle={t("security.subtitle")}
        actions={
          <Link href="/account" className="text-muted-foreground hover:text-foreground text-sm">
            ← {t("common.back")}
          </Link>
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("security.section.email")}
        </h2>
        <Card className="rounded-2xl p-5">
          <ChangeEmailForm currentEmail={user.email ?? ""} />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("security.section.phone")}
        </h2>
        <Card className="rounded-2xl p-5">
          <ChangePhoneForm currentPhone={currentPhone} />
        </Card>
      </section>
    </div>
  );
}
