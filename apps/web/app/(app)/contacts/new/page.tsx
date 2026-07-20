import { createContactAction } from "../../../../actions/contacts";
import { DirectoryForm, Notice } from "../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../components/shell/page-header";
import { getActiveContext } from "../../../../lib/active-context";
export const metadata = { title: "Create contact" };
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const query = await searchParams;
  const { client, organizationId } = await getActiveContext();
  const { data: duplicates } = query.email
    ? await client.rpc("search_contacts", {
        target_organization_id: organizationId,
        search_query: query.email,
        page_size: 5
      })
    : { data: [] };
  return (
    <>
      <PageHeader
        title="Create contact"
        description="Contacts can be reused across projects and do not receive sign-in access."
      />
      <Notice error={query.error} />
      <form
        method="get"
        className="mx-auto mb-5 flex max-w-3xl gap-3 rounded-lg bg-surface p-4 shadow-card"
      >
        <label htmlFor="duplicate-contact" className="sr-only">
          Check for an existing email
        </label>
        <input
          id="duplicate-contact"
          name="email"
          type="email"
          defaultValue={query.email}
          placeholder="Check for an existing email"
          className="h-10 min-w-0 flex-1 rounded-md border border-input bg-surface px-3 text-sm"
        />
        <button
          className="min-h-10 rounded-md border border-border-strong px-4 text-sm font-medium"
          type="submit"
        >
          Check duplicates
        </button>
      </form>
      {duplicates?.length ? (
        <div
          role="status"
          className="mb-5 rounded-md border border-warning-border bg-warning-subtle p-4"
        >
          <p className="font-semibold">Possible duplicate email</p>
          <p className="text-sm text-muted-foreground">
            Review {duplicates.map((d) => `${d.first_name} ${d.last_name}`).join(", ")}. Closeout
            warns but never auto-merges contacts.
          </p>
        </div>
      ) : null}
      <div className="mx-auto max-w-3xl rounded-lg bg-surface p-5 shadow-card">
        <DirectoryForm kind="contact" action={createContactAction} />
      </div>
    </>
  );
}
