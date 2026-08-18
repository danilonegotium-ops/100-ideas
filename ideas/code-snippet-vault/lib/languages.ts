/**
 * Curated language list for the snippet form's <select> and the filter
 * dropdown. Values are highlight.js language identifiers/aliases (verified
 * against the installed `highlight.js@11.12.0` package — see
 * `hljs.listLanguages()` / `hljs.getLanguage(id)` in components/CodeBlock.tsx)
 * so a snippet's stored `language` column always maps to a real highlighter.
 */
export const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash / Shell" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain text" },
] as const;

export type LanguageValue = (typeof LANGUAGES)[number]["value"];

export function languageLabel(value: string): string {
  return LANGUAGES.find((l) => l.value === value)?.label ?? value;
}
