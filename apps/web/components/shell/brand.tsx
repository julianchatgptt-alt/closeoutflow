import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex h-14 items-center gap-2 border-b px-4 font-semibold"
      aria-label="Closeout dashboard"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        C
      </span>
      <span className="sidebar-expanded-only">Closeout</span>
    </Link>
  );
}
