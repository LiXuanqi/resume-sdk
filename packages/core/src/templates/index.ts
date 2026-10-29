export type { ResumeTemplate } from "../index.js";
import { classicTemplate } from "./classic/index.js";
import { blogTemplate } from "./blog/index.js";
export { classicTemplate, blogTemplate };
export const templates = { classic: classicTemplate, blog: blogTemplate };
export const templateIds = Object.keys(templates);
export function getTemplate(id: string) {
  const template = Object.hasOwn(templates, id)
    ? templates[id as keyof typeof templates]
    : undefined;
  if (!template) throw new Error(`Unknown template: ${id}`);
  return template;
}
