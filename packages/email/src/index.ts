export type EmailMessage = {
  to: readonly string[];
  from: string;
  subject: string;
  html?: string;
  text: string;
  idempotencyKey: string;
};

export type EmailDeliveryResult = {
  status: "sent" | "skipped" | "failed";
  providerMessageId: string | null;
  error?: string;
};

export interface EmailAdapter {
  send(message: EmailMessage): Promise<EmailDeliveryResult>;
}

export const noopEmailAdapter: EmailAdapter = {
  async send() {
    return { status: "skipped", providerMessageId: null };
  }
};

export class ResendEmailAdapter implements EmailAdapter {
  constructor(private readonly apiKey: string) {}

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.idempotencyKey
      },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text
      })
    });
    if (!response.ok) return { status: "failed", providerMessageId: null };
    const result = (await response.json()) as { id?: string };
    return { status: "sent", providerMessageId: result.id ?? null };
  }
}

export class MailpitEmailAdapter implements EmailAdapter {
  constructor(private readonly baseUrl = "http://127.0.0.1:54324") {}

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const sender = message.from.match(/^(.*?)\s*<([^>]+)>$/);
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/v1/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Name: sender?.[1]?.trim() ?? "Closeout", Email: sender?.[2] ?? message.from },
        To: message.to.map((email) => ({ Email: email })),
        Subject: message.subject,
        Text: message.text,
        HTML: message.html ?? ""
      })
    });
    if (!response.ok) return { status: "failed", providerMessageId: null };
    return { status: "sent", providerMessageId: null };
  }
}

export type IdentityEmailKind =
  | "verify_email"
  | "password_reset"
  | "organization_invitation"
  | "invitation_reminder"
  | "email_changed"
  | "password_changed"
  | "mfa_changed"
  | "ownership_transfer"
  | "membership_changed"
  | "security_alert";

export type IdentityEmailInput = {
  kind: IdentityEmailKind;
  to: string;
  actionUrl?: string;
  organizationName?: string;
  expiresIn?: string;
  detail?: string;
  idempotencyKey: string;
  from?: string;
};

const subjects: Record<IdentityEmailKind, string> = {
  verify_email: "Confirm your email for Closeout",
  password_reset: "Reset your Closeout password",
  organization_invitation: "You’re invited to an organization on Closeout",
  invitation_reminder: "Reminder: your Closeout invitation",
  email_changed: "Your Closeout email was changed",
  password_changed: "Your Closeout password was changed",
  mfa_changed: "Your Closeout two-factor settings changed",
  ownership_transfer: "Review an ownership transfer in Closeout",
  membership_changed: "Your Closeout organization access changed",
  security_alert: "Security alert for your Closeout account"
};

const actionLabels: Partial<Record<IdentityEmailKind, string>> = {
  verify_email: "Confirm email",
  password_reset: "Reset password",
  organization_invitation: "Accept invitation",
  invitation_reminder: "Review invitation",
  ownership_transfer: "Review ownership transfer",
  password_changed: "Review security",
  mfa_changed: "Review security",
  security_alert: "Secure account"
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ??
      character
  );
}

function validateActionUrl(actionUrl: string | undefined): string | undefined {
  if (!actionUrl) return undefined;
  const url = new URL(actionUrl);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("INVALID_EMAIL_ACTION_URL");
  if (
    url.hostname !== "closeoutflow.com" &&
    !url.hostname.endsWith(".closeoutflow.com") &&
    !["127.0.0.1", "localhost"].includes(url.hostname)
  ) {
    throw new Error("INVALID_EMAIL_ACTION_HOST");
  }
  return url.toString();
}

export function renderIdentityEmail(input: IdentityEmailInput): EmailMessage {
  const actionUrl = validateActionUrl(input.actionUrl);
  const organization = input.organizationName ? ` for ${input.organizationName}` : "";
  const detail =
    input.detail ?? `A Closeout account security or access event occurred${organization}.`;
  const expiry = input.expiresIn ? ` This link expires in ${input.expiresIn}.` : "";
  const label = actionLabels[input.kind];
  const actionText = actionUrl && label ? `\n\n${label}: ${actionUrl}` : "";
  const text = `${detail}${expiry}${actionText}\n\nCloseout\nhttps://closeoutflow.com`;
  const actionHtml =
    actionUrl && label
      ? `<p style="margin:24px 0"><a href="${escapeHtml(actionUrl)}" style="background:#155eef;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">${escapeHtml(label)}</a></p>`
      : "";
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f6f8fb;color:#182230;font-family:Arial,sans-serif"><main style="max-width:600px;margin:0 auto;padding:32px 20px"><div style="font-weight:700;font-size:20px">Closeout</div><h1 style="font-size:24px;line-height:1.3">${escapeHtml(subjects[input.kind])}</h1><p style="line-height:1.6">${escapeHtml(detail)}${escapeHtml(expiry)}</p>${actionHtml}<p style="margin-top:32px;color:#667085;font-size:13px">Closeout · <a href="https://closeoutflow.com">closeoutflow.com</a></p></main></body></html>`;

  return {
    to: [input.to],
    from: input.from ?? "Closeout <no-reply@mail.closeoutflow.com>",
    subject: subjects[input.kind],
    html,
    text,
    idempotencyKey: input.idempotencyKey
  };
}
