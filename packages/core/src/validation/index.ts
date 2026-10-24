import { resumeSchema } from "../schema/resume.js";
export function validateResume(input: unknown) {
  const result = resumeSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      result.error.issues
        .map((issue) => `INVALID_RESUME ${issue.path.join(".") || "$"}: ${issue.message}`)
        .join("\n"),
    );
  }
  return result.data;
}
