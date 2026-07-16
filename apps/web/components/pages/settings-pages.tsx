import { EmptyState } from "@closeoutflow/ui";

import { OrganizationSettingsForm } from "../form/sample-form";
import { PageHeader } from "../shell/page-header";

export function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Company-wide analytics and reports arrive in Phase 11. No charts or live metrics are shown."
      />
      <EmptyState
        title="Reports arrive in Phase 11"
        description="This intentionally disabled preview makes no claim that reporting is functional."
      />
    </>
  );
}

export function SettingsGeneralPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Organization settings are a read-only Phase 3 preview."
      />
      <OrganizationSettingsForm />
    </>
  );
}

export function FutureSettingsPage({ title, phase }: { title: string; phase: number }) {
  return (
    <>
      <PageHeader
        title={title}
        description={`This settings area becomes functional in Phase ${phase}.`}
      />
      <EmptyState
        title={`${title} arrives in Phase ${phase}`}
        description="No configuration, credentials, billing information, or audit data exists on this preview route."
      />
    </>
  );
}
