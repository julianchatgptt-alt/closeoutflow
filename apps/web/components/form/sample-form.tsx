"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Alert,
  AlertDialog,
  Button,
  Field,
  FileUploadPlaceholder,
  Input,
  Select,
  Switch
} from "@closeoutflow/ui";

import { ThemeToggle } from "../theme/theme-toggle";

const schema = z.object({
  name: z.string().min(2, "Enter at least two characters."),
  email: z.email("Enter a valid email address."),
  notes: z.string().max(200).optional()
});
type Values = z.infer<typeof schema>;

export function SampleValidationForm({
  onNavigate
}: {
  onNavigate?: (href: string) => void;
} = {}) {
  const summary = useRef<HTMLDivElement>(null);
  const pendingAnchor = useRef<HTMLAnchorElement | null>(null);
  const bypassNavigationGuard = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", notes: "" }
  });
  const [saved, setSaved] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (isDirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [isDirty]);
  useEffect(() => {
    const guardNavigation = (event: MouseEvent) => {
      if (!isDirty || bypassNavigationGuard.current || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        destination.href === window.location.href
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      pendingAnchor.current = anchor;
      setDiscardOpen(true);
    };
    document.addEventListener("click", guardNavigation, true);
    return () => document.removeEventListener("click", guardNavigation, true);
  }, [isDirty]);
  useEffect(() => {
    if (Object.keys(errors).length) summary.current?.focus();
  }, [errors]);
  return (
    <>
      <form
        className="grid max-w-[var(--content-max-form)] gap-5"
        noValidate
        onSubmit={handleSubmit((values) => {
          setSaved(true);
          reset(values);
        })}
      >
        {Object.keys(errors).length ? (
          <div
            ref={summary}
            tabIndex={-1}
            role="alert"
            className="rounded-md border border-danger-border bg-danger-subtle p-3"
          >
            <p className="font-medium">Review the highlighted fields.</p>
            <p className="text-sm text-muted-foreground">Each error is linked to its control.</p>
          </div>
        ) : null}
        {saved ? (
          <Alert tone="success" title="Sample saved">
            This confirmation is visual only. No data was persisted.
          </Alert>
        ) : null}
        <Field
          label="Contact name"
          htmlFor="sample-name"
          required
          {...(errors.name?.message ? { error: errors.name.message } : {})}
        >
          <Input id="sample-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
        </Field>
        <Field
          label="Email"
          htmlFor="sample-email"
          required
          help="Use a clearly fake address for this preview."
          {...(errors.email?.message ? { error: errors.email.message } : {})}
        >
          <Input
            id="sample-email"
            type="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>
        <div className="flex gap-2">
          <Button type="submit">Validate sample</Button>
          <Button type="button" variant="outline" onClick={() => reset()}>
            Reset
          </Button>
        </div>
        {isDirty ? (
          <p role="status" className="text-sm text-warning">
            Unsaved sample changes
          </p>
        ) : null}
      </form>
      <AlertDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard changes?"
        description="Your unsaved sample changes will be lost if you leave this page."
        actionLabel="Discard and leave"
        onAction={() => {
          const anchor = pendingAnchor.current;
          if (!anchor) return;
          const href = anchor.getAttribute("href") ?? anchor.href;
          reset();
          setDiscardOpen(false);
          if (onNavigate) {
            onNavigate(href);
            return;
          }
          bypassNavigationGuard.current = true;
          window.setTimeout(() => {
            anchor.click();
            bypassNavigationGuard.current = false;
          }, 0);
        }}
      />
    </>
  );
}

export function OrganizationSettingsForm() {
  return (
    <div className="grid max-w-[var(--content-max-form)] gap-6">
      <Alert title="Read-only preview">Organization settings become editable in Phase 4.</Alert>
      <Field label="Organization name" htmlFor="org-name" help="Static sample organization">
        <Input id="org-name" value="Sample Construction Co." readOnly />
      </Field>
      <Field label="Time zone" htmlFor="timezone">
        <Select id="timezone" disabled defaultValue="eastern">
          <option value="eastern">Eastern Time</option>
        </Select>
      </Field>
      <FileUploadPlaceholder phase={4} />
      <div>
        <p className="mb-2 text-sm font-medium">Theme preference</p>
        <ThemeToggle />
      </div>
      <Switch id="weekly-summary" label="Weekly summary emails — Phase 10" disabled />
      <Button disabled>Save settings — Phase 4</Button>
    </div>
  );
}
