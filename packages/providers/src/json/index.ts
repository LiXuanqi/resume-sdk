import { validateResume, type ResumeProvider } from "@resume-sdk/core";

export const jsonProvider: ResumeProvider = {
  id: "json",
  async load(input) {
    return { resume: validateResume(JSON.parse(input)), diagnostics: [] };
  },
};
