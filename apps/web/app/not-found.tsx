import Link from "next/link";

import { EmptyState } from "@closeoutflow/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-[var(--page-gutter)]">
      <div className="w-full max-w-xl">
        <p className="mb-4 text-center text-sm font-semibold text-primary">Closeout</p>
        <EmptyState
          title="Page not found"
          /* Deliberately non-enumerating: this reads the same whether the page
             does not exist or the viewer simply has no access to it. */
          description="This page does not exist, or you don't have access to it."
          action={
            <Link
              href="/dashboard"
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Return to dashboard
            </Link>
          }
        />
      </div>
    </main>
  );
}
