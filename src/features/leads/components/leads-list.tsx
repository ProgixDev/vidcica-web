"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LEAD_SCORE_KEY,
  LEAD_STATUS_KEY,
  SCORE_META,
  STATUS_META,
  type Lead,
} from "@/lib/vidcica/lead";
import { useT } from "@/lib/i18n/provider";
import { useLeadsStore } from "../provider";
import { ExportButton } from "./export-button";

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

/** The leads CRM list — realtime-seeded, selectable, exportable. Honest empty
 *  state (leads are captured automatically once lead campaigns run). */
export function LeadsList() {
  const t = useT();
  const items = useLeadsStore((s) => s.items);
  const newCount = useLeadsStore((s) => s.newCount());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

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

  const exportIds = selected.size > 0 ? [...selected] : items.map((l) => l.id);

  return (
    <div className="flex flex-col gap-4" data-testid="leads-list">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-sm">
          {items.length > 1
            ? t("leads.countPlural", { count: items.length })
            : t("leads.countSingular", { count: items.length })}
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
      <div className="flex flex-col gap-3">
        {items.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            selected={selected.has(lead.id)}
            onToggle={(on) => toggle(lead.id, on)}
          />
        ))}
      </div>
    </div>
  );
}
