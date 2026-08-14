"use client";

import React from "react";
import { highlightClass } from "@/lib/utils";
import type { AnalyzedSentence } from "@/lib/detector/analyze";

interface HighlightedEssayProps {
  text: string;
  sentences: AnalyzedSentence[];
  selectedSentenceId: number | null;
  onSentenceClick: (sentence: AnalyzedSentence) => void;
  threshold?: number; // Only highlight sentences above this score
}

export function HighlightedEssay({
  text,
  sentences,
  selectedSentenceId,
  onSentenceClick,
  threshold = 0.30,
}: HighlightedEssayProps) {
  if (sentences.length === 0) {
    return (
      <div
        className="essay-text p-5 rounded-xl border"
        style={{ borderColor: "hsl(var(--border))", whiteSpace: "pre-wrap" }}
      >
        {text}
      </div>
    );
  }

  // Build a sorted list of sentence positions
  const sortedSentences = [...sentences].sort((a, b) => a.startChar - b.startChar);

  // Build the annotated text segments
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (const sentence of sortedSentences) {
    // Add any text before this sentence
    if (sentence.startChar > cursor) {
      const before = text.slice(cursor, sentence.startChar);
      if (before) {
        segments.push(
          <span key={`pre-${sentence.id}`}>{before}</span>
        );
      }
    }

    const isHighlighted = sentence.score >= threshold;
    const isSelected = selectedSentenceId === sentence.id;
    const cls = isHighlighted ? highlightClass(sentence.band) : "";

    segments.push(
      <span
        key={`sent-${sentence.id}`}
        className={`${cls} ${isSelected ? "selected" : ""}`}
        role={isHighlighted ? "button" : undefined}
        tabIndex={isHighlighted ? 0 : undefined}
        aria-label={
          isHighlighted
            ? `Flagged sentence: ${sentence.text.slice(0, 60)}... Score: ${Math.round(sentence.score * 100)}%`
            : undefined
        }
        aria-pressed={isSelected}
        onClick={() => isHighlighted && onSentenceClick(sentence)}
        onKeyDown={(e) => {
          if (isHighlighted && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSentenceClick(sentence);
          }
        }}
        data-sentence-id={sentence.id}
        data-score={sentence.score}
      >
        {sentence.text}
      </span>
    );

    cursor = sentence.endChar;
  }

  // Add any remaining text
  if (cursor < text.length) {
    segments.push(
      <span key="tail">{text.slice(cursor)}</span>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div
        className="flex items-center gap-4 text-xs flex-wrap"
        aria-label="Highlight intensity legend"
      >
        <span style={{ color: "hsl(var(--muted-foreground))" }}>Signal intensity:</span>
        <LegendItem color="hsl(142 60% 44%)" label="Low" />
        <LegendItem color="hsl(40 95% 48%)" label="Some" />
        <LegendItem color="hsl(25 90% 50%)" label="Elevated" />
        <LegendItem color="hsl(0 72% 51%)" label="Strong" />
        <span style={{ color: "hsl(var(--muted-foreground))" }}>
          · Click a highlighted sentence to see evidence
        </span>
      </div>

      {/* Essay text with highlights */}
      <div
        className="essay-text p-5 rounded-xl border leading-loose"
        style={{
          borderColor: "hsl(var(--border))",
          backgroundColor: "hsl(var(--card))",
          whiteSpace: "pre-wrap",
        }}
        role="article"
        aria-label="Essay with highlighted passages"
      >
        {segments}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block w-3 h-3 rounded-sm"
        style={{ backgroundColor: color, opacity: 0.7 }}
        aria-hidden="true"
      />
      <span style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
    </span>
  );
}
