type Refinement = {
  id: "notched-beam" | "open-packet" | "stepped-fold";
  name: string;
  note: string;
  paths: string[];
};

export const keystoneRefinements: Refinement[] = [
  {
    id: "notched-beam",
    name: "A — Notched Beam",
    note: "A centered keystone notch turns a structural beam into the receiving edge for a separate completion stroke.",
    paths: ["M7 12h12l5 6 5-6h12", "M8 30l10 9 22-20"]
  },
  {
    id: "open-packet",
    name: "B — Open Packet",
    note: "Two separated record corners frame an open center while the lower stroke confirms completion without closing the form.",
    paths: ["M8 20V10h12", "M40 20V10H29", "M9 30l9 9 21-20"]
  },
  {
    id: "stepped-fold",
    name: "C — Stepped Fold",
    note: "A square construction joint replaces the bowl and chevron rhythms, then resolves through a separate completion stroke.",
    paths: ["M7 12h13v7h8v-7h13", "M8 30l10 9 22-20"]
  }
];

function RefinementMark({
  refinement,
  size,
  title,
  className = ""
}: {
  refinement: Refinement;
  size: number;
  title?: string;
  className?: string;
}) {
  const accessibility = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };

  return (
    <svg
      {...accessibility}
      className={`shrink-0 ${className}`}
      focusable="false"
      height={size}
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {refinement.paths.map((path) => (
        <path
          d={path}
          fill="none"
          key={path}
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="6"
        />
      ))}
    </svg>
  );
}

function RefinementLockup({
  refinement,
  inverse = false,
  compact = false
}: {
  refinement: Refinement;
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      aria-label={`Closeout — ${refinement.name}`}
      className={`inline-flex items-center ${compact ? "gap-2.5" : "gap-3.5"}`}
      role="img"
    >
      <RefinementMark
        className={inverse ? "text-white" : "text-primary"}
        refinement={refinement}
        size={compact ? 27 : 38}
      />
      <span
        aria-hidden="true"
        className={`${compact ? "text-[15px]" : "text-[22px]"} font-semibold leading-none tracking-[-0.025em] ${
          inverse ? "text-white" : "text-foreground"
        }`}
      >
        Closeout
      </span>
    </span>
  );
}

function Specimen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-overline">{label}</p>
      <div className="mt-4 flex min-h-16 items-center justify-center">{children}</div>
    </div>
  );
}

function RefinementCard({ refinement }: { refinement: Refinement }) {
  return (
    <article className="grid gap-4" data-refinement={refinement.id}>
      <header className="min-h-24 border-b pb-4">
        <h3 className="text-lg font-semibold">{refinement.name}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{refinement.note}</p>
      </header>

      <Specimen label="Symbol only">
        <RefinementMark refinement={refinement} size={72} title={refinement.name} />
      </Specimen>

      <Specimen label="Horizontal wordmark">
        <RefinementLockup refinement={refinement} />
      </Specimen>

      <Specimen label="Expanded sidebar">
        <div className="w-full rounded-md border bg-surface px-4 py-5 shadow-card">
          <RefinementLockup compact refinement={refinement} />
        </div>
      </Specimen>

      <Specimen label="Collapsed sidebar">
        <div className="grid size-14 place-items-center rounded-md border bg-surface shadow-card">
          <RefinementMark
            refinement={refinement}
            size={28}
            title={`${refinement.name} collapsed`}
          />
        </div>
      </Specimen>

      <Specimen label="Authentication header">
        <div className="w-full rounded-md border bg-surface p-5 text-center shadow-card">
          <RefinementLockup compact refinement={refinement} />
          <p className="mt-4 text-sm text-muted-foreground">Welcome back</p>
        </div>
      </Specimen>

      <div className="grid grid-cols-3 gap-2">
        {[16, 32, 48].map((size) => (
          <Specimen key={size} label={`${size}×${size}`}>
            <RefinementMark
              refinement={refinement}
              size={size}
              title={`${refinement.name} ${size}px`}
            />
          </Specimen>
        ))}
      </div>

      <Specimen label="Dark mode">
        <div className="flex min-h-20 w-full items-center justify-center rounded-md bg-[#0e1014] text-white">
          <RefinementLockup inverse refinement={refinement} />
        </div>
      </Specimen>

      <Specimen label="Monochrome">
        <RefinementMark className="text-foreground" refinement={refinement} size={64} />
      </Specimen>

      <Specimen label="Inverse">
        <div className="flex min-h-20 w-full items-center justify-center rounded-md bg-[#102238] text-white">
          <RefinementMark className="text-white" refinement={refinement} size={64} />
        </div>
      </Specimen>
    </article>
  );
}

export function KeystoneRefinementReview() {
  return (
    <section
      aria-labelledby="keystone-refinement-title"
      className="grid gap-6 border-t pt-8"
      data-testid="keystone-refinement-review"
    >
      <header className="max-w-3xl">
        <p className="text-overline">Founder refinement checkpoint</p>
        <h2
          className="mt-2 text-[length:var(--text-h2)] font-semibold"
          id="keystone-refinement-title"
        >
          Keystone Fold refinement review
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Three neutral Concept C refinements focused on removing the capital-P reading. These
          specimens are review-only and do not replace the currently applied mark.
        </p>
      </header>

      <div className="grid gap-8 xl:grid-cols-3">
        {keystoneRefinements.map((refinement) => (
          <RefinementCard key={refinement.id} refinement={refinement} />
        ))}
      </div>
    </section>
  );
}
