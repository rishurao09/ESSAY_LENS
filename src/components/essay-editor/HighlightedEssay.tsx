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
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Legend */}
      <div
        className="flex items-center gap-4 text-xs flex-wrap px-1"
        aria-label="Highlight intensity legend"
      >
        <span className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>Signal intensity:</span>
        <LegendItem color="hsl(142 65% 40%)" label="Low" />
        <LegendItem color="hsl(38 92% 48%)" label="Some" />
        <LegendItem color="hsl(25 90% 50%)" label="Elevated" />
        <LegendItem color="hsl(0 75% 50%)" label="Strong" />
        <span style={{ color: "hsl(var(--muted-foreground))" }}>
          · Click highlighted text to see evidence
        </span>
      </div>

      {/* Essay text with highlights */}
      <div
        className="essay-text p-7 rounded-2xl leading-loose glass-panel"
        style={{
          whiteSpace: "pre-wrap",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.03)",
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
    <span className="flex items-center gap-1.5 font-medium">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color, opacity: 0.8 }}
        aria-hidden="true"
      />
      <span style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
    </span>
  );
}
