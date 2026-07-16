import pino, { type DestinationStream, type Logger } from "pino";

export type LogContext = {
  requestId?: string;
  source?: "web" | "worker" | "api";
};

export function createLogger(context: LogContext = {}, destination?: DestinationStream): Logger {
  return pino(
    {
      base: null,
      level: "info",
      redact: {
        paths: [
          "password",
          "token",
          "authorization",
          "cookie",
          "*.password",
          "*.token",
          "*.authorization",
          "*.cookie",
          "*.serviceRoleKey"
        ],
        censor: "[Redacted]"
      }
    },
    destination
  ).child({
    request_id: context.requestId,
    source: context.source
  });
}
