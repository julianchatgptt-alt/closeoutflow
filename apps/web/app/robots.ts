import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/",
        "/api/",
        "/dashboard",
        "/design",
        "/invite/",
        "/mfa/",
        "/onboarding",
        "/platform/",
        "/projects/",
        "/reauthenticate",
        "/select-organization",
        "/settings/",
        "/sign-in",
        "/sign-up",
        "/verify-email",
        "/forgot-password",
        "/reset-password"
      ]
    },
    host: "https://closeoutflow.com"
  };
}
