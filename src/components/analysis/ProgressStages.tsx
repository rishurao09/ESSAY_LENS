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
      className="rounded-xl border p-4 animate-fade-in"
      role="status"
      aria-label="Analysis progress"
      aria-live="polite"
      style={{
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <LoadingSpinner />
        <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
          Analyzing essay…
        </span>
      </div>

      <div className="space-y-2">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div key={stage.id} className="flex items-center gap-2.5">
              <div
                className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isDone
                    ? "hsl(142 60% 44%)"
                    : isActive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--border))",
                }}
                aria-hidden="true"
              >
                {isDone && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <span
                className="text-xs"
                style={{
                  color: isPending
                    ? "hsl(var(--muted-foreground))"
                    : "hsl(var(--foreground))",
                  fontWeight: isActive ? 600 : 400,
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
