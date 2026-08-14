import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — Essay Lens",
  description:
    "How Essay Lens detects statistical patterns in writing: sentence rhythm, vocabulary diversity, repetition, and formulaic language.",
};

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 relative z-10">
      <header className="mb-10 animate-fade-in">
        <h1
          className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight"
          style={{ color: "hsl(var(--primary))" }}
        >
          Methodology
        </h1>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          How Essay Lens works — in plain English and technical detail.
        </p>
      </header>

      <div className="prose-content space-y-10">

        {/* Philosophy */}
        <Section title="Core Philosophy">
          <p>
            Essay Lens does not claim to &ldquo;detect AI&rdquo; with certainty.
            Instead, it measures specific linguistic properties of a text and
            reports which properties are statistically unusual relative to a
            reference distribution of human admissions writing.
          </p>
          <p>
            The tool is designed to support human review — not to replace it.
            A high signal does not prove that AI wrote the text.
            A low signal does not prove a human wrote it.
          </p>
          <CalloutBox type="warning">
            AI detection is probabilistic. Human writing can look machine-generated.
            Machine-generated writing can look human. Use this tool as one signal
            among many, never as sole evidence.
          </CalloutBox>
        </Section>

        {/* Architecture */}
        <Section title="Detection Architecture">
          <p>
            The detector uses a <strong>hybrid statistical pipeline</strong>.
            No language model is asked whether text is AI-generated.
            Instead, measurable features are extracted from the text,
            normalized, and fed into a logistic regression classifier.
          </p>
          <Pipeline />
        </Section>

        {/* Sentence Rhythm */}
        <Section title="Feature 1: Sentence Rhythm">
          <p>
            Machine-generated prose often exhibits more regular rhythmic patterns
            than human writing. A human essayist naturally varies sentence
            length — mixing short punchy sentences with longer, more complex ones.
          </p>
          <p>
            We measure:
          </p>
          <ul>
            <li><strong>Mean sentence length</strong> (words per sentence)</li>
            <li><strong>Standard deviation</strong> of sentence lengths</li>
            <li><strong>Coefficient of variation</strong> (CV = σ/μ) — lower CV means more uniform lengths</li>
            <li><strong>Burstiness</strong> — a statistical measure of whether sentence lengths cluster or spread</li>
            <li><strong>Adjacent variation</strong> — average absolute length difference between consecutive sentences</li>
          </ul>
          <CalloutBox type="note">
            Low CV alone does not mean AI. Some human writers naturally have
            consistent prose. This is one signal among many.
          </CalloutBox>
        </Section>

        {/* Vocabulary */}
        <Section title="Feature 2: Vocabulary Diversity">
          <p>
            We use the <strong>Moving-Average Type-Token Ratio (MATTR)</strong> —
            a more stable variant of the classic Type-Token Ratio (TTR).
            TTR measures the proportion of unique words to total words.
            MATTR computes this over sliding 50-word windows, then averages,
            making it robust to essay length.
          </p>
          <p>
            We also measure:
          </p>
          <ul>
            <li>Bigram diversity ratio (unique two-word phrases / all two-word phrases)</li>
            <li>Repeated word ratio</li>
            <li>Function word and pronoun density</li>
            <li>Adjective and adverb density</li>
          </ul>
        </Section>

        {/* Repetition */}
        <Section title="Feature 3: Repetition Patterns">
          <p>
            Language models often reuse structural patterns more than human writers.
            We detect:
          </p>
          <ul>
            <li>Repeated bigrams, trigrams, and 4-grams</li>
            <li>Repeated sentence openings (first 2–3 words)</li>
            <li>Repeated sentence endings</li>
          </ul>
          <p>
            When you see &ldquo;Similar sentence openings occur repeatedly&rdquo; in an evidence panel,
            it corresponds to an actual measurement of shared 2-word sentence starters
            across the passage.
          </p>
        </Section>

        {/* Formulaic Language */}
        <Section title="Feature 4: Formulaic Language">
          <p>
            We maintain a <strong>transparent lexicon</strong> of phrase patterns that
            appear frequently in machine-generated admissions essays. This includes:
          </p>
          <ul>
            <li>Additive transitions: <em>furthermore, moreover, additionally</em></li>
            <li>Conclusive transitions: <em>in conclusion, ultimately, in summary</em></li>
            <li>Metacommentary: <em>it is important to note, this highlights</em></li>
            <li>Vague generalization: <em>in today&rsquo;s world, in the modern era</em></li>
            <li>Journey language: <em>throughout my journey, looking back</em></li>
          </ul>
          <CalloutBox type="note">
            These phrases are <strong>not inherently AI-generated</strong>. Many human writers
            use them. They are only flagged as signals when they appear at elevated density
            or in combination with other signals.
          </CalloutBox>
        </Section>

        {/* Punctuation Entropy */}
        <Section title="Feature 5: Punctuation Entropy">
          <p>
            We calculate the <strong>Shannon entropy</strong> of the punctuation distribution
            in a passage. Shannon entropy measures how unpredictable or varied the punctuation
            choices are. Lower entropy means more repetitive punctuation patterns.
          </p>
          <p>
            Machine-generated text tends toward more uniform punctuation usage —
            heavy on commas, lighter on em-dashes, parentheses, and other structural marks.
          </p>
        </Section>

        {/* Scoring */}
        <Section title="Scoring and Calibration">
          <p>
            After feature extraction, all features are <strong>z-score normalized</strong>
            against reference corpus statistics. Normalized features are fed into a
            <strong> logistic regression classifier</strong> whose coefficients
            were trained offline on a labeled dataset of 600 essays
            (300 human, 300 machine-generated).
          </p>
          <p>
            The classifier outputs a log-odds value, which is passed through a{" "}
            <strong>sigmoid function</strong> to produce a calibrated probability in [0, 1].
          </p>
          <p>
            The final document score blends sentence-level scores (weighted by sentence length)
            with a document-level score.
          </p>
          <p>Score bands:</p>
          <ul>
            <li><strong>&lt; 0.30:</strong> Low evidence of machine-generated style</li>
            <li><strong>0.30–0.50:</strong> Some machine-like signals detected</li>
            <li><strong>0.50–0.70:</strong> Elevated machine-like signals</li>
            <li><strong>&gt; 0.70:</strong> Strong machine-like signals</li>
          </ul>
        </Section>

        {/* LM Signal */}
        <Section title="Optional Language Model Signal">
          <p>
            If an <code>OPENAI_API_KEY</code> is configured, the detector can optionally
            obtain <strong>token-level log-probabilities</strong> from the OpenAI Completions
            API. This returns a measurement of how predictable each token was to the model —
            a statistical proxy for perplexity.
          </p>
          <p>
            <strong>The model is never asked &ldquo;Is this AI-generated?&rdquo;</strong>
            It only returns numerical probability values. The final verdict
            is computed entirely by our pipeline.
          </p>
          <CalloutBox type="note">
            If no API key is provided, the detector falls back to the full statistical
            pipeline. All results remain valid.
          </CalloutBox>
        </Section>

        {/* Fairness */}
        <Section title="Fairness and ESL Writers">
          <p>
            Research has shown that AI writing detectors disproportionately flag
            writing by <strong>second-language English speakers</strong>. Their writing
            may share stylistic properties with machine-generated text
            (more regular sentence structure, simpler vocabulary, formulaic phrasing)
            due to differences in language acquisition, not AI use.
          </p>
          <p>
            Essay Lens explicitly evaluates its performance on ESL writing samples.
            See the <a href="/evaluation" className="underline" style={{ color: "hsl(var(--primary))" }}>Evaluation page</a> for
            false-positive rates by writer group.
          </p>
          <CalloutBox type="warning">
            Never use these results as evidence of misconduct for any writer,
            but apply particular caution when evaluating ESL writers.
          </CalloutBox>
        </Section>

        {/* Limitations */}
        <Section title="Limitations">
          <ul>
            <li>Trained on a small synthetic dataset (n=600); may not generalize to all writing styles</li>
            <li>Optimized for English; other languages will produce unreliable results</li>
            <li>Cannot distinguish AI-generated from AI-polished writing</li>
            <li>Performance degrades on essays fewer than 50 words</li>
            <li>Adversarial paraphrasing can reduce signal strength</li>
            <li>Does not account for extensive human editing of AI output</li>
          </ul>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel p-6 rounded-2xl shadow-sm border" style={{ borderColor: "rgba(255, 255, 255, 0.4)", boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.02)" }}>
      <h2
        className="text-lg font-bold mb-4 pb-2 border-b uppercase tracking-wider text-[11px]"
        style={{
          fontFamily: "var(--font-sans)",
          color: "hsl(var(--primary))",
          borderColor: "rgba(255, 255, 255, 0.3)",
        }}
      >
        {title}
      </h2>
      <div
        className="space-y-4 text-xs sm:text-sm leading-relaxed"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {children}
      </div>
    </section>
  );
}

function CalloutBox({
  type,
  children,
}: {
  type: "note" | "warning";
  children: React.ReactNode;
}) {
  const colors =
    type === "warning"
      ? {
          bg: "rgba(251, 146, 60, 0.06)",
          border: "rgba(251, 146, 60, 0.4)",
          label: "⚠️ Note",
        }
      : {
          bg: "rgba(59, 130, 246, 0.06)",
          border: "rgba(59, 130, 246, 0.4)",
          label: "ℹ️ Note",
        };

  return (
    <div
      className="rounded-xl p-4 border text-xs sm:text-sm glass-panel border-l-4"
      style={{
        backgroundColor: colors.bg,
        borderColor: "rgba(255, 255, 255, 0.3)",
        borderLeftColor: colors.border,
      }}
      role="note"
    >
      <span className="font-bold text-[10px] uppercase tracking-wider block mb-1">{colors.label}</span>
      <div className="leading-relaxed font-medium">{children}</div>
    </div>
  );
}

function Pipeline() {
  const steps = [
    "Text input",
    "Sentence & paragraph segmentation",
    "Feature extraction (structural, lexical, repetition, punctuation, formulaic)",
    "Z-score normalization",
    "Logistic regression (trained offline, coefficients from model-artifact.json)",
    "Sigmoid calibration → [0,1] score",
    "Sentence scoring + evidence generation",
    "Structured JSON response",
  ];

  return (
    <div className="rounded-2xl border overflow-hidden glass-panel" style={{ borderColor: "rgba(255,255,255,0.4)" }}>
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-5 py-3 text-xs sm:text-sm border-b last:border-b-0"
          style={{
            borderColor: "rgba(255, 255, 255, 0.3)",
            backgroundColor: i % 2 === 0 ? "rgba(255, 255, 255, 0.18)" : "transparent",
          }}
        >
          <span
            className="shrink-0 w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              backgroundColor: "hsl(var(--primary))",
              color: "white",
            }}
          >
            {i + 1}
          </span>
          <span className="font-medium text-gray-800">{step}</span>
          {i < steps.length - 1 && (
            <span className="ml-auto text-xs opacity-50">↓</span>
          )}
        </div>
      ))}
    </div>
  );
}
