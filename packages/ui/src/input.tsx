import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "./lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none placeholder:text-subtle-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-danger aria-invalid:ring-danger disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
