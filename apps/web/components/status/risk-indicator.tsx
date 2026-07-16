import { AlertTriangle, CircleHelp, ShieldCheck, ShieldX } from "lucide-react";
import { useId } from "react";

import { Badge } from "@closeoutflow/ui";

const risks = {
  Low: { tone: "success", icon: ShieldCheck },
  Medium: { tone: "warning", icon: AlertTriangle },
  High: { tone: "danger", icon: ShieldX },
  "Insufficient data": { tone: "neutral", icon: CircleHelp }
} as const;

export type RiskLevel = keyof typeof risks;

export function RiskIndicator({ level, drivers }: { level: RiskLevel; drivers?: string }) {
  const { tone, icon: Icon } = risks[level];
  const descriptionId = useId();
  return (
    <span className="inline-flex max-w-xs flex-col items-start gap-1">
      <Badge tone={tone} aria-describedby={drivers ? descriptionId : undefined}>
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {level}
      </Badge>
      {drivers ? (
        <span id={descriptionId} className="text-xs text-muted-foreground">
          {drivers}
        </span>
      ) : null}
    </span>
  );
}

export function OverdueFlag({ label = "Overdue" }: { label?: string }) {
  return (
    <Badge tone="warning">
      <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
