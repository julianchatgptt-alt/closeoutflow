"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import type { ReactNode } from "react";

import { cn } from "./lib/cn";

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastPrimitive.Provider>
      {children}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-50 flex w-full max-w-sm flex-col gap-2 p-4" />
    </ToastPrimitive.Provider>
  );
}

export type ToastProps = {
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  tone?: "success" | "warning" | "danger" | "info";
};

export function Toast({ title, description, open, onOpenChange, tone = "info" }: ToastProps) {
  const openProps = open === undefined ? {} : { open };
  const changeProps = onOpenChange === undefined ? {} : { onOpenChange };

  return (
    <ToastPrimitive.Root
      {...openProps}
      {...changeProps}
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "cof-toast rounded-lg border bg-surface-raised p-4 shadow-md",
        tone === "success" && "border-success-border",
        tone === "warning" && "border-warning-border",
        tone === "danger" && "border-danger-border",
        tone === "info" && "border-info-border"
      )}
    >
      <ToastPrimitive.Title className="font-medium">{title}</ToastPrimitive.Title>
      {description ? (
        <ToastPrimitive.Description className="mt-1 text-sm text-muted-foreground">
          {description}
        </ToastPrimitive.Description>
      ) : null}
      <ToastPrimitive.Close aria-label="Dismiss notification" className="mt-3 text-sm underline">
        Dismiss
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}
