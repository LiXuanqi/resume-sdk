import { Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderOptionsSchema, validateResume, type ResumeTemplate } from "@resume-sdk/core";
import { Highlights, RichText, type DateRange } from "../shared/components.js";
import css from "./styles.css";
import documentCss from "./document.css";

const displayDate = (date: string) => {
  const [year, month, day] = date.split("-");
  return month ? `${month}/${day ? `${day}/` : ""}${year}` : date;
};
const dateRange = (entry: DateRange) =>
  [
    entry.startDate ? displayDate(entry.startDate) : undefined,
    entry.current ? "Present" : entry.endDate ? displayDate(entry.endDate) : undefined,
  ]
    .filter(Boolean)
    .join(" – ");
const urlLabel = (url: string) => url.replace(/^https?:\/\//, "");
function Row({
  title,
  location,
  date,
  children,
}: {
  title: string;
  location?: string | undefined;
  date: string;
  children: ReactNode;
}) {
  return (
    <div className="blog-entry">
      <div className="blog-entry-heading">
        <div>
          <div className="blog-title">
            <h3>{title}</h3>
          </div>
          <span className="blog-location">{location ?? ""}</span>
        </div>
        <div className="blog-date">
          <span>{date}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
function Separated({ items }: { items: ReactNode[] }) {
  return items.map((item, i) => (
    <Fragment key={i}>
      {i > 0 && <span> | </span>}
      {item}
    </Fragment>
  ));
}
export const blogTemplate: ResumeTemplate = {
  id: "blog",
  render(input, options) {
    const resume = validateResume(input);
    const { sections, density } = renderOptionsSchema.parse(options);
    if (density !== "comfortable")
      throw new Error(
        "The blog template uses fixed screen/print spacing. Omit --density or use comfortable.",
      );
    const b = resume.basics;
    const links = (b.profiles ?? []).map((profile, i) => (
      <a key={i} href={profile.url}>
        {urlLabel(profile.url)}
      </a>
    ));
    if (b.url)
      links.push(
        <a key="website" href={b.url}>
          {urlLabel(b.url)}
        </a>,
      );
    const blocks = {
      education: (resume.education ?? []).map((school, i) => (
        <Row key={i} title={school.institution} date={dateRange(school)}>
          {(school.studyType || school.area) && (
            <p>{[school.studyType, school.area].filter(Boolean).join(" · ")}</p>
          )}
          <Highlights items={school.highlights} />
        </Row>
      )),
      work: (resume.work ?? []).map((job, i) => (
        <Row
          key={i}
          title={`${job.name}, ${job.position}`}
          location={job.location}
          date={dateRange(job)}
        >
          <Highlights items={job.highlights} />
        </Row>
      )),
      projects: (resume.projects ?? []).map((project, i) => (
        <Row key={i} title={project.name} date={dateRange(project)}>
          {project.description && <RichText as="p" text={project.description} />}
          {project.url && (
            <p>
              <a href={project.url}>{urlLabel(project.url)}</a>
            </p>
          )}
          <Highlights items={project.highlights} />
        </Row>
      )),
      skills: (resume.skills ?? []).map((skill, i) => (
        <p key={i}>
          <strong>{skill.name}:</strong> {skill.keywords.join(", ")}
        </p>
      )),
    };
    const titles = {
      education: "Education",
      work: "Work Experience",
      projects: "Projects",
      skills: "Skills",
    };
    const html = renderToStaticMarkup(
      <article className="resume-document resume-blog" aria-label="Resume">
        <div className="blog-sheet">
          <div className="blog-content">
            <div className="blog-body">
              <header>
                <h1>{b.name}</h1>
                {b.label && <p className="blog-contact">{b.label}</p>}
                <div className="blog-contact">
                  <Separated
                    items={[b.location, b.phone, b.email].filter(
                      (value): value is string => !!value,
                    )}
                  />
                </div>
                {links.length > 0 && (
                  <div className="blog-links">
                    <Separated items={links} />
                  </div>
                )}
              </header>
              {b.summary && <RichText as="p" text={b.summary} />}
              {sections
                .filter((section) => blocks[section].length)
                .map((section) => (
                  <section key={section}>
                    <h2>{titles[section]}</h2>
                    {blocks[section]}
                  </section>
                ))}
            </div>
          </div>
        </div>
      </article>,
    );
    return { html, css, assets: [], document: { marginMm: 0, css: documentCss } };
  },
};
