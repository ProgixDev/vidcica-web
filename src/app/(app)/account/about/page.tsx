import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { ProfileSection, ProfileLinkRow } from "@/features/profile";

const APP_VERSION = "1.0.0";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("about.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account/about");

  const t = await getT();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-10">
      <PageHeader
        title={t("about.title")}
        actions={
          <Link href="/account" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            ← {t("common.back")}
          </Link>
        }
      />

      {/* App identity */}
      <div className="bg-card flex items-center gap-5 rounded-lg p-6">
        <span
          aria-hidden
          className="bg-primary text-primary-foreground flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold"
        >
          V
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xl font-semibold">Vidcica</h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed">{t("about.tagline")}</p>
          <p className="text-muted-foreground text-[13px]">
            {t("about.version", { version: APP_VERSION })}
          </p>
        </div>
      </div>

      {/* Legal + support links */}
      <ProfileSection title={t("about.sectionLinks")}>
        <ProfileLinkRow href="/support" label={t("about.rowSupport")} testId="about-support-link" />
        <ProfileLinkRow href="/terms" label={t("profile.rowTerms")} testId="about-terms-link" />
        <ProfileLinkRow
          href="/privacy"
          label={t("profile.rowPrivacy")}
          testId="about-privacy-link"
        />
        <ProfileLinkRow
          href="/mentions-legales"
          label={t("profile.rowLegalNotice")}
          testId="about-legal-link"
        />
      </ProfileSection>
    </div>
  );
}
