import { createCompanyAction } from "../../../../actions/companies";
import { DirectoryForm, Notice } from "../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../components/shell/page-header";
import { getActiveContext } from "../../../../lib/active-context";
export const metadata = { title: "Create company" };
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string; name?: string }>;
}) {
  const query = await searchParams;
  const { client, organizationId } = await getActiveContext();
  const { data: duplicates } = query.name
    ? await client.rpc("search_companies", {
        target_organization_id: organizationId,
        search_query: query.name,
        page_size: 5
      })
    : { data: [] };
  return (
    <>
      <PageHeader
        title="Create company"
        description="Create one reusable company record. Project roles are added from each project workspace."
      />
      <Notice error={query.error} />
      <form
        method="get"
        className="mx-auto mb-5 flex max-w-3xl gap-3 rounded-lg bg-surface p-4 shadow-card"
      >
        <label htmlFor="duplicate-company" className="sr-only">
          Check for an existing company
        </label>
        <input
          id="duplicate-company"
          name="name"
          defaultValue={query.name}
          placeholder="Check for an existing company"
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
          <p className="font-semibold">Possible duplicates</p>
          <p className="text-sm text-muted-foreground">
            {duplicates.map((d) => d.display_name).join(", ")}. Duplicate checks warn only; records
            are never auto-merged.
          </p>
        </div>
      ) : null}
      <div className="mx-auto max-w-3xl rounded-lg bg-surface p-5 shadow-card">
        <DirectoryForm kind="company" action={createCompanyAction} />
      </div>
    </>
  );
}
