import { createHash } from "node:crypto";
import postcss from "postcss";
import {
  renderOptionsSchema,
  validateResume,
  type Resume,
  type ResumeTemplate,
  type RenderOptions,
  type RenderedFragment,
} from "../index.js";
import { classicTemplate } from "../templates/index.js";

export type EmbeddedResume = Pick<RenderedFragment, "html" | "css" | "assets">;

/** Scope each selector under the generated wrapper, including conditional rules. */
export function renderFragment(
  resume: Resume,
  options: RenderOptions = { paper: "letter" },
  template: ResumeTemplate = classicTemplate,
): EmbeddedResume {
  const fragment = template.render(validateResume(resume), renderOptionsSchema.parse(options));
  if (fragment.assets.length)
    throw new Error("Fragment asset packaging is not supported yet; use an asset-free template.");
  const scope = createHash("sha256")
    .update(template.id)
    .update("\0")
    .update(fragment.css)
    .digest("hex")
    .slice(0, 24);
  const selector = `[data-resume-sdk="${scope}"]`;
  const stylesheet = postcss.parse(fragment.css);
  stylesheet.walkAtRules((rule) => {
    if (!["media", "supports"].includes(rule.name.toLowerCase()))
      throw new Error(
        `Fragment CSS does not support @${rule.name}; use scoped rules inside @media or @supports. Put page-shell rules in document.css.`,
      );
  });
  stylesheet.walkRules((rule) => {
    if (rule.nodes.some((node) => node.type !== "decl" && node.type !== "comment"))
      throw new Error(
        "Fragment CSS nesting is not supported; expand nested selectors before rendering.",
      );
    rule.selectors = rule.selectors.map((child) => `${selector} ${child}`);
  });
  return {
    html: `<div class="resume-sdk" data-resume-sdk="${scope}">${fragment.html}</div>`,
    css: stylesheet.toString(),
    assets: [],
  };
}
