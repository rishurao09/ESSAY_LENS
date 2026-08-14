/**
 * Repetition Features
 *
 * Detects repeated constructions at sentence-opening, sentence-ending,
 * bigram/trigram, and transition-structure levels.
 *
 * High repetition is a signal (not proof) of machine-generated writing,
 * where LLMs tend to reuse structural patterns.
 */

import { tokenizeWords } from './structural';
import { createBigrams, createTrigrams } from './lexical';

export interface RepetitionFeatures {
  // N-gram repetition
  repeatedBigramCount: number;      // bigrams appearing > 1x in passage
  repeatedTrigramCount: number;     // trigrams appearing > 1x in passage
  repeatedFourgramCount: number;    // 4-grams appearing > 1x in passage
  bigramRepetitionRate: number;     // repeatedBigrams / totalBigrams
  trigramRepetitionRate: number;

  // Sentence-opening/ending patterns
  repeatedOpeningCount: number;     // sentences sharing same 2-word opening
  repeatedEndingCount: number;      // sentences sharing same 2-word ending
  openingRepetitionRate: number;

  // Transition repetition
  repeatedTransitionCount: number;  // same transition phrase used > 1x
  transitionVarietyScore: number;   // unique transitions / total transitions

  // Specific repeated phrases detected
  repeatedPhrases: Array<{
    phrase: string;
    count: number;
    type: 'bigram' | 'trigram' | 'fourgram' | 'opening' | 'ending';
  }>;
}

/**
 * Creates 4-grams from tokens.
 */
function createFourgrams(tokens: string[]): string[] {
  const fourgrams: string[] = [];
  for (let i = 0; i < tokens.length - 3; i++) {
    fourgrams.push(
      [tokens[i], tokens[i+1], tokens[i+2], tokens[i+3]]
        .map(t => t.toLowerCase())
        .join('_')
    );
  }
  return fourgrams;
}

/**
 * Gets the first N words of a sentence (lowercased).
 */
function sentenceOpening(text: string, n = 2): string {
  const words = tokenizeWords(text).slice(0, n);
  return words.map(w => w.toLowerCase()).join(' ');
}

/**
 * Gets the last N words of a sentence (lowercased).
 */
function sentenceEnding(text: string, n = 2): string {
  const words = tokenizeWords(text);
  return words.slice(-n).map(w => w.toLowerCase()).join(' ');
}

/**
 * Counts items in an array that appear more than once.
 */
function countRepetitions(items: string[]): {
  repeatedCount: number;
  repetitionRate: number;
  repeated: Array<{ phrase: string; count: number }>;
} {
  const freq = new Map<string, number>();
  for (const item of items) {
    freq.set(item, (freq.get(item) ?? 0) + 1);
  }

  const repeated = [...freq.entries()]
    .filter(([, count]) => count > 1)
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count);

  return {
    repeatedCount: repeated.length,
    repetitionRate: items.length > 0 ? repeated.reduce((s, r) => s + r.count, 0) / items.length : 0,
    repeated,
  };
}

// Common transition phrases (our transparent lexicon)
const TRANSITION_PHRASES = [
  'furthermore', 'moreover', 'additionally', 'in addition',
  'in conclusion', 'to conclude', 'in summary', 'to summarize',
  'ultimately', 'finally', 'lastly', 'firstly', 'secondly', 'thirdly',
  'however', 'nevertheless', 'on the other hand', 'in contrast',
  'as a result', 'therefore', 'consequently', 'thus', 'hence',
  'this highlights', 'this demonstrates', 'this shows', 'this illustrates',
  'it is important to note', 'it is worth noting', 'it should be noted',
  'in today\'s world', 'in the modern world', 'in today\'s society',
  'throughout my life', 'throughout my journey', 'throughout this experience',
  'looking back', 'reflecting on', 'upon reflection',
  'not only', 'not only that', 'in fact', 'indeed',
  'by doing so', 'in doing so', 'through this experience',
  'as previously mentioned', 'as mentioned above', 'as stated',
  'on one hand', 'in other words', 'for example', 'for instance',
  'in particular', 'specifically', 'notably',
  'building on', 'drawing on', 'given this',
];

/**
 * Finds which transition phrases appear in a text and how often.
 */
export function findTransitions(text: string): Array<{ phrase: string; count: number }> {
  const lower = text.toLowerCase();
  const found: Array<{ phrase: string; count: number }> = [];

  for (const phrase of TRANSITION_PHRASES) {
    const regex = new RegExp(`\\b${phrase.replace(/'/g, "'")}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      found.push({ phrase, count: matches.length });
    }
  }

  return found.sort((a, b) => b.count - a.count);
}

/**
 * Extracts repetition features from a collection of sentence texts.
 */
export function extractRepetitionFeatures(
  sentences: string[],
  fullText: string
): RepetitionFeatures {
  // Tokenize full text for n-gram analysis
  const allWords = tokenizeWords(fullText);

  const bigrams = createBigrams(allWords);
  const trigrams = createTrigrams(allWords);
  const fourgrams = createFourgrams(allWords);

  const bigramRep = countRepetitions(bigrams);
  const trigramRep = countRepetitions(trigrams);
  const fourgramRep = countRepetitions(fourgrams);

  // Sentence opening/ending repetition
  const openings = sentences.map(s => sentenceOpening(s, 2)).filter(o => o.length > 0);
  const endings = sentences.map(s => sentenceEnding(s, 2)).filter(e => e.length > 0);

  const openingRep = countRepetitions(openings);
  const endingRep = countRepetitions(endings);

  // Transition phrase analysis
  const transitions = findTransitions(fullText);
  const totalTransitions = transitions.reduce((s, t) => s + t.count, 0);
  const repeatedTransitions = transitions.filter(t => t.count > 1);
  const transitionVarietyScore =
    totalTransitions > 0 ? transitions.length / totalTransitions : 1;

  // Build repeated phrases summary
  const repeatedPhrases: RepetitionFeatures['repeatedPhrases'] = [
    ...bigramRep.repeated.slice(0, 3).map(r => ({
      ...r,
      type: 'bigram' as const,
    })),
    ...trigramRep.repeated.slice(0, 3).map(r => ({
      ...r,
      type: 'trigram' as const,
    })),
    ...fourgramRep.repeated.slice(0, 2).map(r => ({
      ...r,
      type: 'fourgram' as const,
    })),
    ...openingRep.repeated.slice(0, 2).map(r => ({
      ...r,
      type: 'opening' as const,
    })),
    ...endingRep.repeated.slice(0, 2).map(r => ({
      ...r,
      type: 'ending' as const,
    })),
  ];

  return {
    repeatedBigramCount: bigramRep.repeatedCount,
    repeatedTrigramCount: trigramRep.repeatedCount,
    repeatedFourgramCount: fourgramRep.repeatedCount,
    bigramRepetitionRate: bigramRep.repetitionRate,
    trigramRepetitionRate: trigramRep.repetitionRate,
    repeatedOpeningCount: openingRep.repeatedCount,
    repeatedEndingCount: endingRep.repeatedCount,
    openingRepetitionRate: openingRep.repetitionRate,
    repeatedTransitionCount: repeatedTransitions.reduce((s, t) => s + t.count, 0),
    transitionVarietyScore,
    repeatedPhrases,
  };
}
