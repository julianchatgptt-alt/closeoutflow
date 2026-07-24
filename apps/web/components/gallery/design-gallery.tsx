"use client";

import { Bell, Building2, LayoutDashboard, Lock, Search, Trash2 } from "lucide-react";

import {
  Accordion,
  Alert,
  AlertDialog,
  Avatar,
  Badge,
  Banner,
  Button,
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  Combobox,
  DateInput,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  FileUploadPlaceholder,
  IconButton,
  Input,
  KeyValue,
  Metric,
  MetricCard,
  MultiSelect,
  PermissionDenied,
  Popover,
  Progress,
  RadioGroup,
  ResponsiveStack,
  Select,
  Separator,
  Sheet,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  Textarea,
  Toast,
  ToastProvider,
  Tooltip
} from "@closeoutflow/ui";

import { SampleValidationForm } from "../form/sample-form";
import { BrandFinalReview } from "./brand-final-review";
import { FullProductVisualReview } from "./full-product-visual-review";
import { KeystoneRefinementReview } from "./keystone-refinement-review";
import { LogoFounderReview } from "./logo-founder-review";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState
} from "../dashboard/dashboard-states";
import { PreviewPill } from "../shell/preview-pill";
import { useTheme } from "../theme/theme-provider";
import { ThemeToggle } from "../theme/theme-toggle";
import { RiskIndicator } from "../status/risk-indicator";
import {
  StatusBadge,
  type StatusBadgeProps,
  type StatusCategory,
  statusValues
} from "../status/status-badge";
import { DataTable } from "../table/data-table";
import { projects } from "../../src/mock/phase-3";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t pt-8">
      <h2 className="text-[length:var(--text-h2)] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function GalleryControls() {
  const { density, setDensity } = useTheme();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ThemeToggle />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
      >
        Density: {density}
      </Button>
    </div>
  );
}

export function DesignGallery() {
  return (
    <ToastProvider>
      <main className="mx-auto grid max-w-6xl gap-8 p-4 sm:p-8">
        <div>
          <Badge tone="warning">Local/test only</Badge>
          <h1 className="mt-3 text-3xl font-semibold">Closeout component gallery</h1>
          <p className="mt-2 text-muted-foreground">
            Living Phase 3 reference. Static samples only; this route returns 404 in production.
          </p>
          <div className="mt-4">
            <GalleryControls />
          </div>
        </div>
        <FullProductVisualReview />
        <KeystoneRefinementReview />
        <BrandFinalReview />
        <LogoFounderReview />
        <Section title="Surfaces, type ladder, and color tokens">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-background p-5 ring-1 ring-border">
              <p className="text-overline">Desk</p>
              <p className="mt-2 text-sm">Tinted application canvas</p>
            </div>
            <div className="rounded-lg bg-surface p-5 shadow-card">
              <p className="text-overline">Paper</p>
              <p className="mt-2 text-sm">Operational work surface</p>
            </div>
            <div className="rounded-lg border bg-surface-raised p-5 shadow-md">
              <p className="text-overline">Raised</p>
              <p className="mt-2 text-sm">Menus and overlays</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["primary", "bg-info-subtle text-primary"],
              ["success", "bg-success-subtle text-success"],
              ["warning", "bg-warning-subtle text-warning"],
              ["danger", "bg-danger-subtle text-danger"],
              ["info", "bg-info-subtle text-info"],
              ["owner", "bg-owner-subtle text-owner"]
            ].map(([tone, classes]) => (
              <div key={tone} className={`rounded-lg border p-4 ${classes}`}>
                <p className="font-medium capitalize">{tone}</p>
                <p className="text-xs">AA ≥ 4.5:1</p>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <p className="text-display">32 Metric numeral</p>
            <p className="text-page-title">24 Page heading</p>
            <p className="text-h2 font-semibold">18 Panel heading</p>
            <p className="text-overline">11 Binder-tab overline</p>
            <p>The well-run closeout binder, made live.</p>
            <p className="font-mono tabular-nums">DOC-004 · v03 · 2026-07-16 · 42.8 MB</p>
          </div>
        </Section>
        <Section title="Shell and page-header specimens">
          <div className="overflow-hidden rounded-lg bg-background shadow-card">
            <div className="grid min-h-56 grid-cols-[12rem_1fr]">
              <aside className="p-3">
                <p className="mb-4 px-2 font-semibold">Closeout</p>
                <div className="grid gap-1 text-[13.5px]">
                  <div className="flex min-h-11 items-center gap-3 rounded-lg bg-[hsl(var(--sidebar-active))] px-3 font-semibold text-primary">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </div>
                  <div className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-muted-foreground">
                    <Building2 className="h-4 w-4" /> Companies
                  </div>
                </div>
              </aside>
              <div className="border-l">
                <div className="flex h-14 items-center justify-end gap-2 border-b px-4 text-muted-foreground">
                  <Search className="h-4 w-4" /> Search
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <p className="text-page-title">Workspace title</p>
                    <PreviewPill phase={4} />
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">Context metadata</p>
                </div>
              </div>
            </div>
          </div>
          {/* The fabricated dashboard StatStrip was removed in Phase 6E-B2.
              The Metric primitive that replaced it is shown here instead. */}
          <Card
            tier="panel"
            className="grid divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          >
            <Metric label="Active projects" value={6} href="/projects" />
            <Metric label="Projects needing setup" value={2} attention />
            <Metric label="Requirements needing attention" value={14} attention />
          </Card>
        </Section>
        <Section title="Buttons, controls, and form fields">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Destructive
            </Button>
            <Button variant="link">Link</Button>
            <Tooltip content="Available in Phase 4">
              <span>
                <Button variant="outline" disabled>
                  <Lock aria-hidden="true" className="h-4 w-4" /> Locked
                </Button>
              </span>
            </Tooltip>
            <Button loading>Saving</Button>
            <IconButton label="Notifications">
              <Bell aria-hidden="true" className="h-4 w-4" />
            </IconButton>
          </div>
          <ResponsiveStack>
            <Field label="Project name" htmlFor="gallery-project" required help="Visible help text">
              <Input id="gallery-project" placeholder="Sample project" />
            </Field>
            <Field label="Notes" htmlFor="gallery-notes">
              <Textarea id="gallery-notes" placeholder="Sample notes" />
            </Field>
          </ResponsiveStack>
          <ResponsiveStack>
            <Select aria-label="Sample select">
              <option>Medical office</option>
            </Select>
            <Combobox options={["HVAC", "Electrical", "Roofing"]} />
            <MultiSelect values={["HVAC", "Plumbing"]} />
            <DateInput aria-label="Sample date" />
          </ResponsiveStack>
          <div className="flex flex-wrap gap-6">
            <Checkbox id="gallery-check" label="Required item" />
            <RadioGroup
              label="Review policy"
              options={[
                { value: "all", label: "All approve" },
                { value: "any", label: "Any approve" }
              ]}
            />
            <Switch id="gallery-switch" label="Compact density" />
          </div>
          <FileUploadPlaceholder />
        </Section>
        <Section title="Status and risk system">
          <div className="grid gap-4">
            {(Object.keys(statusValues) as StatusCategory[]).map((category) => (
              <div key={category}>
                <h3 className="mb-2 text-sm font-semibold capitalize">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {statusValues[category].map((status) => (
                    <StatusBadge key={status} {...({ category, status } as StatusBadgeProps)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <RiskIndicator level="Low" drivers="No overdue sample items" />
            <RiskIndicator level="Medium" drivers="Two overdue sample items" />
            <RiskIndicator level="High" drivers="Rejected submission and overdue items" />
            <RiskIndicator level="Insufficient data" />
          </div>
        </Section>
        <Section title="Cards, feedback, and progress">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Active projects" value="3" detail="Sample data" />
            <MetricCard label="Complete" value="72%" />
            <Card>
              <CardHeader>
                <CardTitle>Paper card</CardTitle>
              </CardHeader>
              <CardContent>
                One coherent work object; internal sections use dividers, never nested cards.
              </CardContent>
            </Card>
          </div>
          <Alert tone="success" title="Sample saved">
            No record was persisted.
          </Alert>
          <Alert tone="warning" title="Attention required">
            This is a visual warning state.
          </Alert>
          <Banner tone="info" title="Read-only preview">
            Feature behavior arrives in a later phase.
          </Banner>
          <Progress value={72} label="Sample completeness" />
          <div className="flex items-center gap-4">
            <Spinner />
            <Skeleton className="h-8 w-48" />
          </div>
          <Toast
            title="Sample toast"
            description="Toast behavior is demonstrated locally."
            tone="success"
          />
        </Section>
        <Section title="Overlays and disclosure">
          <div className="flex flex-wrap gap-2">
            <Tooltip content="Supplementary explanation">
              <Button variant="outline">Tooltip</Button>
            </Tooltip>
            <Popover trigger={<Button variant="outline">Popover</Button>}>
              <p className="text-sm">Small contextual controls belong here.</p>
            </Popover>
            <Dialog
              trigger={<Button variant="outline">Dialog</Button>}
              title="Short decision"
              description="Dialogs become sheets on mobile."
            >
              <Button>Continue</Button>
            </Dialog>
            <AlertDialog
              trigger={<Button variant="destructive">Alert dialog</Button>}
              title="Delete sample?"
              description="This demonstrates a destructive confirmation without deleting anything."
              actionLabel="Delete sample"
            />
            <Sheet trigger={<Button variant="outline">Drawer</Button>} title="Context panel">
              <p className="text-sm text-muted-foreground">Focus-trapped drawer content.</p>
            </Sheet>
          </div>
          <Tabs
            value="one"
            tabs={[
              { value: "one", label: "Overview", content: "Tab content" },
              { value: "two", label: "Later phase", disabled: true }
            ]}
          />
          <Accordion
            items={[
              { value: "a", title: "Accordion section", content: "Structured disclosure content." }
            ]}
          />
          <Collapsible trigger={<Button variant="outline">Toggle collapsible</Button>}>
            <Card className="p-4">Collapsible content</Card>
          </Collapsible>
        </Section>
        <Section title="Table architecture">
          <DataTable
            caption="Gallery projects"
            data={[...projects]}
            columns={[
              { key: "name", header: "Project" },
              { key: "type", header: "Type" },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge category="project" status={row.status} />
              },
              { key: "target", header: "Target" }
            ]}
            emptyTitle="No projects"
            emptyDescription="Empty sample"
          />
        </Section>
        <Section title="Form validation and save states">
          <SampleValidationForm />
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Read-only form mode</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <div className="grid grid-cols-[9rem_1fr] gap-3 py-3">
                  <dt className="text-[13px] text-muted-foreground">Organization</dt>
                  <dd className="font-medium">Sample Construction Co.</dd>
                </div>
                <div className="grid grid-cols-[9rem_1fr] gap-3 py-3">
                  <dt className="text-[13px] text-muted-foreground">Time zone</dt>
                  <dd>Eastern Time</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </Section>
        <Section title="Public auth-card readiness pattern">
          <div className="grid gap-5 rounded-lg bg-background p-6 md:grid-cols-2">
            <Card className="mx-auto w-full max-w-sm">
              <CardHeader>
                <CardTitle>Sign in to Closeout</CardTitle>
                <p className="text-[13px] text-muted-foreground">
                  Presentation specimen only — no authentication behavior.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Field label="Work email" htmlFor="gallery-auth-email">
                  <Input
                    id="gallery-auth-email"
                    type="email"
                    placeholder="name@company.com"
                    readOnly
                  />
                </Field>
                <Button variant="outline" disabled>
                  <Lock aria-hidden="true" className="h-4 w-4" /> Continue
                </Button>
              </CardContent>
            </Card>
            <div className="mx-auto w-full max-w-[390px] rounded-[2rem] border-[8px] border-foreground/80 bg-background p-4 shadow-lg">
              <p className="text-overline mb-3">Mobile frame · 390px</p>
              <div className="grid grid-cols-2 overflow-hidden rounded-lg bg-surface shadow-card">
                {["Projects 3", "Due 7", "Reviews 2", "Overdue 1"].map((item) => (
                  <div
                    key={item}
                    className="min-h-16 border-b border-r p-3 text-[13px] last:border-r-0"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
        <Section title="Empty, error, and permission states">
          <EmptyState title="No requirements yet" description="Requirements arrive in Phase 6." />
          <ErrorState
            description="This is a safe, retryable region error example."
            onRetry={() => undefined}
          />
          <PermissionDenied />
          <Alert tone="warning" title="Account suspended">
            Contact an organization owner to restore workspace access.
          </Alert>
          <KeyValue
            items={[
              { label: "Version", value: "v3" },
              {
                label: "Updated by",
                value: (
                  <span>
                    <Avatar name="Jordan Lee" size="sm" /> Jordan Lee
                  </span>
                )
              }
            ]}
          />
          <Calendar />
        </Section>
        <Section title="Dashboard empty, loading, and error states">
          <DashboardEmptyState />
          <DashboardLoadingState />
          <DashboardErrorState />
        </Section>
        <Separator />
      </main>
    </ToastProvider>
  );
}
