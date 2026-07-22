import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { getMyProfile } from "@/lib/vidcica/profile-queries";
import { PageHeader } from "@/components/app-shell";
import { EditProfileForm } from "@/features/profile";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("profile.editTitle") };
}

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account/edit");

  const [profile, t] = await Promise.all([getMyProfile(), getT()]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <PageHeader
        title={t("profile.editTitle")}
        subtitle={t("profile.editSubtitle")}
        actions={
          <Link href="/account" className="text-muted-foreground hover:text-foreground text-sm">
            ← {t("common.back")}
          </Link>
        }
      />
      <EditProfileForm profile={profile} />
    </div>
  );
}
