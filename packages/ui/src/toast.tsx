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
};

export function Toast({ title, description, open, onOpenChange }: ToastProps) {
  const openProps = open === undefined ? {} : { open };
  const changeProps = onOpenChange === undefined ? {} : { onOpenChange };

  return (
    <ToastPrimitive.Root
      {...openProps}
      {...changeProps}
      className={cn("rounded-md border bg-white p-4 shadow-lg dark:bg-slate-950")}
    >
      <ToastPrimitive.Title className="font-medium">{title}</ToastPrimitive.Title>
      {description ? (
        <ToastPrimitive.Description className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {description}
        </ToastPrimitive.Description>
      ) : null}
      <ToastPrimitive.Close aria-label="Dismiss notification" className="mt-3 text-sm underline">
        Dismiss
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}
