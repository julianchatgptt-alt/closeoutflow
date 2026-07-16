"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Breadcrumbs() {
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
                <span aria-current="page" className="truncate text-foreground" title={label}>
                  {label}
                </span>
              ) : (
                <Link href={href} className="truncate hover:text-foreground" title={label}>
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
