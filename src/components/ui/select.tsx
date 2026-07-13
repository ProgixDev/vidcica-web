import { cn } from "@/lib/utils";

/**
 * Native <select>, token-styled to match Input. Native keeps it accessible and
 * dependency-free (no Radix) for the composer's option pickers.
 */
type SelectProps = React.ComponentProps<"select">;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "border-input flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none",
        "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
