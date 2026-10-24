import { z } from "zod";

const text = z.string().trim().min(1);
export const urlSchema = text
  .transform((value) => {
    // Accept bare domains but never reinterpret explicit unsafe schemes.
    return /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  })
  .pipe(
    z
      .url()
      .refine(
        (value) => ["https:", "http:"].includes(new URL(value).protocol),
        "Expected an HTTP(S) URL",
      ),
  );
export const dateSchema = z
  .string()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "Use YYYY, YYYY-MM, or YYYY-MM-DD")
  .refine((value) => {
    const [year = 0, month, day] = value.split("-").map(Number);
    if (year < 1 || year > 9999) return false;
    if (month === undefined) return true;
    if (month < 1 || month > 12) return false;
    if (day === undefined) return true;
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day >= 1 && day <= days[month - 1]!;
  }, "Invalid calendar date");
const dates = {
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  current: z.boolean().optional(),
};
function checkDates(
  value: {
    startDate?: string | undefined;
    endDate?: string | undefined;
    current?: boolean | undefined;
  },
  ctx: z.RefinementCtx,
) {
  if (value.current && value.endDate)
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "An ongoing entry cannot have an end date",
    });
  // Compare intervals: do not invent precision when only a year/month is known.
  const lower = (d: string) => (d.length === 4 ? `${d}-01-01` : d.length === 7 ? `${d}-01` : d);
  const upper = (d: string) => (d.length === 4 ? `${d}-12-31` : d.length === 7 ? `${d}-31` : d);
  if (value.startDate && value.endDate && lower(value.startDate) > upper(value.endDate))
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date precedes start date" });
}
const highlights = z.array(text).optional();
const work = z
  .object({ name: text, position: text, location: text.optional(), ...dates, highlights })
  .strict()
  .superRefine(checkDates);
const education = z
  .object({
    institution: text,
    studyType: text.optional(),
    area: text.optional(),
    ...dates,
    highlights,
  })
  .strict()
  .superRefine(checkDates);
const project = z
  .object({
    name: text,
    description: text.optional(),
    url: urlSchema.optional(),
    ...dates,
    highlights,
  })
  .strict()
  .superRefine(checkDates);
export const sectionSchema = z.enum(["work", "education", "projects", "skills"]);
export type Section = z.infer<typeof sectionSchema>;
export const renderOptionsSchema = z
  .object({
    paper: z.enum(["a4", "letter"]).default("letter"),
    sections: z
      .array(sectionSchema)
      .refine((items) => new Set(items).size === items.length, "Duplicate section")
      .default(["work", "education", "projects", "skills"]),
  })
  .strict();
export const resumeSchema = z
  .object({
    schemaVersion: z.literal("1"),
    basics: z
      .object({
        name: text,
        label: text.optional(),
        summary: text.optional(),
        email: z.email().optional(),
        phone: text.optional(),
        location: text.optional(),
        url: urlSchema.optional(),
        profiles: z.array(z.object({ network: text, url: urlSchema }).strict()).optional(),
      })
      .strict(),
    work: z.array(work).optional(),
    education: z.array(education).optional(),
    projects: z.array(project).optional(),
    skills: z.array(z.object({ name: text, keywords: z.array(text).min(1) }).strict()).optional(),
  })
  .strict();
export type Resume = z.infer<typeof resumeSchema>;
