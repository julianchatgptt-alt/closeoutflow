import { isFreshAuthentication } from "@closeoutflow/auth";

type PendingTransfer = {
  organization_id: string;
  to_user: string;
  status: string;
  expires_at: string;
};

type VerifiedClaims = {
  aal?: unknown;
  auth_time?: unknown;
};

export function canAcceptOwnershipTransfer(input: {
  transfer: PendingTransfer | null;
  userId: string;
  organizationId: string;
  claims: VerifiedClaims | null | undefined;
  now?: Date;
}): boolean {
  const { transfer, userId, organizationId, claims, now = new Date() } = input;
  const authenticatedAt =
    typeof claims?.auth_time === "number" ? new Date(claims.auth_time * 1000) : null;
  return Boolean(
    transfer &&
    transfer.organization_id === organizationId &&
    transfer.to_user === userId &&
    transfer.status === "pending" &&
    new Date(transfer.expires_at) > now &&
    claims?.aal === "aal2" &&
    isFreshAuthentication(authenticatedAt, now)
  );
}
