"use client";

import React, { useState, useCallback } from "react";
import { EssayEditor } from "@/components/essay-editor/EssayEditor";
import { HighlightedEssay } from "@/components/essay-editor/HighlightedEssay";
import { AnalysisSidebar } from "@/components/analysis/AnalysisSidebar";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { ProgressStages, type Stage } from "@/components/analysis/ProgressStages";
import type { AnalysisResult, AnalyzedSentence } from "@/lib/detector/analyze";

type AppState = "idle" | "loading" | "results" | "error";

const STAGE_SEQUENCE: Stage[] = [
  "parsing",
  "extracting",
  "comparing",
  "scoring",
  "preparing",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [currentStage, setCurrentStage] = useState<Stage>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<AnalyzedSentence | null>(null);
  const [originalText, setOriginalText] = useState<string>("");

  const handleAnalyze = useCallback(async (text: string) => {
    setAppState("loading");
    setError(null);
    setResult(null);
    setSelectedSentence(null);
    setOriginalText(text);

    // Simulate progress stages while waiting for API
    const stagePromise = (async () => {
      for (const stage of STAGE_SEQUENCE) {
        setCurrentStage(stage);
        await sleep(600);
      }
    })();

    const apiPromise = fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, options: { includeLMSignal: true } }),
    });

    try {
      const [, response] = await Promise.all([stagePromise, apiPromise]);

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "An unexpected error occurred. Please try again.");
        setAppState("error");
        setCurrentStage("error");
        return;
      }

      setResult(data as AnalysisResult);
      setAppState("results");
      setCurrentStage("done");
    } catch (err) {
      const message =
        err instanceof Error
          ? `Network error: ${err.message}`
          : "Unable to connect to the analysis service. Please check your connection and try again.";
      setError(message);
      setAppState("error");
      setCurrentStage("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState("idle");
    setCurrentStage("idle");
    setResult(null);
    setError(null);
    setSelectedSentence(null);
    setOriginalText("");
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <header className="mb-8 max-w-2xl">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{
            fontFamily: "var(--font-serif)",
            color: "hsl(var(--foreground))",
          }}
        >
          Analyze Your Admissions Essay
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          Paste an essay below to identify statistical patterns associated with
          machine-generated writing. Every result is explained with real evidence.
        </p>
      </header>

      {/* ESL Warning Banner */}
      <div
        className="mb-6 rounded-xl p-4 border text-sm"
        style={{
          backgroundColor: "hsl(220 60% 32% / 0.04)",
          borderColor: "hsl(220 60% 32% / 0.2)",
          color: "hsl(var(--foreground))",
        }}
        role="note"
        aria-label="Important fairness notice"
      >
        <strong>Important:</strong> Automated AI detection can disproportionately affect
        writers whose first language is not English. Statistical patterns differ across
        language backgrounds. <strong>Never treat these results as definitive proof of
        misconduct.</strong>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Left: editor / essay */}
        <div className="min-w-0">
          {appState === "idle" || appState === "loading" ? (
            <div className="flex flex-col gap-5">
              <EssayEditor
                onAnalyze={handleAnalyze}
                isLoading={appState === "loading"}
              />
              {appState === "loading" && (
                <ProgressStages currentStage={currentStage} />
              )}
            </div>
          ) : appState === "error" ? (
            <ErrorState message={error!} onReset={handleReset} />
          ) : result ? (
            <div className="flex flex-col gap-5">
              {/* Back button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="text-sm flex items-center gap-1.5 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded"
                  style={{ color: "hsl(var(--primary))" }}
                  aria-label="Analyze another essay"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Analyze another essay
                </button>
                <span style={{ color: "hsl(var(--border))" }}>·</span>
                <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {result.document.wordCount} words · {result.document.sentenceCount} sentences
                </span>
              </div>

              {/* Highlighted essay */}
              <HighlightedEssay
                text={originalText}
                sentences={result.sentences}
                selectedSentenceId={selectedSentence?.id ?? null}
                onSentenceClick={setSelectedSentence}
              />

              {/* Evidence panel (shown below on mobile, integrated on desktop) */}
              {selectedSentence && (
                <div className="lg:hidden">
                  <EvidencePanel
                    sentence={selectedSentence}
                    onClose={() => setSelectedSentence(null)}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Right: analysis sidebar */}
        <aside className="min-w-0">
          {appState === "idle" && <InfoPanel />}
          {appState === "loading" && <SidebarLoadingSkeleton />}
          {appState === "error" && null}
          {appState === "results" && result && (
            <div className="flex flex-col gap-5">
              <AnalysisSidebar result={result} />

              {/* Evidence panel on desktop */}
              {selectedSentence && (
                <div className="hidden lg:block">
                  <EvidencePanel
                    sentence={selectedSentence}
                    onClose={() => setSelectedSentence(null)}
                  />
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoPanel() {
  return (
    <div className="flex flex-col gap-5">
      <div
        className="rounded-xl border p-5"
        style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
      >
        <h2
          className="text-sm font-semibold mb-3"
          style={{ color: "hsl(var(--foreground))" }}
        >
          How it works
        </h2>
        <div className="space-y-3">
          {[
            {
              icon: "📐",
              title: "Structural analysis",
              desc: "Measures sentence rhythm, length variation, and regularity patterns.",
            },
            {
              icon: "📚",
              title: "Vocabulary analysis",
              desc: "Calculates type-token ratio, phrase diversity, and word repetition.",
            },
            {
              icon: "🔁",
              title: "Repetition detection",
              desc: "Identifies repeated phrases, sentence openings, and structural patterns.",
            },
            {
              icon: "🗣️",
              title: "Formulaic language",
              desc: 'Detects transitions like \u201cfurthermore\u201d and \u201cin conclusion\u201d from a transparent lexicon.',
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="text-lg shrink-0" aria-hidden="true">{item.icon}</span>
              <div>
                <div className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  {item.title}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl border p-4 text-xs leading-relaxed"
        style={{
          borderColor: "hsl(var(--border))",
          backgroundColor: "hsl(var(--secondary))",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>
          What this detector cannot do:
        </p>
        <ul className="space-y-1">
          <li>· Prove that AI wrote any portion of an essay</li>
          <li>· Distinguish between AI-generated and AI-polished writing with certainty</li>
          <li>· Account for individual writing style differences</li>
          <li>· Perform reliably on non-English text</li>
        </ul>
      </div>
    </div>
  );
}

function ErrorState({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div
      className="rounded-xl border p-6 text-center"
      style={{
        borderColor: "hsl(0 72% 51% / 0.3)",
        backgroundColor: "hsl(0 72% 51% / 0.04)",
      }}
      role="alert"
    >
      <div className="text-2xl mb-3" aria-hidden="true">⚠️</div>
      <h2
        className="text-sm font-semibold mb-2"
        style={{ color: "hsl(var(--foreground))" }}
      >
        Analysis failed
      </h2>
      <p
        className="text-sm mb-4 max-w-sm mx-auto"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {message}
      </p>
      <button
        onClick={onReset}
        className="px-5 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
        }}
      >
        Try again
      </button>
    </div>
  );
}

function SidebarLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[80, 120, 100, 60, 80].map((h, i) => (
        <div
          key={i}
          className="shimmer rounded-xl"
          style={{ height: `${h}px` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
