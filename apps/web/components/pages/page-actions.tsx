import { Lock } from "lucide-react";

import { Button, Tooltip } from "@closeoutflow/ui";

export function DisabledPhaseAction({ label, phase }: { label: string; phase: number }) {
  return (
    <Tooltip content={`Available in Phase ${phase}`}>
      <span>
        <Button variant="outline" disabled>
          <Lock aria-hidden="true" className="h-4 w-4" />
          {label}
        </Button>
      </span>
    </Tooltip>
  );
}
