"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  MAX_JOB_DESCRIPTION_LENGTH,
  MAX_RESUME_LENGTH,
  MissingKeyword,
} from "@/lib/prompt";

interface ApiResponse {
  keywords?: MissingKeyword[] | null;
  raw?: string | null;
  error?: string;
}

export function ResumeForm() {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<MissingKeyword[] | null>(null);
  const [raw, setRaw] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setKeywords(null);
    setRaw(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resume }),
      });
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.keywords && data.keywords.length > 0) {
        setKeywords(data.keywords);
      } else if (data.raw) {
        setRaw(data.raw);
      } else {
        setError(
          "No missing keywords found — your resume may already cover the job description well.",
        );
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="jobDescription">Job description</label>
          <textarea
            id="jobDescription"
            required
            rows={8}
            maxLength={MAX_JOB_DESCRIPTION_LENGTH}
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            {jobDescription.length}/{MAX_JOB_DESCRIPTION_LENGTH}
          </p>
        </div>

        <div>
          <label htmlFor="resume">Your resume</label>
          <textarea
            id="resume"
            required
            rows={8}
            maxLength={MAX_RESUME_LENGTH}
            placeholder="Paste your resume text here..."
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            {resume.length}/{MAX_RESUME_LENGTH}
          </p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Find missing keywords"}
        </Button>
      </form>

      {error && (
        <Card className="mt-6 border-danger">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      {keywords && (
        <div className="mt-6 space-y-3">
          {keywords.map((k, i) => (
            <Card key={i}>
              <h2 className="mb-1 font-semibold">{k.keyword}</h2>
              <p className="text-sm text-muted">{k.suggestion}</p>
            </Card>
          ))}
        </div>
      )}

      {raw && (
        <Card className="mt-6">
          <p className="mb-2 text-xs text-muted">
            The AI responded, but not in the expected format. Here&apos;s the raw
            response:
          </p>
          <pre className="whitespace-pre-wrap font-mono text-sm">{raw}</pre>
        </Card>
      )}
    </>
  );
}
