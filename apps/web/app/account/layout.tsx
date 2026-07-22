import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getRequestUser } from "../../lib/server-auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getRequestUser();
  if (!user) redirect("/sign-in?next=/account/profile");
  return children;
}
