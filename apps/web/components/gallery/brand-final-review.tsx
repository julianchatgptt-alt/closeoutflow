import { Alert, Badge, Button, Card, CardContent, Input, Label, Skeleton } from "@closeoutflow/ui";
import { Check, KeyRound, MailCheck, ShieldCheck } from "lucide-react";

import { CloseoutLogo, CloseoutMark } from "../brand/closeout-logo";

function ReviewBlock({
  label,
  children,
  className = "",
  labelClassName = ""
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={`rounded-lg border bg-surface p-4 ${className}`}>
      <p className={`text-overline ${labelClassName}`}>{label}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function AuthSpecimen({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-card">
      <div className="grid min-h-[350px] md:grid-cols-[0.88fr_1.12fr]">
        <div className="hidden bg-[#102238] p-6 text-white md:flex md:flex-col">
          <CloseoutLogo compact variant="inverse" />
          <div className="mt-auto">
            <p className="text-xl font-semibold leading-7 tracking-tight">
              Every record ready for handoff.
            </p>
            <p className="mt-2 text-xs leading-5 text-[#c7d5e4]">
              Organized records · controlled access · documented history
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-5">
          <Card className="w-full max-w-sm shadow-card">
            <CardContent className="p-6">
              <p className="text-overline">Closeout workspace</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
              <div className="mt-5">{children}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function BrandFinalReview() {
  return (
    <section
      className="grid gap-8 border-t-2 border-primary pt-8"
      aria-labelledby="brand-final-title"
    >
      <header className="max-w-3xl">
        <Badge tone="success">Founder selected · final application</Badge>
        <h2 id="brand-final-title" className="mt-3 text-2xl font-semibold tracking-tight">
          Phase 5E Final Brand &amp; Authentication Review
        </h2>
        <p className="mt-2 leading-6 text-muted-foreground">
          The refined Keystone Fold, production lockups, browser assets, and honest authentication
          states shown together for final visual validation.
        </p>
      </header>

      <div className="grid gap-4" data-testid="final-logo-system">
        <p className="text-overline">Final logo system</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReviewBlock label="Primary symbol" className="min-h-44">
            <div className="grid place-items-center py-4 text-primary">
              <CloseoutMark title="Closeout final Keystone Fold symbol" size={84} />
            </div>
          </ReviewBlock>
          <ReviewBlock label="Horizontal wordmark" className="min-h-44">
            <div className="grid place-items-center py-7">
              <CloseoutLogo />
            </div>
          </ReviewBlock>
          <ReviewBlock label="Monochrome" className="min-h-44">
            <div className="grid place-items-center py-4 text-foreground">
              <CloseoutMark size={84} />
            </div>
          </ReviewBlock>
          <ReviewBlock
            label="Inverse"
            className="min-h-44 !bg-[#102238] text-white"
            labelClassName="!text-white/70"
          >
            <div className="grid place-items-center py-7">
              <CloseoutLogo variant="inverse" />
            </div>
          </ReviewBlock>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ReviewBlock label="16×16 favicon">
            {/* Generated local brand asset; plain img verifies the real raster. */}
            <img
              src="/brand/favicon-16.png"
              width="16"
              height="16"
              alt="Closeout 16 pixel favicon"
              className="mx-auto my-5"
            />
          </ReviewBlock>
          <ReviewBlock label="32×32 favicon">
            <img
              src="/brand/favicon-32.png"
              width="32"
              height="32"
              alt="Closeout 32 pixel favicon"
              className="mx-auto my-3"
            />
          </ReviewBlock>
          <ReviewBlock label="48×48 search icon">
            <img
              src="/brand/favicon-48.png"
              width="48"
              height="48"
              alt="Closeout 48 pixel search favicon"
              className="mx-auto my-1"
            />
          </ReviewBlock>
          <ReviewBlock label="Apple touch icon">
            <img
              src="/brand/apple-touch-icon.png"
              width="64"
              height="64"
              alt="Closeout Apple touch icon"
              className="mx-auto rounded-xl"
            />
          </ReviewBlock>
          <ReviewBlock label="PWA icon">
            <img
              src="/brand/icon-192.png"
              width="64"
              height="64"
              alt="Closeout PWA icon"
              className="mx-auto rounded-xl"
            />
          </ReviewBlock>
        </div>
      </div>

      <div className="grid gap-4" data-testid="final-shell-branding">
        <p className="text-overline">Application shell</p>
        <div className="grid gap-3 lg:grid-cols-3">
          <ReviewBlock label="Expanded sidebar">
            <div className="h-36 rounded-lg bg-background p-[18px] shadow-card">
              <CloseoutLogo compact />
            </div>
          </ReviewBlock>
          <ReviewBlock label="Collapsed sidebar">
            <div className="mx-auto grid h-36 w-16 place-items-start justify-center rounded-lg bg-background pt-[18px] text-primary shadow-card">
              <CloseoutMark compact size={27} />
            </div>
          </ReviewBlock>
          <ReviewBlock label="Mobile header">
            <div className="flex h-14 items-center rounded-lg bg-background px-4 shadow-card">
              <CloseoutLogo compact />
            </div>
          </ReviewBlock>
        </div>
      </div>

      <div className="grid gap-4" data-testid="final-auth-experience">
        <p className="text-overline">Authentication experience</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <AuthSpecimen
            title="Welcome back"
            description="Sign in to continue to your Closeout workspace."
          >
            <div className="grid gap-3">
              <Label htmlFor="final-review-email">Email</Label>
              <Input id="final-review-email" value="project.manager@example.com" readOnly />
              <Label htmlFor="final-review-password">Password</Label>
              <Input id="final-review-password" value="••••••••••••" readOnly />
              <Button>Sign in</Button>
            </div>
          </AuthSpecimen>
          <div className="mx-auto w-full max-w-[390px] rounded-[2rem] border-[8px] border-[#102238] bg-background p-4 shadow-lg">
            <div className="py-7">
              <div className="mb-7 flex justify-center">
                <CloseoutLogo compact />
              </div>
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-overline">Get started</p>
                  <h3 className="mt-2 text-xl font-semibold">Create your account</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set up your identity, then create or join a workspace.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <Input aria-label="Your name preview" placeholder="Your name" readOnly />
                    <Input aria-label="Email preview" placeholder="Work email" readOnly />
                    <Button>Create account</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4" data-testid="final-invitation-onboarding">
        <p className="text-overline">Invitation &amp; onboarding states</p>
        <div className="grid gap-3 lg:grid-cols-3">
          <ReviewBlock label="Invitation · valid">
            <CloseoutLogo compact />
            <h3 className="mt-5 text-lg font-semibold">Join Northline Builders</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Project Manager · invited email verified
            </p>
            <Button className="mt-5 w-full">Accept invitation</Button>
          </ReviewBlock>
          <ReviewBlock label="Invitation · expired">
            <MailCheck aria-hidden="true" className="size-6 text-danger-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Invitation unavailable</h3>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              This link is no longer valid. Ask an administrator to resend it.
            </p>
            <Button className="mt-5 w-full" variant="outline">
              Return to sign in
            </Button>
          </ReviewBlock>
          <ReviewBlock label="Invitation · wrong account">
            <Alert tone="danger" title="This invitation is for another email address." />
            <p className="mt-4 text-sm leading-5 text-muted-foreground">
              Continue with the invited email. The invitation is never silently reassigned.
            </p>
            <Button className="mt-5 w-full" variant="outline">
              Use another account
            </Button>
          </ReviewBlock>
          <ReviewBlock label="Organization setup" className="lg:col-span-2">
            <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="grid size-12 place-items-center rounded-lg bg-info-subtle text-primary">
                <CloseoutMark compact size={28} />
              </div>
              <div>
                <p className="text-overline">Workspace setup · Step 1 of 1</p>
                <h3 className="mt-2 text-lg font-semibold">Create your organization</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The organization is the secure boundary for members and future project data.
                </p>
              </div>
            </div>
          </ReviewBlock>
          <ReviewBlock label="Organization selection">
            <p className="font-medium">Northline Builders</p>
            <Badge className="mt-2">project manager</Badge>
            <Button className="mt-5 w-full" variant="outline">
              Open workspace
            </Button>
          </ReviewBlock>
        </div>
      </div>

      <div className="grid gap-4" data-testid="final-mfa-recovery">
        <p className="text-overline">MFA &amp; recovery presentation</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <ReviewBlock label="Authenticator setup">
            <div className="grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-center">
              <div className="grid aspect-square place-items-center rounded-lg border bg-white text-[#102238]">
                <div
                  className="grid grid-cols-5 gap-1"
                  aria-label="QR presentation placeholder"
                  role="img"
                >
                  {Array.from({ length: 25 }, (_, index) => (
                    <span
                      key={index}
                      className={`size-3 ${index % 3 === 0 || index % 7 === 0 ? "bg-[#102238]" : "bg-white"}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">Scan, then verify</h3>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Add Closeout to your authenticator and enter the current code.
                </p>
                <Input
                  className="mt-4 font-mono tracking-[0.28em]"
                  value="123456"
                  aria-label="Authentication code preview"
                  readOnly
                />
              </div>
            </div>
          </ReviewBlock>
          <ReviewBlock label="Recovery codes">
            <p className="flex items-center gap-2 font-semibold">
              <KeyRound aria-hidden="true" className="size-4 text-warning-foreground" />
              Save these codes now
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Each code works once and is shown once.
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-surface-sunken p-4 font-mono text-sm">
              {["COT-4J8M-P2QK", "COT-9N3R-X7VL", "COT-5B1T-W8DZ", "COT-7K6P-H4SF"].map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          </ReviewBlock>
        </div>
      </div>

      <div className="grid gap-4" data-testid="final-system-states">
        <p className="text-overline">Loading, success, error &amp; permission states</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <ReviewBlock label="Loading">
            <div className="space-y-3" role="status" aria-label="Loading account state">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </ReviewBlock>
          <ReviewBlock label="Email verified">
            <Alert tone="success" title="Email verified">
              Your identity is confirmed. Continue to your Closeout workspace.
            </Alert>
          </ReviewBlock>
          <ReviewBlock label="Error">
            <Alert tone="danger" title="We couldn’t complete that request">
              Try again. No account or workspace change was saved.
            </Alert>
          </ReviewBlock>
          <ReviewBlock label="Permission denied">
            <Alert tone="warning" title="You don’t have access to this workspace">
              Switch organizations or contact an organization administrator.
            </Alert>
          </ReviewBlock>
        </div>
      </div>

      <div className="grid gap-4" data-testid="final-email-social">
        <p className="text-overline">Email &amp; social assets</p>
        <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
          <ReviewBlock label="Email header">
            <div className="rounded-lg bg-white p-6">
              <img
                src="/brand/email-header.png"
                width="240"
                height="60"
                alt="Closeout email header"
              />
              <div className="mt-5 h-px bg-[#e0e4e9]" />
              <p className="mt-5 text-sm font-semibold text-[#182230]">
                You’re invited to Closeout
              </p>
            </div>
          </ReviewBlock>
          <ReviewBlock label="Open Graph · 1200×630">
            <img
              src="/brand/opengraph.png"
              width="1200"
              height="630"
              alt="Closeout Open Graph preview"
              className="w-full rounded-lg"
            />
          </ReviewBlock>
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm text-success-foreground">
        <Check aria-hidden="true" className="size-4" />
        Static visual evidence only; no authentication action is invoked from this review.
      </p>
    </section>
  );
}
