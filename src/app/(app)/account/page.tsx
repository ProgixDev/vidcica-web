import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT, getLocale } from "@/lib/i18n/server";
import { getMyProfile } from "@/lib/vidcica/profile-queries";
import { firstName } from "@/lib/vidcica/profile";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { listMyNetworks } from "@/lib/vidcica/networks-queries";
import { tierDef } from "@/lib/vidcica/tiers";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageHeader } from "@/components/app-shell";
import { AccountActions } from "@/features/auth";
import {
  ProfileSection,
  ProfileLinkRow,
  ProfileControlRow,
  MarketingToggle,
} from "@/features/profile";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("account.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [profile, entitlement, networks, t, locale, videosCount] = await Promise.all([
    getMyProfile(),
    getMyEntitlement(),
    listMyNetworks(),
    getT(),
    getLocale(),
    supabase.from("videos").select("*", { count: "exact", head: true }),
  ]);

  const tier = tierDef(entitlement.plan);
  const connectedCount = networks.filter((n) => n.connected).length;
  const videoTotal = videosCount.count ?? 0;
  const name = profile?.displayName?.trim() || firstName(profile, user.email) || (user.email ?? "");
  const initial = (name[0] ?? user.email?.[0] ?? "?").toUpperCase();
  const memberSince = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(profile?.createdAt ?? user.created_at));
  const creditPct =
    tier.monthlyCredits > 0
      ? Math.min(100, Math.round((entitlement.credits / tier.monthlyCredits) * 100))
      : 0;
  const numberFmt = new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader title={t("account.title")} subtitle={user.email ?? undefined} />

      <div className="flex w-full flex-col gap-6">
        {/* Identity */}
        <div className="bg-card flex items-center gap-4 rounded-2xl border p-5">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Supabase avatar
            <img
              src={profile.avatarUrl}
              alt=""
              className="size-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="bg-primary text-primary-foreground flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold"
            >
              {initial}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight">{name}</h2>
              {profile?.niche ? <Badge variant="brand">{profile.niche}</Badge> : null}
            </div>
            <p className="text-muted-foreground truncate text-sm">{user.email}</p>
            <p className="text-muted-foreground text-xs">
              {t("profile.memberSince", { date: memberSince })}
            </p>
          </div>
          <Link
            href="/account/edit"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
            data-testid="edit-profile-link"
          >
            {t("profile.editButton")}
          </Link>
        </div>

        {/* Plan + credits */}
        <div className="bg-card relative overflow-hidden rounded-2xl border p-5">
          <div
            aria-hidden
            className="bg-primary pointer-events-none absolute -top-16 -right-12 size-40 rounded-full opacity-[0.08] blur-2xl"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                {t("profile.planTitle")}
              </p>
              <p className="mt-0.5 text-xl font-semibold tracking-tight">{t(tier.labelKey)}</p>
              <p className="text-muted-foreground text-sm">
                {tier.priceEUR === 0
                  ? t("tiers.free.label")
                  : t("profile.planPriceMonth", { price: tier.priceEUR })}
              </p>
            </div>
            <Link
              href="/billing"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
              data-testid="manage-plan-link"
            >
              {entitlement.plan === "studio" ? t("profile.managePlan") : t("common.upgrade")}
            </Link>
          </div>
          <div className="relative mt-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("profile.creditsLabel")}</span>
              <span className="font-medium tabular-nums">
                {t("profile.creditsOf", {
                  used: numberFmt.format(entitlement.credits),
                  total: numberFmt.format(tier.monthlyCredits),
                })}
              </span>
            </div>
            <Progress value={creditPct} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("profile.statVideos"), value: numberFmt.format(videoTotal) },
            { label: t("profile.statNetworks"), value: numberFmt.format(connectedCount) },
            { label: t("profile.statCredits"), value: numberFmt.format(entitlement.credits) },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border p-4 text-center">
              <p className="text-xl font-semibold tabular-nums">{s.value}</p>
              <p className="text-muted-foreground text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Creator profile (niche / audience / tone) */}
        {profile?.niche || profile?.audience || profile?.preferredTone ? (
          <ProfileSection title={t("profile.sectionCreator")}>
            {profile?.niche ? (
              <ProfileControlRow label={t("profile.nicheLabel")}>
                <span className="text-muted-foreground text-sm">{profile.niche}</span>
              </ProfileControlRow>
            ) : null}
            {profile?.audience ? (
              <ProfileControlRow label={t("profile.audienceLabel")}>
                <span className="text-muted-foreground line-clamp-1 max-w-[16rem] text-right text-sm">
                  {profile.audience}
                </span>
              </ProfileControlRow>
            ) : null}
            {profile?.preferredTone ? (
              <ProfileControlRow label={t("profile.toneLabel")}>
                <span className="text-muted-foreground text-sm capitalize">
                  {profile.preferredTone}
                </span>
              </ProfileControlRow>
            ) : null}
          </ProfileSection>
        ) : null}

        {/* Preferences */}
        <ProfileSection title={t("profile.sectionPreferences")}>
          <ProfileControlRow label={t("profile.rowLanguage")}>
            <LanguageToggle />
          </ProfileControlRow>
          <ProfileControlRow label={t("profile.rowTheme")}>
            <ThemeToggle className="border-border/70 border" />
          </ProfileControlRow>
          <ProfileLinkRow
            href="/notifications"
            label={t("profile.rowNotifications")}
            hint={t("profile.rowNotificationsHint")}
          />
          <ProfileControlRow label={t("profile.rowMarketing")} hint={t("profile.rowMarketingHint")}>
            <MarketingToggle initial={profile?.marketingOptIn ?? false} />
          </ProfileControlRow>
        </ProfileSection>

        {/* Legal */}
        <ProfileSection title={t("profile.sectionLegal")}>
          <ProfileLinkRow href="/terms" label={t("profile.rowTerms")} />
          <ProfileLinkRow href="/privacy" label={t("profile.rowPrivacy")} />
          <ProfileLinkRow href="/mentions-legales" label={t("profile.rowLegalNotice")} />
          <ProfileLinkRow href="/account/about" label={t("profile.rowAbout")} />
        </ProfileSection>

        {/* Session / danger */}
        <ProfileSection title={t("profile.sectionSession")}>
          <ProfileLinkRow
            href="/account/security"
            label={t("security.rowLabel")}
            hint={t("security.rowHint")}
            testId="account-security-link"
          />
          <div className="p-4">
            <AccountActions />
          </div>
        </ProfileSection>
      </div>
    </div>
  );
}
