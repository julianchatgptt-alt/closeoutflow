"use client";

import { Bell, Trash2 } from "lucide-react";

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
import { ThemeToggle } from "../theme/theme-toggle";
import { RiskIndicator } from "../status/risk-indicator";
import { StatusBadge, statusValues } from "../status/status-badge";
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

export function DesignGallery() {
  return (
    <ToastProvider>
      <main className="mx-auto grid max-w-6xl gap-8 p-4 sm:p-8">
        <div>
          <Badge tone="warning">Local/test only</Badge>
          <h1 className="mt-3 text-3xl font-semibold">CloseoutFlow component gallery</h1>
          <p className="mt-2 text-muted-foreground">
            Living Phase 3 reference. Static samples only; this route returns 404 in production.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </div>
        <Section title="Palette and typography">
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
                <p className="text-xs">Semantic token</p>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <p className="text-3xl font-semibold">IBM Plex Sans display</p>
            <p className="text-h1 font-semibold">Page heading at production density</p>
            <p>The well-run closeout binder, made live.</p>
            <p className="font-mono tabular-nums">DOC-004 · v03 · 2026-07-16 · 42.8 MB</p>
          </div>
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
            {Object.entries(statusValues).map(([category, statuses]) => (
              <div key={category}>
                <h3 className="mb-2 text-sm font-semibold capitalize">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <StatusBadge
                      key={status}
                      category={category as keyof typeof statusValues}
                      status={status}
                    />
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
                <CardTitle>Flat card</CardTitle>
              </CardHeader>
              <CardContent>Borders provide structure; no decorative shadow.</CardContent>
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
        </Section>
        <Section title="Empty, error, and permission states">
          <EmptyState title="No requirements yet" description="Requirements arrive in Phase 6." />
          <ErrorState
            description="This is a safe, retryable region error example."
            onRetry={() => undefined}
          />
          <PermissionDenied />
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
        <Separator />
      </main>
    </ToastProvider>
  );
}
