import type { NextConfig } from "next";

export const securityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  }
] as const;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    "@closeoutflow/audit",
    "@closeoutflow/db",
    "@closeoutflow/env",
    "@closeoutflow/observability",
    "@closeoutflow/ui"
  ],
  async headers() {
    return [{ source: "/(.*)", headers: [...securityHeaders] }];
  }
};

export default nextConfig;
