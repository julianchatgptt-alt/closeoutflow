import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

// Nonce-based CSP requires every HTML response to be rendered with its request nonce.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CloseoutFlow",
  description: "Construction closeout management foundation"
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
