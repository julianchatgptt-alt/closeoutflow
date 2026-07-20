import { randomBytes } from "node:crypto";

import { createMiddlewareAuthClient } from "@closeoutflow/auth/middleware";
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

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/account") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/mfa") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/reauthenticate") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/select-organization") ||
    pathname.startsWith("/team")
  );
}

export async function proxy(request: NextRequest) {
  const nonce = createCspNonce();
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  // Next.js extracts the nonce from the request CSP and applies it to framework scripts.
  requestHeaders.set("content-security-policy", contentSecurityPolicy);
  requestHeaders.set("x-nonce", nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", contentSecurityPolicy);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const client = createMiddlewareAuthClient({
    url,
    anonKey,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (updates) => {
        for (const cookie of updates) request.cookies.set(cookie.name, cookie.value);
        response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set("content-security-policy", contentSecurityPolicy);
        for (const cookie of updates) response.cookies.set(cookie);
      }
    }
  });

  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(signIn);
    redirectResponse.headers.set("content-security-policy", contentSecurityPolicy);
    return redirectResponse;
  }

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
