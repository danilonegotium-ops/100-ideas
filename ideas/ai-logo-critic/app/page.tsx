"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { GradientMesh } from "@/components/motion/GradientMesh";

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

// Staggered reveal for each critique field once the result lands — the
// second interaction mode this app centers on (drop -> analyze -> reveal).
const revealContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const revealItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<CritiqueResult | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  async function processFile(file: File | undefined) {
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void processFile(event.target.files?.[0]);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    void processFile(event.dataTransfer.files?.[0]);
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
      <main className="relative mx-auto w-full max-w-site flex-1 px-5 py-8">
        <GradientMesh className="opacity-60" />
        <h1 className="mb-2 text-2xl font-semibold">AI Logo Critic</h1>
        <p className="mb-6 text-muted">
          Drop in a logo and get AI feedback on color balance, readability,
          and how it stacks up against modern design trends.
        </p>

        <Card className="mb-6 flex flex-col gap-4">
          <SpotlightCard
            className={
              "!p-0 border-dashed transition-colors " +
              (isDraggingOver ? "!border-accent" : "!border-border")
            }
          >
            <label
              htmlFor="logo"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex cursor-pointer flex-col items-center gap-3 px-5 py-8 text-center"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="max-h-64 w-auto rounded-brand border border-border bg-bg p-3"
                />
              ) : (
                <>
                  <span className="text-sm font-medium text-fg">
                    Drag and drop a logo here, or click to browse
                  </span>
                  <span className="text-xs text-muted">
                    PNG, JPEG, WEBP, or GIF — max 4MB
                  </span>
                </>
              )}
              <input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </SpotlightCard>

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

        <AnimatePresence>
          {result && (
            <motion.div
              variants={revealContainer}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
            >
              <Card className="flex flex-col gap-4">
                <motion.div variants={revealItem} className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Feedback</h2>
                  <span className="text-sm font-semibold text-accent">
                    {result.overallScore}/10
                  </span>
                </motion.div>
                <motion.div variants={revealItem}>
                  <p className="mb-1 text-sm font-medium text-fg">Color balance</p>
                  <p className="text-sm text-muted">{result.colorBalance}</p>
                </motion.div>
                <motion.div variants={revealItem}>
                  <p className="mb-1 text-sm font-medium text-fg">Readability</p>
                  <p className="text-sm text-muted">{result.readability}</p>
                </motion.div>
                <motion.div variants={revealItem}>
                  <p className="mb-1 text-sm font-medium text-fg">Modern trends</p>
                  <p className="text-sm text-muted">{result.modernTrends}</p>
                </motion.div>
                <motion.div variants={revealItem} className="border-t border-border pt-3">
                  <p className="text-sm font-medium text-fg">{result.summary}</p>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
