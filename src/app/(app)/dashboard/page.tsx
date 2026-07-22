import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { isReady, isRendering } from "@/lib/vidcica/video";
import { VideoList } from "@/features/videos";
import { CreateStoreProvider, CreateFlow } from "@/features/create";
import { getT } from "@/lib/i18n/server";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("dashboard.metaTitle") };
}

// Reads run per-request against the RLS-scoped session (no static cache).
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

/** First name for the greeting — OAuth profile name only (an email prefix like
 *  «chaine100informatique» reads badly, so plain «Bonjour 👋» beats it). */
function firstName(meta: Record<string, unknown>): string | null {
  const full = typeof meta.full_name === "string" ? meta.full_name : undefined;
  const name = full ?? (typeof meta.name === "string" ? meta.name : undefined);
  return name?.split(" ")[0] ?? null;
}

/** Videos created in the last 7 days (server-rendered per request). */
function countThisWeek(videos: { createdAt: string }[]): number {
  const weekAgo = Date.now() - 7 * DAY_MS;
  return videos.filter((v) => {
    const t = new Date(v.createdAt).getTime();
    return Number.isFinite(t) && t >= weekAgo;
  }).length;
}

/**
 * Two RLS-scoped count queries — this rolling 7-day window vs the previous one —
 * for the week-over-week delta on the "this week" tile. Counts only (head:true),
 * so no rows travel; RLS restricts them to `user_id = auth.uid()`.
 */
async function weekOverWeek(): Promise<{ current: number; previous: number }> {
  const supabase = await createClient();
  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY_MS).toISOString();
  const twoWeeksAgo = new Date(now - 14 * DAY_MS).toISOString();

  const [cur, prev] = await Promise.all([
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", weekAgo),
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", twoWeeksAgo)
      .lt("created_at", weekAgo),
  ]);

  return { current: cur.count ?? 0, previous: prev.count ?? 0 };
}

export default async function DashboardPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const [videos, entitlement, wow] = await Promise.all([
    listMyVideos(),
    getMyEntitlement(),
    weekOverWeek(),
  ]);
  const name = firstName(user.user_metadata ?? {});
  const ready = videos.filter((v) => isReady(v)).length;
  const rendering = videos.filter((v) => isRendering(v.status)).length;
  const thisWeek = countThisWeek(videos);
  const drafts = videos.filter((v) => v.status === "brouillon").slice(0, 6);

  // Week-over-week delta %: honest "—" when there is nothing to compare against
  // (a fresh account shouldn't show a fabricated «+0 %»).
  const deltaPct =
    wow.previous > 0 ? Math.round(((wow.current - wow.previous) / wow.previous) * 100) : null;
  const deltaUp = deltaPct !== null && deltaPct >= 0;

  const quickActions = [
    { href: "/create", label: t("dashboard.qaCreate"), icon: IconCreate, testId: "qa-create" },
    {
      href: "/networks",
      label: t("dashboard.qaConnect"),
      icon: IconConnect,
      testId: "qa-connect",
    },
    { href: "/ads", label: t("dashboard.qaBoost"), icon: IconBoost, testId: "qa-boost" },
    {
      href: "/analytics",
      label: t("dashboard.qaAnalytics"),
      icon: IconAnalytics,
      testId: "qa-analytics",
    },
  ] as const;

  return (
    <>
      {/* Hero — the app's home: greeting + the FULL PromptComposer in place
          (submits to plan review right here, then routes to the video). */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {name ? t("dashboard.greeting", { name }) : t("dashboard.greetingNoName")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("dashboard.subtitle")}</p>
        </div>
        <CreateStoreProvider>
          <CreateFlow credits={entitlement.credits} plan={entitlement.plan} />
        </CreateStoreProvider>
      </section>

      {/* Quick actions — compact chips into the core journeys. */}
      <nav aria-label={t("dashboard.quickActionsLabel")} className="flex flex-wrap gap-2">
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            data-testid={a.testId}
            className="border-border bg-card hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors"
          >
            <a.icon />
            {a.label}
          </Link>
        ))}
      </nav>

      {/* Quick stats */}
      <section
        aria-label={t("dashboard.statsLabel")}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { value: String(videos.length), label: t("dashboard.statTotal"), delta: false },
          { value: String(ready), label: t("dashboard.statReady"), delta: false },
          { value: String(rendering), label: t("dashboard.statRendering"), delta: false },
          { value: `+${thisWeek}`, label: t("dashboard.statThisWeek"), delta: true },
        ].map((s) => (
          <div
            key={s.label}
            className="border-border bg-card flex flex-col gap-0.5 rounded-md border p-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight">{s.value}</span>
              {s.delta &&
                (deltaPct !== null ? (
                  <span
                    aria-label={t("dashboard.deltaLabel")}
                    className={cn(
                      "text-xs font-medium",
                      deltaUp ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    {deltaUp ? "▲" : "▼"} {Math.abs(deltaPct)}%
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                ))}
            </div>
            <span className="text-muted-foreground text-xs">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Recent drafts — unfinished videos, one tap back into editing.
          Hidden entirely when there are none (no wasted empty state). */}
      {drafts.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="drafts-h">
          <h2 id="drafts-h" className="text-base font-semibold tracking-tight">
            {t("dashboard.draftsTitle")}
          </h2>
          <ul className="flex flex-col gap-2">
            {drafts.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/videos/${d.id}`}
                  data-testid={`draft-row-${d.id}`}
                  className="border-border bg-card hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors"
                >
                  <span className="truncate text-sm font-medium">{d.title}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDate(new Date(d.updatedAt))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent videos */}
      <section className="flex flex-col gap-4" aria-labelledby="recent-h">
        <div className="flex items-center justify-between">
          <h2 id="recent-h" className="text-base font-semibold tracking-tight">
            {t("dashboard.recentTitle")}
          </h2>
          <Link href="/videos" className="text-muted-foreground hover:text-foreground text-sm">
            {t("common.seeAll")} →
          </Link>
        </div>
        <VideoList userId={user.id} initial={videos.slice(0, 8)} />
      </section>
    </>
  );
}

/* Inline chip glyphs — currentColor, no icon dep, decorative (aria-hidden). */
const svgProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconCreate() {
  return (
    <svg {...svgProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconConnect() {
  return (
    <svg {...svgProps}>
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}
function IconBoost() {
  return (
    <svg {...svgProps}>
      <path d="M4.5 16.5 3 21l4.5-1.5" />
      <path d="M14 5c3 0 5 2 5 5 0 4-4 8-9 9-1-2-1-3-2-4s-2-1-4-2c1-5 5-9 9-9 .3 0 .7 0 1 .1" />
      <circle cx="15" cy="9" r="1.5" />
    </svg>
  );
}
function IconAnalytics() {
  return (
    <svg {...svgProps}>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 5-6" />
    </svg>
  );
}
