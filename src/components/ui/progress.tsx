import { cn } from "@/lib/utils";

/**
 * Determinate progress bar for the render pipeline stages. `value` is 0–100.
 * Not a bare spinner (quality bar): shows real advancement per stage.
 */
type ProgressProps = React.ComponentProps<"div"> & {
  value: number;
  label?: string;
};

export function Progress({ value, label, className, ...props }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("bg-muted h-2 w-full overflow-hidden rounded-full", className)}
      {...props}
    >
      <div
        className="bg-primary h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
