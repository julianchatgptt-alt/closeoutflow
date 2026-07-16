import type { ReactNode } from "react";

import { Badge } from "@closeoutflow/ui";

export function PreviewMarker() {
  return <Badge tone="neutral">Preview — not yet functional</Badge>;
}

export function PageHeader({
  title,
  description,
  meta,
  actions
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="truncate text-[length:var(--text-h1)] font-semibold leading-7">{title}</h1>
          {meta}
        </div>
        {description ? (
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-3">
          <PreviewMarker />
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
