import { resumeSchema } from "../schema/resume.js";
export const validateResume = (input: unknown) => resumeSchema.parse(input);
