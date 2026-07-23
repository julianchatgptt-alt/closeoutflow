import Link from "next/link";

import { CloseoutLogo, CloseoutMark } from "../brand/closeout-logo";

export function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex h-14 items-center px-[18px]"
      aria-label="Closeout dashboard"
    >
      <span className="sidebar-expanded-only">
        <CloseoutLogo compact />
      </span>
      {/* `sidebar-collapsed-only` is a plain class defined in globals.css, not a
          Tailwind variant. Written as a variant prefix it emitted no CSS, so the
          element kept `hidden` and the collapsed rail showed no logo at all. */}
      <span className="sidebar-collapsed-only hidden text-primary">
        <CloseoutMark compact size={27} />
      </span>
    </Link>
  );
}
