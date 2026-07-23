"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioPrimitive from "@radix-ui/react-radio-group";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, Check, ChevronDown, FileUp, Lock, Search, XCircle } from "lucide-react";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";

import { Button, type ButtonProps } from "./button";
import { Input } from "./input";
import { cn } from "./lib/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-24 w-full resize-y rounded-md border border-input bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  required,
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("text-[13px] font-semibold", className)} {...props}>
      {children}
      {required ? (
        <>
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
          <span className="sr-only"> required</span>
        </>
      ) : null}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  help,
  error,
  required,
  children,
  className
}: {
  label: string;
  htmlFor: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const describedBy = [help ? `${htmlFor}-help` : "", error ? `${htmlFor}-error` : ""]
    .filter(Boolean)
    .join(" ");
  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(error ? { "aria-invalid": true } : {}),
        ...(required ? { "aria-required": true } : {})
      })
    : children;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor} {...(required ? { required: true } : {})}>
        {label}
      </Label>
      {control}
      {help ? (
        <p id={`${htmlFor}-help`} className="text-sm text-muted-foreground">
          {help}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="flex items-center gap-1 text-sm text-danger"
        >
          <AlertCircle aria-hidden="true" className="h-4 w-4" />
          {error}
        </p>
      ) : null}
      {describedBy ? (
        <span className="sr-only">Field guidance is provided below the control.</span>
      ) : null}
    </div>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-input bg-surface px-3 pr-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground"
      />
    </div>
  )
);
Select.displayName = "Select";

export function Combobox({
  label = "Search options",
  options = []
}: {
  label?: string;
  options?: string[];
}) {
  return (
    <div className="relative">
      <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input aria-label={label} list={`${label}-options`} className="pl-9" />
      <datalist id={`${label}-options`}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </datalist>
    </div>
  );
}

export function MultiSelect({ values }: { values: string[] }) {
  return (
    <div
      className="flex min-h-10 flex-wrap gap-1 rounded-md border border-input bg-surface p-1.5"
      role="group"
      aria-label="Selected values"
    >
      {values.map((value) => (
        <Badge key={value} tone="neutral">
          {value}
          <span aria-hidden="true"> ×</span>
        </Badge>
      ))}
    </div>
  );
}

export function Checkbox({
  id,
  label,
  visuallyHiddenLabel = false,
  ...props
}: { id: string; label: string; visuallyHiddenLabel?: boolean } & CheckboxPrimitive.CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex min-h-11 items-center gap-2 text-sm">
      <CheckboxPrimitive.Root
        id={id}
        className="grid h-5 w-5 place-items-center rounded-sm border border-input bg-surface data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check aria-hidden="true" className="h-4 w-4" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <span className={visuallyHiddenLabel ? "sr-only" : undefined}>{label}</span>
    </label>
  );
}

export function RadioGroup({
  label,
  options
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <RadioPrimitive.Root className="grid gap-1">
        {options.map((option) => (
          <label key={option.value} className="inline-flex min-h-11 items-center gap-2 text-sm">
            <RadioPrimitive.Item
              value={option.value}
              className="grid h-5 w-5 place-items-center rounded-full border border-input"
            >
              <RadioPrimitive.Indicator className="h-2.5 w-2.5 rounded-full bg-primary" />
            </RadioPrimitive.Item>
            {option.label}
          </label>
        ))}
      </RadioPrimitive.Root>
    </fieldset>
  );
}

export function Switch({
  id,
  label,
  ...props
}: { id: string; label: string } & SwitchPrimitive.SwitchProps) {
  return (
    <label htmlFor={id} className="inline-flex min-h-11 items-center gap-2 text-sm">
      <SwitchPrimitive.Root
        id={id}
        className="h-6 w-11 rounded-full bg-muted data-[state=checked]:bg-primary"
        {...props}
      >
        <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-[22px]" />
      </SwitchPrimitive.Root>
      {label}
    </label>
  );
}

const badge = cva(
  "inline-flex min-h-5 items-center gap-1 rounded-md border px-1.5 py-0 text-[11px] font-semibold leading-4",
  {
    variants: {
      tone: {
        neutral:
          "border-neutral-status-border bg-neutral-status-subtle text-neutral-status-foreground",
        info: "border-info-border bg-info-subtle text-info-foreground",
        success: "border-success-border bg-success-subtle text-success-foreground",
        warning: "border-warning-border bg-warning-subtle text-warning-foreground",
        danger: "border-danger-border bg-danger-subtle text-danger-foreground",
        owner: "border-owner-border bg-owner-subtle text-owner-foreground"
      }
    },
    defaultVariants: { tone: "neutral" }
  }
);
export function Badge({
  tone,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}

export function Avatar({
  name,
  src,
  size = "md"
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <AvatarPrimitive.Root
      aria-label={name}
      className={cn(
        "inline-grid place-items-center overflow-hidden rounded-full bg-muted font-medium",
        size === "sm" && "h-6 w-6 text-xs",
        size === "md" && "h-8 w-8 text-sm",
        size === "lg" && "h-10 w-10"
      )}
    >
      <AvatarPrimitive.Image src={src} alt="" className="h-full w-full object-cover" />
      <AvatarPrimitive.Fallback>{initials}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export function IconButton({
  label,
  children,
  ...props
}: Omit<ButtonProps, "aria-label"> & { label: string }) {
  return (
    <Button
      aria-label={label}
      size="sm"
      variant="ghost"
      className="h-11 w-11 px-0 sm:h-9 sm:w-9"
      {...props}
    >
      {children}
    </Button>
  );
}

export function Alert({
  tone = "info",
  title,
  children
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-md border p-4",
        tone === "info" && "border-info-border bg-info-subtle",
        tone === "success" && "border-success-border bg-success-subtle",
        tone === "warning" && "border-warning-border bg-warning-subtle",
        tone === "danger" && "border-danger-border bg-danger-subtle"
      )}
    >
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-1 text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}
export const Banner = Alert;

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent motion-reduce:animate-none"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <progress
        value={value}
        max={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full accent-[hsl(var(--primary))]"
      />
    </div>
  );
}
export function Separator(props: SeparatorPrimitive.SeparatorProps) {
  return <SeparatorPrimitive.Root className="h-px w-full bg-border" {...props} />;
}

/**
 * Shared state composition: a quiet centred surface with one icon, one title,
 * one line of value, and at most one primary action. Used by every empty,
 * no-results, error, and permission state so the product never shows a blank
 * card, a bare spinner, or a raw message.
 */
function StateShell({
  icon,
  title,
  description,
  action,
  tone = "quiet",
  role,
  headingClassName
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "quiet" | "panel";
  role?: "alert" | "status";
  headingClassName?: string;
}) {
  return (
    <div
      {...(role ? { role } : {})}
      className={cn(
        "grid min-h-40 place-items-center rounded-lg px-6 py-10 text-center",
        tone === "quiet" ? "bg-surface-sunken" : "bg-surface shadow-card"
      )}
    >
      <div className="max-w-md">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface shadow-card">
          {icon}
        </span>
        <h2 className={cn("text-[15px] font-semibold", headingClassName)}>{title}</h2>
        <p className="mx-auto mt-1.5 text-sm leading-[1.35rem] text-muted-foreground">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <StateShell
      icon={icon ?? <FileUp aria-hidden="true" className="h-6 w-6 text-subtle-foreground" />}
      title={title}
      description={description}
      {...(action ? { action } : {})}
    />
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <StateShell
      role="alert"
      tone="panel"
      icon={<XCircle aria-hidden="true" className="h-6 w-6 text-danger" />}
      title={title}
      description={description}
      {...(onRetry
        ? {
            action: (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
            )
          }
        : {})}
    />
  );
}

export function PermissionDenied({
  description = "Ask an organization administrator if you need access.",
  action
}: {
  description?: string;
  action?: ReactNode;
}) {
  return (
    <StateShell
      icon={<Lock aria-hidden="true" className="h-6 w-6 text-subtle-foreground" />}
      title="You don't have permission to view this"
      description={description}
      {...(action ? { action } : {})}
    />
  );
}

export function KeyValue({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
export const MetadataList = KeyValue;
export function ResponsiveStack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-4 md:flex-row", className)} {...props} />;
}
export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-lg bg-surface p-4 shadow-card">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-9 tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

/**
 * A single real count. Used sparingly — one row at most, never a four-up KPI
 * strip. `href` turns the metric into a route into the work it describes.
 */
export function Metric({
  label,
  value,
  detail,
  href,
  attention = false
}: {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  attention?: boolean;
}) {
  const body = (
    <>
      <p className="text-overline">{label}</p>
      <p className={cn("mt-1.5 text-metric", attention && "text-warning-foreground")}>{value}</p>
      {detail ? <p className="mt-1 text-[13px] text-muted-foreground">{detail}</p> : null}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className="block rounded-lg px-4 py-3.5 transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {body}
      </a>
    );
  }
  return <div className="px-4 py-3.5">{body}</div>;
}

/**
 * The single mobile representation every table degrades to below `md`, so the
 * product does not carry a different bespoke card per page.
 */
export function RecordCard({
  title,
  href,
  source,
  status,
  fields = [],
  footer
}: {
  title: string;
  href?: string;
  source?: string;
  status?: ReactNode;
  fields?: Array<{ label: string; value: ReactNode }>;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {href ? (
            <a
              href={href}
              title={title}
              className="block truncate font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {title}
            </a>
          ) : (
            <p title={title} className="truncate font-semibold">
              {title}
            </p>
          )}
          {source ? (
            <p title={source} className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {source}
            </p>
          ) : null}
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </div>
      {fields.length > 0 ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-hairline pt-3">
          {fields.map((field) => (
            <div key={field.label} className="min-w-0">
              <dt className="text-overline">{field.label}</dt>
              <dd className="mt-0.5 truncate text-[13px]">{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}

/**
 * Derived attention, shown as a quiet warning chip rather than a red alarm.
 * Attention here means "setup is incomplete", never "something has failed".
 */
export function AttentionChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-5 items-center gap-1 rounded-full bg-warning-subtle px-2 py-0 text-[11px] font-medium leading-4 text-warning-foreground">
      {children}
    </span>
  );
}

/** Real, derived progress. Never decorative — callers pass actual counts. */
export function Meter({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}
export function FileUploadPlaceholder({ phase = 8 }: { phase?: number }) {
  return (
    <div
      aria-disabled="true"
      className="rounded-lg border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-muted-foreground"
    >
      <FileUp aria-hidden="true" className="mx-auto mb-2 h-6 w-6" />
      Uploads arrive in Phase {phase}
    </div>
  );
}
export function DateInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="date" {...props} />;
}
export function Calendar() {
  const days = Array.from({ length: 35 }, (_, index) => index - 2);
  return (
    <div
      aria-label="Calendar preview"
      className="grid grid-cols-7 gap-1 rounded-lg border p-3 text-center text-xs"
    >
      {"SMTWTFS".split("").map((day, index) => (
        <span key={`${day}-${index}`} className="font-medium text-muted-foreground">
          {day}
        </span>
      ))}
      {days.map((day) => (
        <span
          key={day}
          className={cn("grid h-8 place-items-center", day < 1 && "text-subtle-foreground")}
        >
          {day < 1 ? "" : day}
        </span>
      ))}
    </div>
  );
}
