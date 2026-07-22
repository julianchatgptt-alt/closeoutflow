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
      <span className="hidden text-primary sidebar-collapsed-only:block">
        <CloseoutMark compact size={27} />
      </span>
    </Link>
  );
}
