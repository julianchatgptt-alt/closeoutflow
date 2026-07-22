// @vitest-environment node

import { describe, expect, it } from "vitest";

import { metadata, PRODUCT_DESCRIPTION } from "./metadata";

describe("Closeout metadata", () => {
  it("centralizes the public brand and canonical domain", () => {
    expect(metadata.metadataBase?.toString()).toBe("https://closeoutflow.com/");
    expect(metadata.applicationName).toBe("Closeout");
    expect(metadata.title).toMatchObject({
      default: "Closeout | Construction Closeout Software",
      template: "%s | Closeout"
    });
    expect(metadata.alternates).toMatchObject({ canonical: "/" });
    expect(metadata.openGraph).toMatchObject({
      siteName: "Closeout",
      title: "Closeout | Construction Closeout Software",
      description: PRODUCT_DESCRIPTION,
      images: [expect.objectContaining({ url: "/brand/opengraph.png", width: 1200, height: 630 })]
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Closeout | Construction Closeout Software",
      description: PRODUCT_DESCRIPTION,
      images: ["/brand/opengraph.png"]
    });
    expect(metadata.icons).toMatchObject({
      icon: expect.arrayContaining([
        expect.objectContaining({ url: "/brand/favicon-16.png", sizes: "16x16" }),
        expect.objectContaining({ url: "/brand/favicon-32.png", sizes: "32x32" }),
        expect.objectContaining({ url: "/brand/favicon-48.png", sizes: "48x48" })
      ]),
      apple: [expect.objectContaining({ url: "/brand/apple-touch-icon.png" })]
    });
  });

  it("uses a natural product descriptor without the retired visible brand", () => {
    expect(PRODUCT_DESCRIPTION).toMatch(/construction closeout software/i);
    expect(JSON.stringify(metadata)).not.toContain("CloseoutFlow");
  });
});
