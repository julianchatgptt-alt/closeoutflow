import { notFound, redirect } from "next/navigation";

import { ProjectBreadcrumb } from "../../../../components/shell/project-breadcrumb";
import { createRequestAuthClient } from "../../../../lib/server-auth";

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const [{ projectId }, client] = await Promise.all([params, createRequestAuthClient()]);
  if (!client) redirect("/sign-in");

  // Phase 3 preview routes use a descriptive slug and contain only static sample data.
  // Live Phase 5 project routes always use UUIDs and require the RLS-scoped name lookup below.
  if (!UUID_SEGMENT.test(projectId)) return children;

  const { data: project } = await client
    .from("projects")
    .select("id,name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) notFound();

  return (
    <ProjectBreadcrumb project={{ id: project.id, name: project.name }}>
      {children}
    </ProjectBreadcrumb>
  );
}
