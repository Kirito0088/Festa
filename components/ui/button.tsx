import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

/**
 * Festa buttons: pill-shaped, with feedback on press (not release) via a
 * short scale-down, per Apple's "respond on pointer-down" guidance.
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent text-sm font-medium whitespace-nowrap outline-none select-none transition-[background-color,color,box-shadow,transform,opacity] duration-150 ease-out active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(32_33_31/0.2)] hover:bg-primary/88",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#e7e2d8]",
        outline: "border-border bg-card text-foreground hover:bg-secondary aria-expanded:bg-secondary",
        ghost: "text-foreground hover:bg-secondary aria-expanded:bg-secondary",
        accent: "bg-sage-soft text-sage-strong hover:bg-[#dbe3d5]",
        destructive: "bg-danger-soft text-danger hover:bg-[#f2d5ce]",
        link: "h-auto rounded-md px-0 text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground active:scale-100",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 gap-1.5 px-3 text-[0.8125rem]",
        lg: "h-12 px-6 text-[0.9375rem]",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
