import * as Sentry from "@sentry/node";

export type SentryOptions = {
  enabled: boolean;
  dsn?: string;
  environment: string;
};

export function initializeSentry(options: SentryOptions): boolean {
  if (!options.enabled || !options.dsn) return false;

  Sentry.init({
    dsn: options.dsn,
    environment: options.environment,
    sendDefaultPii: false
  });
  return true;
}
