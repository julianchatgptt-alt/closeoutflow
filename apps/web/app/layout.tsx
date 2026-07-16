import type { Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { ThemeProvider } from "../components/theme/theme-provider";
import { THEME_INIT_SCRIPT } from "../components/theme/theme-script";
export { metadata, PRODUCT_DESCRIPTION } from "./metadata";
import "./globals.css";

// Nonce-based CSP requires every HTML response to be rendered with its request nonce.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" }
  ]
};

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true
});

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script nonce={nonce} suppressHydrationWarning>
          {THEME_INIT_SCRIPT}
        </script>
      </head>
      <body className={`${plexSans.variable} ${plexMono.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
