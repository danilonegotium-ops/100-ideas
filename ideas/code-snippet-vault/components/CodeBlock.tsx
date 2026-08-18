"use client";

import { useMemo } from "react";
import hljs from "highlight.js";

/**
 * Client-side syntax highlighting via `highlight.js` (BSD-3-Clause, no
 * build step required — it's a plain npm dependency that bundles through
 * Next.js's normal webpack pipeline like any other JS import). Chosen over
 * a heavier React wrapper (e.g. react-syntax-highlighter) because the raw
 * `hljs.highlight()` API is small, stable, and well documented, and because
 * this template is deliberately dependency-light. Styling for the emitted
 * `hljs-*` token classes lives in `app/globals.css` (a hand-written theme,
 * not one of highlight.js's bundled CSS files — see the comment there for
 * why).
 */
export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const html = useMemo(() => {
    const known = hljs.getLanguage(language);
    const result = known
      ? hljs.highlight(code, { language, ignoreIllegals: true })
      : hljs.highlightAuto(code);
    return result.value;
  }, [code, language]);

  return (
    <pre className="hljs overflow-x-auto rounded-brand border border-border bg-bg p-3 text-sm">
      <code
        className="font-mono"
        // eslint-disable-next-line react/no-danger -- output comes from
        // highlight.js's own HTML-escaping tokenizer, not raw user HTML.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
}
