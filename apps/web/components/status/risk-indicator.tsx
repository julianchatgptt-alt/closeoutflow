import { AlertTriangle, CircleHelp, ShieldCheck, ShieldX } from "lucide-react";
import { Badge, Tooltip } from "@closeoutflow/ui";

const risks = {
  Low: { tone: "success", icon: ShieldCheck },
  Medium: { tone: "warning", icon: AlertTriangle },
  High: { tone: "danger", icon: ShieldX },
  "Insufficient data": { tone: "neutral", icon: CircleHelp }
} as const;

export type RiskLevel = keyof typeof risks;

/**
 * @deprecated Risk scoring is a later-phase system that does not exist. This
 * component must not appear on any surface backed by real data. It survives
 * only for the dev-only component gallery and the honest, clearly-labelled
 * later-phase preview pages. Removed from the dashboard in Phase 6E-B2.
 */
export function RiskIndicator({ level, drivers }: { level: RiskLevel; drivers?: string }) {
  const { tone, icon: Icon } = risks[level];
  if (level === "Insufficient data") {
    return (
      <span className="inline-flex min-h-5 items-center gap-1 text-[11px] font-semibold text-muted-foreground">
        <Icon aria-hidden="true" className="h-3 w-3" />
        {level}
      </span>
    );
  }
  const indicator = (
    <Badge tone={tone} tabIndex={drivers ? 0 : undefined}>
      <Icon aria-hidden="true" className="h-3 w-3" />
      {level}
    </Badge>
  );
  return drivers ? <Tooltip content={drivers}>{indicator}</Tooltip> : indicator;
}

export function OverdueFlag({ label = "Overdue" }: { label?: string }) {
  return (
    <Badge tone="warning">
      <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
