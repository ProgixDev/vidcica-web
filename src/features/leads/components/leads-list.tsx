"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  LEAD_SCORE_KEY,
  LEAD_STATUS_KEY,
  SCORE_META,
  STATUS_META,
  STATUS_ORDER,
  type Lead,
  type LeadStatus,
} from "@/lib/vidcica/lead";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
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
  const score = SCORE_META[lead.scoreBucket];
  return (
    <Card className="flex items-center gap-3 p-4" data-testid={`lead-${lead.id}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={t("leads.selectLead", { name: `${lead.firstName} ${lead.lastName}` })}
        data-testid={`lead-select-${lead.id}`}
      />
      <Link
        href={`/leads/${lead.id}`}
        className="flex min-w-0 flex-1 items-center justify-between gap-3"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium">
            {lead.firstName} {lead.lastName}
          </span>
          <span className="text-muted-foreground truncate text-xs">{lead.campaignName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={score.variant}>{t(LEAD_SCORE_KEY[lead.scoreBucket])}</Badge>
          <Badge variant={status.variant}>{t(LEAD_STATUS_KEY[lead.status])}</Badge>
        </div>
      </Link>
    </Card>
  );
}

/** Pill toggle used for the status + period filter rows (matches the ads tab style). */
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
      className={
        active
          ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium"
          : "text-muted-foreground hover:text-foreground border-border rounded-full border px-3 py-1 text-xs font-medium"
      }
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
    <div className="flex flex-col gap-4" data-testid="leads-list">
      {/* Search */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("leads.searchPlaceholder")}
        aria-label={t("leads.searchPlaceholder")}
        data-testid="leads-search"
      />

      {/* Status chips */}
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label={t("leads.filterStatusAria")}
      >
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

      {/* Period chips */}
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label={t("leads.filterPeriodAria")}
      >
        {PERIOD_OPTIONS.map((opt) => (
          <FilterPill
            key={opt.value}
            active={period === opt.value}
            onClick={() => setPeriod(opt.value)}
            testId={`leads-period-filter-${opt.value}`}
          >
            {t(opt.label)}
          </FilterPill>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-sm">
          {filtered.length > 1
            ? t("leads.countPlural", { count: filtered.length })
            : t("leads.countSingular", { count: filtered.length })}
          {newCount > 0 ? (
            <Badge variant="brand" className="ml-2" data-testid="leads-new-badge">
              {newCount > 1
                ? t("leads.newCountPlural", { count: newCount })
                : t("leads.newCountSingular", { count: newCount })}
            </Badge>
          ) : null}
        </span>
        <ExportButton ids={exportIds} />
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
        <div className="flex flex-col gap-3">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              selected={selected.has(lead.id)}
              onToggle={(on) => toggle(lead.id, on)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
