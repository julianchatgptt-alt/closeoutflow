export type Actor = {
  type: "internal_user" | "external_grant" | "platform_admin" | "system";
  id: string;
};

export type AuthorizationResource = {
  type: string;
  id: string;
  organizationId?: string;
};

export type AuthorizationDecision =
  { allowed: true } | { allowed: false; reason: "policy_not_implemented" };

export function can(
  actor: Actor,
  action: string,
  resource: AuthorizationResource
): AuthorizationDecision {
  void actor;
  void action;
  void resource;
  return { allowed: false, reason: "policy_not_implemented" };
}
