import { FileText } from "lucide-react";
import type { ReactNode } from "react";

import { Avatar, Tooltip } from "@closeoutflow/ui";

import { formatDateOnly, formatRelativeTimestamp, formatTimestamp } from "../../lib/date-format";

export function DateCell({ value, overdue = false }: { value: string; overdue?: boolean }) {
  const formatted = formatDateOnly(value);
  return (
    <Tooltip content={new Date(value).toISOString()}>
      <time dateTime={value} className={`tabular-nums ${overdue ? "text-warning" : ""}`}>
        {formatted}
        {overdue ? " · Overdue" : ""}
      </time>
    </Tooltip>
  );
}
export function TimestampCell({ value, timeZone }: { value: string; timeZone?: string | null }) {
  const absolute = formatTimestamp(value, timeZone ?? undefined);
  return (
    <Tooltip content={absolute}>
      <time dateTime={value} className="tabular-nums" title={absolute}>
        {formatRelativeTimestamp(value)}
      </time>
    </Tooltip>
  );
}
export function FileCell({ name, size }: { name: string; size: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{name}</span>
      <span className="font-mono text-xs text-muted-foreground">{size}</span>
    </span>
  );
}
export function UserCell({ name, detail }: { name: string; detail?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar name={name} size="sm" />
      <span>
        <span className="block">{name}</span>
        {detail ? <span className="block text-xs text-muted-foreground">{detail}</span> : null}
      </span>
    </span>
  );
}
