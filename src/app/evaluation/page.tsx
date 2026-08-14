import React from "react";
import type { Metadata } from "next";
import evaluationResults from "@/lib/evaluation-results.json";

export const metadata: Metadata = {
  title: "Evaluation — Essay Lens",
  description:
    "Evaluation metrics, confusion matrix, three confidently wrong examples, and ESL fairness analysis for the Essay Lens AI detector.",
};

export default function EvaluationPage() {
  const data = evaluationResults;
  const cm = data.confusionMatrix;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "var(--font-serif)", color: "hsl(var(--foreground))" }}
        >
          Evaluation
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          Real evaluation results from the held-out test set. This page does not cherry-pick results.
          All numbers reflect actual detector performance.
        </p>
      </header>

      {/* Small dataset warning */}
      <div
        className="mb-8 rounded-xl border-l-4 p-4 text-sm"
        style={{
          backgroundColor: "hsl(40 95% 48% / 0.08)",
          borderColor: "hsl(40 95% 48%)",
          color: "hsl(var(--foreground))",
        }}
        role="note"
      >
        <strong>⚠️ Small Dataset Notice:</strong> {data._meta.smallDatasetWarning}
      </div>

      <div className="space-y-10">

        {/* Dataset */}
        <section>
          <SectionTitle>Dataset</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <StatCard label="Total examples" value={data.dataset.total.toString()} />
            <StatCard label="Human essays" value={data.dataset.human.toString()} color="green" />
            <StatCard label="AI-generated" value={data.dataset.aiGenerated.toString()} color="red" />
            <StatCard label="Mixed (AI-polished)" value={data.dataset.mixedHumanAi.toString()} color="orange" />
            <StatCard label="Train split" value={data.dataset.trainSplit.toString()} />
            <StatCard label="Validation split" value={data.dataset.validationSplit.toString()} />
            <StatCard label="Test split (held-out)" value={data.dataset.testSplit.toString()} />
          </div>

          {/* Data sources */}
          <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>
            Data Sources
          </h3>
          <div className="space-y-2">
            {data.dataset.sources.map((source, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 text-sm"
                style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                    {source.name}
                  </span>
                  <TypeBadge type={source.type} />
                  <span className="ml-auto text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    n={source.count}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {source.description}
                </p>
                <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <strong>License:</strong> {source.license}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Overall Metrics */}
        <section>
          <SectionTitle>Overall Metrics (Held-Out Test Set, n=60)</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <MetricCard label="Accuracy" value={pct(data.overallMetrics.accuracy)} />
            <MetricCard label="Precision" value={pct(data.overallMetrics.precision)} />
            <MetricCard label="Recall" value={pct(data.overallMetrics.recall)} />
            <MetricCard label="F1 Score" value={data.overallMetrics.f1.toFixed(2)} />
            <MetricCard label="AUC-ROC" value={data.overallMetrics.aucRoc.toFixed(2)} />
            <MetricCard label="False Positive Rate" value={pct(data.overallMetrics.falsePositiveRate)} highlight="warn" />
            <MetricCard label="False Negative Rate" value={pct(data.overallMetrics.falseNegativeRate)} highlight="warn" />
            <MetricCard label="Decision Threshold" value={data.overallMetrics.threshold.toString()} />
          </div>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            95% CI for accuracy: [{pct(data.overallMetrics.confidenceInterval95.accuracy[0])},&nbsp;
            {pct(data.overallMetrics.confidenceInterval95.accuracy[1])}] —&nbsp;
            {data.overallMetrics.confidenceInterval95.note}
          </p>
        </section>

        {/* Confusion Matrix */}
        <section>
          <SectionTitle>Confusion Matrix</SectionTitle>
          <div className="overflow-x-auto">
            <table
              className="text-sm border-collapse"
              style={{ borderColor: "hsl(var(--border))" }}
              aria-label="Confusion matrix"
            >
              <thead>
                <tr>
                  <th className="p-3 border text-left" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--secondary))" }}></th>
                  <th className="p-3 border text-center" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--secondary))" }}>Predicted: Human</th>
                  <th className="p-3 border text-center" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--secondary))" }}>Predicted: AI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border font-medium" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--secondary))" }}>Actual: Human</td>
                  <td className="p-3 border text-center font-semibold" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(142 60% 44% / 0.12)", color: "hsl(142 60% 30%)" }}>
                    {cm.trueNegatives} ✓<div className="text-xs font-normal opacity-70">True Negatives</div>
                  </td>
                  <td className="p-3 border text-center font-semibold" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(0 72% 51% / 0.10)", color: "hsl(0 72% 35%)" }}>
                    {cm.falsePositives} ✗<div className="text-xs font-normal opacity-70">False Positives</div>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 border font-medium" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--secondary))" }}>Actual: AI</td>
                  <td className="p-3 border text-center font-semibold" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(40 95% 48% / 0.10)", color: "hsl(40 95% 28%)" }}>
                    {cm.falseNegatives} ✗<div className="text-xs font-normal opacity-70">False Negatives</div>
                  </td>
                  <td className="p-3 border text-center font-semibold" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(142 60% 44% / 0.12)", color: "hsl(142 60% 30%)" }}>
                    {cm.truePositives} ✓<div className="text-xs font-normal opacity-70">True Positives</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ESL Fairness */}
        <section>
          <SectionTitle>ESL Fairness Analysis</SectionTitle>
          <div
            className="rounded-xl border-l-4 p-4 mb-4"
            style={{
              backgroundColor: "hsl(0 72% 51% / 0.06)",
              borderColor: "hsl(0 72% 51%)",
            }}
            role="note"
          >
            <p className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>
              ⚠️ ESL writers are flagged at a significantly higher rate.
            </p>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {data.eslFairness.interpretation}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FairnessCard
              group="Native English speakers"
              n={data.eslFairness.nativeSpeakers.n}
              fpr={data.eslFairness.nativeSpeakers.falsePositiveRate}
              note={data.eslFairness.nativeSpeakers.note}
              color="green"
            />
            <FairnessCard
              group="ESL writers"
              n={data.eslFairness.eslSpeakers.n}
              fpr={data.eslFairness.eslSpeakers.falsePositiveRate}
              note={data.eslFairness.eslSpeakers.note}
              color="red"
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            {data.eslFairness.caveat}
          </p>
        </section>

        {/* Three Confidently Wrong Examples */}
        <section>
          <SectionTitle>Three Confidently Wrong Examples</SectionTitle>
          <p className="text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
            These are real examples where the detector made confident but incorrect predictions.
            Understanding failures is essential for responsible use.
          </p>
          <div className="space-y-6">
            {data.confidentiallyWrongExamples.map((ex) => (
              <WrongExample key={ex.id} example={ex} />
            ))}
          </div>
        </section>

        {/* Subgroup Analysis */}
        <section>
          <SectionTitle>Subgroup Analysis</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>By Essay Length</h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "hsl(var(--secondary))" }}>
                    <th className="p-2 border text-left" style={{ borderColor: "hsl(var(--border))" }}>Length</th>
                    <th className="p-2 border text-center" style={{ borderColor: "hsl(var(--border))" }}>n</th>
                    <th className="p-2 border text-center" style={{ borderColor: "hsl(var(--border))" }}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.subgroupAnalysis.byEssayLength).map(([key, val]) => (
                    <tr key={key}>
                      <td className="p-2 border" style={{ borderColor: "hsl(var(--border))" }}>{key.replace(/_/g, " ")}</td>
                      <td className="p-2 border text-center" style={{ borderColor: "hsl(var(--border))" }}>{val.n}</td>
                      <td className="p-2 border text-center" style={{ borderColor: "hsl(var(--border))" }}>{pct(val.accuracy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>By AI Model (Detection Rate)</h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "hsl(var(--secondary))" }}>
                    <th className="p-2 border text-left" style={{ borderColor: "hsl(var(--border))" }}>Model</th>
                    <th className="p-2 border text-center" style={{ borderColor: "hsl(var(--border))" }}>n</th>
                    <th className="p-2 border text-center" style={{ borderColor: "hsl(var(--border))" }}>Detected</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.subgroupAnalysis.byAiModel).map(([key, val]) => (
                    <tr key={key}>
                      <td className="p-2 border" style={{ borderColor: "hsl(var(--border))" }}>{key}</td>
                      <td className="p-2 border text-center" style={{ borderColor: "hsl(var(--border))" }}>{val.n}</td>
                      <td className="p-2 border text-center" style={{ borderColor: "hsl(var(--border))" }}>{pct(val.detectionRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl font-semibold mb-5 pb-2 border-b"
      style={{
        fontFamily: "var(--font-serif)",
        color: "hsl(var(--foreground))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {children}
    </h2>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "green" | "red" | "orange";
}) {
  const bgColor =
    color === "green"
      ? "hsl(142 60% 44% / 0.10)"
      : color === "red"
      ? "hsl(0 72% 51% / 0.08)"
      : color === "orange"
      ? "hsl(25 90% 50% / 0.10)"
      : "hsl(var(--secondary))";

  return (
    <div
      className="rounded-xl p-4 text-center border"
      style={{ borderColor: "hsl(var(--border))", backgroundColor: bgColor }}
    >
      <div className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
        {value}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
        {label}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "warn";
}) {
  return (
    <div
      className="rounded-xl p-4 text-center border"
      style={{
        borderColor: highlight ? "hsl(40 95% 48% / 0.3)" : "hsl(var(--border))",
        backgroundColor: highlight ? "hsl(40 95% 48% / 0.06)" : "hsl(var(--card))",
      }}
    >
      <div className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
        {value}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
        {label}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    human: { bg: "hsl(142 60% 44% / 0.12)", text: "hsl(142 60% 30%)" },
    ai: { bg: "hsl(0 72% 51% / 0.10)", text: "hsl(0 72% 35%)" },
    mixed: { bg: "hsl(25 90% 50% / 0.12)", text: "hsl(25 90% 32%)" },
  };
  const s = styles[type] ?? styles.human;
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded-full capitalize"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {type}
    </span>
  );
}

function FairnessCard({
  group,
  n,
  fpr,
  note,
  color,
}: {
  group: string;
  n: number;
  fpr: number;
  note: string;
  color: "green" | "red";
}) {
  const bgColor =
    color === "green" ? "hsl(142 60% 44% / 0.08)" : "hsl(0 72% 51% / 0.08)";
  const borderColor =
    color === "green" ? "hsl(142 60% 44% / 0.3)" : "hsl(0 72% 51% / 0.3)";

  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <h4 className="text-sm font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>
        {group}
      </h4>
      <div className="text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
        {pct(fpr)} FPR
      </div>
      <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
        n = {n} examples
      </div>
      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
        {note}
      </p>
    </div>
  );
}

function WrongExample({ example }: { example: typeof evaluationResults.confidentiallyWrongExamples[0] }) {
  const categoryColor =
    example.actualLabel === "human"
      ? "hsl(0 72% 51%)"
      : example.actualLabel === "ai"
      ? "hsl(40 95% 48%)"
      : "hsl(25 90% 50%)";

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "hsl(var(--border))" }}
    >
      <div
        className="px-5 py-3 border-b flex items-start gap-3"
        style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--secondary))" }}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              {example.category}
            </span>
          </div>
          <div className="flex gap-3 mt-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span>Actual: <strong style={{ color: categoryColor }}>{example.actualLabel}</strong></span>
            <span>Predicted: <strong>{example.predictedLabel}</strong></span>
            <span>Score: <strong>{pct(example.score)}</strong></span>
            <span>Band: <strong>{example.band}</strong></span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Excerpt */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Essay excerpt
          </div>
          <blockquote
            className="text-sm leading-relaxed border-l-2 pl-3 italic"
            style={{
              fontFamily: "var(--font-serif)",
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
          >
            &ldquo;{example.excerpt}&rdquo;
          </blockquote>
        </div>

        {/* Signals */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Relevant signals
          </div>
          <ul className="space-y-1">
            {example.signals.map((s, i) => (
              <li key={i} className="text-xs flex gap-2" style={{ color: "hsl(var(--foreground))" }}>
                <span style={{ color: "hsl(var(--muted-foreground))" }}>·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Why wrong */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Likely reason for failure
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
            {example.likelyReason}
          </p>
        </div>

        {/* Lesson */}
        <div
          className="rounded-lg p-3 text-xs"
          style={{
            backgroundColor: "hsl(var(--secondary))",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <strong>What this tells us:</strong> {example.lessonsLearned}
        </div>
      </div>
    </div>
  );
}
