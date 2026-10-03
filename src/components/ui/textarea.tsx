import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "bg-secondary text-foreground flex min-h-28 w-full rounded-md px-4 py-3 text-[15px] leading-relaxed transition-colors outline-none",
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
