"use client";

import React, { useState, useRef, useCallback } from "react";
import { countWords, countSentences, countParagraphs } from "@/lib/utils";
import { EXAMPLE_ESSAYS } from "@/lib/example-essays";

interface EssayEditorProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
  minWords?: number;
  maxWords?: number;
}

export function EssayEditor({
  onAnalyze,
  isLoading,
  minWords = 50,
  maxWords = 5000,
}: EssayEditorProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);
  const paragraphCount = countParagraphs(text);

  const isTooShort = text.trim().length > 0 && wordCount < minWords;
  const isTooLong = wordCount > maxWords;
  const canAnalyze = wordCount >= minWords && !isTooLong && !isLoading;

  const handleExampleLoad = useCallback((essayText: string) => {
    setText(essayText);
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Example essay buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Try an example:
        </span>
        {EXAMPLE_ESSAYS.map((essay) => (
          <button
            key={essay.id}
            onClick={() => handleExampleLoad(essay.text)}
            className="text-xs px-3.5 py-1.5 rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{
              borderColor: "rgba(255, 255, 255, 0.4)",
              backgroundColor: "rgba(255, 255, 255, 0.45)",
              backdropFilter: "blur(8px)",
              color: "hsl(var(--primary))",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
            }}
            aria-label={`Load example: ${essay.title}`}
          >
            {essay.title}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="relative rounded-2xl overflow-hidden glass-panel" style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.03)" }}>
        <textarea
          ref={textareaRef}
          id="essay-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your college admissions essay here…"
          aria-label="Essay text input"
          aria-describedby="essay-stats essay-hint"
          disabled={isLoading}
          className="w-full min-h-[420px] md:min-h-[520px] resize-y p-6 text-base leading-relaxed bg-transparent border-0 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-serif)",
            color: "hsl(var(--foreground))",
          }}
          spellCheck
          maxLength={40000}
        />
        {/* Clear button */}
        {text.length > 0 && !isLoading && (
          <button
            onClick={() => setText("")}
            className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-md bg-white/40 hover:bg-white/70 backdrop-blur-sm border border-white/20 transition-all opacity-80 hover:opacity-100"
            style={{ color: "hsl(var(--muted-foreground))" }}
            aria-label="Clear essay"
          >
            Clear
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div
        id="essay-stats"
        className="flex items-center justify-between text-xs"
        role="status"
        aria-live="polite"
      >
        <div className="flex gap-4" style={{ color: "hsl(var(--muted-foreground))" }}>
          <span>
            <strong style={{ color: isTooLong ? "hsl(0 75% 50%)" : "hsl(var(--foreground))" }}>
              {wordCount.toLocaleString()}
            </strong>{" "}
            words
          </span>
          <span>
            <strong style={{ color: "hsl(var(--foreground))" }}>{sentenceCount}</strong> sentences
          </span>
          <span>
            <strong style={{ color: "hsl(var(--foreground))" }}>{paragraphCount}</strong> paragraphs
          </span>
          <span>Max: {maxWords.toLocaleString()}</span>
        </div>

        {isTooShort && (
          <span className="text-xs font-medium" style={{ color: "hsl(0 75% 50%)" }}>
            Add at least {minWords - wordCount} more words for reliable analysis
          </span>
        )}
        {isTooLong && (
          <span className="text-xs font-medium" style={{ color: "hsl(0 75% 50%)" }}>
            Essay exceeds {maxWords.toLocaleString()} word limit
          </span>
        )}
      </div>

      {/* Analyze button */}
      <button
        onClick={() => canAnalyze && onAnalyze(text)}
        disabled={!canAnalyze}
        id="analyze-button"
        className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all duration-300 transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        style={{
          background: canAnalyze
            ? "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(220 70% 20%) 100%)"
            : "rgba(0, 0, 0, 0.05)",
          border: canAnalyze ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.05)",
          color: canAnalyze ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
          boxShadow: canAnalyze ? "0 4px 20px hsl(var(--primary) / 0.25)" : "none",
        }}
        aria-label={isLoading ? "Analyzing essay..." : "Analyze essay"}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner />
            Analyzing essay…
          </span>
        ) : (
          "Analyze Essay"
        )}
      </button>

      {/* Hint */}
      <p
        id="essay-hint"
        className="text-xs text-center"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        The detector analyzes linguistic patterns only. It cannot determine authorship.{" "}
        <span className="font-medium">Never use these results as proof of misconduct.</span>
      </p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
