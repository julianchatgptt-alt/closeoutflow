"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ChevronDown, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "./button";
import { cn } from "./lib/cn";

const overlay = "cof-fade fixed inset-0 z-overlay bg-[hsl(var(--overlay))]";
/* Overlays carry real elevation instead of a border ring, and drop to a bottom
   sheet below `sm` so forms are never cramped on a phone. */
const dialog =
  "cof-dialog fixed left-1/2 top-1/2 z-modal w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-hairline bg-surface-raised p-6 shadow-overlay max-sm:bottom-0 max-sm:top-auto max-sm:w-full max-sm:max-w-none max-sm:-translate-y-0 max-sm:rounded-b-none max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]";
const commandDialog =
  "cof-dialog fixed left-1/2 top-[12vh] z-command w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl border border-hairline bg-surface-raised shadow-overlay max-sm:inset-0 max-sm:h-dvh max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:rounded-none";

export function Tooltip({ children, content }: { children: ReactNode; content: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={6}
            className="cof-menu z-tooltip rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
export function Popover({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="cof-menu z-dropdown w-72 rounded-lg border border-hairline bg-surface-raised p-4 shadow-overlay"
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function DropdownMenu({
  trigger,
  items
}: {
  trigger: ReactNode;
  items: Array<{ label: string; disabled?: boolean; onSelect?: () => void }>;
}) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align="end"
          sideOffset={6}
          className="cof-menu z-dropdown min-w-48 rounded-lg border border-hairline bg-surface-raised p-1.5 shadow-overlay"
        >
          {items.map((item) => (
            <DropdownPrimitive.Item
              key={item.label}
              {...(item.disabled ? { disabled: true } : {})}
              {...(item.onSelect ? { onSelect: item.onSelect } : {})}
              className="cursor-default rounded-md px-3 py-2 text-sm outline-none focus:bg-muted data-[disabled]:opacity-50"
            >
              {item.label}
            </DropdownPrimitive.Item>
          ))}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export function Dialog({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  variant = "default",
  showClose = true,
  bodyClassName,
  onCloseAutoFocus
}: {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "command";
  showClose?: boolean;
  bodyClassName?: string;
  onCloseAutoFocus?: ComponentProps<typeof DialogPrimitive.Content>["onCloseAutoFocus"];
}) {
  return (
    <DialogPrimitive.Root
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlay} />
        <DialogPrimitive.Content
          className={variant === "command" ? commandDialog : dialog}
          {...(onCloseAutoFocus ? { onCloseAutoFocus } : {})}
        >
          <DialogPrimitive.Title
            className={variant === "command" ? "sr-only" : "text-h2 font-semibold"}
          >
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description
              className={variant === "command" ? "sr-only" : "mt-1 text-sm text-muted-foreground"}
            >
              {description}
            </DialogPrimitive.Description>
          ) : null}
          <div className={cn(variant === "command" ? "h-full" : "mt-5", bodyClassName)}>
            {children}
          </div>
          {showClose ? (
            <DialogPrimitive.Close
              aria-label="Close dialog"
              className="absolute right-4 top-4 rounded-md p-2 hover:bg-muted"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function AlertDialog({
  trigger,
  title,
  description,
  actionLabel = "Continue",
  open,
  onOpenChange,
  onAction
}: {
  trigger?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAction?: () => void;
}) {
  return (
    <AlertDialogPrimitive.Root
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {trigger ? (
        <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger>
      ) : null}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={overlay} />
        <AlertDialogPrimitive.Content className={dialog}>
          <AlertDialogPrimitive.Title className="text-h2 font-semibold">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button variant="destructive" onClick={onAction}>
                {actionLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export function Sheet({
  trigger,
  title,
  children,
  side = "left"
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  side?: "left" | "right";
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlay} />
        <DialogPrimitive.Content
          className={cn(
            "cof-sheet fixed inset-y-0 z-modal w-[min(19rem,88vw)] bg-surface-raised p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-overlay",
            side === "left" ? "left-0" : "right-0"
          )}
        >
          <DialogPrimitive.Title className="text-h2 font-semibold">{title}</DialogPrimitive.Title>
          <div className="mt-4">{children}</div>
          <DialogPrimitive.Close
            aria-label="Close drawer"
            className="absolute right-3 top-3 rounded-md p-2 hover:bg-muted"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
export const Drawer = Sheet;

export function Tabs({
  value,
  onValueChange,
  tabs
}: {
  value: string;
  onValueChange?: (value: string) => void;
  tabs: Array<{ value: string; label: string; disabled?: boolean; content?: ReactNode }>;
}) {
  return (
    <TabsPrimitive.Root value={value} {...(onValueChange ? { onValueChange } : {})}>
      <TabsPrimitive.List className="flex gap-1 overflow-x-auto border-b" aria-label="Sections">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className="min-h-11 shrink-0 border-b-2 border-transparent px-3 text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[disabled]:opacity-50"
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((tab) =>
        tab.content ? (
          <TabsPrimitive.Content key={tab.value} value={tab.value} className="pt-4">
            {tab.content}
          </TabsPrimitive.Content>
        ) : null
      )}
    </TabsPrimitive.Root>
  );
}

export function Accordion({
  items
}: {
  items: Array<{ value: string; title: string; content: ReactNode }>;
}) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="divide-y rounded-lg border">
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.value} value={item.value}>
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="flex min-h-11 w-full items-center justify-between px-4 text-left font-medium">
              {item.title}
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="px-4 pb-4 text-sm text-muted-foreground">
            {item.content}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
export function Collapsible({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <CollapsiblePrimitive.Root>
      <CollapsiblePrimitive.Trigger asChild>{trigger}</CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className="mt-2">{children}</CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
export function ScrollArea({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ScrollAreaPrimitive.Root className={cn("overflow-hidden", className)}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="w-2 p-0.5">
        <ScrollAreaPrimitive.Thumb className="rounded-full bg-border-strong" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}
