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
      description: PRODUCT_DESCRIPTION
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary",
      title: "Closeout | Construction Closeout Software",
      description: PRODUCT_DESCRIPTION
    });
  });

  it("uses a natural product descriptor without the retired visible brand", () => {
    expect(PRODUCT_DESCRIPTION).toMatch(/construction closeout software/i);
    expect(JSON.stringify(metadata)).not.toContain("CloseoutFlow");
  });
});
