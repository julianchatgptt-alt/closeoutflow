import { Button, Field, Input, Textarea } from "@closeoutflow/ui";
import Link from "next/link";

import { createTemplateAction } from "../../../../actions/requirement-templates";
import { Notice, outlineLink } from "../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../components/shell/page-header";
import { getActiveContext } from "../../../../lib/active-context";

export const metadata = { title: "New template" };

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const query = await searchParams;
  await getActiveContext();
  return (
    <>
      <PageHeader
        title="New requirement template"
        description="Start a reusable closeout standard. You’ll add its requirements next, then publish it for use on projects."
      />
      <Notice error={query.error} message={query.message} />
      <div className="max-w-2xl rounded-lg bg-surface p-6 shadow-card">
        <form action={createTemplateAction} className="grid gap-5">
          <Field label="Template name" htmlFor="name" required>
            <Input
              id="name"
              name="name"
              required
              maxLength={120}
              placeholder="e.g. Standard Medical Office Closeout"
            />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              placeholder="When should this standard be used?"
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Link className={outlineLink} href="/templates">
              Cancel
            </Link>
            <Button type="submit">Create template</Button>
          </div>
        </form>
      </div>
    </>
  );
}
