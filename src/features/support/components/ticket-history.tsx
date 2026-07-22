"use client";

import { Badge } from "@/components/ui/badge";
import { useT, useLocale } from "@/lib/i18n/provider";
import { TICKET_STATUS_META, type SupportTicket } from "@/lib/vidcica/support-ticket";

/** Read-only history of the user's past support tickets (real RLS-scoped data). */
export function TicketHistory({ tickets }: { tickets: SupportTicket[] }) {
  const t = useT();
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-2" data-testid="ticket-history">
      <h3 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
        {t("help.tickets.title")}
      </h3>
      {tickets.length === 0 ? (
        <div className="bg-card rounded-2xl border px-4 py-5">
          <p className="text-sm font-medium">{t("help.tickets.empty.title")}</p>
          <p className="text-muted-foreground mt-1 text-xs">{t("help.tickets.empty.body")}</p>
        </div>
      ) : (
        <div className="bg-card divide-border/60 flex flex-col divide-y rounded-2xl border">
          {tickets.map((ticket) => {
            const meta = TICKET_STATUS_META[ticket.status];
            return (
              <div
                key={ticket.id}
                className="flex items-start gap-3 px-4 py-3"
                data-testid={`ticket-${ticket.id}`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{ticket.subject}</span>
                  <span className="text-muted-foreground line-clamp-2 text-xs">
                    {ticket.message}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={meta.variant}>{t(meta.labelKey)}</Badge>
                  <span className="text-muted-foreground text-xs">
                    {new Date(ticket.updatedAt).toLocaleDateString(
                      locale === "en" ? "en-US" : "fr-FR",
                      { day: "2-digit", month: "short" },
                    )}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
