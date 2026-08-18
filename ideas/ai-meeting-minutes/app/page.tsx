"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

const MAX_TRANSCRIPT_LENGTH = 20000;

interface MinutesResult {
  summary: string;
  decisions: string[];
  actionItems: string[];
}

type SummarizeStatus = "idle" | "summarizing" | "done" | "not_configured" | "error";

export default function Home() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [micError, setMicError] = useState("");
  const [status, setStatus] = useState<SummarizeStatus>("idle");
  const [result, setResult] = useState<MinutesResult | null>(null);
  const [summarizeError, setSummarizeError] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Feature-detect on mount — SpeechRecognition works best in Chrome-based
  // browsers (Chrome, Edge, Brave); Safari/Firefox support is inconsistent
  // or absent.
  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(Boolean(SpeechRecognitionCtor));
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    setMicError("");
    setInterimText("");

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const speechResult = event.results[i];
        const text = speechResult[0]?.transcript ?? "";
        if (speechResult.isFinal) {
          // Only finalized speech gets appended to the persistent
          // transcript — this way live interim text never clobbers
          // anything the user has manually typed/edited in the textarea.
          setTranscript((prev) => {
            const next = (prev ? prev.trim() + " " : "") + text.trim();
            return next.slice(0, MAX_TRANSCRIPT_LENGTH);
          });
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      setMicError(
        `Microphone/recognition error: ${event.error}. Check microphone permissions.`,
      );
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  async function handleSummarize() {
    const trimmed = transcript.trim();
    if (!trimmed) return;
    setStatus("summarizing");
    setSummarizeError("");
    setResult(null);

    try {
      const res = await fetch("/api/summarize-minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: trimmed }),
      });
      const data = await res.json();

      if (data.configured === false) {
        setStatus("not_configured");
        return;
      }
      if (data.error) {
        setStatus("error");
        setSummarizeError(data.error);
        return;
      }

      setResult({
        summary: data.summary,
        decisions: data.decisions,
        actionItems: data.actionItems,
      });
      setStatus("done");
    } catch {
      setStatus("error");
      setSummarizeError("Something went wrong reaching the AI service.");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">AI Meeting Minutes</h1>
        <p className="mb-6 text-muted">
          Record a live meeting right in your browser — free, on-device
          speech-to-text, no audio uploaded anywhere — then get an AI
          summary of the key decisions and action items.
        </p>

        {supported === false && (
          <Card className="mb-6">
            <p className="text-sm text-danger">
              Live transcription isn&apos;t supported in this browser. It
              relies on the Web Speech API, which works best in
              Chrome-based browsers (Chrome, Edge, Brave). You can still
              paste or type a transcript below and get an AI summary.
            </p>
          </Card>
        )}

        <Card className="mb-6 flex flex-col gap-4">
          {supported !== false && (
            <div className="flex items-center gap-3">
              {!recording ? (
                <Button onClick={startRecording} disabled={supported === null}>
                  Start recording
                </Button>
              ) : (
                <Button variant="danger" onClick={stopRecording}>
                  Stop recording
                </Button>
              )}
              {recording && <span className="text-sm text-muted">Listening…</span>}
            </div>
          )}

          {micError && <p className="text-sm text-danger">{micError}</p>}

          <div>
            <label htmlFor="transcript">Transcript</label>
            <textarea
              id="transcript"
              rows={10}
              value={transcript}
              onChange={(event) =>
                setTranscript(event.target.value.slice(0, MAX_TRANSCRIPT_LENGTH))
              }
              placeholder="Transcript appears here as you speak — or paste/type one manually."
            />
            {interimText && (
              <p className="mt-1 text-xs italic text-muted">{interimText}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              {transcript.length}/{MAX_TRANSCRIPT_LENGTH}
            </p>
          </div>

          <Button
            onClick={handleSummarize}
            disabled={!transcript.trim() || status === "summarizing"}
            className="self-start"
          >
            {status === "summarizing" ? "Summarizing…" : "Summarize into minutes"}
          </Button>
        </Card>

        {status === "not_configured" && (
          <Card className="mb-6">
            <p className="text-sm text-muted">
              AI summarization isn&apos;t available yet —{" "}
              <code className="font-mono">GOOGLE_AI_API_KEY</code> isn&apos;t
              configured on this deployment.
            </p>
          </Card>
        )}

        {status === "error" && summarizeError && (
          <Card className="mb-6">
            <p className="text-sm text-danger">{summarizeError}</p>
          </Card>
        )}

        {result && (
          <Card className="flex flex-col gap-4">
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Summary</p>
              <p className="text-sm text-muted">{result.summary}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Key decisions</p>
              {result.decisions.length === 0 ? (
                <p className="text-sm text-muted">None identified.</p>
              ) : (
                <ul className="list-disc pl-5 text-sm text-muted">
                  {result.decisions.map((decision, i) => (
                    <li key={i}>{decision}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Action items</p>
              {result.actionItems.length === 0 ? (
                <p className="text-sm text-muted">None identified.</p>
              ) : (
                <ul className="list-disc pl-5 text-sm text-muted">
                  {result.actionItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
