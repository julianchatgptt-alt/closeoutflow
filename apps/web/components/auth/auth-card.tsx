import { Card, CardContent } from "@closeoutflow/ui";
import Link from "next/link";

export function AuthCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-6 flex w-fit items-center gap-2.5 font-semibold"
          aria-label="Closeout home"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            C
          </span>
          <span>Closeout</span>
        </Link>
        <Card className="ring-1 ring-border">
          <CardContent className="p-6 sm:p-8">
            <header className="mb-6 space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </header>
            {children}
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-xs text-subtle-foreground">
          Secure identity for your Closeout workspace
        </p>
      </div>
    </main>
  );
}
