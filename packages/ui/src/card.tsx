import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "./lib/cn";

/**
 * Surface ladder (Phase 6E-B2). Hierarchy comes from tone and elevation rather
 * than from putting a border ring around every box.
 *
 * - `quiet`   grouping regions and insets — tone shift only, no border, no shadow
 * - `panel`   the default content surface — hairline boundary, no drop shadow
 * - `raised`  the ONE focal element per view — real elevation, no ring
 *
 * Use at most one `raised` card per viewport; nested cards are prohibited (back
 * sub-groups with `quiet` plus spacing instead).
 */
const card = cva("rounded-lg", {
  variants: {
    tier: {
      quiet: "bg-surface-sunken",
      panel: "bg-surface shadow-card",
      raised: "rounded-xl bg-surface-raised shadow-raised"
    }
  },
  defaultVariants: { tier: "panel" }
});

export type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof card>;

export function Card({ className, tier, ...props }: CardProps) {
  return <div className={cn(card({ tier }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-overline", className)} {...props}>
      {children}
    </h2>
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
