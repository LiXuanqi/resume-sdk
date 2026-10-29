import { validateResume, type ResumeProvider } from "../../index.js";

export const jsonProvider: ResumeProvider = {
  id: "json",
  async load(input) {
    return { resume: validateResume(JSON.parse(input)), diagnostics: [] };
  },
};
