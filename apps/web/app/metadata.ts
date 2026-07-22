import type { Metadata } from "next";

export const PRODUCT_DESCRIPTION =
  "Construction closeout software for organizing project requirements, documents, reviews, and turnover records.";

export const metadata: Metadata = {
  metadataBase: new URL("https://closeoutflow.com"),
  applicationName: "Closeout",
  title: {
    default: "Closeout | Construction Closeout Software",
    template: "%s | Closeout"
  },
  description: PRODUCT_DESCRIPTION,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/closeout-symbol-compact.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Closeout",
    title: "Closeout | Construction Closeout Software",
    description: PRODUCT_DESCRIPTION,
    images: [
      {
        url: "/brand/opengraph.png",
        width: 1200,
        height: 630,
        alt: "Closeout — every record ready for handoff"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Closeout | Construction Closeout Software",
    description: PRODUCT_DESCRIPTION,
    images: ["/brand/opengraph.png"]
  }
};
