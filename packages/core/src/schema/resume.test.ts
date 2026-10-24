import { describe, expect, it } from "vitest";
import { resumeSchema } from "./resume.js";

describe("resume schema", () => {
  it("normalizes whitespace in the name", () => {
    expect(
      resumeSchema.parse({ schemaVersion: "1", basics: { name: " Ada Lovelace " } }).basics.name,
    ).toBe("Ada Lovelace");
  });
  it("rejects unsupported versions and unknown fields instead of silently discarding data", () => {
    expect(resumeSchema.safeParse({ schemaVersion: "2", basics: { name: "Ada" } }).success).toBe(
      false,
    );
    expect(
      resumeSchema.safeParse({ schemaVersion: "1", basics: { name: "Ada" }, unknownSection: [] })
        .success,
    ).toBe(false);
  });
});
