"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  LEAD_SCORE_KEY,
  LEAD_STATUS_KEY,
  STATUS_META,
  STATUS_ORDER,
  type Lead,
  type LeadStatus,
} from "@/lib/vidcica/lead";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLeadsStore } from "../provider";
import { ExportButton } from "./export-button";

/** Status filter value — every LeadStatus plus an "all" pass-through. */
type StatusFilter = "all" | LeadStatus;
type PeriodFilter = "all" | "24h" | "7d" | "30d";

const PERIOD_TO_MS: Record<PeriodFilter, number | null> = {
  all: null,
  "24h": 24 * 3600 * 1000,
  "7d": 7 * 24 * 3600 * 1000,
  "30d": 30 * 24 * 3600 * 1000,
};

/** Cutoff timestamp for a period, or null for "all". `Date.now()` lives at module
 *  scope so the react-compiler purity rule doesn't flag it inside render. */
function periodCutoff(period: PeriodFilter): number | null {
  const ms = PERIOD_TO_MS[period];
  return ms === null ? null : Date.now() - ms;
}

const PERIOD_OPTIONS: { value: PeriodFilter; label: MessageKey }[] = [
  { value: "all", label: "leads.period.all" },
  { value: "24h", label: "leads.period.24h" },
  { value: "7d", label: "leads.period.7d" },
  { value: "30d", label: "leads.period.30d" },
];

function LeadCard({
  lead,
  selected,
  onToggle,
}: {
  lead: Lead;
  selected: boolean;
  onToggle: (on: boolean) => void;
}) {
  const t = useT();
  const status = STATUS_META[lead.status];
  return (
    <li
      className="hover:bg-accent flex min-h-16 items-center gap-4 pl-5 transition-colors"
      data-testid={`lead-${lead.id}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={t("leads.selectLead", { name: `${lead.firstName} ${lead.lastName}` })}
        data-testid={`lead-select-${lead.id}`}
        className="accent-primary size-4 shrink-0 cursor-pointer"
      />
      <Link
        href={`/leads/${lead.id}`}
        className="focus-visible:ring-ring flex min-w-0 flex-1 items-center justify-between gap-4 self-stretch py-3 pr-5 outline-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold">
            {lead.firstName} {lead.lastName}
          </span>
          <span className="text-muted-foreground truncate text-[13px]">
            {t(LEAD_SCORE_KEY[lead.scoreBucket])} · {lead.campaignName}
          </span>
        </span>
        <Badge variant={status.variant} className="shrink-0">
          {t(LEAD_STATUS_KEY[lead.status])}
        </Badge>
      </Link>
    </li>
  );
}

const SEGMENT_FOCUS = "focus-visible:ring-ring outline-none focus-visible:ring-2";

/** Chip toggle for the status filter row — the selected chip is the ink pill. */
function FilterPill({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        SEGMENT_FOCUS,
        "focus-visible:ring-offset-background inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold transition-colors focus-visible:ring-offset-2",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

/** One segment of the pale period control (same look as the analytics range). */
function Segment({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        SEGMENT_FOCUS,
        "inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors",
        active ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** The leads CRM list — realtime-seeded, searchable + filterable, selectable,
 *  exportable. Search (name/email/phone/company/city) + status + period run purely
 *  client-side over the live list. Honest empty states for both a truly empty
 *  account and a filtered-to-nothing view. */
export function LeadsList() {
  const t = useT();
  const items = useLeadsStore((s) => s.items);
  const newCount = useLeadsStore((s) => s.newCount());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let list = items;
    if (status !== "all") list = list.filter((l) => l.status === status);
    const cutoff = periodCutoff(period);
    if (cutoff !== null) {
      list = list.filter((l) => new Date(l.capturedAt).getTime() >= cutoff);
    }
    const q = deferredSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((l) => {
        const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
        return (
          fullName.includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.campaignName.toLowerCase().includes(q) ||
          (l.city ?? "").toLowerCase().includes(q)
        );
      });
    }
    return [...list].sort(
      (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
    );
  }, [items, status, period, deferredSearch]);

  // Truly empty account (no leads captured yet) — the honest onboarding state.
  if (items.length === 0) {
    return (
      <div data-testid="leads-empty">
        <EmptyState
          className="py-16"
          title={t("leads.emptyTitle")}
          description={t("leads.emptyDescription")}
        />
      </div>
    );
  }

  const exportIds = selected.size > 0 ? [...selected] : filtered.map((l) => l.id);

  const statusOptions: StatusFilter[] = ["all", ...STATUS_ORDER];

  return (
    <div className="flex flex-col gap-6" data-testid="leads-list">
      {/* Search + the one action of this list */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("leads.searchPlaceholder")}
          aria-label={t("leads.searchPlaceholder")}
          data-testid="leads-search"
          className="min-w-0 flex-1 basis-60"
        />
        <ExportButton ids={exportIds} />
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("leads.filterStatusAria")}>
        {statusOptions.map((s) => (
          <FilterPill
            key={s}
            active={status === s}
            onClick={() => setStatus(s)}
            testId={`leads-status-filter-${s}`}
          >
            {s === "all" ? t("leads.filterAll") : t(LEAD_STATUS_KEY[s])}
          </FilterPill>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-muted-foreground flex items-center gap-2 text-[13px]">
          {filtered.length > 1
            ? t("leads.countPlural", { count: filtered.length })
            : t("leads.countSingular", { count: filtered.length })}
          {newCount > 0 ? (
            <Badge variant="muted" data-testid="leads-new-badge">
              {newCount > 1
                ? t("leads.newCountPlural", { count: newCount })
                : t("leads.newCountSingular", { count: newCount })}
            </Badge>
          ) : null}
        </span>

        {/* Period — a pale segmented control */}
        <div
          className="bg-secondary inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1"
          role="tablist"
          aria-label={t("leads.filterPeriodAria")}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <Segment
              key={opt.value}
              active={period === opt.value}
              onClick={() => setPeriod(opt.value)}
              testId={`leads-period-filter-${opt.value}`}
            >
              {t(opt.label)}
            </Segment>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div data-testid="leads-no-results">
          <EmptyState
            className="py-12"
            title={t("leads.noResultsTitle")}
            description={t("leads.noResultsDescription")}
          />
        </div>
      ) : (
        <ul className="bg-card divide-border flex flex-col divide-y overflow-hidden rounded-lg">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              selected={selected.has(lead.id)}
              onToggle={(on) => toggle(lead.id, on)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
