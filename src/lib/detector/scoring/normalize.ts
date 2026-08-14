/**
 * Score Normalization
 *
 * Applies z-score normalization to raw feature values using
 * corpus statistics stored in the model artifact.
 *
 * Normalization is critical for the logistic regression classifier
 * to work correctly across different text lengths and styles.
 */

import modelArtifact from '../model-artifact.json';

type NormalizationStats = {
  mean: number;
  std: number;
};

type FeatureName = keyof typeof modelArtifact.normalization.features;

/**
 * Z-score normalizes a single value given mean and std.
 * Clips at ±3 standard deviations to handle outliers.
 */
export function zScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0;
  const z = (value - mean) / std;
  // Clip to [-3, 3] range
  return Math.max(-3, Math.min(3, z));
}

/**
 * Normalizes a named feature using corpus statistics.
 */
export function normalizeFeature(name: FeatureName, value: number): number {
  const stats = modelArtifact.normalization.features[name] as NormalizationStats;
  if (!stats) return 0;
  return zScore(value, stats.mean, stats.std);
}

export interface NormalizedFeatureVector {
  // Structural
  rhythmScore: number;
  coefficientOfVariation_neg: number;  // inverted: lower CV → higher AI signal
  burstiness_neg: number;              // inverted: more regular → higher signal
  adjacentVariationMean: number;

  // Lexical
  movingAvgTTR_neg: number;            // inverted: lower TTR → higher AI signal
  bigramDiversityRatio_neg: number;
  repeatedWordRatio: number;

  // Repetition
  bigramRepetitionRate: number;
  trigramRepetitionRate: number;
  openingRepetitionRate: number;

  // Punctuation
  punctuationEntropy_neg: number;      // inverted: lower entropy → higher AI signal
  clauseDensity: number;

  // Formulaic
  formulaicScore: number;
  transitionDensity: number;
  adjectiveAdverbDensity: number;
  conjunctionDensity: number;

  // Function words
  functionWordRatio: number;
}

/**
 * Builds a normalized feature vector from document features.
 * Features marked _neg are inverted (lower raw value = higher AI signal).
 */
export function buildNormalizedVector(
  rhythmScore: number,
  coefficientOfVariation: number,
  burstiness: number,
  adjacentVariationMean: number,
  movingAvgTTR: number,
  bigramDiversityRatio: number,
  repeatedWordRatio: number,
  bigramRepetitionRate: number,
  trigramRepetitionRate: number,
  openingRepetitionRate: number,
  punctuationEntropy: number,
  clauseDensity: number,
  formulaicScore: number,
  transitionDensity: number,
  adjectiveAdverbDensity: number,
  conjunctionDensity: number,
  functionWordRatio: number
): NormalizedFeatureVector {
  const norm = modelArtifact.normalization.features;

  return {
    rhythmScore: zScore(rhythmScore, norm.rhythmScore.mean, norm.rhythmScore.std),
    // Inverted features: we negate because lower raw value → higher AI likelihood
    coefficientOfVariation_neg: -zScore(coefficientOfVariation, norm.coefficientOfVariation.mean, norm.coefficientOfVariation.std),
    burstiness_neg: -zScore(burstiness, norm.burstiness.mean, norm.burstiness.std),
    adjacentVariationMean: zScore(adjacentVariationMean, norm.adjacentVariationMean.mean, norm.adjacentVariationMean.std),
    movingAvgTTR_neg: -zScore(movingAvgTTR, norm.movingAvgTTR.mean, norm.movingAvgTTR.std),
    bigramDiversityRatio_neg: -zScore(bigramDiversityRatio, norm.bigramDiversityRatio.mean, norm.bigramDiversityRatio.std),
    repeatedWordRatio: zScore(repeatedWordRatio, norm.repeatedWordRatio.mean, norm.repeatedWordRatio.std),
    bigramRepetitionRate: zScore(bigramRepetitionRate, norm.bigramRepetitionRate.mean, norm.bigramRepetitionRate.std),
    trigramRepetitionRate: zScore(trigramRepetitionRate, norm.trigramRepetitionRate.mean, norm.trigramRepetitionRate.std),
    openingRepetitionRate: zScore(openingRepetitionRate, norm.openingRepetitionRate.mean, norm.openingRepetitionRate.std),
    punctuationEntropy_neg: -zScore(punctuationEntropy, norm.punctuationEntropy.mean, norm.punctuationEntropy.std),
    clauseDensity: zScore(clauseDensity, norm.clauseDensity.mean, norm.clauseDensity.std),
    formulaicScore: zScore(formulaicScore, norm.formulaicScore.mean, norm.formulaicScore.std),
    transitionDensity: zScore(transitionDensity, norm.transitionDensity.mean, norm.transitionDensity.std),
    adjectiveAdverbDensity: zScore(adjectiveAdverbDensity, norm.adjectiveAdverbDensity.mean, norm.adjectiveAdverbDensity.std),
    conjunctionDensity: zScore(conjunctionDensity, norm.conjunctionDensity.mean, norm.conjunctionDensity.std),
    functionWordRatio: zScore(functionWordRatio, norm.functionWordRatio.mean, norm.functionWordRatio.std),
  };
}
