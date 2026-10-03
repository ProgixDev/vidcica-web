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
        "bg-secondary text-foreground flex h-11 w-full appearance-none rounded-md px-4 py-2 text-[15px] transition-colors outline-none",
        "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
