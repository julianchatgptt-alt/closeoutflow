import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  createRequestAuthClient,
  getRequestUser,
  getVerifiedAssuranceLevel
} from "../../lib/server-auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getRequestUser();
  if (!user) redirect("/sign-in");
  const client = await createRequestAuthClient();
  if (!client) notFound();
  const [{ data: platformRole }, assurance] = await Promise.all([
    client.from("platform_roles").select("role").eq("user_id", user.id).maybeSingle(),
    getVerifiedAssuranceLevel(client)
  ]);
  if (!platformRole) notFound();
  if (assurance !== "aal2") {
    redirect("/mfa/challenge?next=/platform");
  }
  return children;
}
