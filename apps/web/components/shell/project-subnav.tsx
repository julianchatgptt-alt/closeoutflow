"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { projectNavigation } from "./navigation";

export function ProjectSubnav() {
  const pathname = usePathname();
  const match = pathname.match(/^\/projects\/([^/]+)/);
  if (!match?.[1]) return null;
  const base = `/projects/${match[1]}`;
  return (
    <nav
      aria-label="Project navigation"
      className="sticky top-14 z-sticky border-b bg-background/95 backdrop-blur-sm"
    >
      <div className="flex h-11 overflow-x-auto px-[var(--page-gutter)]">
        {projectNavigation.map((item) => {
          const href = item.segment ? `${base}/${item.segment}` : base;
          const active = pathname === href;
          return (
            <Link
              key={item.segment || "overview"}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-1 border-b-2 px-3 text-[13px] font-medium transition-colors duration-[var(--dur-fast)] ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
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
