# Resume schema v1

Canonical field reference for the current MVP; [SPEC.md](SPEC.md) defines product behavior. Objects are strict: unknown properties fail rather than being dropped. Only `schemaVersion` and `basics` are required at the root. All text fields are trimmed and must be nonempty when supplied.

| Object          | Required                        | Optional                                                                       |
| --------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| Root            | `schemaVersion: "1"`, `basics`  | `work[]`, `education[]`, `projects[]`, `skills[]`                              |
| basics          | `name`                          | `label`, `summary`, `email`, `phone`, `location` (string), `url`, `profiles[]` |
| profile         | `network`, `url`                | —                                                                              |
| work entry      | `name` (employer), `position`   | `location`, dates, `highlights[]`                                              |
| education entry | `institution`                   | `studyType`, `area`, dates, `highlights[]`                                     |
| project entry   | `name`                          | `description`, `url`, dates, `highlights[]`                                    |
| skill entry     | `name`, `keywords[]` (nonempty) | —                                                                              |

Dates are optional `startDate`, `endDate` (`YYYY`, `YYYY-MM`, or `YYYY-MM-DD`) and `current` (boolean). `current: true` cannot coexist with `endDate`. Invalid calendar dates and unambiguously reversed ranges fail. Date precision is retained and currently displayed verbatim; current entries display “Present”.

URLs accept HTTP(S); a bare domain receives `https://`. Profile text, titles, and keywords are plain text. `summary`, project `description`, and `highlights` accept inline Markdown emphasis, strong emphasis, and links. Embedded raw HTML is escaped. Relative/unsafe Markdown links and images are not rendered as active content.

Collections preserve source order. Rendering defaults to work, education, projects, skills; empty sections are omitted. `--sections` overrides selection/order. The profile header and summary remain visible. See the equivalent fictional YAML and JSON examples under `examples/`.

Custom fields, arbitrary assets, and source provenance storage are not implemented in this slice. These data are JSON Resume-inspired, not a drop-in implementation of the external JSON Resume schema.
