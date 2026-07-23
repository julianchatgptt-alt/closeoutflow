"use client";

import { AlertDialog, Button, Field, Input } from "@closeoutflow/ui";
import { useRef, useState } from "react";

const minimumReasonLength = 3;
const maximumReasonLength = 200;

export function NotApplicableAction({
  action,
  fields
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState(false);

  function validateAndConfirm() {
    const length = reason.trim().length;
    if (length < minimumReasonLength) {
      setError("Enter a reason between 3 and 200 characters.");
      inputRef.current?.focus();
      return;
    }
    if (length > maximumReasonLength) {
      setError("Reason must be 200 characters or fewer.");
      inputRef.current?.focus();
      return;
    }
    setError(undefined);
    setOpen(true);
  }

  return (
    <form ref={formRef} action={action} className="grid gap-3" noValidate>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Field label="Reason" htmlFor="na-reason" required {...(error ? { error } : {})}>
        <Input
          ref={inputRef}
          id="na-reason"
          name="reason"
          value={reason}
          required
          minLength={minimumReasonLength}
          maxLength={maximumReasonLength}
          onChange={(event) => {
            setReason(event.currentTarget.value);
            if (error) setError(undefined);
          }}
        />
      </Field>
      <Button type="button" variant="outline" onClick={validateAndConfirm}>
        Mark not applicable
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Mark not applicable?"
        description="This records that the requirement never applied to this project. It stays visible with the reason and can be reopened."
        actionLabel="Mark not applicable"
        onAction={() => formRef.current?.requestSubmit()}
      />
    </form>
  );
}
