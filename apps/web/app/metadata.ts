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
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Closeout",
    title: "Closeout | Construction Closeout Software",
    description: PRODUCT_DESCRIPTION
  },
  twitter: {
    card: "summary",
    title: "Closeout | Construction Closeout Software",
    description: PRODUCT_DESCRIPTION
  }
};
