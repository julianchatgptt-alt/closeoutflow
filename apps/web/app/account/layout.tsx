import { redirect } from "next/navigation";

import { getRequestUser } from "../../lib/server-auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getRequestUser();
  if (!user) redirect("/sign-in?next=/account/profile");
  return children;
}
