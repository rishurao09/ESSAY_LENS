/**
 * Lexical Features
 *
 * Measures vocabulary richness, diversity, and distribution.
 * These are signals of writing style, not proof of authorship.
 *
 * Key measures:
 *   - Type-Token Ratio (TTR): unique words / total words
 *   - Moving-Average TTR (MATTR): TTR over sliding windows (more stable than raw TTR)
 *   - N-gram diversity
 *   - Function word, stopword, rare word distributions
 */

import { tokenizeWords } from './structural';

export interface LexicalFeatures {
  // Vocabulary richness
  typeTokenRatio: number;           // unique_words / total_words
  movingAvgTTR: number;             // MATTR over window of 50 words
  uniqueWordRatio: number;          // same as TTR but in [0,1]
  vocabularySize: number;           // count of unique word types

  // Repetition at word/phrase level
  repeatedWordRatio: number;        // words appearing > 2x / total unique words
  topWordFrequency: number;         // freq of most common content word

  // N-gram diversity
  bigramDiversityRatio: number;     // unique bigrams / total bigrams
  trigramDiversityRatio: number;    // unique trigrams / total trigrams

  // Word class distributions (heuristic-based)
  functionWordRatio: number;        // function words / total words
  contentWordRatio: number;         // content words / total words
  stopwordRatio: number;
  rareWordRatio: number;            // words not in common-word list
  commonWordRatio: number;

  // Density measures
  adjectiveAdverbDensity: number;   // estimated from word lists
  pronounDensity: number;
  conjunctionDensity: number;

  // Sentence-level averages (when called on window)
  avgWordsPerSentence: number;
}

// Common English function words
const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
  'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
  'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'shall', 'should', 'may', 'might', 'must', 'can', 'could', 'and', 'but',
  'or', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'not', 'only',
  'own', 'same', 'than', 'too', 'very', 'just', 'because', 'as', 'until',
  'while', 'although', 'though', 'however', 'therefore', 'thus', 'also',
  'no', 'if', 'when', 'where', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'any', 'here', 'there',
]);

// Common English personal pronouns
const PRONOUNS = new Set([
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  'who', 'whom', 'whose',
]);

// Common English conjunctions
const CONJUNCTIONS = new Set([
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
  'although', 'though', 'even', 'while', 'whereas',
  'because', 'since', 'unless', 'until', 'before', 'after',
  'if', 'whether', 'that', 'which', 'who', 'whom',
  'however', 'therefore', 'furthermore', 'moreover', 'nevertheless',
  'consequently', 'additionally', 'alternatively',
]);

// Adjective/adverb indicators (suffix-based heuristic)
function isLikelyAdjOrAdv(word: string): boolean {
  const w = word.toLowerCase();
  return (
    w.endsWith('ly') ||
    w.endsWith('ful') ||
    w.endsWith('less') ||
    w.endsWith('ous') ||
    w.endsWith('ive') ||
    w.endsWith('able') ||
    w.endsWith('ible') ||
    w.endsWith('al') ||
    w.endsWith('ary') ||
    w.endsWith('ory')
  );
}

// Top ~3000 common English words (abbreviated — we use a heuristic)
// In production, load from a file; here we use length + frequency proxy
function isRareWord(word: string): boolean {
  const w = word.toLowerCase();
  // Heuristic: words > 8 chars not in function words tend to be rarer
  // This is an approximation; real implementation would use a word frequency list
  return w.length > 8 && !FUNCTION_WORDS.has(w);
}

/**
 * Creates bigrams from an array of tokens.
 */
export function createBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i].toLowerCase()}_${tokens[i + 1].toLowerCase()}`);
  }
  return bigrams;
}

/**
 * Creates trigrams from an array of tokens.
 */
export function createTrigrams(tokens: string[]): string[] {
  const trigrams: string[] = [];
  for (let i = 0; i < tokens.length - 2; i++) {
    trigrams.push(
      `${tokens[i].toLowerCase()}_${tokens[i + 1].toLowerCase()}_${tokens[i + 2].toLowerCase()}`
    );
  }
  return trigrams;
}

/**
 * Computes Moving-Average Type-Token Ratio (MATTR).
 * More stable than raw TTR for texts of different lengths.
 */
export function computeMATTR(tokens: string[], windowSize = 50): number {
  if (tokens.length < windowSize) {
    // Fall back to raw TTR for short texts
    const unique = new Set(tokens.map(t => t.toLowerCase()));
    return tokens.length > 0 ? unique.size / tokens.length : 0;
  }

  let totalTTR = 0;
  let windows = 0;

  for (let i = 0; i <= tokens.length - windowSize; i++) {
    const window = tokens.slice(i, i + windowSize).map(t => t.toLowerCase());
    const unique = new Set(window);
    totalTTR += unique.size / windowSize;
    windows++;
  }

  return windows > 0 ? totalTTR / windows : 0;
}

/**
 * Extracts lexical features from a block of text.
 * Can be called on a full document, paragraph, or passage.
 */
export function extractLexicalFeatures(
  text: string,
  sentenceCount: number = 1
): LexicalFeatures {
  const words = tokenizeWords(text);
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      typeTokenRatio: 0,
      movingAvgTTR: 0,
      uniqueWordRatio: 0,
      vocabularySize: 0,
      repeatedWordRatio: 0,
      topWordFrequency: 0,
      bigramDiversityRatio: 0,
      trigramDiversityRatio: 0,
      functionWordRatio: 0,
      contentWordRatio: 0,
      stopwordRatio: 0,
      rareWordRatio: 0,
      commonWordRatio: 0,
      adjectiveAdverbDensity: 0,
      pronounDensity: 0,
      conjunctionDensity: 0,
      avgWordsPerSentence: 0,
    };
  }

  const lowercaseWords = words.map(w => w.toLowerCase());

  // Frequency map
  const freqMap = new Map<string, number>();
  for (const w of lowercaseWords) {
    freqMap.set(w, (freqMap.get(w) ?? 0) + 1);
  }

  const uniqueWords = new Set(lowercaseWords);
  const typeTokenRatio = uniqueWords.size / wordCount;
  const movingAvgTTR = computeMATTR(words);

  // Repeated words (appear > 2 times)
  const repeatedWords = [...freqMap.entries()].filter(([, count]) => count > 2);
  const repeatedWordRatio =
    uniqueWords.size > 0 ? repeatedWords.length / uniqueWords.size : 0;

  // Top content word frequency
  const contentFreqs = [...freqMap.entries()]
    .filter(([w]) => !FUNCTION_WORDS.has(w) && w.length > 2)
    .sort((a, b) => b[1] - a[1]);
  const topWordFrequency =
    contentFreqs.length > 0 ? contentFreqs[0][1] / wordCount : 0;

  // Bigram/trigram diversity
  const bigrams = createBigrams(words);
  const trigrams = createTrigrams(words);
  const uniqueBigrams = new Set(bigrams);
  const uniqueTrigrams = new Set(trigrams);
  const bigramDiversityRatio =
    bigrams.length > 0 ? uniqueBigrams.size / bigrams.length : 0;
  const trigramDiversityRatio =
    trigrams.length > 0 ? uniqueTrigrams.size / trigrams.length : 0;

  // Word class counts
  let functionWordCount = 0;
  let pronounCount = 0;
  let conjunctionCount = 0;
  let adjAdvCount = 0;
  let rareWordCount = 0;

  for (const w of lowercaseWords) {
    if (FUNCTION_WORDS.has(w)) functionWordCount++;
    if (PRONOUNS.has(w)) pronounCount++;
    if (CONJUNCTIONS.has(w)) conjunctionCount++;
    if (isLikelyAdjOrAdv(w)) adjAdvCount++;
    if (isRareWord(w)) rareWordCount++;
  }

  const functionWordRatio = functionWordCount / wordCount;
  const contentWordRatio = (wordCount - functionWordCount) / wordCount;
  const stopwordRatio = functionWordRatio; // approximation
  const rareWordRatio = rareWordCount / wordCount;
  const commonWordRatio = 1 - rareWordRatio;
  const adjectiveAdverbDensity = adjAdvCount / wordCount;
  const pronounDensity = pronounCount / wordCount;
  const conjunctionDensity = conjunctionCount / wordCount;

  return {
    typeTokenRatio,
    movingAvgTTR,
    uniqueWordRatio: typeTokenRatio,
    vocabularySize: uniqueWords.size,
    repeatedWordRatio,
    topWordFrequency,
    bigramDiversityRatio,
    trigramDiversityRatio,
    functionWordRatio,
    contentWordRatio,
    stopwordRatio,
    rareWordRatio,
    commonWordRatio,
    adjectiveAdverbDensity,
    pronounDensity,
    conjunctionDensity,
    avgWordsPerSentence: sentenceCount > 0 ? wordCount / sentenceCount : wordCount,
  };
}
