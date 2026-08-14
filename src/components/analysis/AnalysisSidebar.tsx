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
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Overall band */}
      <section aria-label="Overall assessment" className="glass-panel p-5 rounded-2xl">
        <div
          className={`rounded-xl p-5 ${bandClass}`}
          style={{ border: "1px solid currentColor", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-85 mb-1.5">
            Overall Assessment
          </div>
          <div className="text-base font-bold leading-snug">{overall.bandLabel}</div>
          <div className="text-xs mt-1.5 opacity-80 font-medium">
            Confidence: {formatPercent(overall.confidence)} ·{" "}
            Score: {formatPercent(overall.score)}
          </div>
        </div>

        <p className="text-xs mt-3 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          <strong>This is not proof of AI authorship.</strong> Statistical signals only.
          Human writing can trigger high scores. AI writing can trigger low scores.
        </p>
      </section>

      {/* Document stats */}
      <section aria-label="Document statistics" className="glass-panel p-5 rounded-2xl">
        <h3
          className="text-[10px] font-bold uppercase tracking-wider mb-3.5"
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
      <section aria-label="Signal breakdown by category" className="glass-panel p-5 rounded-2xl">
        <h3
          className="text-[10px] font-bold uppercase tracking-wider mb-4"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Signal Breakdown
        </h3>
        <div className="flex flex-col gap-3.5">
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
        <section aria-label="Notable patterns" className="glass-panel p-5 rounded-2xl">
          <h3
            className="text-[10px] font-bold uppercase tracking-wider mb-3"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Formulaic Phrases Found
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {features.documentFormulaic.matches.slice(0, 8).map((m, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "hsl(var(--muted-foreground))",
                  backdropFilter: "blur(4px)",
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
      <section aria-label="Sentence rhythm statistics" className="glass-panel p-5 rounded-2xl">
        <h3
          className="text-[10px] font-bold uppercase tracking-wider mb-3"
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
        <p className="text-[11px] mt-2.5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          CV &lt; 0.30 may indicate unusually regular prose. Typical range: 0.35–0.55.
        </p>
      </section>

      {/* LM Signal */}
      <section aria-label="Language model signal" className="glass-panel p-5 rounded-2xl">
        <h3
          className="text-[10px] font-bold uppercase tracking-wider mb-3"
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
          <p className="text-xs rounded-xl p-3 border leading-relaxed bg-white/20 border-white/20" style={{
            color: "hsl(var(--muted-foreground))",
          }}>
            {lmSignal.note}
          </p>
        )}
      </section>

      {/* Limitations */}
      <div className="glass-panel p-4 rounded-2xl">
        <details className="group">
          <summary
            className="cursor-pointer text-xs font-semibold uppercase tracking-wider list-none flex items-center justify-between"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Known limitations
            <span className="group-open:rotate-180 transition-transform duration-200 text-xs">▼</span>
          </summary>
          <ul className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
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
      </div>

      {/* Detector version */}
      <p
        className="text-[10px] uppercase font-bold tracking-widest text-center"
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
      className="rounded-xl p-3 text-center border"
      style={{
        borderColor: "rgba(255, 255, 255, 0.4)",
        backgroundColor: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(8px)",
        gridColumn: span ? `span ${span}` : undefined,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.01)",
      }}
    >
      <div
        className="text-[10px] uppercase font-bold tracking-wider mb-0.5 truncate"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {label}
      </div>
      <div
        className="text-sm font-bold"
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
      ? "hsl(142 65% 40%)"
      : pct < 55
      ? "hsl(38 92% 48%)"
      : pct < 75
      ? "hsl(25 90% 50%)"
      : "hsl(0 75% 50%)";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          {label}
        </span>
        <span className="text-xs font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>
          {pct.toFixed(0)}
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full overflow-hidden border border-white/20 bg-white/20"
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
      <p className="text-[10px] mt-1 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
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
