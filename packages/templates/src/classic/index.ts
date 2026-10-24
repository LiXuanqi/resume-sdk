import { renderOptionsSchema, validateResume, type ResumeTemplate } from "@resume-sdk/core";
import { escapeHtml as e, richText } from "../shared/text.js";
const dates = (entry: {
  startDate?: string | undefined;
  endDate?: string | undefined;
  current?: boolean | undefined;
}) => [entry.startDate, entry.current ? "Present" : entry.endDate].filter(Boolean).join(" – ");
const list = (items?: string[]) =>
  items?.length ? `<ul>${items.map((item) => `<li>${richText(item)}</li>`).join("")}</ul>` : "";
const entry = (title: string, subtitle: string, date: string, content: string) =>
  `<div class="resume-document__entry"><div class="resume-document__entry-heading"><div><h3>${e(title)}</h3>${subtitle ? `<p class="resume-document__subtitle">${e(subtitle)}</p>` : ""}</div>${date ? `<p class="resume-document__date">${e(date)}</p>` : ""}</div>${content}</div>`;
export const classicTemplate: ResumeTemplate = {
  id: "classic",
  render(input, options) {
    const resume = validateResume(input);
    const { sections } = renderOptionsSchema.parse(options);
    const b = resume.basics;
    const contact = [
      b.location ? e(b.location) : "",
      b.email ? `<a href="mailto:${e(b.email)}">${e(b.email)}</a>` : "",
      b.phone ? e(b.phone) : "",
      b.url ? `<a href="${e(b.url)}">${e(b.url.replace(/^https?:\/\//, ""))}</a>` : "",
      ...(b.profiles ?? []).map(
        (profile) => `<a href="${e(profile.url)}">${e(profile.network)}</a>`,
      ),
    ]
      .filter(Boolean)
      .map((value) => `<span>${value}</span>`)
      .join("");
    const blocks = {
      work: (resume.work ?? [])
        .map((job) =>
          entry(
            job.position,
            [job.name, job.location].filter(Boolean).join(" · "),
            dates(job),
            list(job.highlights),
          ),
        )
        .join(""),
      education: (resume.education ?? [])
        .map((school) =>
          entry(
            school.institution,
            [school.studyType, school.area].filter(Boolean).join(" · "),
            dates(school),
            list(school.highlights),
          ),
        )
        .join(""),
      projects: (resume.projects ?? [])
        .map((project) =>
          entry(
            project.name,
            "",
            dates(project),
            `${project.description ? `<p>${richText(project.description)}</p>` : ""}${project.url ? `<p><a href="${e(project.url)}">${e(project.url)}</a></p>` : ""}${list(project.highlights)}`,
          ),
        )
        .join(""),
      skills: (resume.skills ?? [])
        .map(
          (skill) =>
            `<p><strong>${e(skill.name)}:</strong> ${skill.keywords.map(e).join(", ")}</p>`,
        )
        .join(""),
    };
    const titles = {
      work: "Experience",
      education: "Education",
      projects: "Projects",
      skills: "Skills",
    };
    return {
      html: `<article class="resume-document" aria-label="Resume"><header><h1>${e(b.name)}</h1>${b.label ? `<p class="resume-document__label">${e(b.label)}</p>` : ""}<div class="resume-document__contact">${contact}</div></header>${b.summary ? `<p class="resume-document__summary">${richText(b.summary)}</p>` : ""}${sections
        .filter((section) => blocks[section])
        .map((section) => `<section><h2>${titles[section]}</h2>${blocks[section]}</section>`)
        .join("")}</article>`,
      css: `
.resume-document { color: #202b36; font: 10.5pt/1.45 Arial, Helvetica, sans-serif; overflow-wrap: anywhere; }
.resume-document, .resume-document * { box-sizing: border-box; }
.resume-document h1 { font-size: 27pt; line-height: 1.1; letter-spacing: -0.6pt; margin: 0 0 5pt; color: #172b3e; }
.resume-document h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 1.2pt; border-bottom: 1px solid #adb9c3; padding-bottom: 4pt; margin: 17pt 0 9pt; break-after: avoid; }
.resume-document h3 { font-size: 11pt; margin: 0; }
.resume-document p { margin: 3pt 0; }
.resume-document a { color: #254d70; text-decoration: none; }
.resume-document ul { padding-left: 15pt; margin: 6pt 0 0; }
.resume-document li { margin: 3pt 0; orphans: 2; widows: 2; }
.resume-document__label { font-size: 12pt; color: #496073; }
.resume-document__contact { display: flex; flex-wrap: wrap; gap: 3pt 12pt; font-size: 9pt; margin-top: 9pt; }
.resume-document .resume-document__summary { margin-top: 14pt; }
.resume-document__entry { margin-bottom: 11pt; break-inside: avoid; }
.resume-document__entry-heading { display: flex; justify-content: space-between; gap: 12pt; break-after: avoid; }
.resume-document__date { white-space: nowrap; font-size: 9pt; color: #496073; }
.resume-document__subtitle { color: #496073; }
@media screen and (max-width: 540px) { .resume-document__entry-heading { display: block; } }
@media print { .resume-document { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
`,
      assets: [],
    };
  },
};
