"use client";

import { AlertDialog, Button } from "@closeoutflow/ui";
import { useRef } from "react";

/** Confirmation gate that submits the closest enclosing form on approval. */
export function ConfirmSubmit({
  title,
  description,
  actionLabel,
  variant = "default"
}: {
  title: string;
  description: string;
  actionLabel: string;
  variant?: "default" | "outline";
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  return (
    <span ref={anchorRef}>
      <AlertDialog
        title={title}
        description={description}
        actionLabel={actionLabel}
        onAction={() => anchorRef.current?.closest("form")?.requestSubmit()}
        trigger={
          <Button type="button" variant={variant}>
            {actionLabel}
          </Button>
        }
      />
    </span>
  );
}
