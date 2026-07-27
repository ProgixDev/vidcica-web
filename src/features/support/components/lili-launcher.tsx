"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, m } from "@/components/motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { SupportStoreProvider, useSupportStore } from "../provider";

/**
 * Global floating assistant ("Lia") — a Messenger-style bubble pinned bottom-right
 * on every authenticated page, so help is one tap away instead of buried in the
 * Help center. Mounted once by the app layout.
 *
 * The `SupportStoreProvider` wraps the whole launcher (not just the open panel),
 * so the conversation + AI wiring persist across open/close for the session — the
 * panel itself mounts/unmounts for the entrance animation, the thread does not.
 * Hidden on `/support` (the full chat already lives there — no double bubble).
 */
export function LiliLauncher() {
  const pathname = usePathname();
  if (pathname?.startsWith("/support")) return null;
  return (
    <SupportStoreProvider>
      <LauncherInner />
    </SupportStoreProvider>
  );
}

const NUDGE_KEY = "lili.nudged";
const isContactChip = (s: string) => /formulaire|contact/i.test(s);

function LauncherInner() {
  const t = useT();
  const router = useRouter();
  const messages = useSupportStore((s) => s.messages);
  const typing = useSupportStore((s) => s.typing);
  const send = useSupportStore((s) => s.send);

  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [text, setText] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  // One-time "I'm here" nudge per browser session — never nags twice.
  useEffect(() => {
    if (typeof window === "undefined" || sessionStorage.getItem(NUDGE_KEY)) return;
    const id = window.setTimeout(() => setNudge(true), 2600);
    return () => window.clearTimeout(id);
  }, []);

  // Keep the thread pinned to the latest message.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function dismissNudge() {
    setNudge(false);
    if (typeof window !== "undefined") sessionStorage.setItem(NUDGE_KEY, "1");
  }

  function openPanel() {
    dismissNudge();
    setOpen(true);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || typing) return;
    setText("");
    void send(body);
  }

  function onChip(chip: string) {
    if (isContactChip(chip)) {
      router.push("/support?tab=contact");
      setOpen(false);
    } else {
      void send(chip);
    }
  }

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open ? (
          <m.div
            key="panel"
            role="dialog"
            aria-label={t("support.bubble.dialogLabel")}
            data-testid="lili-panel"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            style={{ transformOrigin: "bottom right", height: "min(560px, calc(100dvh - 7.5rem))" }}
            className="fixed right-4 bottom-[5.75rem] z-40 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-3xl border shadow-2xl sm:right-6"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3">
              <LiaAvatar />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-tight font-semibold">
                  {t("support.bubble.assistantName")}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] opacity-90">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-300" />
                  </span>
                  {t("support.bubble.online")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/support")}
                aria-label={t("support.bubble.expandAria")}
                className="hover:bg-primary-foreground/15 flex size-8 items-center justify-center rounded-full transition-colors"
              >
                <Icon name="expand" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("support.bubble.closeAria")}
                data-testid="lili-close"
                className="hover:bg-primary-foreground/15 flex size-8 items-center justify-center rounded-full transition-colors"
              >
                <Icon name="chevron-down" />
              </button>
            </div>

            {/* Thread */}
            <div
              ref={bodyRef}
              role="log"
              aria-live="polite"
              aria-label={t("support.chatLogLabel")}
              className="bg-background flex flex-1 flex-col gap-3 overflow-y-auto px-3.5 py-4"
            >
              {messages.map((msgItem) => (
                <div
                  key={msgItem.id}
                  className={cn(
                    "flex items-end gap-2",
                    msgItem.author === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  {msgItem.author === "lia" ? <LiaAvatar size="sm" /> : null}
                  <div
                    className={cn(
                      "flex min-w-0 flex-col gap-1.5",
                      msgItem.author === "user" && "items-end",
                    )}
                  >
                    <div
                      data-testid={`lili-msg-${msgItem.author}`}
                      className={cn(
                        "max-w-[15rem] px-3.5 py-2 text-sm break-words",
                        msgItem.author === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                          : "bg-muted text-foreground rounded-2xl rounded-bl-md",
                      )}
                    >
                      {msgItem.body}
                    </div>
                    {msgItem.suggestions && msgItem.suggestions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {msgItem.suggestions.map((sugg) => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => onChip(sugg)}
                            data-testid="lili-suggestion"
                            className="border-input hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1 text-xs transition-colors"
                          >
                            {sugg}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {typing ? (
                <div
                  className="flex items-end gap-2"
                  role="status"
                  aria-label={t("support.typing")}
                >
                  <LiaAvatar size="sm" />
                  <div className="bg-muted flex items-center gap-1 rounded-2xl rounded-bl-md px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <m.span
                        key={i}
                        className="bg-muted-foreground/60 size-1.5 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Composer */}
            <form
              onSubmit={submit}
              className="border-border/60 bg-background/85 flex items-center gap-2 border-t px-3 py-2.5 backdrop-blur"
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("support.inputPlaceholder")}
                aria-label={t("support.inputAriaLabel")}
                data-testid="lili-input"
                autoFocus
                className="h-10 rounded-full"
              />
              <button
                type="submit"
                disabled={typing || text.trim().length === 0}
                aria-label={t("support.send")}
                data-testid="lili-send"
                className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                <Icon name="send" />
              </button>
            </form>
          </m.div>
        ) : null}
      </AnimatePresence>

      {/* ── "I'm here" nudge ───────────────────────────────────────── */}
      <AnimatePresence>
        {nudge && !open ? (
          <m.div
            key="nudge"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{ transformOrigin: "bottom right" }}
            className="bg-card fixed right-5 bottom-[5.5rem] z-40 flex max-w-[15rem] items-center gap-2 rounded-2xl rounded-br-md border py-2 pr-2 pl-3 shadow-lg sm:right-7"
          >
            <button
              type="button"
              onClick={openPanel}
              data-testid="lili-nudge"
              className="text-foreground text-left text-xs leading-snug"
            >
              {t("support.bubble.nudge")}
            </button>
            <button
              type="button"
              onClick={dismissNudge}
              aria-label={t("support.bubble.dismissNudge")}
              className="text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded-full"
            >
              <Icon name="close" small />
            </button>
          </m.div>
        ) : null}
      </AnimatePresence>

      {/* ── Floating bubble (FAB) ──────────────────────────────────── */}
      <m.button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? t("support.bubble.closeAria") : t("support.bubble.openAria")}
        data-testid="lili-fab"
        className="bg-primary text-primary-foreground shadow-primary/30 fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full shadow-lg transition-[transform,box-shadow] hover:scale-105 hover:shadow-xl active:scale-95 sm:right-6 sm:bottom-6"
      >
        {/* online pip */}
        {!open ? (
          <span className="border-primary absolute top-0.5 right-0.5 size-3 rounded-full border-2 bg-emerald-400" />
        ) : null}
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={open ? "down" : "chat"}
            initial={{ opacity: 0, rotate: -30, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-center"
          >
            <Icon name={open ? "chevron-down" : "chat"} big />
          </m.span>
        </AnimatePresence>
      </m.button>
    </>
  );
}

/** Lia avatar — a warm brand disc with a friendly chat/sparkle mark. */
function LiaAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "size-7" : "size-9";
  return (
    <span
      aria-hidden
      className={cn(
        "bg-primary-foreground/15 ring-primary-foreground/25 grid shrink-0 place-items-center rounded-full ring-1",
        dim,
        size === "md" ? "text-primary-foreground" : "bg-primary/10 text-primary ring-primary/20",
      )}
    >
      <svg
        width={size === "sm" ? 15 : 18}
        height={size === "sm" ? 15 : 18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
        <path d="M12 8.5l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9L9.2 11.3l1.9-.9z" />
      </svg>
    </span>
  );
}

type IconName = "chat" | "chevron-down" | "send" | "expand" | "close";
function Icon({ name, big, small }: { name: IconName; big?: boolean; small?: boolean }) {
  const s = big ? 24 : small ? 13 : 18;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
          <path d="M8 10h8M8 13.5h5" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      );
    case "expand":
      return (
        <svg {...common}>
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
  }
}
