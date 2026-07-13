"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SCORE_META, STATUS_META, type Lead } from "@/lib/vidcica/lead";
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
  const status = STATUS_META[lead.status];
  const score = SCORE_META[lead.scoreBucket];
  return (
    <Card className="flex items-center gap-3 p-4" data-testid={`lead-${lead.id}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={`Sélectionner ${lead.firstName} ${lead.lastName}`}
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
          <Badge variant={score.variant}>{score.label}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </Link>
    </Card>
  );
}

/** The leads CRM list — realtime-seeded, selectable, exportable. Honest empty
 *  state (leads are captured automatically once lead campaigns run). */
export function LeadsList() {
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
          title="Aucun prospect pour le moment"
          description="Les prospects issus de vos campagnes à formulaire apparaîtront ici automatiquement, dès leur première soumission."
        />
      </div>
    );
  }

  const exportIds = selected.size > 0 ? [...selected] : items.map((l) => l.id);

  return (
    <div className="flex flex-col gap-4" data-testid="leads-list">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-sm">
          {items.length} prospect{items.length > 1 ? "s" : ""}
          {newCount > 0 ? (
            <Badge variant="brand" className="ml-2" data-testid="leads-new-badge">
              {newCount} nouveau{newCount > 1 ? "x" : ""}
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
