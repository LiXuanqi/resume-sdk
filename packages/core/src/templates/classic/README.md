# Classic

React/TSX-authored static semantic HTML and separate scoped CSS with safe inline Markdown. Uses system fonts and no external assets or client-side layout runtime. Chromium handles PDF pagination.

- `density: "comfortable"` (default): 10.5pt/1.45 body, 27pt name; document renderer supplies 16mm margins.
- `density: "compact"`: 9pt/1.25 body, 20pt name, tighter section/list/entry spacing; document renderer supplies 12mm margins.
- Entries can split between bullets. Headings stay with following content; individual bullets avoid splitting where possible. Oversized content can continue onto later pages.
- Density never changes resume content or automatically scales text to fit one page.

CLI: `resume-sdk build resume.yaml --density compact --format html,pdf`. Preview accepts the same option. Library: `renderDocument(resume, { paper: "letter", density: "compact" })`.
