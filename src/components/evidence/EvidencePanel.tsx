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
      className="animate-fade-in rounded-2xl glass-panel overflow-hidden border"
      style={{
        borderColor: "rgba(255, 255, 255, 0.4)",
        boxShadow: "0 12px 40px 0 rgba(31, 38, 135, 0.06)",
      }}
      role="region"
      aria-label="Evidence panel for selected sentence"
      aria-live="polite"
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 p-5 border-b"
        style={{ borderColor: "rgba(255, 255, 255, 0.3)" }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${bandClass}`}
            >
              {sentence.band === "low"
                ? "Low signal"
                : sentence.band === "some"
                ? "Some signals"
                : sentence.band === "elevated"
                ? "Elevated signals"
                : "Strong signals"}
            </span>
            <span className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              Score: {formatPercent(sentence.score)}
            </span>
          </div>
          <p
            className="text-sm leading-relaxed line-clamp-3 font-medium"
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
          className="shrink-0 p-1.5 rounded-xl hover:bg-white/40 border border-transparent hover:border-white/20 transition-all focus-visible:outline-none focus-visible:ring-2"
          aria-label="Close evidence panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Why was this flagged? */}
      <div className="p-5">
        <h4
          className="text-[10px] font-bold uppercase tracking-wider mb-3.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Why was this flagged?
        </h4>

        {evidenceData.length === 0 ? (
          <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
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
          className="mt-5 p-4 rounded-xl text-xs leading-relaxed border bg-white/25 border-white/25"
          style={{
            color: "hsl(var(--muted-foreground))",
            boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
          }}
          role="note"
          aria-label="Important disclaimer"
        >
          <strong className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--foreground))" }}>What this does not mean:</strong>{" "}
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
      ? "hsl(16 85% 52%)"
      : item.direction === "toward_human"
      ? "hsl(142 65% 40%)"
      : "hsl(220 15% 50%)";

  const dirLabel =
    item.direction === "toward_ai"
      ? "Higher machine likelihood"
      : item.direction === "toward_human"
      ? "Lower machine likelihood"
      : "Neutral";

  return (
    <div
      className="rounded-xl p-3.5 border bg-white/20"
      style={{
        borderColor: "rgba(255, 255, 255, 0.4)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.01)",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold" style={{ color: "hsl(var(--foreground))" }}>
          {item.displayName}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${dirColor}12`,
            color: dirColor,
          }}
        >
          {dirLabel}
        </span>
      </div>

      <p className="text-xs leading-relaxed mb-2 font-medium" style={{ color: "hsl(var(--foreground))" }}>
        {item.explanation}
      </p>

      <p className="text-[11px] leading-relaxed mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
        {item.detail}
      </p>

      {/* Raw metrics */}
      {item.rawMetrics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.rawMetrics.map((metric, i) => (
            <div
              key={i}
              className="text-[10px] font-medium rounded-lg px-2.5 py-1 border bg-white/35"
              style={{
                borderColor: "rgba(255, 255, 255, 0.3)",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              <span className="font-semibold">{metric.label}:</span> {metric.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
