/**
 * Feature Index
 *
 * Composes all feature extractors into a unified DocumentFeatures type.
 * Call extractAllFeatures(text) to get the complete feature vector.
 */

import { segmentText } from '../segmentation';
import {
  extractStructuralFeatures,
  computeCrossSentenceStats,
  tokenizeWords,
  type StructuralFeatures,
  type CrossSentenceStats,
} from './structural';
import { extractLexicalFeatures, type LexicalFeatures } from './lexical';
import { extractRepetitionFeatures, type RepetitionFeatures } from './repetition';
import {
  extractPunctuationFeatures,
  type PunctuationFeatures,
} from './punctuation';
import {
  extractFormulaicFeatures,
  type FormulaicFeatures,
} from './formulaic';

export type { StructuralFeatures, CrossSentenceStats, LexicalFeatures, RepetitionFeatures, PunctuationFeatures, FormulaicFeatures };

export interface SentenceFeatures {
  sentenceId: number;
  text: string;
  structural: StructuralFeatures;
  // Window-level features (using surrounding context)
  windowLexical: LexicalFeatures;
  windowRepetition: RepetitionFeatures;
  formulaic: FormulaicFeatures;
}

export interface DocumentFeatures {
  // Document statistics
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgSentencesPerParagraph: number;

  // Feature sets
  crossSentence: CrossSentenceStats;
  documentLexical: LexicalFeatures;
  documentRepetition: RepetitionFeatures;
  documentPunctuation: PunctuationFeatures;
  documentFormulaic: FormulaicFeatures;

  // Per-sentence features
  sentences: SentenceFeatures[];
}

/**
 * Extracts all features from a text document.
 * This is the main entry point for feature extraction.
 */
export function extractAllFeatures(text: string): DocumentFeatures {
  const { sentences, paragraphs } = segmentText(text);

  const words = tokenizeWords(text);
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;

  // Per-sentence structural features
  const structuralFeatures = sentences.map((s, i) =>
    extractStructuralFeatures(s.text, i, s.paragraphIndex)
  );

  const crossSentence = computeCrossSentenceStats(structuralFeatures);

  // Document-level lexical features
  const documentLexical = extractLexicalFeatures(text, sentenceCount);

  // Document-level repetition
  const sentenceTexts = sentences.map(s => s.text);
  const documentRepetition = extractRepetitionFeatures(sentenceTexts, text);

  // Document-level punctuation
  const paragraphWordCounts = paragraphs.map(p =>
    tokenizeWords(p.text).length
  );
  const sentenceWordCounts = structuralFeatures.map(f => f.wordCount);

  const documentPunctuation = extractPunctuationFeatures(
    text,
    wordCount,
    sentenceCount,
    paragraphWordCounts,
    sentenceWordCounts
  );

  // Document-level formulaic
  const documentFormulaic = extractFormulaicFeatures(text, wordCount);

  // Per-sentence features with window context
  const windowSize = 5;
  const sentenceFeatures: SentenceFeatures[] = sentences.map((s, i) => {
    // Create a window of surrounding sentences for context
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(sentences.length, start + windowSize);
    const windowSentences = sentences.slice(start, end);
    const windowText = windowSentences.map(ws => ws.text).join(' ');
    const windowSentenceTexts = windowSentences.map(ws => ws.text);

    const windowLexical = extractLexicalFeatures(
      windowText,
      windowSentences.length
    );

    const windowRepetition = extractRepetitionFeatures(
      windowSentenceTexts,
      windowText
    );

    // Formulaic features for this sentence
    const sentenceFormulaic = extractFormulaicFeatures(
      s.text,
      structuralFeatures[i].wordCount
    );

    return {
      sentenceId: s.id,
      text: s.text,
      structural: structuralFeatures[i],
      windowLexical,
      windowRepetition,
      formulaic: sentenceFormulaic,
    };
  });

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence:
      sentenceCount > 0 ? wordCount / sentenceCount : 0,
    avgSentencesPerParagraph:
      paragraphCount > 0 ? sentenceCount / paragraphCount : 0,
    crossSentence,
    documentLexical,
    documentRepetition,
    documentPunctuation,
    documentFormulaic,
    sentences: sentenceFeatures,
  };
}
