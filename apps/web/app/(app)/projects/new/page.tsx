import { createProjectAction } from "../../../../actions/projects";
import { ProjectForm, Notice } from "../../../../components/projects/phase-5-ui";
import { PageHeader } from "../../../../components/shell/page-header";
export const metadata = { title: "Create project" };
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return (
    <>
      <PageHeader
        title="Create a project"
        description="Start with the essentials. You can complete the setup after creation."
      />
      <Notice error={query.error} />
      <div className="mx-auto max-w-3xl rounded-lg bg-surface p-5 shadow-card sm:p-7">
        <ProjectForm action={createProjectAction} />
      </div>
    </>
  );
}
