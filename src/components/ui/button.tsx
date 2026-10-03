import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Design-system button — identity 01. Every button is a full pill. The main action
 * is INK (`default`); `brand` is the citron accent and appears at most once per
 * viewport. No borders, no shadows. Variants live here; layout (margins, width)
 * belongs to the call site — docs/design/redesign-rules.md.
 */
const buttonVariants = cva(
  "focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        brand: "bg-brand text-brand-foreground hover:bg-brand-pressed",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        // Kept for call-site compatibility: identity 01 has no outlined controls,
        // so `outline` is the pale pill.
        outline: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-foreground hover:bg-secondary",
        destructive: "bg-destructive-subtle text-destructive hover:bg-destructive-subtle/70",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-7 text-[15px]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
