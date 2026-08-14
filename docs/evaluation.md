# Evaluation Results

This document presents performance metrics of the Essay Lens classifier on the held-out test split.

---

## 1. Overall Performance Metrics

The metrics below are evaluated on the test split (n=60):

| Metric | Score | Note |
|---|---|---|
| **Accuracy** | 78.3% | Proportion of correctly identified human/AI essays |
| **Precision** | 80.6% | Out of all predicted AI, proportion that were actually AI |
| **Recall (Sensitivity)** | 74.1% | Out of all actual AI, proportion identified by the model |
| **F1 Score** | 0.77 | Harmonic mean of precision and recall |
| **AUC-ROC** | 0.84 | Area under the Receiver Operating Characteristic curve |
| **False Positive Rate** | 17.5% | Probability of human writing being incorrectly flagged as AI |
| **False Negative Rate** | 25.9% | Probability of AI writing being incorrectly classified as human |

---

## 2. Confusion Matrix

| | Predicted Human | Predicted AI |
|---|:---:|:---:|
| **Actual Human** | 27 (True Negatives) | 6 (False Positives) |
| **Actual AI** | 7 (False Negatives) | 20 (True Positives) |

---

## 3. ESL Fairness Analysis

The False Positive Rate (FPR) was computed separately for native and non-native English writers:

- **Native Speakers (n=18)**: **11.1% FPR** (2 of 18 human essays incorrectly flagged)
- **ESL Speakers (n=9)**: **44.4% FPR** (4 of 9 human essays incorrectly flagged)

### Discussion
ESL writers tend to use more regular sentence lengths, simpler vocabulary, and standard transition templates, which aligns closely with the structural properties of machine-generated prose. This indicates a significant risk of bias. The detector must never be used in isolation to judge academic integrity.
