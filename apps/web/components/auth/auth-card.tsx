import { Card, CardContent } from "@closeoutflow/ui";
import { Check, FileCheck2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { CloseoutLogo, CloseoutMark } from "../brand/closeout-logo";

export function AuthCard({
  title,
  description,
  eyebrow = "Closeout workspace",
  children
}: {
  title: string;
  description: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(25rem,0.92fr)_minmax(34rem,1.08fr)]">
      <section
        className="relative hidden min-h-screen overflow-hidden bg-[#102238] px-10 py-9 text-white lg:flex lg:flex-col"
        aria-label="About Closeout"
      >
        <Link href="/" aria-label="Closeout home" className="relative z-10 w-fit">
          <CloseoutLogo variant="inverse" />
        </Link>

        <div className="relative z-10 my-auto max-w-lg py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9bb8d6]">
            Construction closeout, organized
          </p>
          <h2 className="mt-5 text-[clamp(2.4rem,4vw,4rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
            Every record ready for handoff.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-[#c7d5e4]">
            Bring project requirements, document history, and team access into one calm, accountable
            workspace.
          </p>
          <ul className="mt-9 grid gap-4 text-sm text-[#d9e4ef]">
            <li className="flex items-center gap-3">
              <FileCheck2 aria-hidden="true" className="size-4 text-[#8bb6e8]" />
              Organized project records
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck aria-hidden="true" className="size-4 text-[#8bb6e8]" />
              Controlled workspace access
            </li>
            <li className="flex items-center gap-3">
              <Check aria-hidden="true" className="size-4 text-[#8bb6e8]" />
              Documented history from setup to handoff
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-[#9bb0c7]">closeoutflow.com</p>
        <div aria-hidden="true" className="absolute -bottom-32 -right-28 text-white/[0.045]">
          <CloseoutMark size={430} />
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[29rem]">
          <Link href="/" className="mx-auto mb-7 block w-fit lg:hidden" aria-label="Closeout home">
            <CloseoutLogo />
          </Link>
          <Card className="overflow-hidden border-border/90 bg-surface shadow-card">
            <CardContent className="p-6 sm:p-9">
              <header className="mb-7">
                <p className="text-overline">{eyebrow}</p>
                <h1 className="mt-2.5 text-[1.75rem] font-semibold leading-9 tracking-[-0.025em]">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </header>
              {children}
            </CardContent>
          </Card>
          <p className="mt-5 text-center text-xs text-subtle-foreground">
            Private project information. Controlled access.
          </p>
        </div>
      </section>
    </main>
  );
}
