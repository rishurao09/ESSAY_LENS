/**
 * Score Module
 *
 * Applies the logistic regression classifier to normalized feature vectors.
 * The final score comes from OUR pipeline, not from any language model.
 *
 * Score pipeline:
 *   1. Extract features (see features/)
 *   2. Normalize (see normalize.ts)
 *   3. Apply logistic regression (coefficients from model-artifact.json)
 *   4. Apply sigmoid calibration
 *   5. Return calibrated [0,1] probability score
 *
 * Weighting methodology:
 *   - Formulaic language: 0.20 (strong indicator)
 *   - Structural regularity: 0.25 (rhythmic patterns)
 *   - Lexical repetition: 0.25 (reduced diversity)
 *   - Repetition patterns: 0.20
 *   - Punctuation entropy: 0.10 (weaker signal)
 */

import modelArtifact from '../model-artifact.json';
import { buildNormalizedVector, type NormalizedFeatureVector } from './normalize';
import type { DocumentFeatures } from '../features/index';

export interface SignalContribution {
  name: string;
  displayName: string;
  category: 'structural' | 'lexical' | 'repetition' | 'punctuation' | 'formulaic';
  rawValue: number;
  normalizedValue: number;
  contribution: number;   // signed contribution to log-odds
  direction: 'higher' | 'lower' | 'neutral';
}

export interface SentenceScore {
  sentenceId: number;
  text: string;
  score: number;          // calibrated [0,1]
  rawLogit: number;
  signals: SignalContribution[];
  topSignals: SignalContribution[];
}

export interface DocumentScore {
  overall: number;        // calibrated [0,1] document-level score
  confidence: number;     // how far from 0.5 the score is [0,1]
  band: 'low' | 'some' | 'elevated' | 'strong';
  bandLabel: string;
  sentences: SentenceScore[];
  categoryScores: {
    structural: number;
    lexical: number;
    repetition: number;
    punctuation: number;
    formulaic: number;
  };
  featureVector: NormalizedFeatureVector;
}

/**
 * Sigmoid function: maps logit to [0,1] probability.
 */
function sigmoid(logit: number): number {
  return 1 / (1 + Math.exp(-logit));
}

/**
 * Computes the logit (log-odds) from a normalized feature vector
 * using the stored logistic regression coefficients.
 */
function computeLogit(vec: NormalizedFeatureVector): number {
  const c = modelArtifact.coefficients;

  return (
    c.intercept +
    c.rhythmScore * vec.rhythmScore +
    c.coefficientOfVariation_neg * vec.coefficientOfVariation_neg +
    c.movingAvgTTR_neg * vec.movingAvgTTR_neg +
    c.bigramDiversityRatio_neg * vec.bigramDiversityRatio_neg +
    c.repeatedWordRatio * vec.repeatedWordRatio +
    c.bigramRepetitionRate * vec.bigramRepetitionRate +
    c.trigramRepetitionRate * vec.trigramRepetitionRate +
    c.openingRepetitionRate * vec.openingRepetitionRate +
    c.punctuationEntropy_neg * vec.punctuationEntropy_neg +
    c.formulaicScore * vec.formulaicScore +
    c.transitionDensity * vec.transitionDensity +
    c.adjectiveAdverbDensity * vec.adjectiveAdverbDensity +
    c.burstiness_neg * vec.burstiness_neg
  );
}

/**
 * Assigns a band based on score.
 */
function assignBand(score: number): { band: DocumentScore['band']; label: string } {
  const bands = modelArtifact.bands;
  if (score < bands.low.max) return { band: 'low', label: bands.low.label };
  if (score < bands.some.max) return { band: 'some', label: bands.some.label };
  if (score < bands.elevated.max) return { band: 'elevated', label: bands.elevated.label };
  return { band: 'strong', label: bands.strong.label };
}

/**
 * Computes signal contributions for a given feature vector.
 */
function computeSignals(
  vec: NormalizedFeatureVector,
  rawFeatures: {
    rhythmScore: number;
    coefficientOfVariation: number;
    movingAvgTTR: number;
    bigramDiversityRatio: number;
    repeatedWordRatio: number;
    bigramRepetitionRate: number;
    trigramRepetitionRate: number;
    openingRepetitionRate: number;
    punctuationEntropy: number;
    formulaicScore: number;
    transitionDensity: number;
  }
): SignalContribution[] {
  const c = modelArtifact.coefficients;

  const signals: SignalContribution[] = [
    {
      name: 'rhythmScore',
      displayName: 'Sentence rhythm regularity',
      category: 'structural',
      rawValue: rawFeatures.rhythmScore,
      normalizedValue: vec.rhythmScore,
      contribution: c.rhythmScore * vec.rhythmScore,
      direction: vec.rhythmScore > 0.3 ? 'higher' : vec.rhythmScore < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'sentenceLengthVariation',
      displayName: 'Sentence length variation',
      category: 'structural',
      rawValue: rawFeatures.coefficientOfVariation,
      normalizedValue: vec.coefficientOfVariation_neg,
      contribution: c.coefficientOfVariation_neg * vec.coefficientOfVariation_neg,
      direction: vec.coefficientOfVariation_neg > 0.3 ? 'higher' : vec.coefficientOfVariation_neg < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'movingAvgTTR',
      displayName: 'Vocabulary diversity (MATTR)',
      category: 'lexical',
      rawValue: rawFeatures.movingAvgTTR,
      normalizedValue: vec.movingAvgTTR_neg,
      contribution: c.movingAvgTTR_neg * vec.movingAvgTTR_neg,
      direction: vec.movingAvgTTR_neg > 0.3 ? 'higher' : vec.movingAvgTTR_neg < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'bigramDiversity',
      displayName: 'Phrase-level diversity',
      category: 'lexical',
      rawValue: rawFeatures.bigramDiversityRatio,
      normalizedValue: vec.bigramDiversityRatio_neg,
      contribution: c.bigramDiversityRatio_neg * vec.bigramDiversityRatio_neg,
      direction: vec.bigramDiversityRatio_neg > 0.3 ? 'higher' : vec.bigramDiversityRatio_neg < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'repeatedWordRatio',
      displayName: 'Word repetition rate',
      category: 'repetition',
      rawValue: rawFeatures.repeatedWordRatio,
      normalizedValue: vec.repeatedWordRatio,
      contribution: c.repeatedWordRatio * vec.repeatedWordRatio,
      direction: vec.repeatedWordRatio > 0.3 ? 'higher' : vec.repeatedWordRatio < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'bigramRepetition',
      displayName: 'Two-word phrase repetition',
      category: 'repetition',
      rawValue: rawFeatures.bigramRepetitionRate,
      normalizedValue: vec.bigramRepetitionRate,
      contribution: c.bigramRepetitionRate * vec.bigramRepetitionRate,
      direction: vec.bigramRepetitionRate > 0.3 ? 'higher' : vec.bigramRepetitionRate < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'trigramRepetition',
      displayName: 'Three-word phrase repetition',
      category: 'repetition',
      rawValue: rawFeatures.trigramRepetitionRate,
      normalizedValue: vec.trigramRepetitionRate,
      contribution: c.trigramRepetitionRate * vec.trigramRepetitionRate,
      direction: vec.trigramRepetitionRate > 0.3 ? 'higher' : vec.trigramRepetitionRate < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'openingRepetition',
      displayName: 'Repeated sentence openings',
      category: 'repetition',
      rawValue: rawFeatures.openingRepetitionRate,
      normalizedValue: vec.openingRepetitionRate,
      contribution: c.openingRepetitionRate * vec.openingRepetitionRate,
      direction: vec.openingRepetitionRate > 0.3 ? 'higher' : vec.openingRepetitionRate < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'punctuationEntropy',
      displayName: 'Punctuation variety',
      category: 'punctuation',
      rawValue: rawFeatures.punctuationEntropy,
      normalizedValue: vec.punctuationEntropy_neg,
      contribution: c.punctuationEntropy_neg * vec.punctuationEntropy_neg,
      direction: vec.punctuationEntropy_neg > 0.3 ? 'higher' : vec.punctuationEntropy_neg < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'formulaicScore',
      displayName: 'Formulaic language density',
      category: 'formulaic',
      rawValue: rawFeatures.formulaicScore,
      normalizedValue: vec.formulaicScore,
      contribution: c.formulaicScore * vec.formulaicScore,
      direction: vec.formulaicScore > 0.3 ? 'higher' : vec.formulaicScore < -0.3 ? 'lower' : 'neutral',
    },
    {
      name: 'transitionDensity',
      displayName: 'Transition phrase density',
      category: 'formulaic',
      rawValue: rawFeatures.transitionDensity,
      normalizedValue: vec.transitionDensity,
      contribution: c.transitionDensity * vec.transitionDensity,
      direction: vec.transitionDensity > 0.3 ? 'higher' : vec.transitionDensity < -0.3 ? 'lower' : 'neutral',
    },
  ];

  return signals.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

/**
 * Scores a single sentence within document context.
 */
function scoreSentence(
  sentenceFeature: DocumentFeatures['sentences'][0],
  docFeatures: DocumentFeatures
): SentenceScore {
  const sf = sentenceFeature.structural;
  const lf = sentenceFeature.windowLexical;
  const rf = sentenceFeature.windowRepetition;
  const ff = sentenceFeature.formulaic;
  const cs = docFeatures.crossSentence;
  const pf = docFeatures.documentPunctuation;

  // For sentence-level scoring, blend sentence-specific and window-level features
  const localLengthDeviation =
    cs.meanLength > 0
      ? Math.abs(sf.wordCount - cs.meanLength) / cs.meanLength
      : 0;

  // Sentence-level regularity: closer to mean → higher signal
  const sentenceRhythmScore = Math.max(0, 1 - localLengthDeviation);

  const vec = buildNormalizedVector(
    sentenceRhythmScore,
    cs.coefficientOfVariation,
    cs.burstiness,
    cs.adjacentVariationMean,
    lf.movingAvgTTR,
    lf.bigramDiversityRatio,
    lf.repeatedWordRatio,
    rf.bigramRepetitionRate,
    rf.trigramRepetitionRate,
    rf.openingRepetitionRate,
    pf.punctuationEntropy,
    pf.clauseDensity,
    ff.formulaicScore,
    ff.transitionDensity,
    lf.adjectiveAdverbDensity,
    lf.conjunctionDensity,
    lf.functionWordRatio
  );

  const rawLogit = computeLogit(vec);
  const score = sigmoid(rawLogit);

  const signals = computeSignals(vec, {
    rhythmScore: sentenceRhythmScore,
    coefficientOfVariation: cs.coefficientOfVariation,
    movingAvgTTR: lf.movingAvgTTR,
    bigramDiversityRatio: lf.bigramDiversityRatio,
    repeatedWordRatio: lf.repeatedWordRatio,
    bigramRepetitionRate: rf.bigramRepetitionRate,
    trigramRepetitionRate: rf.trigramRepetitionRate,
    openingRepetitionRate: rf.openingRepetitionRate,
    punctuationEntropy: pf.punctuationEntropy,
    formulaicScore: ff.formulaicScore,
    transitionDensity: ff.transitionDensity,
  });

  return {
    sentenceId: sentenceFeature.sentenceId,
    text: sentenceFeature.text,
    score,
    rawLogit,
    signals,
    topSignals: signals.slice(0, 4),
  };
}

/**
 * Main scoring function. Takes extracted document features
 * and returns a complete scored document.
 */
export function scoreDocument(features: DocumentFeatures): DocumentScore {
  // Score each sentence
  const sentenceScores = features.sentences.map(sf =>
    scoreSentence(sf, features)
  );

  // Document-level score: weighted average of sentence scores
  // (sentences that are longer get more weight)
  let weightedSum = 0;
  let totalWeight = 0;
  for (const ss of sentenceScores) {
    const weight = Math.max(features.sentences.find(s => s.sentenceId === ss.sentenceId)?.structural.wordCount ?? 1, 1);
    weightedSum += ss.score * weight;
    totalWeight += weight;
  }

  // Also score at document level using document-wide features
  const docVec = buildNormalizedVector(
    features.crossSentence.rhythmScore,
    features.crossSentence.coefficientOfVariation,
    features.crossSentence.burstiness,
    features.crossSentence.adjacentVariationMean,
    features.documentLexical.movingAvgTTR,
    features.documentLexical.bigramDiversityRatio,
    features.documentLexical.repeatedWordRatio,
    features.documentRepetition.bigramRepetitionRate,
    features.documentRepetition.trigramRepetitionRate,
    features.documentRepetition.openingRepetitionRate,
    features.documentPunctuation.punctuationEntropy,
    features.documentPunctuation.clauseDensity,
    features.documentFormulaic.formulaicScore,
    features.documentFormulaic.transitionDensity,
    features.documentLexical.adjectiveAdverbDensity,
    features.documentLexical.conjunctionDensity,
    features.documentLexical.functionWordRatio
  );

  const docLogit = computeLogit(docVec);
  const docScore = sigmoid(docLogit);

  // Blend sentence-level and document-level score
  const sentenceAvg = totalWeight > 0 ? weightedSum / totalWeight : docScore;
  const overall = 0.5 * docScore + 0.5 * sentenceAvg;

  const confidence = Math.abs(overall - 0.5) * 2;
  const { band, label: bandLabel } = assignBand(overall);

  // Category scores (average signal in each category)
  const catScores = {
    structural: 0,
    lexical: 0,
    repetition: 0,
    punctuation: 0,
    formulaic: 0,
  };

  const docSignals = computeSignals(docVec, {
    rhythmScore: features.crossSentence.rhythmScore,
    coefficientOfVariation: features.crossSentence.coefficientOfVariation,
    movingAvgTTR: features.documentLexical.movingAvgTTR,
    bigramDiversityRatio: features.documentLexical.bigramDiversityRatio,
    repeatedWordRatio: features.documentLexical.repeatedWordRatio,
    bigramRepetitionRate: features.documentRepetition.bigramRepetitionRate,
    trigramRepetitionRate: features.documentRepetition.trigramRepetitionRate,
    openingRepetitionRate: features.documentRepetition.openingRepetitionRate,
    punctuationEntropy: features.documentPunctuation.punctuationEntropy,
    formulaicScore: features.documentFormulaic.formulaicScore,
    transitionDensity: features.documentFormulaic.transitionDensity,
  });

  for (const signal of docSignals) {
    catScores[signal.category] += signal.contribution;
  }

  // Normalize category scores to [0,1]
  const maxCat = Math.max(...Object.values(catScores), 0.01);
  for (const key of Object.keys(catScores) as Array<keyof typeof catScores>) {
    catScores[key] = Math.max(0, Math.min(1, catScores[key] / maxCat));
  }

  return {
    overall,
    confidence,
    band,
    bandLabel,
    sentences: sentenceScores,
    categoryScores: catScores,
    featureVector: docVec,
  };
}
