import type { ReactNode } from "react";

type ConceptId = "sealed-packet" | "closeout-check" | "keystone-fold";

type Concept = {
  id: ConceptId;
  label: string;
  letter: "A" | "B" | "C";
  meaning: string;
  strengths: string;
  weaknesses: string;
  smallSize: string;
  similarityRisk: string;
};

export const logoConcepts: readonly Concept[] = [
  {
    id: "sealed-packet",
    letter: "A",
    label: "The Sealed Packet",
    meaning: "An ordered record set whose final folded seal completes the handoff.",
    strengths: "Most directly connects organized documentation, readiness, and final delivery.",
    weaknesses: "The document rhythm must simplify at favicon size to avoid visual noise.",
    smallSize:
      "Strong silhouette; the 16px cut removes the inner record line while retaining the seal.",
    similarityRisk:
      "Low — the offset packet and integrated closure are more specific than a file icon."
  },
  {
    id: "closeout-check",
    letter: "B",
    label: "The Closeout Check",
    meaning: "Calibrated segments rise from progress to a precise completed state.",
    strengths: "Fast recognition, excellent reduction, and a confident sense of forward motion.",
    weaknesses: "Completion marks are common, so the stepped construction must remain distinctive.",
    smallSize: "Excellent; the progressive silhouette stays legible without internal detail.",
    similarityRisk:
      "Medium — differentiated by the three calibrated rising segments, not a generic tick."
  },
  {
    id: "keystone-fold",
    letter: "C",
    label: "The Keystone Fold",
    meaning: "An architectural frame closes around a deliberate aperture and final notch.",
    strengths: "Most structural and ownable, with a quiet name cue rather than a literal monogram.",
    weaknesses: "Its architectural weight can feel institutional if reproduced too heavily.",
    smallSize: "Good; the favicon cut enlarges the aperture and omits the secondary fold line.",
    similarityRisk:
      "Medium — the open keystone avoids the common solid chevron and fintech diamond."
  }
] as const;

function SealedPacket({ compact }: { compact: boolean }) {
  return (
    <>
      <path
        d="M8 14.5 13 9h17l10 10v20H13l-5-5.5v-19Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
      <path
        d="M30 9v10h10"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
      <path
        d="m27.5 16.5 3.8 3.8 8.2-9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="3.2"
      />
      {!compact ? (
        <>
          <path
            d="M8 19H5.5v18.5L10 42h24v-3"
            fill="none"
            opacity="0.45"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M16 27h15M16 33h11"
            fill="none"
            opacity="0.72"
            stroke="currentColor"
            strokeLinecap="square"
            strokeWidth="2.4"
          />
        </>
      ) : null}
    </>
  );
}

function CloseoutCheck() {
  return (
    <>
      <path d="m5 25.2 6.8-6.8 10.1 10.1-6.8 6.8L5 25.2Z" fill="currentColor" />
      <path d="m18.5 25.1 6.8 6.8 7.3-7.3-6.8-6.8-7.3 7.3Z" fill="currentColor" />
      <path d="m26.4 17.2 6.8 6.8 7.1-7.1-6.8-6.8-7.1 7.1Z" fill="currentColor" />
      <path d="m34.1 9.5 6.8 6.8L45 12.2V5.4h-6.8l-4.1 4.1Z" fill="currentColor" />
    </>
  );
}

function KeystoneFold({ compact }: { compact: boolean }) {
  return (
    <>
      <path
        d="M12 5h23l9 9-7 7h-9l6-6H17l-6 6v7l6 6h17l-6-6h9l7 7-9 9H12L4 36V13l8-8Z"
        fill="currentColor"
      />
      {!compact ? (
        <path
          d="m12 5 5 10v19l-5 10"
          fill="none"
          opacity="0.34"
          stroke="hsl(var(--surface))"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      ) : null}
    </>
  );
}

export function LogoSymbol({
  concept,
  size = 48,
  compact = false,
  accessibleName
}: {
  concept: ConceptId;
  size?: number;
  compact?: boolean;
  accessibleName?: string;
}) {
  const accessibility = accessibleName
    ? { role: "img", "aria-label": accessibleName }
    : { "aria-hidden": true };

  return (
    <svg
      {...accessibility}
      className="shrink-0"
      focusable="false"
      height={size}
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {concept === "sealed-packet" ? <SealedPacket compact={compact} /> : null}
      {concept === "closeout-check" ? <CloseoutCheck /> : null}
      {concept === "keystone-fold" ? <KeystoneFold compact={compact} /> : null}
    </svg>
  );
}

export function LogoLockup({
  concept,
  compact = false,
  inverse = false,
  fixedLightSurface = false
}: {
  concept: ConceptId;
  compact?: boolean;
  inverse?: boolean;
  fixedLightSurface?: boolean;
}) {
  const lockupInk = inverse
    ? "text-white"
    : fixedLightSurface
      ? "text-[#111827]"
      : "text-foreground";
  const symbolInk = inverse
    ? "text-white"
    : fixedLightSurface
      ? "text-[hsl(216_68%_36%)]"
      : "text-primary";

  return (
    <span
      aria-label="Closeout"
      className={`inline-flex items-center ${compact ? "gap-2" : "gap-3"} ${lockupInk}`}
      role="img"
    >
      <span aria-hidden="true" className={symbolInk}>
        <LogoSymbol concept={concept} compact={compact} size={compact ? 26 : 38} />
      </span>
      <span
        aria-hidden="true"
        className={`${compact ? "text-[15px]" : "text-[22px]"} font-semibold tracking-[-0.01em]`}
      >
        Closeout
      </span>
    </span>
  );
}

function PreviewSurface({
  label,
  children,
  dark = false,
  className = ""
}: {
  label: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`grid min-h-32 content-between gap-4 rounded-lg border p-4 ${
        dark ? "border-white/15 bg-[#11151c] text-white" : "bg-surface text-foreground"
      } ${className}`}
    >
      <p className={`text-overline ${dark ? "!text-white/65" : ""}`}>{label}</p>
      <div className="flex min-w-0 items-center justify-center">{children}</div>
    </div>
  );
}

function SizePreview({ concept }: { concept: Concept }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2" data-testid={`${concept.id}-applications`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <PreviewSurface label="Favicon 16×16">
          <span className="text-primary">
            <LogoSymbol concept={concept.id} compact size={16} />
          </span>
        </PreviewSurface>
        <PreviewSurface label="Favicon 32×32">
          <span className="text-primary">
            <LogoSymbol concept={concept.id} compact size={32} />
          </span>
        </PreviewSurface>
        <PreviewSurface label="App icon">
          <span className="grid size-16 place-items-center rounded-[18px] bg-primary text-primary-foreground">
            <LogoSymbol concept={concept.id} compact size={38} />
          </span>
        </PreviewSurface>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewSurface label="Collapsed sidebar">
          <div className="grid h-24 w-14 place-items-start justify-center rounded-lg bg-background pt-4 shadow-card">
            <span className="text-primary">
              <LogoSymbol concept={concept.id} compact size={28} />
            </span>
          </div>
        </PreviewSurface>
        <PreviewSurface label="Expanded sidebar">
          <div className="flex h-24 w-full max-w-52 items-start rounded-lg bg-background p-4 shadow-card">
            <LogoLockup concept={concept.id} compact />
          </div>
        </PreviewSurface>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
        <PreviewSurface label="Mobile header">
          <div className="flex h-14 w-full max-w-sm items-center border-b bg-background px-4">
            <LogoLockup concept={concept.id} compact />
          </div>
        </PreviewSurface>
        <PreviewSurface label="Email header">
          <div className="flex h-20 w-full max-w-sm items-center border-b bg-white px-5 text-[#111827]">
            <LogoLockup concept={concept.id} compact fixedLightSurface />
          </div>
        </PreviewSurface>
        <PreviewSurface label="Social avatar" className="sm:col-span-2">
          <span className="grid size-20 place-items-center rounded-full border-4 border-white bg-background text-primary shadow-card">
            <LogoSymbol concept={concept.id} compact size={44} />
          </span>
        </PreviewSurface>
      </div>
    </div>
  );
}

function MockField({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`h-8 rounded-md border ${dark ? "border-white/20 bg-white/5" : "bg-background"}`}
    />
  );
}

function DesktopSignIn({ concept, dark = false }: { concept: Concept; dark?: boolean }) {
  return (
    <div
      className={`grid min-h-64 overflow-hidden rounded-lg border lg:grid-cols-[0.84fr_1.16fr] ${
        dark ? "border-white/15 bg-[#151a22] text-white" : "bg-surface"
      }`}
    >
      <div className={`grid content-between gap-8 p-6 ${dark ? "bg-[#0d1117]" : "bg-background"}`}>
        <LogoLockup concept={concept.id} compact inverse={dark} />
        <div>
          <p className="font-semibold">Project records, ready for handoff.</p>
          <p className={`mt-2 text-xs ${dark ? "text-white/65" : "text-muted-foreground"}`}>
            Controlled access · documented history · construction closeout focus
          </p>
        </div>
      </div>
      <div className="grid content-center gap-4 p-6">
        <div>
          <p className="text-lg font-semibold">Sign in to Closeout</p>
          <p className={`mt-1 text-xs ${dark ? "text-white/65" : "text-muted-foreground"}`}>
            Visual review mockup only
          </p>
        </div>
        <div className="grid gap-2">
          <p className="text-xs font-medium">Work email</p>
          <MockField dark={dark} />
          <p className="mt-1 text-xs font-medium">Password</p>
          <MockField dark={dark} />
        </div>
        <div className={`h-9 rounded-md ${dark ? "bg-[#8db7f3]" : "bg-primary"}`} />
      </div>
    </div>
  );
}

function MobileSignIn({ concept }: { concept: Concept }) {
  return (
    <div className="mx-auto w-full max-w-64 rounded-[28px] border-[7px] border-foreground/85 bg-surface p-5 shadow-lg">
      <LogoLockup concept={concept.id} compact />
      <p className="mt-8 text-lg font-semibold">Welcome back</p>
      <p className="mt-1 text-xs text-muted-foreground">Sign in to your Closeout workspace.</p>
      <div className="mt-5 grid gap-3">
        <MockField />
        <MockField />
        <div className="h-10 rounded-md bg-primary" />
      </div>
      <p className="mt-5 border-t pt-4 text-[11px] text-muted-foreground">
        Private project information. Controlled access.
      </p>
    </div>
  );
}

function JourneyHeader({ concept, kind }: { concept: Concept; kind: "invite" | "onboarding" }) {
  const invitation = kind === "invite";
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-lg bg-surface shadow-card">
      <div className="border-b bg-background p-5">
        <LogoLockup concept={concept.id} compact />
      </div>
      <div className="p-5">
        <p className="text-overline">{invitation ? "Invitation" : "Welcome to Closeout"}</p>
        <p className="mt-2 text-lg font-semibold">
          {invitation ? "Join Northline Builders" : "Set up your workspace"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {invitation
            ? "You were invited as Project Manager. Review the organization before continuing."
            : "Start with your profile, then create or join an organization."}
        </p>
        <div className="mt-5 h-9 rounded-md bg-primary" />
      </div>
    </div>
  );
}

function AuthPreviews({ concept }: { concept: Concept }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2" data-testid={`${concept.id}-auth-previews`}>
      <PreviewSurface label="Desktop sign-in" className="min-h-80">
        <div className="w-full">
          <DesktopSignIn concept={concept} />
        </div>
      </PreviewSurface>
      <PreviewSurface label="Dark-mode sign-in" dark className="min-h-80">
        <div className="w-full">
          <DesktopSignIn concept={concept} dark />
        </div>
      </PreviewSurface>
      <PreviewSurface label="Mobile sign-in" className="min-h-[28rem]">
        <MobileSignIn concept={concept} />
      </PreviewSurface>
      <div className="grid gap-3">
        <PreviewSurface label="Invitation acceptance header">
          <JourneyHeader concept={concept} kind="invite" />
        </PreviewSurface>
        <PreviewSurface label="Onboarding header">
          <JourneyHeader concept={concept} kind="onboarding" />
        </PreviewSurface>
      </div>
    </div>
  );
}

function ComparisonCard({ concept, children }: { concept: Concept; children: ReactNode }) {
  return (
    <div className="grid content-between gap-4 bg-surface p-4 shadow-card">
      <div>
        <p className="text-overline">Concept {concept.letter}</p>
        <p className="mt-1 font-semibold">{concept.label}</p>
      </div>
      {children}
    </div>
  );
}

function AppliedComparisonBoards() {
  return (
    <div className="grid gap-8 border-t pt-8" data-testid="logo-applied-comparisons">
      <div>
        <h3 className="text-overline mb-3">Favicon comparison</h3>
        <div className="grid gap-3 md:grid-cols-3" data-testid="all-favicon-previews">
          {logoConcepts.map((concept) => (
            <ComparisonCard concept={concept} key={concept.id}>
              <div className="flex items-end justify-center gap-7 py-6 text-primary">
                <div className="grid justify-items-center gap-2">
                  <LogoSymbol concept={concept.id} compact size={16} />
                  <span className="text-xs text-muted-foreground">16px</span>
                </div>
                <div className="grid justify-items-center gap-2">
                  <LogoSymbol concept={concept.id} compact size={32} />
                  <span className="text-xs text-muted-foreground">32px</span>
                </div>
              </div>
            </ComparisonCard>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-overline mb-3">Sidebar comparison</h3>
        <div className="grid gap-3 md:grid-cols-3" data-testid="all-sidebar-previews">
          {logoConcepts.map((concept) => (
            <ComparisonCard concept={concept} key={concept.id}>
              <div className="flex items-start justify-center gap-3 py-4">
                <div className="grid h-24 w-14 place-items-start justify-center rounded-lg bg-background pt-4 shadow-card">
                  <span className="text-primary">
                    <LogoSymbol concept={concept.id} compact size={28} />
                  </span>
                </div>
                <div className="flex h-24 flex-1 items-start rounded-lg bg-background p-4 shadow-card">
                  <LogoLockup concept={concept.id} compact />
                </div>
              </div>
            </ComparisonCard>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-overline mb-3">Desktop authentication comparison</h3>
        <div className="grid gap-3 xl:grid-cols-3" data-testid="all-desktop-auth-previews">
          {logoConcepts.map((concept) => (
            <ComparisonCard concept={concept} key={concept.id}>
              <DesktopSignIn concept={concept} />
            </ComparisonCard>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-overline mb-3">Mobile authentication comparison</h3>
        <div className="grid gap-3 md:grid-cols-3" data-testid="all-mobile-auth-previews">
          {logoConcepts.map((concept) => (
            <ComparisonCard concept={concept} key={concept.id}>
              <MobileSignIn concept={concept} />
            </ComparisonCard>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-overline mb-3">Invitation and onboarding comparison</h3>
        <div className="grid gap-3 xl:grid-cols-3" data-testid="all-journey-previews">
          {logoConcepts.map((concept) => (
            <ComparisonCard concept={concept} key={concept.id}>
              <div className="grid gap-3">
                <JourneyHeader concept={concept} kind="invite" />
                <JourneyHeader concept={concept} kind="onboarding" />
              </div>
            </ComparisonCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConceptDetail({ concept }: { concept: Concept }) {
  return (
    <article
      aria-labelledby={`${concept.id}-title`}
      className="grid gap-6 border-t pt-8"
      data-testid={`concept-${concept.letter.toLowerCase()}-detail`}
      id={`concept-${concept.letter.toLowerCase()}`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)] lg:items-end">
        <div>
          <p className="text-overline">Concept {concept.letter}</p>
          <h3 className="mt-2 text-page-title" id={`${concept.id}-title`}>
            {concept.label}
          </h3>
          <p className="mt-2 max-w-2xl text-muted-foreground">{concept.meaning}</p>
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <dt className="font-semibold">Strengths</dt>
            <dd className="text-muted-foreground">{concept.strengths}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <dt className="font-semibold">Potential weakness</dt>
            <dd className="text-muted-foreground">{concept.weaknesses}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <dt className="font-semibold">Small-size</dt>
            <dd className="text-muted-foreground">{concept.smallSize}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <dt className="font-semibold">Similarity risk</dt>
            <dd className="text-muted-foreground">{concept.similarityRisk}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-3 md:grid-cols-3" data-testid={`${concept.id}-identity-variants`}>
        <PreviewSurface label="Light background">
          <div className="grid justify-items-center gap-4 text-primary">
            <LogoSymbol concept={concept.id} size={64} />
            <LogoLockup concept={concept.id} />
            <LogoLockup concept={concept.id} compact />
          </div>
        </PreviewSurface>
        <PreviewSurface label="Dark background" dark>
          <div className="grid justify-items-center gap-4 text-white">
            <LogoSymbol concept={concept.id} size={64} />
            <LogoLockup concept={concept.id} inverse />
            <LogoLockup concept={concept.id} compact inverse />
          </div>
        </PreviewSurface>
        <PreviewSurface label="Monochrome">
          <div className="grid justify-items-center gap-4 text-foreground">
            <LogoSymbol concept={concept.id} size={64} />
            <LogoLockup concept={concept.id} />
            <p className="text-xs text-muted-foreground">Single-ink construction</p>
          </div>
        </PreviewSurface>
      </div>

      <div>
        <h4 className="text-overline mb-3">Applied sizes and surfaces</h4>
        <SizePreview concept={concept} />
      </div>

      <div>
        <h4 className="text-overline mb-3">Authentication presentation mockups</h4>
        <AuthPreviews concept={concept} />
      </div>
    </article>
  );
}

export function LogoFounderReview() {
  return (
    <section
      aria-labelledby="logo-founder-review-title"
      className="grid gap-8 border-t pt-8"
      data-testid="logo-founder-review"
      id="logo-founder-review"
    >
      <div className="grid gap-8" data-testid="logo-review-comparison">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-overline">Phase 5E-B1 · visual checkpoint</p>
            <span className="rounded-md border bg-warning-subtle px-2 py-1 text-xs font-semibold text-warning">
              No selection recorded
            </span>
          </div>
          <h2 className="text-[length:var(--text-h2)] font-semibold" id="logo-founder-review-title">
            Closeout Logo Founder Review
          </h2>
          <p className="max-w-3xl text-muted-foreground">
            Three production-minded directions shown under identical conditions. These are review
            specimens only; the temporary application mark remains active until the founder records
            a decision.
          </p>
        </div>
        <div>
          <h3 className="text-overline mb-3">Neutral comparison</h3>
          <div className="grid gap-3 md:grid-cols-3" data-testid="logo-neutral-comparison">
            {logoConcepts.map((concept) => (
              <article
                className="grid min-h-72 content-between gap-6 bg-surface p-6 shadow-card"
                key={concept.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-overline">Concept {concept.letter}</p>
                    <h4 className="mt-2 text-lg font-semibold">{concept.label}</h4>
                  </div>
                  <span className="text-primary">
                    <LogoSymbol
                      accessibleName={`Closeout ${concept.label} concept symbol`}
                      concept={concept.id}
                      size={56}
                    />
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{concept.meaning}</p>
                <span className="border-t pt-4">
                  <LogoLockup concept={concept.id} />
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>

      <AppliedComparisonBoards />

      {logoConcepts.map((concept) => (
        <ConceptDetail concept={concept} key={concept.id} />
      ))}

      <div className="rounded-lg border bg-info-subtle p-5 text-sm">
        <p className="font-semibold">Founder decision required before global application</p>
        <p className="mt-1 text-muted-foreground">
          This gallery intentionally provides no select button. Record the chosen direction in a
          separate logo-decision document only after founder review.
        </p>
      </div>
    </section>
  );
}
