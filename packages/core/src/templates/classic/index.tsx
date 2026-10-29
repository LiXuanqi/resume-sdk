import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { renderOptionsSchema, validateResume, type ResumeTemplate } from "../../index.js";
import { Highlights, RichText, dates } from "../shared/components.js";
import css from "./styles.css";

function Entry({
  title,
  subtitle,
  date,
  children,
}: {
  title: string;
  subtitle: string;
  date: string;
  children: ReactNode;
}) {
  return (
    <div className="resume-document__entry">
      <div className="resume-document__entry-heading">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="resume-document__subtitle">{subtitle}</p>}
        </div>
        {date && <p className="resume-document__date">{date}</p>}
      </div>
      {children}
    </div>
  );
}
export const classicTemplate: ResumeTemplate = {
  id: "classic",
  render(input, options) {
    const resume = validateResume(input);
    const { sections, density } = renderOptionsSchema.parse(options);
    const b = resume.basics;
    const contact: ReactNode[] = [];
    if (b.location) contact.push(b.location);
    if (b.email) contact.push(<a href={`mailto:${b.email}`}>{b.email}</a>);
    if (b.phone) contact.push(b.phone);
    if (b.url) contact.push(<a href={b.url}>{b.url.replace(/^https?:\/\//, "")}</a>);
    for (const profile of b.profiles ?? [])
      contact.push(<a href={profile.url}>{profile.network}</a>);
    const blocks = {
      work: (resume.work ?? []).map((job, i) => (
        <Entry
          key={i}
          title={job.position}
          subtitle={[job.name, job.location].filter(Boolean).join(" · ")}
          date={dates(job)}
        >
          <Highlights items={job.highlights} />
        </Entry>
      )),
      education: (resume.education ?? []).map((school, i) => (
        <Entry
          key={i}
          title={school.institution}
          subtitle={[school.studyType, school.area].filter(Boolean).join(" · ")}
          date={dates(school)}
        >
          <Highlights items={school.highlights} />
        </Entry>
      )),
      projects: (resume.projects ?? []).map((project, i) => (
        <Entry key={i} title={project.name} subtitle="" date={dates(project)}>
          {project.description && <RichText as="p" text={project.description} />}
          {project.url && (
            <p>
              <a href={project.url}>{project.url}</a>
            </p>
          )}
          <Highlights items={project.highlights} />
        </Entry>
      )),
      skills: (resume.skills ?? []).map((skill, i) => (
        <p key={i}>
          <strong>{skill.name}:</strong> {skill.keywords.join(", ")}
        </p>
      )),
    };
    const titles = {
      work: "Experience",
      education: "Education",
      projects: "Projects",
      skills: "Skills",
    };
    return {
      html: renderToStaticMarkup(
        <article className={`resume-document resume-document--${density}`} aria-label="Resume">
          <header>
            <h1>{b.name}</h1>
            {b.label && <p className="resume-document__label">{b.label}</p>}
            <div className="resume-document__contact">
              {contact.map((value, i) => (
                <span key={i}>{value}</span>
              ))}
            </div>
          </header>
          {b.summary && <RichText as="p" className="resume-document__summary" text={b.summary} />}
          {sections
            .filter((section) => blocks[section].length)
            .map((section) => (
              <section key={section}>
                <h2>{titles[section]}</h2>
                {blocks[section]}
              </section>
            ))}
        </article>,
      ),
      css,
      assets: [],
    };
  },
};
