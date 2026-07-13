"use client";

import { Button } from "@/components/ui/button";
import { useLeadsStore } from "../provider";

/** Exports the given leads to CSV (real download) + logs an export interaction. */
export function ExportButton({ ids, disabled }: { ids: string[]; disabled?: boolean }) {
  const exportLeads = useLeadsStore((s) => s.exportLeads);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportLeads(ids)}
      disabled={disabled || ids.length === 0}
      data-testid="export-leads"
    >
      Exporter{ids.length > 0 ? ` (${ids.length})` : ""}
    </Button>
  );
}
