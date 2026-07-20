import type { User } from "@supabase/supabase-js";

export const ACTIVE_ORGANIZATION_COOKIE = "cof-active-org";

export type AssuranceLevel = "aal1" | "aal2";

export type AuthenticatedActorContext = {
  user: User;
  assuranceLevel: AssuranceLevel;
  authenticatedAt: Date | null;
};

export type ActiveOrganization = {
  organizationId: string;
  membershipId: string;
  role: string;
};

export type ActiveOrganizationResolution =
  | { status: "active"; organization: ActiveOrganization }
  | { status: "no_organization" }
  | { status: "suspended"; organizationId: string }
  | { status: "invalid_preference" };

export interface ActiveOrganizationResolver {
  resolve(userId: string, preferredOrganizationId?: string): Promise<ActiveOrganizationResolution>;
}

export function hasRequiredAssurance(
  current: AssuranceLevel | null | undefined,
  required: AssuranceLevel
): boolean {
  if (required === "aal1") return current === "aal1" || current === "aal2";
  return current === "aal2";
}

export function isFreshAuthentication(
  authenticatedAt: Date | null,
  now = new Date(),
  maximumAgeSeconds = 15 * 60
): boolean {
  if (!authenticatedAt) return false;
  const ageMilliseconds = now.getTime() - authenticatedAt.getTime();
  return ageMilliseconds >= 0 && ageMilliseconds <= maximumAgeSeconds * 1000;
}
