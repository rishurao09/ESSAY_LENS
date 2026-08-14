# Detection Methodology

This document details the feature extraction, normalization, classification, and calibration pipeline of the Essay Lens AI writing detector.

---

## 1. Feature Extraction

The detector extracts features across five independent linguistic categories rather than relying on a single classification score.

### A. Structural Features
- **Sentence Length Variation**: Calculates mean, standard deviation, and coefficient of variation (CV = σ/μ) of sentence lengths. Machine-generated text tends to have lower variation.
- **Sentence rhythm regularity**: Calculated as `1 - CV`, capped at 1. Lower variance yields a higher rhythm regularity score.
- **Word/Char ratios**: Long word ratio (words > 6 characters) and short word ratio (words <= 3 characters) are measured per sentence.

### B. Lexical Features
- **Vocabulary Diversity**: Moving-Average Type-Token Ratio (MATTR) calculated over sliding 50-word windows. 
- **Unique Word/Bigram/Trigram Ratios**: Measures phrase-level variety. Machine-generated text tends to exhibit repetitive phrase constructions.
- **Word Class Density**: Counts of function words, conjunctions, and adjectives/adverbs per 100 words.

### C. Repetition Features
- **Sentence opening repetition**: Counts of sentences sharing the same 2-word opening sequence.
- **Phrase repetitions**: Identifies identical bigrams, trigrams, and 4-grams repeating across a passage.
- **Transition repetition**: Counts of transition phrases reused multiple times.

### D. Punctuation Features
- **Punctuation Entropy**: Shannon entropy over the frequencies of periods, commas, colons, semicolons, dashes, question marks, and parentheses.
- **Clause Density**: Approximated using the frequency of commas, colons, and semicolons per sentence.

### E. Formulaic Language Features
- ** Lexicon Match Density**: Density of phrases matched from a transparent lexicon of ~60 common transitions (e.g. *furthermore*, *moreover*, *it is important to note*, *in today's world*).

---

## 2. Normalization

Since raw feature distributions vary widely in scale (e.g., transition density vs. MATTR), every feature value $x$ is normalized using training set statistics:

$$z = \frac{x - \mu}{\sigma}$$

Normalized values are capped at $\pm 3$ to prevent outliers from dominating the log-odds prediction.

---

## 3. Classification & Calibration

The normalized feature vector is passed to a logistic regression classifier:

$$\text{logit} = \beta_0 + \sum_{i=1}^d \beta_i z_i$$

The output probability is calibrated using the standard logistic sigmoid function:

$$p = \frac{1}{1 + e^{-\text{logit}}}$$

This score ($p \in [0,1]$) is mapped to one of four calibrated likelihood bands:
- **$p < 0.30$**: Low evidence of machine-generated style
- **$0.30 \le p < 0.50$**: Some machine-like signals detected
- **$0.50 \le p < 0.70$**: Elevated machine-like signals
- **$p \ge 0.70$**: Strong machine-like signals

---

## 4. Optional Language Model Signal

When an API key is present, token-level log-probabilities are fetched from `gpt-3.5-turbo-instruct` completions using `echo=true`.
The model is **never** prompted to classify the essay. The detector uses log-probabilities to compute perplexity:

$$\text{Perplexity} = e^{-\frac{1}{N}\sum_{i=1}^N \log P(t_i)}$$

This is used as an optional statistical feature; the final classification decision remains entirely inside our pipeline.
