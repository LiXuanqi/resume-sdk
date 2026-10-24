import MarkdownIt from "markdown-it";
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );
}
const markdown = new MarkdownIt("zero", { html: false }).enable([
  "emphasis",
  "link",
  "escape",
  "entity",
  "newline",
]);
markdown.validateLink = (url) => {
  try {
    return ["https:", "http:", "mailto:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};
export function richText(value: string): string {
  return markdown.renderInline(value);
}
