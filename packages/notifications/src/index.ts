export type NotificationChannel = "email" | "in_app";

export type NotificationRequest = {
  channel: NotificationChannel;
  recipientId: string;
  category: string;
  idempotencyKey: string;
  payload: Readonly<Record<string, unknown>>;
};

export interface NotificationsAdapter {
  dispatch(request: NotificationRequest): Promise<{ status: "queued" | "skipped" }>;
}

export const noopNotificationsAdapter: NotificationsAdapter = {
  async dispatch() {
    return { status: "skipped" };
  }
};
