import "server-only";

import {
  MailpitEmailAdapter,
  noopEmailAdapter,
  renderIdentityEmail,
  ResendEmailAdapter,
  type IdentityEmailKind
} from "@closeoutflow/email";
import { serverEnv } from "@closeoutflow/env/server";

function emailAdapter() {
  if (serverEnv.EMAIL_PROVIDER === "mailpit") {
    return serverEnv.MAILPIT_URL
      ? new MailpitEmailAdapter(serverEnv.MAILPIT_URL)
      : new MailpitEmailAdapter();
  }
  if (serverEnv.EMAIL_PROVIDER === "resend" && serverEnv.RESEND_API_KEY) {
    return new ResendEmailAdapter(serverEnv.RESEND_API_KEY);
  }
  return noopEmailAdapter;
}

export async function sendIdentityEmail(input: {
  kind: IdentityEmailKind;
  to: string;
  idempotencyKey: string;
  actionUrl?: string;
  organizationName?: string;
  expiresIn?: string;
  detail?: string;
}) {
  return emailAdapter().send(
    renderIdentityEmail({
      ...input,
      from: serverEnv.EMAIL_FROM ?? "Closeout <no-reply@mail.closeoutflow.com>"
    })
  );
}
