import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input">;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "bg-secondary text-foreground flex h-11 w-full rounded-md px-4 py-2 text-[15px] transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-destructive aria-invalid:ring-2",
        className,
      )}
      {...props}
    />
  );
}
