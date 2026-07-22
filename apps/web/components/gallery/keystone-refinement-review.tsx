type Refinement = {
  id: "balanced-aperture" | "wider-aperture" | "squared-notch";
  name: string;
  note: string;
  path: string;
};

export const keystoneRefinements: Refinement[] = [
  {
    id: "balanced-aperture",
    name: "A — Balanced Aperture",
    note: "The original faceted C-frame with equal upper and lower terminals, a centered aperture, and no extended stem.",
    path: "M14 6H34L42 14L34 22L28 16H20L16 20V28L20 32H28L34 26L42 34L34 42H14L6 34V14Z"
  },
  {
    id: "wider-aperture",
    name: "B — Wider Aperture",
    note: "A broader internal opening and shorter terminal folds make the handoff aperture clearer at header and favicon sizes.",
    path: "M14 6H33L41 14L34 21L29 16H21L16 21V27L21 32H29L34 27L41 34L33 42H14L6 34V14Z"
  },
  {
    id: "squared-notch",
    name: "C — Squared Notch",
    note: "Squared inner terminals turn the aperture into a deliberate receiving joint while retaining the original faceted frame.",
    path: "M14 6H34L42 14L35 21H29L24 16H20L16 20V28L20 32H24L29 27H35L42 34L34 42H14L6 34V14Z"
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
      <path d={refinement.path} fill="currentColor" />
      {size >= 24 ? (
        <>
          <path d="M14 6L20 16L16 20L6 14Z" fill="#000000" opacity="0.14" />
          <path d="M6 34L16 28L20 32L14 42Z" fill="#000000" opacity="0.14" />
          <path d="M34 6L42 14L34 22L28 16Z" fill="#ffffff" opacity="0.1" />
        </>
      ) : null}
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
          Three neutral refinements of the original faceted C-frame, preserving its architectural
          aperture and paired terminal folds while removing the capital-P reading. These specimens
          are review-only and do not replace the currently applied mark.
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
