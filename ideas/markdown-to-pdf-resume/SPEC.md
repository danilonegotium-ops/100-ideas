# Markdown to PDF Resume

A resume editor: a Markdown textarea (pre-filled with a starter resume template covering
headers, contact-line links, bold, bullet lists, and a horizontal rule) on the left, with a live
HTML preview on the right that re-renders on every keystroke via a hand-written
`markdownToHtml()` parser (`app.js`) covering the common subset needed for a resume — headers
(`#`..`######`), bold (`**`/`__`), italic (`*`/`_`), inline code, links (`[text](url)`),
unordered/ordered lists, horizontal rules, and paragraphs (blank-line separated, single newlines
within a paragraph become `<br>` so contact-info lines don't need trailing blank lines). Not a
full CommonMark implementation — no nested blockquotes, tables, footnotes, or nested lists.

"Download PDF" calls `window.print()`. A `@media print` block in `theme.css` hides everything
except `#preview` (editor pane, header, footer, buttons all get `display: none`), strips the
preview's card styling (border/shadow/padding), and sets `@page { margin: 1.5cm }` so the
browser's native print-to-PDF produces a clean, full-page resume with no extra chrome. This
avoids needing a client-side PDF-generation library. The preview pane is always styled as white
paper with dark text (independent of the site's dark/light theme) since it represents the
printed page.

**Out of scope for this pass:** full CommonMark compliance (tables, blockquotes, nested lists,
footnotes, images), multiple resume templates/themes, saving to localStorage, custom page
size/margin controls in the UI (fixed at 1.5cm via CSS), export formats other than the browser's
native print dialog (no server-side PDF generation, no docx export).

**Data:** `data.js` contains only the starter resume template text — original placeholder copy
written for this tool, not a real person's resume.
