# Essay Lens

### Understand the writing. Not just the score.

Essay Lens is an explainable AI-writing analysis tool designed specifically for **college admissions essays**.

Instead of asking a language model whether an essay was written by AI, Essay Lens analyzes measurable linguistic patterns and identifies passages that exhibit statistical characteristics associated with machine-generated or machine-polished prose.

**Live Demo:** https://essay-lens.vercel.app/

> ⚠️ **Important:** Essay Lens does not prove whether AI wrote an essay. Its results are probabilistic signals intended to support human review, not replace it.

---

## ✨ Why Essay Lens?

A result like:

> **"73% AI"**

doesn't tell a reader:

* Which part of the essay triggered the result
* Why it was flagged
* Which linguistic patterns contributed
* Whether the result came from one unusual sentence or the entire essay
* How reliable the detector is
* Where the detector fails

Essay Lens takes a different approach.

Instead of treating AI detection as a black-box classification problem, it exposes the **evidence behind the signal**.

The application analyzes essays at both the **document level and sentence/passage level**, allowing users to inspect the specific linguistic patterns that contributed to a result.

---

# 🚀 Features

## 🔍 Explainable Essay Analysis

Paste an admissions essay into Essay Lens and receive an analysis based on measurable linguistic characteristics.

The application provides:

* Overall machine-like signal
* Sentence-level analysis
* Passage-level analysis
* Highlighted suspicious passages
* Evidence for individual flags
* Signal breakdown
* Confidence information
* Word, sentence, paragraph, and character statistics

---

## 🧠 Statistical Detection — Not an LLM Verdict

Essay Lens does **not** send an essay to a chatbot and ask:

> "Is this AI-generated?"

Instead, the detector follows a statistical pipeline:

```text
Essay
  ↓
Sentence & Paragraph Segmentation
  ↓
Feature Extraction
  ↓
Feature Normalization
  ↓
Logistic Regression
  ↓
Probability Calibration
  ↓
Sentence-Level Scoring
  ↓
Evidence Generation
  ↓
Explainable Result
```

The final judgement is produced by the application's own statistical pipeline.

A language model, when optionally enabled, is used only as a source of measurable token-level probability information. It is never asked to make the AI/human judgement.

---

# 📊 What Essay Lens Measures

Essay Lens combines multiple linguistic signals rather than relying on a single feature.

## 1. Sentence Rhythm

The detector analyzes how sentence lengths vary throughout an essay.

Features include:

* Mean sentence length
* Standard deviation
* Coefficient of variation
* Burstiness
* Adjacent sentence-length variation

Highly regular sentence rhythms can be one signal associated with machine-generated prose.

However, regular sentence structure alone is **not** treated as proof of AI writing.

---

## 2. Vocabulary Diversity

Essay Lens measures lexical diversity using:

* Moving-Average Type-Token Ratio (MATTR)
* Bigram diversity
* Repeated word ratio
* Function-word density
* Pronoun density
* Adjective/adverb density

MATTR is calculated using sliding 50-word windows to make vocabulary measurements less dependent on essay length.

---

## 3. Repetition Patterns

The detector looks for repeated constructions such as:

* Repeated bigrams
* Repeated trigrams
* Repeated 4-grams
* Repeated sentence openings
* Repeated sentence endings

When a passage is flagged for repetition, the explanation corresponds to an actual measurement rather than an LLM-generated explanation.

---

## 4. Formulaic Language

Essay Lens maintains a transparent lexicon of common formulaic constructions.

Examples include:

* "Furthermore"
* "Moreover"
* "Additionally"
* "In conclusion"
* "Ultimately"
* "It is important to note"
* "This highlights"
* "In today's world"
* "Throughout my journey"

These phrases are **not considered inherently AI-generated**.

They become a signal when their frequency or combination with other characteristics is unusual.

---

## 5. Punctuation Entropy

Essay Lens measures the distribution and variability of punctuation using Shannon entropy.

This captures whether punctuation choices are highly repetitive or varied throughout a passage.

Again, this is treated as one statistical signal rather than standalone evidence.

---

# 🏗️ Detection Architecture

The current detector uses a hybrid statistical architecture.

```text
                    ┌──────────────────┐
                    │   Essay Input    │
                    └────────┬─────────┘
                             ↓
                ┌─────────────────────────┐
                │ Sentence / Paragraph    │
                │ Segmentation            │
                └────────────┬────────────┘
                             ↓
              ┌──────────────────────────────┐
              │      Feature Extraction      │
              │                              │
              │ • Sentence rhythm            │
              │ • Vocabulary diversity       │
              │ • Repetition                 │
              │ • Punctuation                │
              │ • Formulaic language         │
              └──────────────┬───────────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Z-score Normalization│
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Logistic Regression  │
                  │ Offline-trained      │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Sigmoid Calibration  │
                  │      [0, 1]          │
                  └──────────┬──────────┘
                             ↓
                ┌─────────────────────────┐
                │ Sentence-Level Scoring  │
                └────────────┬────────────┘
                             ↓
                ┌─────────────────────────┐
                │ Evidence Generation     │
                └────────────┬────────────┘
                             ↓
                    ┌────────────────┐
                    │ Explainable     │
                    │ Result          │
                    └────────────────┘
```

The classifier is trained offline and uses a lightweight model artifact at runtime.

---

# 🎯 Score Interpretation

Essay Lens uses four broad signal bands:

| Score         | Interpretation                          |
| ------------- | --------------------------------------- |
| `< 0.30`      | Low evidence of machine-generated style |
| `0.30 – 0.50` | Some machine-like signals               |
| `0.50 – 0.70` | Elevated machine-like signals           |
| `> 0.70`      | Strong machine-like signals             |

These values represent **statistical evidence**, not certainty of authorship.

---

# 🤖 Optional Language-Model Signal

Essay Lens can optionally use token-level log probabilities from an external language-model API.

The model is used as an **instrument**, not as the detector.

The system does **not** send a prompt such as:

```text
"Is this essay AI-generated?"
```

Instead, it obtains numerical token-probability information that can be used as an additional statistical feature.

The final classification remains the responsibility of the application's own statistical pipeline.

If the optional model signal is unavailable, Essay Lens falls back to its statistical feature pipeline.

---

# 📚 Dataset

Dataset construction and documentation are part of the project.

The current dataset contains:

**600 total examples**

| Category                 | Examples |
| ------------------------ | -------: |
| Human essays             |      300 |
| AI-generated essays      |      250 |
| AI-polished human essays |       50 |
| **Total**                |  **600** |

The dataset includes admissions-style writing covering topics such as:

* Personal growth
* Academic interests
* Extracurricular activities
* Challenges
* Leadership
* Personal experiences

### AI-generated sources

The machine-generated portion includes essays produced using multiple model families and prompting styles, including:

* GPT-3.5
* GPT-4
* Claude

The dataset also includes **AI-polished human essays**, representing a more realistic scenario where a person writes an essay and a language model subsequently improves grammar, flow, or transitions.

---

# 🧪 Evaluation

Essay Lens evaluates its detector using a held-out test set.

Current evaluation configuration:

```text
Total dataset:       600
Training:            480
Validation:           60
Held-out test:        60
```

The evaluation page reports:

* Accuracy
* Precision
* Recall
* F1
* ROC-AUC
* False-positive rate
* False-negative rate
* Decision threshold
* Subgroup performance
* Essay-length performance
* Detection rate by model family

Because the held-out test set is relatively small, the evaluation results should be treated as **indicative rather than definitive**.

A small change in the number of correctly classified essays can substantially change the reported percentage.

---

# ⚠️ Known Failure Cases

A responsible detector should show where it fails.

Essay Lens therefore includes three confidently incorrect examples in its evaluation.

### False Positive

A human-written essay was strongly flagged because it contained:

* Dense formal transitions
* Regular sentence rhythm
* Lower vocabulary diversity

This demonstrates that formal academic writing can resemble machine-generated prose.

### False Negative

An AI-generated essay was classified as human because it used:

* High sentence-length variation
* A personal narrative voice
* Specific anecdotal details
* Few formulaic transitions

This demonstrates that deliberately human-like prompting can evade surface-level statistical detection.

### Mixed / AI-Polished Essay

A human essay containing AI-polished sections received a strong overall AI signal.

This demonstrates one of the hardest cases for automated detection:

> A document can contain both human-written and machine-polished prose.

For this reason, sentence-level evidence is often more useful than the overall document score.

---

# 🌍 Fairness & ESL Writers

AI-writing detectors have a known fairness problem:

**writers who learned English as a second language can be disproportionately flagged.**

Essay Lens explicitly evaluates this issue.

The current small evaluation sample reports:

| Writer group            | False Positive Rate |
| ----------------------- | ------------------: |
| Native English speakers |               11.1% |
| ESL writers             |               44.4% |

The ESL sample is very small, so these numbers should **not** be treated as a definitive fairness estimate.

However, the difference is important enough that it should not be hidden.

Essay Lens therefore recommends particular caution when interpreting results for second-language English writers.

---

# ⚠️ Limitations

Essay Lens intentionally documents its limitations.

### Small training dataset

The current dataset contains 600 examples and may not generalize to every writing style, institution, demographic, or subject.

### English-focused

The detector is optimized for English prose.

Results on other languages should not be considered reliable.

### AI-polished writing

The detector cannot reliably determine how much of an essay was written by a human versus polished by an AI system.

### Short essays

Performance decreases on very short essays.

Essays under approximately 50 words do not provide enough linguistic evidence for reliable analysis.

### Paraphrasing

Adversarial paraphrasing can reduce detectable signals.

### Human editing

Extensive human editing of AI-generated content can significantly change the statistical characteristics of the original output.

---

# 🔐 Privacy

Essay Lens is designed around the principle that admissions essays can contain sensitive personal information.

The application should not treat submitted essays as generic training data.

The detector is designed to analyze submitted text rather than use it as evidence of wrongdoing.

Users should always understand how their text is processed before submitting sensitive information.

---

# 🛠️ Tech Stack

The application is built as a modern web application with a production-oriented architecture.

### Frontend

* React
* Next.js
* TypeScript
* Tailwind CSS

### Detection / ML

* Statistical NLP feature extraction
* Logistic regression
* Feature normalization
* Probability calibration
* Optional token-level language-model statistics

### Testing

* Unit testing
* Integration testing
* End-to-end testing

### Deployment

* GitHub
* Vercel

---

# 📁 Project Structure

A simplified architecture looks like:

```text
.
├── src/
│   ├── app/
│   │   ├── analyze/
│   │   ├── evaluation/
│   │   ├── methodology/
│   │   └── api/
│   │       └── analyze/
│   │
│   ├── components/
│   │   ├── analysis/
│   │   ├── evidence/
│   │   ├── essay-editor/
│   │   └── ui/
│   │
│   └── lib/
│       └── detector/
│           ├── features/
│           ├── scoring/
│           ├── segmentation/
│           ├── calibration/
│           └── evidence/
│
├── data/
├── scripts/
├── tests/
├── docs/
├── public/
└── README.md
```

---

# 🚀 Running Locally

Clone the repository:

```bash
git clone <your-repository-url>
cd essay-lens
```

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Add any optional API configuration required by your environment.

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🧪 Testing

Run the test suite:

```bash
npm test
```

Run TypeScript checks:

```bash
npx tsc --noEmit
```

Run linting:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

The production build should pass before deployment.

---

# ☁️ Deployment

Essay Lens is deployed using Vercel.

The production application is available at:

```text
https://essay-lens.vercel.app/
```

The deployment architecture is designed around a Next.js application and server-side analysis endpoints suitable for Vercel's serverless environment.

For production deployments, environment variables should be configured through the hosting platform rather than committed to the repository.

Never commit:

```text
.env
.env.local
.env.production
```

or any API credentials.

---

# 🧭 Product Philosophy

Essay Lens is built around three principles.

### 1. Evidence over verdicts

A percentage without an explanation is not useful.

Every meaningful flag should have measurable evidence behind it.

### 2. Statistical signals over black-box judgement

The detector should measure writing characteristics rather than simply asking another AI model for an opinion.

### 3. Honesty over impressive numbers

AI detection is an inherently uncertain problem.

A responsible system should show:

* Where it works
* Where it fails
* What it measures
* What it does not measure
* Who may be disproportionately affected
* How much confidence users should place in the result

---

# ⚖️ Responsible Use

Essay Lens should **never be used as the sole basis for an admissions, disciplinary, academic-integrity, employment, or misconduct decision.**

A detector score is not proof of authorship.

In particular:

> **A high score does not prove that AI wrote the essay.**

and:

> **A low score does not prove that a human wrote the essay.**

Human writing can resemble machine-generated writing.

Machine-generated writing can resemble human writing.

AI-polished writing can contain characteristics of both.

The appropriate use of Essay Lens is as a **review and research tool**, with human judgement remaining essential.

---

# 🎓 Why This Project Matters

AI-writing detection is often presented as a simple classification problem:

```text
Essay → AI detector → 73%
```

But real-world writing is much messier.

A student might:

```text
Write an essay
      ↓
Use Grammarly
      ↓
Ask an AI to improve one paragraph
      ↓
Rewrite that paragraph
      ↓
Have a teacher edit it
      ↓
Submit the final version
```

There is no clean binary boundary anymore.

Essay Lens explores how far **transparent statistical signals** can go while being honest about where automated detection breaks down.

The goal isn't to build a magical AI detector.

The goal is to build a detector whose reasoning can be **inspected, questioned, evaluated, and challenged.**

---

# 📖 Further Reading

The deployed application includes dedicated pages explaining:

* Detection methodology
* Feature engineering
* Statistical scoring
* Dataset construction
* Evaluation results
* Fairness considerations
* Known failure cases

---

# 📌 Status

**Project Status: Production / Deployed**

The application is currently deployed and available for testing.

> Built as an applied NLP/ML project exploring explainable AI-writing detection for admissions essays.

---

## ⚠️ Disclaimer

Essay Lens provides probabilistic statistical analysis of writing patterns.

It does **not** determine authorship.

It does **not** provide definitive proof of AI use.

It should never be used as the sole evidence for accusations of academic misconduct or other high-stakes decisions.

Use the tool responsibly and apply human judgement.
