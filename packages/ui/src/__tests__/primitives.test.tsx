import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  Accordion,
  Alert,
  AlertDialog,
  Avatar,
  Button,
  Calendar,
  Card,
  CardContent,
  CardTitle,
  Checkbox,
  Collapsible,
  Combobox,
  Dialog,
  DropdownMenu,
  EmptyState,
  ErrorState,
  Field,
  FileUploadPlaceholder,
  Input,
  KeyValue,
  MetricCard,
  MultiSelect,
  PermissionDenied,
  Popover,
  Progress,
  RadioGroup,
  Select,
  Sheet,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  Textarea,
  Toast,
  ToastProvider,
  Tooltip
} from "../index";

describe("UI primitives", () => {
  it("renders card, button, loading, input, and skeleton foundations", async () => {
    const { container } = render(
      <Card>
        <CardTitle>Foundation</CardTitle>
        <CardContent>
          <label htmlFor="name">Name</label>
          <Input id="name" />
          <Button>Save</Button>
          <Button loading>Saving</Button>
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );

    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("wires labels, help, errors, and selection controls accessibly", async () => {
    const { container } = render(
      <div>
        <Field
          label="Contact name"
          htmlFor="contact"
          help="Use the primary contact."
          error="Contact is required."
          required
        >
          <Input id="contact" />
        </Field>
        <label htmlFor="notes">Notes</label>
        <Textarea id="notes" />
        <label htmlFor="trade">Trade</label>
        <Select id="trade" defaultValue="electrical">
          <option value="electrical">Electrical</option>
        </Select>
        <Combobox label="Search companies" options={["Atlas Electric"]} />
        <MultiSelect values={["Electrical", "Mechanical"]} />
        <Checkbox id="complete" label="Complete" />
        <RadioGroup
          label="Priority"
          options={[
            { value: "normal", label: "Normal" },
            { value: "urgent", label: "Urgent" }
          ]}
        />
        <Switch id="updates" label="Email updates" />
      </div>
    );

    const contact = screen.getByLabelText(/Contact name/);
    expect(contact).toHaveAttribute("aria-invalid", "true");
    expect(contact).toHaveAttribute("aria-describedby", "contact-help contact-error");
    fireEvent.click(screen.getByRole("checkbox", { name: "Complete" }));
    expect(screen.getByRole("checkbox", { name: "Complete" })).toBeChecked();
    fireEvent.click(screen.getByRole("switch", { name: "Email updates" }));
    expect(screen.getByRole("switch", { name: "Email updates" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Urgent" }));
    expect(screen.getByRole("radio", { name: "Urgent" })).toBeChecked();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("renders feedback, progress, metadata, and placeholder states", async () => {
    const retry = vi.fn();
    const { container } = render(
      <div>
        <Alert title="Sample notice">Static preview content.</Alert>
        <Spinner label="Loading sample" />
        <Progress value={42} label="Package progress" />
        <EmptyState title="No projects" description="No sample projects match." />
        <ErrorState description="The sample failed." onRetry={retry} />
        <PermissionDenied />
        <MetricCard label="Open items" value={12} detail="Sample data" />
        <KeyValue items={[{ label: "Project ID", value: "CF-1001" }]} />
        <FileUploadPlaceholder />
        <Calendar />
        <Avatar name="Jordan Lee" />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("progressbar", { name: "Package progress" })).toHaveValue(42);
    expect(screen.getByLabelText("Jordan Lee")).toBeVisible();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("opens and closes dialogs, alert dialogs, and sheets", () => {
    render(
      <>
        <Dialog
          trigger={<Button>Open details</Button>}
          title="Project details"
          description="Static details"
        >
          Detail content
        </Dialog>
        <AlertDialog
          trigger={<Button>Delete sample</Button>}
          title="Delete sample?"
          description="This is only a component demonstration."
          actionLabel="Delete"
        />
        <Sheet trigger={<Button>Open filters</Button>} title="Filters">
          Filter content
        </Sheet>
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open details" }));
    expect(screen.getByRole("dialog", { name: "Project details" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog", { name: "Project details" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete sample" }));
    expect(screen.getByRole("alertdialog", { name: "Delete sample?" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByRole("button", { name: "Open filters" }));
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close drawer" }));
  });

  it("supports popover, menu, tabs, accordion, collapsible, and tooltip triggers", () => {
    const selected = vi.fn();
    render(
      <>
        <Popover trigger={<Button>Open popover</Button>}>Popover content</Popover>
        <DropdownMenu
          trigger={<Button>Open menu</Button>}
          items={[{ label: "Choose sample", onSelect: selected }]}
        />
        <Tabs
          value="overview"
          tabs={[
            { value: "overview", label: "Overview", content: "Overview content" },
            { value: "details", label: "Details", content: "Details content" }
          ]}
        />
        <Accordion
          items={[{ value: "one", title: "More information", content: "Accordion content" }]}
        />
        <Collapsible trigger={<Button>Show advanced</Button>}>Advanced content</Collapsible>
        <Tooltip content="Helpful context">
          <Button>Help</Button>
        </Tooltip>
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open popover" }));
    expect(screen.getByText("Popover content")).toBeVisible();
    fireEvent.pointerDown(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Choose sample" }));
    expect(selected).toHaveBeenCalledOnce();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "More information" }));
    expect(screen.getByText("Accordion content")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Show advanced" }));
    expect(screen.getByText("Advanced content")).toBeVisible();
    expect(screen.getByRole("button", { name: "Help" })).toBeVisible();
  });

  it("renders dismissible toast semantics", () => {
    render(
      <ToastProvider>
        <Toast title="Saved" description="Sample only" open />
      </ToastProvider>
    );

    expect(screen.getByText("Saved").closest('[role="status"]')).toHaveTextContent("Saved");
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeVisible();
  });
});
