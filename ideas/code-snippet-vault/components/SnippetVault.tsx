"use client";

import { FormEvent, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { CodeBlock } from "@/components/CodeBlock";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES, languageLabel } from "@/lib/languages";
import type { Snippet } from "@/lib/types";

type FormStatus = "idle" | "saving" | "error";

export function SnippetVault({
  userId,
  initialSnippets,
}: {
  userId: string;
  initialSnippets: Snippet[];
}) {
  const [snippets, setSnippets] = useState<Snippet[]>(initialSnippets);
  const [showForm, setShowForm] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState("");

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<string>(LANGUAGES[0].value);
  const [code, setCode] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const s of snippets) for (const t of s.tags) set.add(t);
    return Array.from(set).sort();
  }, [snippets]);

  const allLanguagesInUse = useMemo(() => {
    const set = new Set<string>();
    for (const s of snippets) set.add(s.language);
    return Array.from(set).sort();
  }, [snippets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snippets.filter((s) => {
      if (languageFilter !== "all" && s.language !== languageFilter)
        return false;
      if (tagFilter !== "all" && !s.tags.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.code.toLowerCase().includes(q)
      );
    });
  }, [snippets, search, languageFilter, tagFilter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormStatus("saving");
    setFormError("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("code_snippet_vault_snippets")
      .insert({
        user_id: userId,
        title: title.trim(),
        language,
        code,
        tags,
      })
      .select("id, title, language, code, tags, created_at, updated_at")
      .single();

    if (error || !data) {
      setFormStatus("error");
      setFormError(error?.message ?? "Could not save the snippet.");
      return;
    }

    setSnippets((prev) => [data, ...prev]);
    setTitle("");
    setCode("");
    setTagsInput("");
    setLanguage(LANGUAGES[0].value);
    setFormStatus("idle");
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("code_snippet_vault_snippets")
      .delete()
      .eq("id", id);

    if (!error) {
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    }
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Search title, tags, or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
          >
            <option value="all">All languages</option>
            {allLanguagesInUse.map((l) => (
              <option key={l} value={l}>
                {languageLabel(l)}
              </option>
            ))}
          </select>
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="all">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New snippet"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Debounce a function"
              />
            </div>
            <div>
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="code">Code</label>
              <textarea
                id="code"
                required
                rows={10}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-sm"
                placeholder="Paste your snippet here…"
              />
            </div>
            <div>
              <label htmlFor="tags">Tags (comma separated)</label>
              <input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="utility, performance"
              />
            </div>
            {formStatus === "error" && (
              <p className="text-sm text-danger">{formError}</p>
            )}
            <Button type="submit" disabled={formStatus === "saving"}>
              {formStatus === "saving" ? "Saving…" : "Save snippet"}
            </Button>
          </form>
        </Card>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={
            snippets.length === 0
              ? "No snippets yet"
              : "No snippets match your search/filter"
          }
          description={
            snippets.length === 0
              ? "Save your first one above."
              : "Try a different search term, language, or tag."
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((s, i) => (
            <AnimatedCard key={s.id} index={i}>
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">{s.title}</h2>
                  <p className="text-xs text-muted">
                    {languageLabel(s.language)}
                    {s.tags.length > 0 && (
                      <>
                        {" · "}
                        {s.tags.map((t) => (
                          <span
                            key={t}
                            className="mr-1 rounded-full border border-border px-2 py-0.5 text-xs"
                          >
                            {t}
                          </span>
                        ))}
                      </>
                    )}
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                >
                  {deletingId === s.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
              <CodeBlock code={s.code} language={s.language} />
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
