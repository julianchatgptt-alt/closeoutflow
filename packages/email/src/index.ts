export type EmailMessage = {
  to: readonly string[];
  from: string;
  subject: string;
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
