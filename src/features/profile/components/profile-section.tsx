import Link from "next/link";
import { cn } from "@/lib/utils";

/** A titled card grouping profile rows (mirrors the mobile settings sections). */
export function ProfileSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title ? (
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {title}
        </h2>
      ) : null}
      <div className="bg-card divide-border/60 flex flex-col divide-y rounded-2xl border">
        {children}
      </div>
    </section>
  );
}

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground/70 shrink-0"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

type RowBase = { label: string; hint?: string; danger?: boolean; icon?: React.ReactNode };

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
      {icon ? <span className="text-muted-foreground shrink-0">{icon}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("text-sm font-medium", danger && "text-destructive")}>{label}</span>
        {hint ? <span className="text-muted-foreground truncate text-xs">{hint}</span> : null}
      </span>
      <Chevron />
    </>
  );
  const cls =
    "hover:bg-muted/60 flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl";
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
    <div className="flex items-center gap-3 px-4 py-3">
      {icon ? <span className="text-muted-foreground shrink-0">{icon}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{label}</span>
        {hint ? <span className="text-muted-foreground truncate text-xs">{hint}</span> : null}
      </span>
      <span className="shrink-0">{children}</span>
    </div>
  );
}
