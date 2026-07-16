import { Button } from "@closeoutflow/ui";

export function DisabledPhaseAction({ label, phase }: { label: string; phase: number }) {
  return (
    <Button disabled>
      {label} — Phase {phase}
    </Button>
  );
}
