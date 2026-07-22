"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { useLeadsStore } from "../provider";

/** Exports the given leads to CSV (real download) + logs an export interaction. */
export function ExportButton({ ids, disabled }: { ids: string[]; disabled?: boolean }) {
  const t = useT();
  const exportLeads = useLeadsStore((s) => s.exportLeads);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportLeads(ids)}
      disabled={disabled || ids.length === 0}
      data-testid="export-leads"
    >
      {ids.length > 0 ? t("leads.exportCount", { count: ids.length }) : t("leads.export")}
    </Button>
  );
}
