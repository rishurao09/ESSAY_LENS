/**
 * Structural Features
 *
 * Extracts per-sentence structural features (length, rhythm, variation)
 * and cross-sentence statistics.
 *
 * These are signals, not proof. Low variation alone does not mean AI.
 */

export interface StructuralFeatures {
  // Per-sentence metrics
  wordCount: number;
  charCount: number;
  sentenceLength: number; // word count
  avgWordLength: number;
  longWordRatio: number;    // words > 6 chars / total words
  shortWordRatio: number;   // words <= 3 chars / total words

  // Punctuation
  commaDensity: number;     // commas per word
  semicolonDensity: number;
  colonDensity: number;
  questionMarkCount: number;
  exclamationCount: number;
  parenthesisCount: number;
  quotationCount: number;
  dashCount: number;
  totalPunctuation: number;

  // Capitalization
  allCapsWordCount: number;
  titleCaseWordCount: number;
  numericCount: number;

  // Position in document
  sentenceIndex: number;
  paragraphIndex: number;
}

export interface CrossSentenceStats {
  meanLength: number;
  stdDevLength: number;
  coefficientOfVariation: number;  // stdDev/mean — lower = more regular
  burstiness: number;              // (std - mean) / (std + mean)
  adjacentVariationMean: number;   // avg |len[i] - len[i-1]|
  rhythmScore: number;             // normalized regularity [0,1], higher = more regular
}

/**
 * Tokenizes a sentence into words.
 */
export function tokenizeWords(text: string): string[] {
  return text
    .replace(/["""'']/g, '')
    .split(/\s+/)
    .map(w => w.replace(/^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$/g, ''))
    .filter(w => w.length > 0);
}

/**
 * Extracts structural features from a single sentence.
 */
export function extractStructuralFeatures(
  text: string,
  sentenceIndex: number,
  paragraphIndex: number
): StructuralFeatures {
  const words = tokenizeWords(text);
  const wordCount = words.length;
  const charCount = text.length;

  const avgWordLength =
    wordCount > 0
      ? words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0) / wordCount
      : 0;

  const longWordRatio =
    wordCount > 0 ? words.filter(w => w.length > 6).length / wordCount : 0;
  const shortWordRatio =
    wordCount > 0 ? words.filter(w => w.length <= 3).length / wordCount : 0;

  const commaDensity = wordCount > 0 ? (text.match(/,/g)?.length ?? 0) / wordCount : 0;
  const semicolonDensity = wordCount > 0 ? (text.match(/;/g)?.length ?? 0) / wordCount : 0;
  const colonDensity = wordCount > 0 ? (text.match(/:/g)?.length ?? 0) / wordCount : 0;

  const questionMarkCount = (text.match(/\?/g)?.length ?? 0);
  const exclamationCount = (text.match(/!/g)?.length ?? 0);
  const parenthesisCount = (text.match(/[()]/g)?.length ?? 0);
  const quotationCount = (text.match(/["""'']/g)?.length ?? 0);
  const dashCount = (text.match(/[-–—]/g)?.length ?? 0);
  const totalPunctuation =
    (text.match(/[.,;:!?()"""''—–\-]/g)?.length ?? 0);

  const allCapsWordCount = words.filter(w => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w)).length;
  const titleCaseWordCount = words.filter(w => /^[A-Z][a-z]/.test(w) && w.length > 1).length;
  const numericCount = words.filter(w => /\d/.test(w)).length;

  return {
    wordCount,
    charCount,
    sentenceLength: wordCount,
    avgWordLength,
    longWordRatio,
    shortWordRatio,
    commaDensity,
    semicolonDensity,
    colonDensity,
    questionMarkCount,
    exclamationCount,
    parenthesisCount,
    quotationCount,
    dashCount,
    totalPunctuation,
    allCapsWordCount,
    titleCaseWordCount,
    numericCount,
    sentenceIndex,
    paragraphIndex,
  };
}

/**
 * Computes cross-sentence statistics from an array of structural features.
 * These measure the regularity / variation of the prose rhythm.
 */
export function computeCrossSentenceStats(
  features: StructuralFeatures[]
): CrossSentenceStats {
  if (features.length === 0) {
    return {
      meanLength: 0,
      stdDevLength: 0,
      coefficientOfVariation: 0,
      burstiness: 0,
      adjacentVariationMean: 0,
      rhythmScore: 0,
    };
  }

  const lengths = features.map(f => f.wordCount);

  const meanLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  const variance =
    lengths.reduce((sum, l) => sum + Math.pow(l - meanLength, 2), 0) / lengths.length;
  const stdDevLength = Math.sqrt(variance);

  const coefficientOfVariation = meanLength > 0 ? stdDevLength / meanLength : 0;

  // Burstiness: (σ - μ) / (σ + μ). Positive = bursty, negative = regular.
  const burstiness =
    stdDevLength + meanLength > 0
      ? (stdDevLength - meanLength) / (stdDevLength + meanLength)
      : 0;

  // Adjacent variation: average absolute difference between consecutive sentence lengths
  let adjacentSum = 0;
  for (let i = 1; i < lengths.length; i++) {
    adjacentSum += Math.abs(lengths[i] - lengths[i - 1]);
  }
  const adjacentVariationMean =
    lengths.length > 1 ? adjacentSum / (lengths.length - 1) : 0;

  // Rhythm score: higher = more regular
  // Low CoV → high rhythm score (more machine-like patterning)
  // We cap at 1 for clarity
  const rhythmScore = Math.min(1, Math.max(0, 1 - coefficientOfVariation));

  return {
    meanLength,
    stdDevLength,
    coefficientOfVariation,
    burstiness,
    adjacentVariationMean,
    rhythmScore,
  };
}
