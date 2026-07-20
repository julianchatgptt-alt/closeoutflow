const DEFAULT_REDIRECT = "/dashboard";

const allowedPrefixes = [
  "/account",
  "/dashboard",
  "/invite",
  "/mfa",
  "/onboarding",
  "/projects",
  "/reauthenticate",
  "/reports",
  "/reset-password",
  "/select-organization",
  "/settings",
  "/team"
] as const;

export function getSafeRedirect(
  candidate: string | null | undefined,
  fallback = DEFAULT_REDIRECT
): string {
  if (!candidate) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }

  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(decoded)
  ) {
    return fallback;
  }

  let url: URL;
  try {
    url = new URL(decoded, "https://closeoutflow.com");
  } catch {
    return fallback;
  }

  if (url.origin !== "https://closeoutflow.com") return fallback;
  const allowed = allowedPrefixes.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
  );
  return allowed ? `${url.pathname}${url.search}${url.hash}` : fallback;
}
