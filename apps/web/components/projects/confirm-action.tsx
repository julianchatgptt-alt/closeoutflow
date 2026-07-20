"use client";

import { AlertDialog, Button } from "@closeoutflow/ui";
import { useRef, type ReactNode } from "react";

export function ConfirmAction({
  action,
  fields,
  title,
  description,
  actionLabel,
  children
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  title: string;
  description: string;
  actionLabel: string;
  children?: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="grid gap-3">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <AlertDialog
        title={title}
        description={description}
        actionLabel={actionLabel}
        onAction={() => formRef.current?.requestSubmit()}
        trigger={
          <Button type="button" variant="outline">
            {actionLabel}
          </Button>
        }
      />
    </form>
  );
}
