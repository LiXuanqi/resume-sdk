import { validateResume, type ResumeProvider } from "../../index.js";
import { parse } from "yaml";

export const yamlProvider: ResumeProvider = {
  id: "yaml",
  async load(input) {
    return { resume: validateResume(parse(input)), diagnostics: [] };
  },
};
