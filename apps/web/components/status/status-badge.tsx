import {
  Activity,
  Archive,
  Check,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock,
  Eye,
  File,
  History,
  LoaderCircle,
  Mail,
  Send,
  ShieldAlert,
  type LucideIcon,
  Upload,
  User,
  UserCheck,
  X
} from "lucide-react";

import { Badge } from "@closeoutflow/ui";

export type StatusCategory = keyof typeof statusValues;
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "owner";

export const statusValues = {
  project: [
    "Draft",
    "Active",
    "Closeout In Progress",
    "Owner Review",
    "Published",
    "Complete",
    "Archived",
    "Cancelled"
  ],
  requirement: [
    "Not assigned",
    "Requested",
    "Submitted",
    "Processing",
    "Under review",
    "Approved",
    "Approved with conditions",
    "Rejected",
    "Not applicable requested",
    "Not applicable approved",
    "Waived",
    "Complete"
  ],
  document: [
    "Uploading",
    "Processing",
    "Available",
    "Failed processing",
    "Classified",
    "Under review",
    "Approved",
    "Superseded",
    "Quarantined",
    "Archived",
    "Deleted (soft)"
  ],
  review: [
    "Not started",
    "Assigned",
    "In progress",
    "Approved",
    "Approved with conditions",
    "Rejected",
    "Cancelled",
    "Superseded"
  ],
  package: [
    "Draft",
    "Generating",
    "Validation failed",
    "Ready for review",
    "Approved",
    "Published",
    "Superseded",
    "Archived"
  ],
  invitation: ["Pending", "Active", "Accepted", "Expired", "Revoked"],
  notification: [
    "Queued",
    "Processing",
    "Delivered",
    "Deferred",
    "Bounced",
    "Failed",
    "Suppressed",
    "Opened"
  ],
  subscription: ["Trialing", "Active", "Past due", "Suspended", "Cancelled", "Expired"]
} as const;

type Presentation = {
  tone: StatusTone;
  icon: LucideIcon;
};

const neutral: Presentation = { tone: "neutral", icon: Circle };
const info: Presentation = { tone: "info", icon: Activity };
const success: Presentation = { tone: "success", icon: CheckCircle2 };
const warning: Presentation = { tone: "warning", icon: Clock };
const danger: Presentation = { tone: "danger", icon: X };

const shared: Record<string, Presentation> = {
  Draft: { tone: "neutral", icon: File },
  Active: info,
  Published: success,
  Complete: success,
  Archived: { tone: "neutral", icon: Archive },
  Cancelled: danger,
  Processing: { tone: "info", icon: LoaderCircle },
  "Under review": { tone: "info", icon: Eye },
  Approved: { tone: "success", icon: Check },
  "Approved with conditions": { tone: "warning", icon: Check },
  Rejected: danger,
  Superseded: { tone: "neutral", icon: History },
  Expired: { tone: "neutral", icon: Clock }
};

export const STATUS_PRESENTATION: Record<StatusCategory, Record<string, Presentation>> = {
  project: {
    ...shared,
    Draft: shared.Draft!,
    Active: shared.Active!,
    "Closeout In Progress": info,
    "Owner Review": { tone: "owner", icon: UserCheck },
    Published: success,
    Complete: success,
    Archived: shared.Archived!,
    Cancelled: danger
  },
  requirement: {
    ...shared,
    "Not assigned": { tone: "neutral", icon: CircleDashed },
    Requested: { tone: "info", icon: Send },
    Submitted: { tone: "info", icon: Upload },
    Processing: shared.Processing!,
    "Under review": shared["Under review"]!,
    Approved: success,
    "Approved with conditions": warning,
    Rejected: danger,
    "Not applicable requested": neutral,
    "Not applicable approved": neutral,
    Waived: neutral,
    Complete: success
  },
  document: {
    ...shared,
    Uploading: { tone: "info", icon: Upload },
    Processing: shared.Processing!,
    Available: { tone: "neutral", icon: File },
    "Failed processing": danger,
    Classified: info,
    "Under review": shared["Under review"]!,
    Approved: success,
    Superseded: shared.Superseded!,
    Quarantined: { tone: "danger", icon: ShieldAlert },
    Archived: shared.Archived!,
    "Deleted (soft)": neutral
  },
  review: {
    ...shared,
    "Not started": neutral,
    Assigned: { tone: "info", icon: User },
    "In progress": { tone: "info", icon: Eye },
    Approved: success,
    "Approved with conditions": warning,
    Rejected: danger,
    Cancelled: neutral,
    Superseded: shared.Superseded!
  },
  package: {
    ...shared,
    Draft: shared.Draft!,
    Generating: { tone: "info", icon: LoaderCircle },
    "Validation failed": warning,
    "Ready for review": { tone: "info", icon: Eye },
    Approved: success,
    Published: success,
    Superseded: shared.Superseded!,
    Archived: shared.Archived!
  },
  invitation: {
    Pending: { tone: "info", icon: Mail },
    Active: info,
    Accepted: success,
    Expired: shared.Expired!,
    Revoked: danger
  },
  notification: {
    Queued: neutral,
    Processing: shared.Processing!,
    Delivered: success,
    Deferred: warning,
    Bounced: danger,
    Failed: danger,
    Suppressed: neutral,
    Opened: success
  },
  subscription: {
    Trialing: info,
    Active: success,
    "Past due": warning,
    Suspended: danger,
    Cancelled: neutral,
    Expired: neutral
  }
};

export function StatusBadge({ category, status }: { category: StatusCategory; status: string }) {
  const presentation = STATUS_PRESENTATION[category][status];
  if (!presentation) throw new Error(`Unknown ${category} status: ${status}`);
  const Icon = presentation.icon;
  return (
    <Badge tone={presentation.tone}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span>{status}</span>
    </Badge>
  );
}
