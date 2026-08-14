"use client";

import React, { useEffect, useRef } from "react";
import type { AnalyzedSentence } from "@/lib/detector/analyze";
import { bandColorClass, formatPercent } from "@/lib/utils";

interface EvidencePanelProps {
  sentence: AnalyzedSentence | null;
  onClose: () => void;
}

export function EvidencePanel({ sentence, onClose }: EvidencePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (sentence) {
      closeRef.current?.focus();
    }
  }, [sentence]);

  // Keyboard close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && sentence) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sentence, onClose]);

  if (!sentence) return null;

  const { evidence: evidenceData } = sentence.evidence;
  const bandClass = bandColorClass(sentence.band);

  return (
    <div
      ref={panelRef}
      className="animate-fade-in rounded-xl border overflow-hidden"
      style={{
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
        boxShadow: "0 4px 24px hsl(220 20% 12% / 0.08)",
      }}
      role="region"
      aria-label="Evidence panel for selected sentence"
      aria-live="polite"
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 p-4 border-b"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bandClass}`}
            >
              {sentence.band === "low"
                ? "Low signal"
                : sentence.band === "some"
                ? "Some signals"
                : sentence.band === "elevated"
                ? "Elevated signals"
                : "Strong signals"}
            </span>
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              Score: {formatPercent(sentence.score)}
            </span>
          </div>
          <p
            className="text-sm leading-relaxed line-clamp-3"
            style={{
              fontFamily: "var(--font-serif)",
              color: "hsl(var(--foreground))",
            }}
          >
            &ldquo;{sentence.text}&rdquo;
          </p>
        </div>
        <button
          ref={closeRef}
          onClick={onClose}
          className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2"
          aria-label="Close evidence panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Why was this flagged? */}
      <div className="p-4">
        <h4
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Why was this flagged?
        </h4>

        {evidenceData.length === 0 ? (
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            This sentence was flagged based on its position within the essay context.
            No single signal contributed strongly on its own.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {evidenceData.map((item, i) => (
              <EvidenceItem key={i} item={item} />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div
          className="mt-4 p-3 rounded-lg text-xs leading-relaxed"
          style={{
            backgroundColor: "hsl(var(--secondary))",
            color: "hsl(var(--muted-foreground))",
          }}
          role="note"
          aria-label="Important disclaimer"
        >
          <strong className="text-xs">What this does not mean:</strong>{" "}
          {sentence.evidence.disclaimer}
        </div>
      </div>
    </div>
  );
}

function EvidenceItem({
  item,
}: {
  item: {
    displayName: string;
    category: string;
    explanation: string;
    detail: string;
    rawMetrics: Array<{ label: string; value: string }>;
    direction: "toward_ai" | "toward_human" | "neutral";
    strength: "weak" | "moderate" | "strong";
  };
}) {
  const dirColor =
    item.direction === "toward_ai"
      ? "hsl(16 86% 52%)"
      : item.direction === "toward_human"
      ? "hsl(142 60% 44%)"
      : "hsl(220 10% 60%)";

  const dirLabel =
    item.direction === "toward_ai"
      ? "Higher machine-writing likelihood"
      : item.direction === "toward_human"
      ? "Lower machine-writing likelihood"
      : "Neutral";

  return (
    <div
      className="rounded-lg p-3 border"
      style={{
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--background))",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          {item.displayName}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `${dirColor}18`,
            color: dirColor,
          }}
        >
          {dirLabel}
        </span>
      </div>

      <p className="text-xs leading-relaxed mb-2" style={{ color: "hsl(var(--foreground))" }}>
        {item.explanation}
      </p>

      <p className="text-xs leading-relaxed mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
        {item.detail}
      </p>

      {/* Raw metrics */}
      {item.rawMetrics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.rawMetrics.map((metric, i) => (
            <div
              key={i}
              className="text-xs rounded px-2 py-1"
              style={{
                backgroundColor: "hsl(var(--secondary))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              <span className="font-medium">{metric.label}:</span> {metric.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
