/** A small honest inline notice — used wherever a chart shell is shown but the
 *  collection pipeline that fills it doesn't exist yet. Token colours only. */
export function DataComingNotice({ title, body }: { title?: string; body: string }) {
  return (
    <div
      className="border-border bg-muted/40 rounded-2xl border border-dashed p-4"
      data-testid="analytics-data-coming"
    >
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
    </div>
  );
}
