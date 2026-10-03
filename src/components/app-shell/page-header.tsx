/**
 * Consistent page header for authed pages — replaces the ad-hoc per-page
 * `<header>` blocks. Title left, optional actions right, optional subtitle.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-9 font-semibold tracking-[-0.03em] sm:text-[32px] sm:leading-10">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-muted-foreground max-w-xl text-[15px] leading-relaxed">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
