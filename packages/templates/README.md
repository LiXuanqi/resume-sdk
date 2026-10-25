# Authoring templates

Built-ins use React + TSX for readable typed components and separate CSS files for styling. Consumers receive ordinary HTML/CSS/assets; they do not need React in their website or a JSX/CSS build pipeline.

## Layout

```text
src/
  classic/index.tsx    React components and static-render adapter
  classic/styles.css  Scoped typography, density, print rules
  blog/index.tsx      Blog-style document
  blog/styles.css     Scoped resume styles
  blog/document.css   Standalone shell only
  shared/components.tsx  Safe rich text, highlights, date helpers
  index.ts            Built-in registry
```

## Add a template

1. Create `<id>/index.tsx` exporting a `ResumeTemplate`. Validate input and options; return `renderToStaticMarkup(<YourResume />)` as `html`, imported CSS as `css`, and `assets: []`.
2. Scope fragment CSS to the template's root class. Global body/page-shell rules belong in the optional `document: { marginMm, css }` field, which fragment consumers must omit. Let the document renderer emit page size/margins.
3. Use ordinary JSX expressions for data; React escapes them. Use `RichText`/`Highlights` for descriptions. Never insert source HTML directly. Keep data fetching, filesystem access, browser effects, and website navigation out of templates.
4. Register the template in `src/index.ts`. CLI build/preview choices follow that registry automatically. Honor selected section order and populated content; do not trim facts to fit a page. Reject unsupported presentation options explicitly.
5. Run `pnpm check` and `pnpm test:pdf`. Preview fictional data with `pnpm cli preview examples/resume.yaml --template <id>`; inspect short/long resumes, both papers, links, and malicious-looking text.

`build.mjs` emits declarations and bundles the single public entry with CSS as strings. React and Markdown libraries remain package dependencies. No runtime CSS files or consumer loaders are needed. Generated `dist/` is disposable.

## Framework-neutral boundary

`ResumeTemplate` lives in core and references only canonical data, render options, and string/binary artifacts. A plain JavaScript template remains valid. React components are internal implementation details, not the public template contract. Vue support would require a separate adapter/build recipe and an explicit decision about asynchronous rendering; it is not implemented here.
