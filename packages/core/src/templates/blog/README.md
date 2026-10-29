# Blog

React/TSX recreation of the resume document in the user's blog. Uses system sans-serif, a centered name/contact block, company-first entries, right-aligned dates and ruled section headings. Separate CSS reproduces the original 14px screen and 12px print text and nested padding; the document renderer uses zero page margin plus the template's print padding.

```sh
resume-sdk build resume.yaml --template blog --sections education,work --format html,pdf
```

Section selection is explicit so other people's projects/skills are never silently hidden. Dates use canonical precision and normalized en-dash separators. Links remain normalized and safe. Navigation belongs to the host app. Exact appearance assumes the same system fonts/browser as the source.

This template has fixed screen/print spacing. Default `comfortable` selects the reference layout; `compact` is unsupported and rejected. Long entries follow the original blog's natural print flow.
