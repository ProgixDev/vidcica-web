/** A small honest inline notice — used wherever a chart shell is shown but the
 *  collection pipeline that fills it doesn't exist yet. A quiet pale surface. */
export function DataComingNotice({ title, body }: { title?: string; body: string }) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-lg p-5" data-testid="analytics-data-coming">
      {title ? <p className="text-[15px] font-semibold">{title}</p> : null}
      <p className="text-muted-foreground text-[13px] leading-relaxed">{body}</p>
    </div>
  );
}
