"use client";

import { Badge } from "@/components/ui/badge";
import { useT, useLocale } from "@/lib/i18n/provider";
import { TICKET_STATUS_META, type SupportTicket } from "@/lib/vidcica/support-ticket";

/** Read-only history of the user's past support tickets (real RLS-scoped data). */
export function TicketHistory({ tickets }: { tickets: SupportTicket[] }) {
  const t = useT();
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-4" data-testid="ticket-history">
      <h3 className="text-xl font-semibold">{t("help.tickets.title")}</h3>
      {tickets.length === 0 ? (
        <div className="bg-card rounded-lg p-6">
          <p className="text-[15px] font-semibold">{t("help.tickets.empty.title")}</p>
          <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
            {t("help.tickets.empty.body")}
          </p>
        </div>
      ) : (
        <div className="divide-border flex flex-col divide-y">
          {tickets.map((ticket) => {
            const meta = TICKET_STATUS_META[ticket.status];
            return (
              <div
                key={ticket.id}
                className="flex min-h-14 items-start gap-4 py-4"
                data-testid={`ticket-${ticket.id}`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] leading-snug font-semibold">
                    {ticket.subject}
                  </span>
                  <span className="text-muted-foreground line-clamp-2 text-[13px] leading-relaxed">
                    {ticket.message}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge variant={meta.variant === "brand" ? "muted" : meta.variant}>
                    {t(meta.labelKey)}
                  </Badge>
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
