"use client";

import { Info } from "lucide-react";

import { Popover } from "@closeoutflow/ui";

export function PreviewPill({ phase, message }: { phase: number; message?: string }) {
  return (
    <Popover
      trigger={
        <button
          type="button"
          className="inline-flex h-[22px] items-center gap-1 rounded-md border border-info-border px-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-info transition-colors hover:bg-info-subtle"
          aria-label="Preview information"
        >
          <Info aria-hidden="true" className="h-3 w-3" />
          Preview
        </button>
      }
    >
      <p className="text-sm leading-5">
        {message ?? `Static sample data for design review. Functional in Phase ${phase}.`}
      </p>
    </Popover>
  );
}
