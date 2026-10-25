import type { Resume, Section } from "../schema/resume.js";
export interface Diagnostic {
  code: string;
  message: string;
  severity: "warning" | "error";
  path?: string;
}
export interface ProviderResult {
  resume: Resume;
  diagnostics: Diagnostic[];
}
export interface ResumeProvider<Input = string> {
  id: string;
  load(input: Input): Promise<ProviderResult>;
}
export interface RenderOptions {
  paper: "a4" | "letter";
  density?: "comfortable" | "compact";
  sections?: Section[];
}
export interface ResumeAsset {
  path: string;
  content: Uint8Array;
  mediaType: string;
}
export interface RenderedFragment {
  /** Optional standalone shell; fragment consumers use only html/css/assets. */
  document?: { marginMm: number; css: string };
  html: string;
  css: string;
  assets: ResumeAsset[];
}
export interface ResumeTemplate {
  id: string;
  render(resume: Resume, options: RenderOptions): RenderedFragment;
}
