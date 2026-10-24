import { z } from "zod";

// Initial contract only; expand before implementing full resume generation.
export const resumeSchema = z
  .object({
    schemaVersion: z.literal("1"),
    basics: z.object({ name: z.string().trim().min(1), label: z.string().optional() }).strict(),
  })
  .strict();
export type Resume = z.infer<typeof resumeSchema>;
