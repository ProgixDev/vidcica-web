"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/provider";
import { submitTicket } from "../actions";

export function ContactForm() {
  const t = useT();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (subject.trim().length < 3 || message.trim().length < 10) {
      setError(t("support.contactValidation"));
      return;
    }
    setPending(true);
    const res = await submitTicket({ subject, message });
    setPending(false);
    if (res.ok) setSent(true);
    else setError(res.message);
  }

  if (sent) {
    return (
      <EmptyState
        className="py-16"
        title={t("support.sentTitle")}
        description={t("support.sentDescription")}
        action={
          <Button
            variant="outline"
            onClick={() => {
              setSent(false);
              setSubject("");
              setMessage("");
            }}
          >
            {t("support.sendAnother")}
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" data-testid="contact-form">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ct-subject">{t("support.subjectLabel")}</Label>
        <Input
          id="ct-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("support.subjectPlaceholder")}
          data-testid="contact-subject"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ct-message">{t("support.messageLabel")}</Label>
        <Textarea
          id="ct-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("support.messagePlaceholder")}
          className="min-h-32"
          data-testid="contact-message"
        />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} data-testid="contact-submit" className="self-start">
        {pending ? t("common.sending") : t("support.submit")}
      </Button>
    </form>
  );
}
