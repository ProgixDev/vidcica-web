import Link from "next/link";
import { cn } from "@/lib/utils";

/** A titled group of settings rows (mirrors the mobile settings sections). */
export function ProfileSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      {title ? (
        <h2 className="text-muted-foreground px-1 text-[13px] font-medium tracking-normal">
          {title}
        </h2>
      ) : null}
      <div className="bg-card flex flex-col overflow-hidden rounded-lg py-2">{children}</div>
    </section>
  );
}

function Chevron() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground shrink-0"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

type RowBase = { label: string; hint?: string; danger?: boolean; icon?: React.ReactNode };

function RowText({ label, hint, danger }: Pick<RowBase, "label" | "hint" | "danger">) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className={cn("text-[15px] leading-snug font-semibold", danger && "text-destructive")}>
        {label}
      </span>
      {hint ? (
        <span className="text-muted-foreground truncate text-[13px] leading-snug">{hint}</span>
      ) : null}
    </span>
  );
}

/** A tappable row that navigates (internal link or external). */
export function ProfileLinkRow({
  href,
  external,
  label,
  hint,
  danger,
  icon,
  testId,
}: RowBase & { href: string; external?: boolean; testId?: string }) {
  const inner = (
    <>
      {icon ? <span className="text-foreground shrink-0">{icon}</span> : null}
      <RowText label={label} hint={hint} danger={danger} />
      <Chevron />
    </>
  );
  const cls =
    "hover:bg-accent focus-visible:ring-ring flex min-h-14 items-center gap-4 px-5 py-2.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls} data-testid={testId}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls} data-testid={testId}>
      {inner}
    </Link>
  );
}

/** A non-navigating row that hosts a control (e.g. a switch) on the right. */
export function ProfileControlRow({
  label,
  hint,
  icon,
  children,
}: RowBase & { children: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center gap-4 px-5 py-2.5">
      {icon ? <span className="text-foreground shrink-0">{icon}</span> : null}
      <RowText label={label} hint={hint} />
      <span className="flex shrink-0 items-center">{children}</span>
    </div>
  );
}
