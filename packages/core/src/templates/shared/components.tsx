import { richText } from "./text.js";
export function RichText({
  as: Tag,
  text,
  className,
}: {
  as: "p" | "li";
  text: string;
  className?: string;
}) {
  // Only the restricted Markdown renderer may produce raw markup.
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: richText(text) }} />;
}
export function Highlights({ items }: { items?: string[] | undefined }) {
  return items?.length ? (
    <ul>
      {items.map((text, i) => (
        <RichText key={i} as="li" text={text} />
      ))}
    </ul>
  ) : null;
}
export interface DateRange {
  startDate?: string | undefined;
  endDate?: string | undefined;
  current?: boolean | undefined;
}
export const dates = (entry: DateRange) =>
  [entry.startDate, entry.current ? "Present" : entry.endDate].filter(Boolean).join(" – ");
