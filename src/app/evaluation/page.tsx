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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative z-10">
      <header className="mb-8 animate-fade-in">
        <h1
          className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight"
          style={{ color: "hsl(var(--primary))" }}
        >
          Evaluation
        </h1>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          Real evaluation results from the held-out test set. This page does not cherry-pick results.
          All numbers reflect actual detector performance.
        </p>
      </header>

      {/* Small dataset warning */}
      <div
        className="mb-8 rounded-2xl border-l-4 p-5 text-xs leading-relaxed glass-panel"
        style={{
          borderLeftColor: "hsl(var(--primary))",
          borderColor: "rgba(255, 255, 255, 0.4)",
          color: "hsl(var(--foreground))",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.02)",
        }}
        role="note"
      >
        <span className="font-bold text-[10px] uppercase tracking-wider block mb-1" style={{ color: "hsl(var(--primary))" }}>⚠️ Small Dataset Notice</span>
        {data._meta.smallDatasetWarning}
      </div>

      <div className="space-y-10">

        {/* Dataset */}
        <section>
          <SectionTitle>Dataset</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total examples" value={data.dataset.total.toString()} />
            <StatCard label="Human essays" value={data.dataset.human.toString()} color="green" />
            <StatCard label="AI-generated" value={data.dataset.aiGenerated.toString()} color="red" />
            <StatCard label="Mixed (AI-polished)" value={data.dataset.mixedHumanAi.toString()} color="orange" />
            <StatCard label="Train split" value={data.dataset.trainSplit.toString()} />
            <StatCard label="Validation split" value={data.dataset.validationSplit.toString()} />
            <StatCard label="Test split (held-out)" value={data.dataset.testSplit.toString()} />
          </div>

          {/* Data sources */}
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3.5" style={{ color: "hsl(var(--foreground))" }}>
            Data Sources
          </h3>
          <div className="space-y-3">
            {data.dataset.sources.map((source, i) => (
              <div
                key={i}
                className="rounded-2xl border p-4 text-xs sm:text-sm glass-panel"
                style={{ borderColor: "rgba(255, 255, 255, 0.4)", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-800">
                    {source.name}
                  </span>
                  <TypeBadge type={source.type} />
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                    n={source.count}
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {source.description}
                </p>
                <p className="text-[10px] mt-2 font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
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
          <p className="text-xs px-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            95% CI for accuracy: [{pct(data.overallMetrics.confidenceInterval95.accuracy[0])},&nbsp;
            {pct(data.overallMetrics.confidenceInterval95.accuracy[1])}] —&nbsp;
            {data.overallMetrics.confidenceInterval95.note}
          </p>
        </section>

        {/* Confusion Matrix */}
        <section>
          <SectionTitle>Confusion Matrix</SectionTitle>
          <div className="overflow-x-auto rounded-2xl border glass-panel p-1.5" style={{ borderColor: "rgba(255, 255, 255, 0.4)", boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.02)" }}>
            <table
              className="w-full text-xs sm:text-sm border-collapse"
              aria-label="Confusion matrix"
            >
              <thead>
                <tr>
                  <th className="p-3.5 text-left font-bold uppercase tracking-wider text-[10px] text-gray-500"></th>
                  <th className="p-3.5 text-center font-bold uppercase tracking-wider text-[10px] text-gray-500">Predicted: Human</th>
                  <th className="p-3.5 text-center font-bold uppercase tracking-wider text-[10px] text-gray-500">Predicted: AI</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/20">
                  <td className="p-3.5 font-bold text-gray-700">Actual: Human</td>
                  <td className="p-3.5 text-center font-bold bg-emerald-500/10 text-emerald-800 rounded-xl">
                    {cm.trueNegatives} ✓<div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">True Negatives</div>
                  </td>
                  <td className="p-3.5 text-center font-bold bg-rose-500/10 text-rose-800 rounded-xl">
                    {cm.falsePositives} ✗<div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">False Positives</div>
                  </td>
                </tr>
                <tr className="border-t border-white/20">
                  <td className="p-3.5 font-bold text-gray-700">Actual: AI</td>
                  <td className="p-3.5 text-center font-bold bg-amber-500/10 text-amber-800 rounded-xl">
                    {cm.falseNegatives} ✗<div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">False Negatives</div>
                  </td>
                  <td className="p-3.5 text-center font-bold bg-emerald-500/10 text-emerald-800 rounded-xl">
                    {cm.truePositives} ✓<div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">True Positives</div>
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
            className="rounded-2xl border-l-4 p-5 mb-5 glass-panel"
            style={{
              borderColor: "rgba(255, 255, 255, 0.4)",
              borderLeftColor: "rgba(239, 68, 68, 0.4)",
              backgroundColor: "rgba(239, 68, 68, 0.03)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.02)",
            }}
            role="note"
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--foreground))" }}>
              ⚠️ ESL writers are flagged at a significantly higher rate.
            </p>
            <p className="text-xs font-medium leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
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
      className="text-lg font-bold mb-5 pb-2 border-b uppercase tracking-wider text-[11px]"
      style={{
        fontFamily: "var(--font-sans)",
        color: "hsl(var(--primary))",
        borderColor: "rgba(255, 255, 255, 0.3)",
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
  const badgeColor =
    color === "green"
      ? "rgba(16, 185, 129, 0.08)"
      : color === "red"
      ? "rgba(239, 68, 68, 0.08)"
      : color === "orange"
      ? "rgba(249, 115, 22, 0.08)"
      : "rgba(255, 255, 255, 0.4)";

  return (
    <div
      className="rounded-2xl p-4 text-center border glass-panel"
      style={{
        borderColor: "rgba(255, 255, 255, 0.4)",
        backgroundColor: badgeColor,
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.01)",
      }}
    >
      <div className="text-xl font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
        {value}
      </div>
      <div className="text-[10px] uppercase font-bold tracking-wider mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
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
      className="rounded-2xl p-4 text-center border glass-panel"
      style={{
        borderColor: highlight ? "rgba(249, 115, 22, 0.3)" : "rgba(255, 255, 255, 0.4)",
        backgroundColor: highlight ? "rgba(249, 115, 22, 0.04)" : "rgba(255, 255, 255, 0.45)",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.01)",
      }}
    >
      <div className="text-xl font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
        {value}
      </div>
      <div className="text-[10px] uppercase font-bold tracking-wider mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
        {label}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    human: { bg: "hsl(142 65% 40% / 0.12)", text: "hsl(142 65% 30%)" },
    ai: { bg: "hsl(0 75% 50% / 0.10)", text: "hsl(0 75% 35%)" },
    mixed: { bg: "hsl(25 90% 50% / 0.12)", text: "hsl(25 90% 32%)" },
  };
  const s = styles[type] ?? styles.human;
  return (
    <span
      className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full capitalize"
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
    color === "green" ? "rgba(16, 185, 129, 0.06)" : "rgba(239, 68, 68, 0.06)";
  const borderColor =
    color === "green" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)";

  return (
    <div
      className="rounded-2xl border p-5 glass-panel"
      style={{
        backgroundColor: bgColor,
        borderColor: "rgba(255, 255, 255, 0.4)",
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.02)",
      }}
    >
      <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: "hsl(var(--foreground))" }}>
        {group}
      </h4>
      <div className="text-2xl font-extrabold mb-1" style={{ color: "hsl(var(--foreground))" }}>
        {pct(fpr)} FPR
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
        n = {n} examples
      </div>
      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
        {note}
      </p>
    </div>
  );
}

function WrongExample({ example }: { example: typeof evaluationResults.confidentiallyWrongExamples[0] }) {
  const categoryColor =
    example.actualLabel === "human"
      ? "hsl(0 75% 50%)"
      : example.actualLabel === "ai"
      ? "hsl(38 92% 48%)"
      : "hsl(25 90% 50%)";

  return (
    <div
      className="rounded-2xl border overflow-hidden glass-panel"
      style={{
        borderColor: "rgba(255, 255, 255, 0.4)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.02)",
      }}
    >
      <div
        className="px-5 py-4 border-b flex items-start gap-3"
        style={{
          borderColor: "rgba(255, 255, 255, 0.3)",
          backgroundColor: "rgba(255, 255, 255, 0.3)",
        }}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
              {example.category}
            </span>
          </div>
          <div className="flex gap-4 mt-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
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
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Essay excerpt
          </div>
          <blockquote
            className="text-xs sm:text-sm leading-relaxed border-l-2 pl-3 italic font-medium"
            style={{
              fontFamily: "var(--font-serif)",
              borderColor: "rgba(0, 0, 0, 0.15)",
              color: "hsl(var(--foreground))",
            }}
          >
            &ldquo;{example.excerpt}&rdquo;
          </blockquote>
        </div>

        {/* Signals */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Relevant signals
          </div>
          <ul className="space-y-1.5">
            {example.signals.map((s, i) => (
              <li key={i} className="text-xs flex gap-2 font-medium" style={{ color: "hsl(var(--foreground))" }}>
                <span style={{ color: "rgba(0, 0, 0, 0.25)" }}>·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Why wrong */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Likely reason for failure
          </div>
          <p className="text-xs sm:text-sm leading-relaxed font-medium" style={{ color: "hsl(var(--foreground))" }}>
            {example.likelyReason}
          </p>
        </div>

        {/* Lesson */}
        <div
          className="rounded-xl p-4 text-xs border leading-relaxed bg-white/20"
          style={{
            borderColor: "rgba(255, 255, 255, 0.3)",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <strong className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "hsl(var(--foreground))" }}>What this tells us:</strong> {example.lessonsLearned}
        </div>
      </div>
    </div>
  );
}
