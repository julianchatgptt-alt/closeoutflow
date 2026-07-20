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
