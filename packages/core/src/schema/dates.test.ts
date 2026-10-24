import { expect, it } from "vitest";
import { dateSchema, resumeSchema } from "./resume.js";
it("validates real calendar dates and preserves precision", () => {
  for (const value of ["2024", "2024-02", "2024-02-29"])
    expect(dateSchema.parse(value)).toBe(value);
  for (const value of ["0000", "2023-02-29", "2024-13", "2024-04-31"])
    expect(dateSchema.safeParse(value).success).toBe(false);
});
it("rejects contradictory ranges and unsafe links", () => {
  const base = { schemaVersion: "1", basics: { name: "Alex" } };
  for (const dates of [
    { startDate: "2025", endDate: "2024" },
    { current: true, endDate: "2024" },
  ]) {
    expect(
      resumeSchema.safeParse({ ...base, work: [{ name: "Co", position: "Engineer", ...dates }] })
        .success,
    ).toBe(false);
  }
  expect(
    resumeSchema.safeParse({ ...base, basics: { name: "Alex", url: "javascript:alert(1)" } })
      .success,
  ).toBe(false);
  expect(
    resumeSchema.parse({ ...base, basics: { name: "Alex", url: "example.com" } }).basics.url,
  ).toBe("https://example.com");
});
