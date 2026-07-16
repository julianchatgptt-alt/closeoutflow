import { randomBytes } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

export function createCspNonce(): string {
  return randomBytes(16).toString("base64");
}

export function createContentSecurityPolicy(
  nonce: string,
  environment: "development" | "production" | "test" = process.env.NODE_ENV
): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      environment === "development" ? " 'unsafe-eval'" : ""
    }`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    environment === "production" ? "upgrade-insecure-requests" : ""
  ];

  return directives.filter(Boolean).join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = createCspNonce();
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  // Next.js extracts the nonce from the request CSP and applies it to framework scripts.
  requestHeaders.set("content-security-policy", contentSecurityPolicy);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icons/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
};
