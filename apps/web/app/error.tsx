"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, ErrorState } from "@closeoutflow/ui";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The Phase 2 observability boundary owns production reporting. Never render raw error details.
    void error.digest;
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-background p-[var(--page-gutter)]">
      <div className="grid w-full max-w-xl gap-4">
        <p className="text-center text-sm font-semibold text-primary">Closeout</p>
        <ErrorState description="Closeout could not display this page. Try again or return to the dashboard." />
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-muted"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
