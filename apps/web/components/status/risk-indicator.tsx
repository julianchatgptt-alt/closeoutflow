import { AlertTriangle, CircleHelp, ShieldCheck, ShieldX } from "lucide-react";

import { Badge, Tooltip } from "@closeoutflow/ui";

const risks = {
  Low: { tone: "success", icon: ShieldCheck },
  Medium: { tone: "warning", icon: AlertTriangle },
  High: { tone: "danger", icon: ShieldX },
  "Insufficient data": { tone: "neutral", icon: CircleHelp }
} as const;

export type RiskLevel = keyof typeof risks;

export function RiskIndicator({ level, drivers }: { level: RiskLevel; drivers?: string }) {
  const { tone, icon: Icon } = risks[level];
  const badge = (
    <Badge tone={tone}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {level}
    </Badge>
  );
  return drivers ? <Tooltip content={drivers}>{badge}</Tooltip> : badge;
}

export function OverdueFlag({ label = "Overdue" }: { label?: string }) {
  return (
    <Badge tone="warning">
      <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
