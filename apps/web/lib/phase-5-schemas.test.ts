import { describe, expect, it } from "vitest";

import {
  companySchema,
  contactSchema,
  projectCreateSchema,
  projectUpdateSchema
} from "./phase-5-schemas";

describe("Phase 5 form validation", () => {
  it("keeps fast project creation to one required field", () => {
    expect(projectCreateSchema.safeParse({ name: "Medical Office" }).success).toBe(true);
    expect(projectCreateSchema.safeParse({ name: " " }).success).toBe(false);
  });

  it("rejects malformed contact email without requiring an account", () => {
    expect(
      contactSchema.safeParse({ firstName: "Jordan", lastName: "Lee", email: "bad" }).success
    ).toBe(false);
    expect(
      contactSchema.safeParse({ firstName: "Jordan", lastName: "Lee", email: "" }).success
    ).toBe(true);
  });

  it("requires concurrency tokens for project updates", () => {
    expect(
      projectUpdateSchema.safeParse({ projectId: crypto.randomUUID(), name: "Office" }).success
    ).toBe(false);
  });

  it("validates reusable company records", () => {
    expect(
      companySchema.safeParse({ displayName: "Ace Mechanical", email: "ops@ace.example" }).success
    ).toBe(true);
    expect(companySchema.safeParse({ displayName: "A" }).success).toBe(false);
  });
});
