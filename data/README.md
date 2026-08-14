# Dataset Documentation

## Overview

This dataset was created for training the Essay Lens AI writing detector.
It consists of human-written and machine-generated admissions essays.

**IMPORTANT LIMITATIONS:**
- This is a small dataset (n=600). Results may not generalize to all writing styles.
- A detector trained on admissions essays may fail on other text types.
- ESL writers are underrepresented in the training data.
- Do not treat evaluation metrics as definitive performance guarantees.

---

## Dataset Structure

```
data/
  raw/
    human/           # Human-authored essays
    ai/              # AI-generated essays
    mixed/           # AI-polished human essays
  processed/
    train.json       # Training split (80%)
    validation.json  # Validation split (10%)
    test.json        # Held-out test set (10%) — NOT used for threshold fitting
    features.json    # Extracted feature vectors
    stats.json       # Corpus statistics for normalization
```

---

## Sources

### Human Writing

| Source | Count | License | Description |
|--------|-------|---------|-------------|
| Volunteer essays | ~150 | CC-BY / volunteer contribution | Admissions-style essays contributed by volunteers |
| Public writing samples | ~100 | CC-BY 4.0 or public domain | Reflective personal essays from open access collections |
| Adapted narrative excerpts | ~50 | Public domain | Literary personal narratives adapted to essay format |

**Subject distribution:**
- Personal growth / challenge: 35%
- Academic interest: 25%
- Community / service: 15%
- Extracurricular / activity: 15%
- Miscellaneous: 10%

**Writing proficiency levels:** Mixed (high school through post-graduate)

**Known biases:**
- Overrepresentation of English-language native speakers
- Overrepresentation of STEM topics
- Underrepresentation of students from non-Western educational backgrounds

### AI-Generated Writing

| Model | Count | Style | Prompts |
|-------|-------|-------|---------|
| GPT-3.5-turbo | 120 | Generic, polished, concise, verbose | 4 variants |
| GPT-4 | 80 | Polished, detailed | 3 variants |
| Claude 2 | 50 | Standard admissions | 2 variants |

**Generation prompts used** (see `scripts/dataset/prompts.ts`):
1. Direct request: "Write a college admissions essay about [topic]"
2. Role-play: "You are a high school student applying to college. Write your personal essay about..."
3. Polished: "Write a polished, formal college admissions essay..."
4. Concise: "Write a brief, direct college admissions essay..."
5. Verbose: "Write a detailed, expansive college admissions essay..."

### Mixed (AI-Polished Human Essays)

Human essays were submitted to GPT-4 with the instruction:
> "Improve the grammar, flow, and transitions of the following essay while preserving the original ideas and voice as much as possible."

This creates realistic "AI-polished" text — which is likely the most common real-world case.

---

## Train/Validation/Test Split

| Split | Count | Human | AI | Mixed |
|-------|-------|-------|----|----- |
| Train | 480 | 240 | 200 | 40 |
| Validation | 60 | 30 | 25 | 5 |
| Test | 60 | 30 | 25 | 5 |

The test set was held out completely and not used for any threshold fitting or hyperparameter tuning.

---

## ESL Subset

A small subset of human essays (n=30) was labeled as ESL (English as a Second Language) by self-report.
This subset was used only for fairness analysis.

| Group | n | False Positive Rate |
|-------|---|---------------------|
| Native English | 18 | 11.1% |
| ESL | 9 | 44.4% |

**WARNING:** This ESL analysis is based on a very small sample (n=9 ESL essays in test set).
The difference is substantial and consistent with published research, but the small sample
means the confidence intervals are very wide. Larger studies are needed.

---

## Preprocessing

1. Strip HTML/markdown artifacts
2. Normalize whitespace
3. Segment into sentences and paragraphs
4. Extract feature vectors (see `src/lib/detector/features/`)
5. Z-score normalize features using training set statistics
6. Store normalization stats in `model-artifact.json`

---

## Reproduction Instructions

```bash
# 1. Generate AI essays (requires OPENAI_API_KEY)
npm run generate:ai-essays

# 2. Prepare dataset (requires raw data in data/raw/)
npm run dataset:prepare

# 3. Train classifier
npm run detector:train

# 4. Evaluate on test set
npm run detector:evaluate
```

---

## Known Issues and Limitations

1. **Small size:** n=600 is small for ML. Wide confidence intervals on all metrics.
2. **Narrow domain:** Only admissions essays. May fail on other genres.
3. **Synthetic AI data:** AI essays were generated with specific prompts — adversarial prompting may evade detection.
4. **ESL bias:** Insufficient ESL representation in training data.
5. **Temporal drift:** As language models improve, detection accuracy may degrade.
6. **Model coverage:** Only GPT-3.5, GPT-4, and Claude 2 represented. Other models may behave differently.
7. **Mixed essays:** Only 50 AI-polished examples. Real-world distribution of polishing levels is unknown.
