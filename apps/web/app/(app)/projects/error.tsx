"use client";

import { Button, ErrorState } from "@closeoutflow/ui";
import { useEffect } from "react";

export default function ProjectsError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Production reporting is handled by the application observability boundary.
    void error.digest;
  }, [error]);

  return (
    <div className="grid gap-4">
      <ErrorState description="Projects could not be loaded. No changes were made." />
      <div className="flex justify-center">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
