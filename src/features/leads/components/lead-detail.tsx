"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  LEAD_SCORE_KEY,
  LEAD_STATUS_KEY,
  SCORE_META,
  STATUS_ORDER,
  type ContactKind,
  type Lead,
} from "@/lib/vidcica/lead";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { useLeadsStore } from "../provider";

const CONTACT_LABEL: Record<ContactKind, MessageKey> = {
  call: "leads.contactCall",
  email: "leads.contactEmail",
  whatsapp: "leads.contactWhatsapp",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

/** Lead detail — contact + score, status pipeline, notes, contact log, timeline.
 *  All mutations are optimistic (store) + written through to the `leads` row. */
export function LeadDetail({ id, fallback }: { id: string; fallback: Lead }) {
  const t = useT();
  const lead = useLeadsStore((s) => s.byId(id)) ?? fallback;
  const setStatus = useLeadsStore((s) => s.setStatus);
  const addNote = useLeadsStore((s) => s.addNote);
  const logContact = useLeadsStore((s) => s.logContact);
  const [note, setNote] = useState("");

  const score = SCORE_META[lead.scoreBucket];
  const timeline = [...lead.interactions].reverse();

  function submitNote() {
    const body = note.trim();
    if (!body) return;
    addNote(lead.id, body);
    setNote("");
  }

  return (
    <div className="flex flex-col gap-6" data-testid="lead-detail">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">
            {lead.firstName} {lead.lastName}
          </h1>
          <p className="text-muted-foreground text-sm">{lead.campaignName}</p>
        </div>
        <Badge variant={score.variant}>{t(LEAD_SCORE_KEY[lead.scoreBucket])}</Badge>
      </header>

      <Card className="flex flex-col gap-1.5 p-4 text-sm">
        <ContactRow
          label={t("leads.fieldEmail")}
          value={lead.email}
          href={`mailto:${lead.email}`}
        />
        <ContactRow label={t("leads.fieldPhone")} value={lead.phone} href={`tel:${lead.phone}`} />
        {lead.city ? <ContactRow label={t("leads.fieldCity")} value={lead.city} /> : null}
        <ContactRow label={t("leads.fieldCapturedAt")} value={fmt(lead.capturedAt)} />
      </Card>

      <section className="flex flex-col gap-2" data-testid="status-pipeline">
        <h2 className="text-sm font-medium">{t("leads.statusHeading")}</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => {
            const active = lead.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(lead.id, s)}
                aria-pressed={active}
                data-testid={`status-${s}`}
                className={
                  active
                    ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium"
                    : "border-input hover:bg-accent rounded-full border px-3 py-1 text-xs"
                }
              >
                {t(LEAD_STATUS_KEY[s])}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{t("leads.contactHeading")}</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CONTACT_LABEL) as ContactKind[]).map((k) => (
            <Button
              key={k}
              variant="outline"
              size="sm"
              onClick={() => logContact(lead.id, k)}
              data-testid={`contact-${k}`}
            >
              {t(CONTACT_LABEL[k])}
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{t("leads.notesHeading")}</h2>
        {lead.notes.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {lead.notes.map((n) => (
              <li key={n.id} className="bg-muted/50 rounded-lg p-2 text-sm">
                <p>{n.body}</p>
                <span className="text-muted-foreground text-xs">{fmt(n.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs">{t("leads.noNotes")}</p>
        )}
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("leads.notePlaceholder")}
          className="min-h-20"
          aria-label={t("leads.noteAriaLabel")}
          data-testid="note-input"
        />
        <Button
          size="sm"
          onClick={submitNote}
          disabled={note.trim().length === 0}
          className="self-start"
          data-testid="note-add"
        >
          {t("leads.addNote")}
        </Button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{t("leads.historyHeading")}</h2>
        {timeline.length > 0 ? (
          <ul className="flex flex-col gap-2" data-testid="timeline">
            {timeline.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 text-xs">
                <span>{i.message}</span>
                <span className="text-muted-foreground shrink-0">{fmt(i.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs">{t("leads.noInteractions")}</p>
        )}
      </section>
    </div>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      {href ? (
        <a href={href} className="font-medium underline-offset-2 hover:underline">
          {value}
        </a>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}
