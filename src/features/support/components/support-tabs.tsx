"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SupportStoreProvider } from "../provider";
import { SupportChat } from "./support-chat";
import { ContactForm } from "./contact-form";

type Tab = "assistant" | "contact";

export function SupportTabs() {
  const [tab, setTab] = useState<Tab>("assistant");

  return (
    <div className="flex flex-col gap-6" data-testid="support-tabs">
      <div
        role="tablist"
        aria-label="Support"
        className="bg-muted grid grid-cols-2 gap-1 rounded-full p-1"
      >
        {(["assistant", "contact"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            data-testid={`tab-${t}`}
            className={cn(
              "focus-visible:ring-ring rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
              tab === t
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "assistant" ? "Assistant" : "Contact"}
          </button>
        ))}
      </div>

      {tab === "assistant" ? (
        <SupportStoreProvider>
          <SupportChat onHandoff={() => setTab("contact")} />
        </SupportStoreProvider>
      ) : (
        <ContactForm />
      )}
    </div>
  );
}
