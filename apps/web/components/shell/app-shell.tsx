"use client";

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Menu,
  Search,
  UserRound,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge, Button, DropdownMenu, IconButton, Sheet, Tooltip } from "@closeoutflow/ui";

import { ThemeToggle } from "../theme/theme-toggle";
import { useTheme } from "../theme/theme-provider";
import { SIDEBAR_STORAGE_KEY } from "../theme/theme-script";
import { commandRoutes, globalNavigation, projectNavigation } from "./navigation";

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex h-14 items-center gap-2 border-b px-4 font-semibold"
      aria-label="CloseoutFlow dashboard"
    >
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        CF
      </span>
      {collapsed ? null : <span>CloseoutFlow</span>}
    </Link>
  );
}

function Navigation({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary navigation"
      id="primary-navigation"
      className="flex flex-1 flex-col gap-1 p-2"
    >
      {globalNavigation.map((item, index) => {
        const disabled = "disabled" in item;
        const active =
          !disabled && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
        const content = (
          <>
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
            {collapsed ? null : <span>{item.label}</span>}
            {disabled && !collapsed ? (
              <Badge tone="neutral" className="ml-auto">
                Later
              </Badge>
            ) : null}
          </>
        );
        const classes = `flex min-h-11 items-center gap-3 rounded-md border-l-2 px-3 text-sm font-medium ${active ? "border-primary bg-info-subtle text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"} ${disabled ? "cursor-not-allowed opacity-55" : ""} ${index === 4 ? "mt-auto" : ""}`;
        if (disabled)
          return (
            <Tooltip key={item.href} content={`Available in Phase ${item.phase}`}>
              <span aria-disabled="true" className={classes}>
                {content}
              </span>
            </Tooltip>
          );
        return (
          <Tooltip key={item.href} content={collapsed ? item.label : "Navigation item"}>
            <Link href={item.href} aria-current={active ? "page" : undefined} className={classes}>
              {content}
            </Link>
          </Tooltip>
        );
      })}
    </nav>
  );
}

function CommandPalette({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(
    () => commandRoutes.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 0);
  }, [open]);
  if (!open) return null;
  const navigate = (href: string) => {
    router.push(href);
    onOpenChange(false);
    setQuery("");
  };
  return (
    <div
      className="fixed inset-0 z-command grid place-items-start bg-[hsl(var(--overlay))] p-4 pt-[12vh] max-sm:p-0"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-title"
        className="w-full max-w-xl rounded-lg border bg-surface-raised shadow-lg max-sm:min-h-screen max-sm:max-w-none max-sm:rounded-none"
      >
        <div className="flex items-center gap-3 border-b p-4">
          <Search aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
          <h2 id="command-title" className="sr-only">
            Command palette
          </h2>
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onOpenChange(false);
              if (event.key === "Enter" && results[0]) navigate(results[0].href);
            }}
            placeholder="Search pages and sample projects…"
            aria-controls="command-results"
            className="h-10 flex-1 bg-transparent text-sm outline-none"
          />
          <IconButton label="Close command palette" onClick={() => onOpenChange(false)}>
            <X aria-hidden="true" className="h-4 w-4" />
          </IconButton>
        </div>
        <div id="command-results" role="listbox" className="max-h-96 overflow-auto p-2">
          {results.length ? (
            results.map((item) => (
              <button
                key={item.href}
                role="option"
                aria-selected="false"
                className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm hover:bg-muted focus:bg-muted"
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
          <p className="border-t p-3 text-xs text-muted-foreground">
            Sample navigation only — no live search or API.
          </p>
        </div>
      </section>
    </div>
  );
}

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const labels = segments.map((segment) =>
    segment === "riverside-medical-office"
      ? "Riverside Medical Office"
      : segment
          .split("-")
          .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
          .join(" ")
  );
  return (
    <nav aria-label="Breadcrumbs" className="min-w-0 flex-1">
      <ol className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        {labels.map((label, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const current = index === labels.length - 1;
          return (
            <li
              key={href}
              className={
                index < labels.length - 2 ? "hidden md:flex" : "flex min-w-0 items-center gap-2"
              }
            >
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {current ? (
                <span aria-current="page" className="truncate text-foreground">
                  {label}
                </span>
              ) : (
                <Link href={href} className="truncate hover:text-foreground">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ProjectSubnav() {
  const pathname = usePathname();
  const match = pathname.match(/^\/projects\/([^/]+)/);
  if (!match?.[1]) return null;
  const base = `/projects/${match[1]}`;
  return (
    <nav aria-label="Project navigation" className="sticky top-14 z-sticky border-b bg-surface">
      <div className="flex h-11 overflow-x-auto px-[var(--page-gutter)]">
        {projectNavigation.map((item) => {
          const href = item.segment ? `${base}/${item.segment}` : base;
          const active = pathname === href;
          return (
            <Link
              key={item.segment || "overview"}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-1 border-b-2 px-3 text-sm ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {item.label}
              {"previewOnly" in item ? (
                <span className="sr-only">, preview for Phase {item.phase}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { density, setDensity } = useTheme();
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof document !== "undefined" && document.documentElement.dataset.sidebar === "collapsed"
  );
  const [palette, setPalette] = useState(false);
  const toggleSidebar = useCallback(() => {
    setCollapsed((current) => {
      const value = !current;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? "collapsed" : "expanded");
      document.documentElement.dataset.sidebar = value ? "collapsed" : "expanded";
      return value;
    });
  }, []);
  useEffect(() => {
    let pending = "";
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.matches("input, textarea, select, [contenteditable=true]");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette(true);
        return;
      }
      if (typing) return;
      if (event.key === "/") {
        event.preventDefault();
        setPalette(true);
      } else if (event.key === "[") toggleSidebar();
      else if (pending === "g" && event.key === "p") {
        router.push("/projects");
        pending = "";
      } else if (pending === "g" && event.key === "d") {
        router.push("/dashboard");
        pending = "";
      } else pending = event.key === "g" ? "g" : "";
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, toggleSidebar]);
  return (
    <div className={`min-h-screen bg-background ${collapsed ? "lg:pl-16" : "lg:pl-64"}`}>
      <a
        href="#main"
        className="fixed left-3 top-2 z-[1000] -translate-y-20 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:translate-y-0"
      >
        Skip to main content
      </a>
      <aside
        aria-label="Application sidebar"
        className={`fixed inset-y-0 left-0 z-sidebar hidden border-r bg-surface lg:flex lg:flex-col ${collapsed ? "w-16" : "w-64"}`}
      >
        <Brand collapsed={collapsed} />
        <Navigation collapsed={collapsed} />
        <Button variant="ghost" className="m-2 justify-start px-3" onClick={toggleSidebar}>
          {collapsed ? (
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              <span>Collapse sidebar</span>
            </>
          )}
        </Button>
      </aside>
      <header className="sticky top-0 z-header flex h-14 items-center gap-2 border-b bg-surface px-3 sm:px-4">
        <div className="lg:hidden">
          <Sheet
            key={pathname}
            title="CloseoutFlow navigation"
            trigger={
              <IconButton label="Open navigation">
                <Menu aria-hidden="true" className="h-5 w-5" />
              </IconButton>
            }
          >
            <Brand />
            <Navigation />
          </Sheet>
        </div>
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm" className="max-w-52 truncate">
              Sample Construction Co. <span aria-hidden="true">⌄</span>
            </Button>
          }
          items={[
            { label: "Sample Construction Co." },
            { label: "Create organization — Phase 4", disabled: true }
          ]}
        />
        <Breadcrumbs />
        <Button
          variant="outline"
          size="sm"
          className="hidden min-w-52 justify-between text-muted-foreground md:flex"
          onClick={() => setPalette(true)}
        >
          <span className="flex items-center gap-2">
            <Search aria-hidden="true" className="h-4 w-4" />
            Search sample data
          </span>
          <kbd>⌘K</kbd>
        </Button>
        <IconButton label="Search" className="md:hidden" onClick={() => setPalette(true)}>
          <Search aria-hidden="true" className="h-5 w-5" />
        </IconButton>
        <DropdownMenu
          trigger={
            <IconButton label="Notifications">
              <Bell aria-hidden="true" className="h-5 w-5" />
            </IconButton>
          }
          items={[{ label: "No notifications yet", disabled: true }]}
        />
        <DropdownMenu
          trigger={
            <IconButton label="Help">
              <CircleHelp aria-hidden="true" className="h-5 w-5" />
            </IconButton>
          }
          items={[
            { label: "Keyboard shortcuts" },
            { label: "Contact support — preview", disabled: true }
          ]}
        />
        <DropdownMenu
          trigger={
            <IconButton label="User menu">
              <UserRound aria-hidden="true" className="h-5 w-5" />
            </IconButton>
          }
          items={[
            { label: "Jordan Lee — Preview", disabled: true },
            {
              label: `Density: ${density}`,
              onSelect: () => setDensity(density === "compact" ? "comfortable" : "compact")
            },
            { label: "Sign out — Phase 4", disabled: true }
          ]}
        />
        <div className="fixed bottom-3 right-3 z-toast rounded-lg border bg-surface-raised p-2 shadow-md">
          <ThemeToggle compact />
        </div>
      </header>
      <ProjectSubnav />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[var(--content-max)] p-[var(--page-gutter)]"
      >
        {children}
      </main>
      <CommandPalette open={palette} onOpenChange={setPalette} />
    </div>
  );
}
