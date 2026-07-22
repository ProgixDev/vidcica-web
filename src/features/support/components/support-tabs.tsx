"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import type { SupportTicket } from "@/lib/vidcica/support-ticket";
import { SupportStoreProvider } from "../provider";
import { SupportChat } from "./support-chat";
import { ContactForm } from "./contact-form";
import { FaqSection } from "./faq-section";
import { GuidesList } from "./guides-list";
import { TutorialsList } from "./tutorials-list";
import { TicketHistory } from "./ticket-history";

type Tab = "faq" | "guides" | "tutorials" | "contact" | "chat";

const TABS: ReadonlyArray<{ id: Tab; labelKey: MessageKey }> = [
  { id: "faq", labelKey: "help.tab.faq" },
  { id: "guides", labelKey: "help.tab.guides" },
  { id: "tutorials", labelKey: "help.tab.tutorials" },
  { id: "contact", labelKey: "help.tab.contact" },
  { id: "chat", labelKey: "help.tab.chat" },
];

export function SupportTabs({ tickets }: { tickets: SupportTicket[] }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("faq");

  return (
    <div className="flex flex-col gap-6" data-testid="support-tabs">
      <div
        role="tablist"
        aria-label={t("support.tablistLabel")}
        className="bg-muted flex flex-wrap gap-1 rounded-full p-1"
      >
        {TABS.map(({ id, labelKey }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            data-testid={`tab-${id}`}
            className={cn(
              "focus-visible:ring-ring flex-1 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none",
              tab === id
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {tab === "faq" ? <FaqSection onContact={() => setTab("contact")} /> : null}
      {tab === "guides" ? <GuidesList /> : null}
      {tab === "tutorials" ? <TutorialsList /> : null}
      {tab === "contact" ? (
        <div className="flex flex-col gap-8">
          <ContactForm />
          <TicketHistory tickets={tickets} />
        </div>
      ) : null}
      {tab === "chat" ? (
        <SupportStoreProvider>
          <SupportChat onHandoff={() => setTab("contact")} />
        </SupportStoreProvider>
      ) : null}
    </div>
  );
}
