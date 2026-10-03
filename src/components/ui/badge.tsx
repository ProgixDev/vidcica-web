import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Status pill — identity 01. Neutral by default; status colours are a tinted
 * `*-subtle` surface with its paired foreground (all AA) and are used only when
 * the feedback is essential. Never bordered. `brand` is the ink pill, not citron.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        muted: "bg-secondary text-subtle-foreground",
        brand: "bg-primary text-primary-foreground",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        destructive: "bg-destructive-subtle text-destructive",
        outline: "bg-secondary text-foreground",
      },
    },
    defaultVariants: { variant: "muted" },
  },
);

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
