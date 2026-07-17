"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type RefObject } from "react";

import { Dialog, IconButton } from "@closeoutflow/ui";

import { commandRoutes } from "./navigation";

export function CommandPalette({
  open,
  onOpenChange,
  returnFocusRef
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const listboxId = useId();
  const optionIdPrefix = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const results = useMemo(
    () => commandRoutes.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  const changeOpen = (value: boolean) => {
    if (!value) {
      setQuery("");
      setActiveIndex(0);
    }
    onOpenChange(value);
  };

  const navigate = (href: string) => {
    changeOpen(false);
    router.push(href);
  };
  const move = (next: number) => {
    if (!results.length) return;
    setActiveIndex((next + results.length) % results.length);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={changeOpen}
      title="Command palette"
      description="Navigate among Closeout pages."
      variant="command"
      showClose={false}
      bodyClassName="flex flex-col"
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        returnFocusRef.current?.focus();
      }}
    >
      <div className="flex items-center gap-3 border-b p-4">
        <Search aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              move(activeIndex + 1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              move(activeIndex - 1);
            } else if (event.key === "Home") {
              event.preventDefault();
              setActiveIndex(0);
            } else if (event.key === "End") {
              event.preventDefault();
              setActiveIndex(Math.max(0, results.length - 1));
            } else if (event.key === "Enter" && results[activeIndex]) {
              event.preventDefault();
              navigate(results[activeIndex].href);
            }
          }}
          placeholder="Search pages and sample projects…"
          aria-label="Search Closeout pages and sample projects"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-activedescendant={
            results[activeIndex] ? `${optionIdPrefix}-${activeIndex}` : undefined
          }
          className="h-10 flex-1 bg-transparent text-sm outline-none"
        />
        <IconButton label="Close command palette" onClick={() => changeOpen(false)}>
          <X aria-hidden="true" className="h-4 w-4" />
        </IconButton>
      </div>
      <div
        id={listboxId}
        role="listbox"
        aria-label="Navigation results"
        className="max-h-96 overflow-auto p-2"
      >
        <p className="text-overline px-3 pb-2 pt-1">Navigate</p>
        {results.length ? (
          results.map((item, index) => (
            <button
              id={`${optionIdPrefix}-${index}`}
              key={item.href}
              role="option"
              aria-selected={index === activeIndex}
              tabIndex={-1}
              className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm hover:bg-muted data-[active=true]:bg-muted data-[active=true]:text-foreground"
              data-active={index === activeIndex}
              onPointerMove={() => setActiveIndex(index)}
              onClick={() => navigate(item.href)}
            >
              {item.label}
            </button>
          ))
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No sample results for “{query}”.
          </p>
        )}
        <p className="mt-2 flex items-center justify-between gap-3 border-t bg-surface-sunken p-3 text-xs text-muted-foreground">
          <span>Sample navigation only — no live search or API.</span>
          <span className="whitespace-nowrap">
            <kbd className="rounded border px-1.5 py-0.5">↑↓</kbd> move ·{" "}
            <kbd className="rounded border px-1.5 py-0.5">↵</kbd> open
          </span>
        </p>
      </div>
    </Dialog>
  );
}
