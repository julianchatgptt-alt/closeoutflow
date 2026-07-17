import { EmptyState } from "@closeoutflow/ui";

import { OrganizationSettingsForm } from "../form/sample-form";
import { PageHeader } from "../shell/page-header";

export function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Portfolio reporting and project closeout insights."
        previewPhase={11}
      />
      <EmptyState
        title="No reports yet"
        description="Reporting views will appear in this workspace."
      />
    </>
  );
}

export function SettingsGeneralPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Organization identity and workspace preferences."
        previewPhase={4}
      />
      <OrganizationSettingsForm />
    </>
  );
}

export function FutureSettingsPage({ title, phase }: { title: string; phase: number }) {
  return (
    <>
      <PageHeader title={title} previewPhase={phase} />
      <EmptyState
        title={`No ${title.toLowerCase()} settings yet`}
        description="This settings area has no configuration to show."
      />
    </>
  );
}
