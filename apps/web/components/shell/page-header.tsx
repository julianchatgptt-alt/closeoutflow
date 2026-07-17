import type { ReactNode } from "react";

import { PreviewPill } from "./preview-pill";

export function PageHeader({
  title,
  description,
  meta,
  actions,
  previewPhase,
  previewMessage
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  previewPhase: number;
  previewMessage?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-page-title truncate">{title}</h1>
          {meta}
          <PreviewPill
            phase={previewPhase}
            {...(previewMessage ? { message: previewMessage } : {})}
          />
        </div>
        {description ? (
          <p className="mt-1 max-w-3xl text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
