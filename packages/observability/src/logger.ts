import pino, { type DestinationStream, type Logger } from "pino";

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";

export type LogContext = {
  requestId?: string;
  source?: "web" | "worker" | "api";
  level?: LogLevel;
};

const redactedValue = "[Redacted]";
const sensitiveKeys = new Set([
  "authorization",
  "proxyauthorization",
  "cookie",
  "setcookie",
  "accesstoken",
  "refreshtoken",
  "securelinktoken",
  "token",
  "password",
  "passphrase",
  "apikey",
  "secret",
  "clientsecret",
  "servicerolekey",
  "supabaseservicerolekey",
  "signedurl"
]);
const sensitivePayloadKeys = new Set([
  "body",
  "rawbody",
  "requestbody",
  "documentpayload",
  "filecontent",
  "filecontents",
  "bytes"
]);

function normalizedKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function keyIsSensitive(key: string): boolean {
  const normalized = normalizedKey(key);
  return (
    sensitiveKeys.has(normalized) ||
    normalized.endsWith("token") ||
    normalized.endsWith("password") ||
    normalized.endsWith("apikey") ||
    normalized.endsWith("secret") ||
    normalized.endsWith("signedurl") ||
    normalized.includes("servicerole")
  );
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (Array.isArray(value)) return value.map((entry) => redactValue(entry, seen));
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date || value instanceof Error || ArrayBuffer.isView(value)) return value;
  if (seen.has(value)) return "[Circular]";

  seen.add(value);
  const redacted: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const normalized = normalizedKey(key);
    redacted[key] =
      keyIsSensitive(key) || sensitivePayloadKeys.has(normalized)
        ? redactedValue
        : redactValue(nestedValue, seen);
  }
  seen.delete(value);
  return redacted;
}

export function redactSensitiveLogData(value: Record<string, unknown>): Record<string, unknown> {
  return redactValue(value, new WeakSet()) as Record<string, unknown>;
}

export function createLogger(context: LogContext = {}, destination?: DestinationStream): Logger {
  return pino(
    {
      base: null,
      level: context.level ?? "info",
      formatters: {
        log: redactSensitiveLogData
      }
    },
    destination
  ).child({
    request_id: context.requestId,
    source: context.source
  });
}
