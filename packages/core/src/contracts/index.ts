import type { Resume } from "../schema/resume.js";

export interface Diagnostic {
  message: string;
  severity: "warning" | "error";
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
}
export interface ResumeAsset {
  path: string;
  content: Uint8Array;
  mediaType: string;
}
export interface RenderedFragment {
  html: string;
  css: string;
  assets: ResumeAsset[];
}
export interface ResumeTemplate {
  id: string;
  render(resume: Resume, options: RenderOptions): RenderedFragment;
}
