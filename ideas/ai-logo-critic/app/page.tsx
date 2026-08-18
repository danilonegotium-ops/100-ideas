"use client";

import { ChangeEvent, useState } from "react";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

interface CritiqueResult {
  colorBalance: string;
  readability: string;
  modernTrends: string;
  overallScore: number;
  summary: string;
}

type Status = "idle" | "analyzing" | "done" | "not_configured" | "error";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<CritiqueResult | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setResult(null);
    setStatus("idle");
    setErrorMessage("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage("Unsupported file type. Use PNG, JPEG, WEBP, or GIF.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage("Image is too large (max 4MB).");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const [, base64] = dataUrl.split(",");
    setPreviewUrl(dataUrl);
    setImageBase64(base64);
    setMimeType(file.type);
  }

  async function handleAnalyze() {
    if (!imageBase64 || !mimeType) return;
    setStatus("analyzing");
    setErrorMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/critique-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      const data = await res.json();

      if (data.configured === false) {
        setStatus("not_configured");
        return;
      }
      if (data.error) {
        setStatus("error");
        setErrorMessage(data.error);
        return;
      }

      setResult({
        colorBalance: data.colorBalance,
        readability: data.readability,
        modernTrends: data.modernTrends,
        overallScore: data.overallScore,
        summary: data.summary,
      });
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong reaching the AI service.");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">AI Logo Critic</h1>
        <p className="mb-6 text-muted">
          Upload a logo and get AI feedback on color balance, readability,
          and how it stacks up against modern design trends.
        </p>

        <Card className="mb-6 flex flex-col gap-4">
          <div>
            <label htmlFor="logo">Logo image (PNG, JPEG, WEBP, or GIF — max 4MB)</label>
            <input
              id="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
            />
          </div>

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Logo preview"
              className="max-h-64 w-auto self-start rounded-brand border border-border bg-bg p-3"
            />
          )}

          {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

          <Button
            onClick={handleAnalyze}
            disabled={!imageBase64 || status === "analyzing"}
            className="self-start"
          >
            {status === "analyzing" ? "Analyzing…" : "Get feedback"}
          </Button>
        </Card>

        {status === "not_configured" && (
          <Card>
            <p className="text-sm text-muted">
              AI critique isn&apos;t available yet — <code className="font-mono">GOOGLE_AI_API_KEY</code>{" "}
              isn&apos;t configured on this deployment.
            </p>
          </Card>
        )}

        {result && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Feedback</h2>
              <span className="text-sm font-semibold text-accent">
                {result.overallScore}/10
              </span>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Color balance</p>
              <p className="text-sm text-muted">{result.colorBalance}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Readability</p>
              <p className="text-sm text-muted">{result.readability}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Modern trends</p>
              <p className="text-sm text-muted">{result.modernTrends}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-medium text-fg">{result.summary}</p>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
