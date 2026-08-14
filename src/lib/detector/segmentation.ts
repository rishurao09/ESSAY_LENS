/**
 * Segmentation Module
 *
 * Splits text into sentences, paragraphs, and sliding windows.
 * Uses heuristic rules to handle abbreviations, titles, and edge cases.
 */

export interface Sentence {
  id: number;
  text: string;
  startChar: number;
  endChar: number;
  paragraphIndex: number;
}

export interface Paragraph {
  id: number;
  text: string;
  sentences: Sentence[];
  startChar: number;
  endChar: number;
}

export interface Window {
  sentences: Sentence[];
  startSentenceId: number;
  endSentenceId: number;
}

// Common abbreviations that should NOT trigger sentence boundaries
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'rev', 'gen', 'sgt', 'cpl',
  'pvt', 'capt', 'lt', 'col', 'maj', 'brig', 'adm', 'est', 'dept', 'approx',
  'appt', 'apt', 'ave', 'blvd', 'bldg', 'cl', 'ct', 'ctr', 'dr', 'expy',
  'ext', 'ft', 'fwy', 'hwy', 'i', 'ii', 'iii', 'iv', 'vi', 'vii', 'viii',
  'ix', 'xi', 'xii', 'xiii', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul',
  'aug', 'sep', 'oct', 'nov', 'dec', 'vs', 'etc', 'eg', 'ie', 'cf',
  'ca', 'al', 'ltd', 'inc', 'corp', 'co', 'vol', 'no', 'pp', 'fig',
]);

/**
 * Splits text into paragraphs (double newline separated).
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Splits a paragraph into sentences using heuristic tokenization.
 * Handles common abbreviations, decimal numbers, and ellipses.
 */
export function splitSentences(text: string): string[] {
  // Protect known abbreviations
  let protected_text = text;

  // Replace decimal numbers (e.g., 3.14) to avoid false splits
  protected_text = protected_text.replace(/(\d+)\.(\d+)/g, '$1DECIMAL$2');

  // Replace known abbreviations + period
  protected_text = protected_text.replace(
    /\b([A-Za-z]{1,4})\.(\s)/g,
    (match, word, space) => {
      if (ABBREVIATIONS.has(word.toLowerCase())) {
        return `${word}ABBR${space}`;
      }
      return match;
    }
  );

  // Replace ellipses
  protected_text = protected_text.replace(/\.{3}/g, 'ELLIPSIS');

  // Split on sentence-ending punctuation followed by space + capital or end of string
  const raw = protected_text.split(/(?<=[.!?])\s+(?=[A-Z"']|$)/);

  // Restore protected patterns
  return raw
    .map(s =>
      s
        .replace(/DECIMAL/g, '.')
        .replace(/ABBR/g, '.')
        .replace(/ELLIPSIS/g, '...')
        .trim()
    )
    .filter(s => s.length > 0);
}

/**
 * Segments the full text into structured Sentence and Paragraph objects.
 */
export function segmentText(text: string): {
  sentences: Sentence[];
  paragraphs: Paragraph[];
} {
  const paragraphTexts = splitParagraphs(text);
  const sentences: Sentence[] = [];
  const paragraphs: Paragraph[] = [];

  let globalSentenceId = 0;
  let charOffset = 0;

  for (let pIdx = 0; pIdx < paragraphTexts.length; pIdx++) {
    const paraText = paragraphTexts[pIdx];
    const paraStart = text.indexOf(paraText, charOffset);
    const paraEnd = paraStart + paraText.length;

    const sentenceTexts = splitSentences(paraText);
    const paragraphSentences: Sentence[] = [];

    let sentenceCharOffset = paraStart;

    for (const sentText of sentenceTexts) {
      const sentStart = text.indexOf(sentText, sentenceCharOffset);
      const sentEnd = sentStart + sentText.length;

      const sentence: Sentence = {
        id: globalSentenceId++,
        text: sentText,
        startChar: sentStart,
        endChar: sentEnd,
        paragraphIndex: pIdx,
      };

      sentences.push(sentence);
      paragraphSentences.push(sentence);
      sentenceCharOffset = sentEnd;
    }

    paragraphs.push({
      id: pIdx,
      text: paraText,
      sentences: paragraphSentences,
      startChar: paraStart,
      endChar: paraEnd,
    });

    charOffset = paraEnd;
  }

  return { sentences, paragraphs };
}

/**
 * Creates overlapping sliding windows of sentences.
 * Used for passage-level analysis.
 */
export function createSlidingWindows(
  sentences: Sentence[],
  windowSize = 5,
  stepSize = 2
): Window[] {
  const windows: Window[] = [];

  for (let i = 0; i <= sentences.length - windowSize; i += stepSize) {
    windows.push({
      sentences: sentences.slice(i, i + windowSize),
      startSentenceId: sentences[i].id,
      endSentenceId: sentences[i + windowSize - 1].id,
    });
  }

  // Add final window if needed
  if (sentences.length > 0 && sentences.length < windowSize) {
    windows.push({
      sentences,
      startSentenceId: sentences[0].id,
      endSentenceId: sentences[sentences.length - 1].id,
    });
  }

  return windows;
}
