/**
 * Punctuation Features
 *
 * Measures punctuation entropy, density, and sentence rhythm.
 * Machine-generated prose tends to have lower punctuation entropy
 * (more formulaic use of punctuation) and more consistent rhythm.
 *
 * These are signals, not proof.
 */

export interface PunctuationFeatures {
  // Entropy
  punctuationEntropy: number;       // Shannon entropy over punctuation types
  punctuationDiversity: number;     // unique punctuation types used

  // Frequency (per 100 words)
  periodsPer100Words: number;
  commasPer100Words: number;
  semicolonsPer100Words: number;
  colonsPer100Words: number;
  dashesEmDashesPer100Words: number;
  questionMarksPer100Words: number;
  exclamationsPer100Words: number;
  parenthesesPer100Words: number;
  ellipsesPer100Words: number;

  // Clause density approximation
  clauseDensity: number;            // (commas + semicolons + colons) / sentences
  avgClausesPerSentence: number;

  // Paragraph rhythm
  paragraphLengthVariance: number;  // variance in paragraph word counts
  sentenceLengthVariance: number;   // variance in sentence word counts
}

// Punctuation types to measure
const PUNCT_TYPES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'period', pattern: /\./g },
  { name: 'comma', pattern: /,/g },
  { name: 'semicolon', pattern: /;/g },
  { name: 'colon', pattern: /:/g },
  { name: 'question', pattern: /\?/g },
  { name: 'exclamation', pattern: /!/g },
  { name: 'dash', pattern: /[-–—]/g },
  { name: 'paren', pattern: /[()]/g },
  { name: 'quote', pattern: /["""'']/g },
  { name: 'ellipsis', pattern: /\.\.\./g },
];

/**
 * Computes Shannon entropy of a probability distribution.
 * H = -Σ p(x) * log2(p(x))
 */
export function shannonEntropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;

  return -counts
    .filter(c => c > 0)
    .map(c => {
      const p = c / total;
      return p * Math.log2(p);
    })
    .reduce((a, b) => a + b, 0);
}

/**
 * Counts punctuation occurrences of a type in text.
 */
function countPunctuation(text: string, pattern: RegExp): number {
  return (text.match(new RegExp(pattern.source, 'g')) ?? []).length;
}

/**
 * Extracts punctuation features from text.
 */
export function extractPunctuationFeatures(
  text: string,
  wordCount: number,
  sentenceCount: number,
  paragraphWordCounts: number[],
  sentenceWordCounts: number[]
): PunctuationFeatures {
  const per100 = wordCount > 0 ? 100 / wordCount : 0;

  // Count each punctuation type
  const counts = PUNCT_TYPES.map(({ pattern }) => countPunctuation(text, pattern));
  const nonZeroTypes = counts.filter(c => c > 0).length;

  const punctuationEntropy = shannonEntropy(counts);
  const punctuationDiversity = nonZeroTypes;

  // Per-100-word frequencies
  const [periodCount, commaCount, semicolonCount, colonCount,
         questionCount, exclamationCount, dashCount, parenCount,
         , ellipsisCount] = counts;

  // Clause density: commas + semicolons + colons as clause separators
  const clauseMarkers = commaCount + semicolonCount + colonCount;
  const clauseDensity = sentenceCount > 0 ? clauseMarkers / sentenceCount : 0;
  const avgClausesPerSentence = clauseDensity + 1; // +1 for the main clause

  // Variance in paragraph/sentence lengths
  function variance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  return {
    punctuationEntropy,
    punctuationDiversity,
    periodsPer100Words: periodCount * per100,
    commasPer100Words: commaCount * per100,
    semicolonsPer100Words: semicolonCount * per100,
    colonsPer100Words: colonCount * per100,
    dashesEmDashesPer100Words: dashCount * per100,
    questionMarksPer100Words: questionCount * per100,
    exclamationsPer100Words: exclamationCount * per100,
    parenthesesPer100Words: parenCount * per100,
    ellipsesPer100Words: ellipsisCount * per100,
    clauseDensity,
    avgClausesPerSentence,
    paragraphLengthVariance: variance(paragraphWordCounts),
    sentenceLengthVariance: variance(sentenceWordCounts),
  };
}
