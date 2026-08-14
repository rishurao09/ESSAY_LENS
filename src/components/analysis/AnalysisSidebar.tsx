"use client";

import React from "react";
import { bandColorClass, formatPercent } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/detector/analyze";

interface AnalysisSidebarProps {
  result: AnalysisResult;
  isLoading?: boolean;
}

export function AnalysisSidebar({ result, isLoading }: AnalysisSidebarProps) {
  if (isLoading) {
    return <SidebarSkeleton />;
  }

  const { overall, document: doc, categoryScores, features, lmSignal } = result;
  const bandClass = bandColorClass(overall.band);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Overall band */}
      <section aria-label="Overall assessment">
        <div
          className={`rounded-xl p-5 ${bandClass}`}
          style={{ border: "1px solid currentColor" }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
            Overall Assessment
          </div>
          <div className="text-base font-semibold leading-snug">{overall.bandLabel}</div>
          <div className="text-xs mt-1 opacity-70">
            Confidence: {formatPercent(overall.confidence)} ·{" "}
            Score: {formatPercent(overall.score)}
          </div>
        </div>

        <p className="text-xs mt-2 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          <strong>This is not proof of AI authorship.</strong> Statistical signals only.
          Human writing can trigger high scores. AI writing can trigger low scores.
        </p>
      </section>

      {/* Document stats */}
      <section aria-label="Document statistics">
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Document Statistics
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Words" value={doc.wordCount.toLocaleString()} />
          <StatBox label="Sentences" value={doc.sentenceCount.toString()} />
          <StatBox label="Paragraphs" value={doc.paragraphCount.toString()} />
          <StatBox
            label="Avg length"
            value={`${doc.avgWordsPerSentence.toFixed(1)} wds`}
            span={3}
          />
        </div>
      </section>

      {/* Signal breakdown */}
      <section aria-label="Signal breakdown by category">
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Signal Breakdown
        </h3>
        <div className="flex flex-col gap-2">
          <SignalBar
            label="Structural regularity"
            value={categoryScores.structural}
            description={
              features.crossSentence.rhythmScore > 0.65
                ? "Sentence lengths are unusually consistent"
                : "Sentence rhythm varies naturally"
            }
          />
          <SignalBar
            label="Vocabulary"
            value={categoryScores.lexical}
            description={
              features.documentLexical.movingAvgTTR < 0.62
                ? "Lower vocabulary diversity than typical"
                : "Vocabulary diversity within normal range"
            }
          />
          <SignalBar
            label="Repetition"
            value={categoryScores.repetition}
            description={
              features.documentRepetition.openingRepetitionRate > 0.25
                ? "Repeated structural patterns detected"
                : "Phrase repetition within normal range"
            }
          />
          <SignalBar
            label="Punctuation"
            value={categoryScores.punctuation}
            description={
              features.documentPunctuation.punctuationEntropy < 1.2
                ? "Lower punctuation variety than typical"
                : "Punctuation patterns appear natural"
            }
          />
          <SignalBar
            label="Formulaic language"
            value={categoryScores.formulaic}
            description={
              features.documentFormulaic.uniqueTransitionsUsed > 4
                ? `${features.documentFormulaic.uniqueTransitionsUsed} formulaic phrases found`
                : "Minimal formulaic transitions"
            }
          />
        </div>
      </section>

      {/* Notable patterns */}
      {features.documentFormulaic.matches.length > 0 && (
        <section aria-label="Notable patterns">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Formulaic Phrases Found
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {features.documentFormulaic.matches.slice(0, 8).map((m, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--muted-foreground))",
                }}
                title={`Category: ${m.category}, Count: ${m.count}`}
              >
                &ldquo;{m.phrase}&rdquo; ×{m.count}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Rhythm stats */}
      <section aria-label="Sentence rhythm statistics">
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Sentence Rhythm
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <StatBox
            label="Mean length"
            value={`${features.crossSentence.meanLength.toFixed(1)} words`}
          />
          <StatBox
            label="Std deviation"
            value={features.crossSentence.stdDevLength.toFixed(1)}
          />
          <StatBox
            label="Variation (CV)"
            value={features.crossSentence.coefficientOfVariation.toFixed(2)}
          />
          <StatBox
            label="Rhythm score"
            value={features.crossSentence.rhythmScore.toFixed(2)}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          CV &lt; 0.30 may indicate unusually regular prose. Typical range: 0.35–0.55.
        </p>
      </section>

      {/* LM Signal */}
      <section aria-label="Language model signal">
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Language Model Signal
        </h3>
        {lmSignal.available ? (
          <div className="grid grid-cols-2 gap-2">
            <StatBox
              label="Perplexity"
              value={lmSignal.perplexity?.toFixed(1) ?? "—"}
            />
            <StatBox
              label="Log-prob variance"
              value={lmSignal.logProbVariance?.toFixed(3) ?? "—"}
            />
          </div>
        ) : (
          <p className="text-xs rounded-lg p-3" style={{
            backgroundColor: "hsl(var(--secondary))",
            color: "hsl(var(--muted-foreground))",
          }}>
            {lmSignal.note}
          </p>
        )}
      </section>

      {/* Limitations */}
      <details className="group">
        <summary
          className="cursor-pointer text-xs font-medium list-none flex items-center gap-1"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
          Known limitations
        </summary>
        <ul className="mt-2 space-y-1">
          {result.limitations.slice(0, 4).map((l, i) => (
            <li
              key={i}
              className="text-xs leading-relaxed"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              · {l}
            </li>
          ))}
        </ul>
      </details>

      {/* Detector version */}
      <p
        className="text-xs"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        Detector v{result.detectorVersion} · Dataset v{result.datasetVersion}
      </p>
    </div>
  );
}

function StatBox({
  label,
  value,
  span,
}: {
  label: string;
  value: string;
  span?: number;
}) {
  return (
    <div
      className="rounded-lg p-2.5 text-center"
      style={{
        backgroundColor: "hsl(var(--secondary))",
        gridColumn: span ? `span ${span}` : undefined,
      }}
    >
      <div
        className="text-xs mb-0.5 truncate"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {label}
      </div>
      <div
        className="text-sm font-semibold"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {value}
      </div>
    </div>
  );
}

function SignalBar({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const color =
    pct < 30
      ? "hsl(142 60% 44%)"
      : pct < 55
      ? "hsl(40 95% 48%)"
      : pct < 75
      ? "hsl(25 90% 50%)"
      : "hsl(0 72% 51%)";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          {pct.toFixed(0)}
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: "hsl(var(--border))" }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct.toFixed(0)}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
        {description}
      </p>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[60, 40, 80, 50, 70].map((w, i) => (
        <div
          key={i}
          className="shimmer rounded-lg"
          style={{ height: `${w}px` }}
        />
      ))}
    </div>
  );
}
