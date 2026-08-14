"use client";

import React from "react";

export type Stage =
  | "idle"
  | "parsing"
  | "extracting"
  | "comparing"
  | "scoring"
  | "preparing"
  | "done"
  | "error";

const STAGES: Array<{ id: Stage; label: string }> = [
  { id: "parsing", label: "Parsing essay structure" },
  { id: "extracting", label: "Extracting linguistic features" },
  { id: "comparing", label: "Comparing writing patterns" },
  { id: "scoring", label: "Scoring passages" },
  { id: "preparing", label: "Preparing evidence" },
];

interface ProgressStagesProps {
  currentStage: Stage;
}

export function ProgressStages({ currentStage }: ProgressStagesProps) {
  if (currentStage === "idle" || currentStage === "done" || currentStage === "error") {
    return null;
  }

  const currentIdx = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div
      className="rounded-2xl border p-5 animate-fade-in glass-panel"
      role="status"
      aria-label="Analysis progress"
      aria-live="polite"
      style={{
        borderColor: "rgba(255, 255, 255, 0.4)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.03)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <LoadingSpinner />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
          Analyzing essay…
        </span>
      </div>

      <div className="space-y-3">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div key={stage.id} className="flex items-center gap-3">
              <div
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300"
                style={{
                  backgroundColor: isDone
                    ? "hsl(142 65% 40%)"
                    : isActive
                    ? "hsl(var(--primary))"
                    : "rgba(255, 255, 255, 0.4)",
                  borderColor: isDone
                    ? "hsl(142 65% 40%)"
                    : isActive
                    ? "hsl(var(--primary))"
                    : "rgba(0, 0, 0, 0.1)",
                }}
                aria-hidden="true"
              >
                {isDone && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <span
                className="text-xs"
                style={{
                  color: isPending
                    ? "hsl(var(--muted-foreground))"
                    : "hsl(var(--foreground))",
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
