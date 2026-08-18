"use client";

import { ChangeEvent, useState } from "react";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { STYLES } from "@/lib/interior/styles";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface ImageResult {
  mode: "image";
  imageBase64: string;
  mimeType: string;
  note: string | null;
}

interface TextResult {
  mode: "text";
  fallbackReason: string;
  summary: string;
  colorPalette: string;
  keyPieces: string[];
  layoutNotes: string;
}

type Result = ImageResult | TextResult;
type Status = "idle" | "generating" | "done" | "not_configured" | "error";

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
  const [style, setStyle] = useState<string>(STYLES[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setResult(null);
    setStatus("idle");
    setErrorMessage("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage("Unsupported file type. Use PNG, JPEG, or WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage("Image is too large (max 5MB).");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const [, base64] = dataUrl.split(",");
    setPreviewUrl(dataUrl);
    setImageBase64(base64);
    setMimeType(file.type);
  }

  async function handleGenerate() {
    if (!imageBase64 || !mimeType) return;
    setStatus("generating");
    setErrorMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/decorate-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType, style }),
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

      if (data.mode === "image") {
        setResult({
          mode: "image",
          imageBase64: data.imageBase64,
          mimeType: data.mimeType,
          note: data.note ?? null,
        });
      } else {
        setResult({
          mode: "text",
          fallbackReason: data.fallbackReason,
          summary: data.summary,
          colorPalette: data.colorPalette,
          keyPieces: data.keyPieces,
          layoutNotes: data.layoutNotes,
        });
      }
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
        <h1 className="mb-2 text-2xl font-semibold">AI Interior Decorator</h1>
        <p className="mb-6 text-muted">
          Upload a photo of an empty room, pick a style, and get an
          AI-furnished version. Image generation on a free-tier AI model is
          genuinely uncertain — if it&apos;s not available for your request,
          you&apos;ll automatically get clearly-labeled AI furniture
          placement suggestions instead, so this is never a dead end.
        </p>

        <Card className="mb-6 flex flex-col gap-4">
          <div>
            <label htmlFor="room">Room photo (PNG, JPEG, or WEBP — max 5MB)</label>
            <input
              id="room"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
            />
          </div>

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Room preview"
              className="max-h-72 w-auto self-start rounded-brand border border-border bg-bg p-3"
            />
          )}

          <div>
            <label htmlFor="style">Style</label>
            <select
              id="style"
              value={style}
              onChange={(event) => setStyle(event.target.value)}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

          <Button
            onClick={handleGenerate}
            disabled={!imageBase64 || status === "generating"}
            className="self-start"
          >
            {status === "generating" ? "Generating…" : "Decorate this room"}
          </Button>
        </Card>

        {status === "not_configured" && (
          <Card>
            <p className="text-sm text-muted">
              AI decorating isn&apos;t available yet —{" "}
              <code className="font-mono">GOOGLE_AI_API_KEY</code> isn&apos;t
              configured on this deployment.
            </p>
          </Card>
        )}

        {result?.mode === "image" && (
          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Before &amp; after</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-muted">Original</p>
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Original room"
                    className="w-full rounded-brand border border-border"
                  />
                )}
              </div>
              <div>
                <p className="mb-1 text-xs text-muted">{style}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${result.mimeType};base64,${result.imageBase64}`}
                  alt={`Room decorated in ${style} style`}
                  className="w-full rounded-brand border border-border"
                />
              </div>
            </div>
            {result.note && <p className="text-sm text-muted">{result.note}</p>}
          </Card>
        )}

        {result?.mode === "text" && (
          <Card className="flex flex-col gap-4">
            <div className="rounded-brand border border-accent bg-bg px-3 py-2">
              <p className="text-sm font-medium text-accent">
                Text-based suggestions (image generation unavailable)
              </p>
              <p className="mt-1 text-xs text-muted">{result.fallbackReason}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-fg">{style} concept</p>
              <p className="text-sm text-muted">{result.summary}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Color palette</p>
              <p className="text-sm text-muted">{result.colorPalette}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Key pieces</p>
              <ul className="list-disc pl-5 text-sm text-muted">
                {result.keyPieces.map((piece, i) => (
                  <li key={i}>{piece}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Layout notes</p>
              <p className="text-sm text-muted">{result.layoutNotes}</p>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
