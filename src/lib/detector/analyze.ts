/**
 * Main Analyzer
 *
 * Orchestrates the full detection pipeline:
 *   text → preprocessing → segmentation → feature extraction
 *   → normalization → scoring → evidence generation → response
 *
 * This is the single entry point for the detector.
 */

import { segmentText } from './segmentation';
import { extractAllFeatures } from './features/index';
import { scoreDocument } from './scoring/score';
import { generateSentenceEvidence } from './evidence/generate';
import { getLMSignal, type LMSignal } from './model/openai-logprobs';
import type { DocumentFeatures } from './features/index';
import type { DocumentScore } from './scoring/score';
import type { SentenceEvidence } from './evidence/generate';

export interface AnalysisOptions {
  includeLMSignal?: boolean;  // Whether to call OpenAI logprobs (optional)
}

export interface AnalyzedSentence {
  id: number;
  text: string;
  startChar: number;
  endChar: number;
  paragraphIndex: number;
  score: number;           // [0,1] calibrated AI likelihood
  band: 'low' | 'some' | 'elevated' | 'strong';
  evidence: SentenceEvidence;
  wordCount: number;
}

export interface AnalysisResult {
  // Document statistics
  document: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    avgWordsPerSentence: number;
    text: string;
  };

  // Overall assessment
  overall: {
    score: number;         // [0,1]
    confidence: number;    // [0,1]
    band: 'low' | 'some' | 'elevated' | 'strong';
    bandLabel: string;
  };

  // Per-sentence analysis
  sentences: AnalyzedSentence[];

  // Signal breakdown by category
  categoryScores: {
    structural: number;
    lexical: number;
    repetition: number;
    punctuation: number;
    formulaic: number;
  };

  // Optional language model signal
  lmSignal: LMSignal;

  // Metadata
  detectorVersion: string;
  datasetVersion: string;
  modelVersion: string;
  limitations: string[];

  // Raw feature data (for technical mode)
  features: {
    crossSentence: DocumentFeatures['crossSentence'];
    documentLexical: DocumentFeatures['documentLexical'];
    documentRepetition: DocumentFeatures['documentRepetition'];
    documentPunctuation: DocumentFeatures['documentPunctuation'];
    documentFormulaic: DocumentFeatures['documentFormulaic'];
  };
}

const DETECTOR_VERSION = '1.0.0';
const DATASET_VERSION = '1.0.0';
const MODEL_VERSION = '1.0.0';

const LIMITATIONS = [
  'This detector is optimized for English-language admissions essays.',
  'Short essays (fewer than 50 words) produce unreliable scores.',
  'The detector cannot distinguish between AI-written and human-written text with certainty.',
  'Heavy editing or paraphrasing may change detection results.',
  'Writers whose first language is not English may be disproportionately affected.',
  'The detector is trained on a small synthetic dataset and may not generalize to all writing styles.',
  'A high score does not prove AI authorship. A low score does not prove human authorship.',
];

/**
 * Analyzes an essay for statistical signals associated with machine-generated writing.
 *
 * @param text - The essay text to analyze
 * @param options - Optional configuration
 * @returns Structured analysis result with per-sentence scores and evidence
 */
export async function analyzeEssay(
  text: string,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  // Extract all linguistic features
  const features = extractAllFeatures(text);

  // Score the document using our logistic regression classifier
  const score: DocumentScore = scoreDocument(features);

  // Get segmentation for char positions
  const { sentences: segSentences } = segmentText(text);

  // Generate per-sentence evidence
  const docStats = {
    meanLength: features.crossSentence.meanLength,
    coefficientOfVariation: features.crossSentence.coefficientOfVariation,
    avgTTR: features.documentLexical.movingAvgTTR,
    avgRepetitionRate: features.documentRepetition.bigramRepetitionRate,
    wordCount: features.wordCount,
  };

  const analyzedSentences: AnalyzedSentence[] = score.sentences.map((ss, i) => {
    const segSentence = segSentences[i];
    const sfEvidence = generateSentenceEvidence(ss, docStats);
    const band =
      ss.score < 0.30 ? 'low'
      : ss.score < 0.50 ? 'some'
      : ss.score < 0.70 ? 'elevated'
      : 'strong';

    return {
      id: ss.sentenceId,
      text: ss.text,
      startChar: segSentence?.startChar ?? 0,
      endChar: segSentence?.endChar ?? 0,
      paragraphIndex: segSentence?.paragraphIndex ?? 0,
      score: ss.score,
      band,
      evidence: sfEvidence,
      wordCount: features.sentences[i]?.structural.wordCount ?? 0,
    };
  });

  // Optionally fetch language model signal
  let lmSignal: LMSignal;
  if (options.includeLMSignal !== false) {
    lmSignal = await getLMSignal(text);
  } else {
    lmSignal = {
      available: false,
      perplexity: null,
      meanLogProb: null,
      logProbVariance: null,
      minLogProb: null,
      maxLogProb: null,
      tokenCount: null,
      modelName: null,
      note: 'Language-model probability signal not requested.',
    };
  }

  return {
    document: {
      wordCount: features.wordCount,
      sentenceCount: features.sentenceCount,
      paragraphCount: features.paragraphCount,
      avgWordsPerSentence: features.avgWordsPerSentence,
      text,
    },
    overall: {
      score: score.overall,
      confidence: score.confidence,
      band: score.band,
      bandLabel: score.bandLabel,
    },
    sentences: analyzedSentences,
    categoryScores: score.categoryScores,
    lmSignal,
    detectorVersion: DETECTOR_VERSION,
    datasetVersion: DATASET_VERSION,
    modelVersion: MODEL_VERSION,
    limitations: LIMITATIONS,
    features: {
      crossSentence: features.crossSentence,
      documentLexical: features.documentLexical,
      documentRepetition: features.documentRepetition,
      documentPunctuation: features.documentPunctuation,
      documentFormulaic: features.documentFormulaic,
    },
  };
}
