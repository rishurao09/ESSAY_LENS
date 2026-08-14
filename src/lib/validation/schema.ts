/**
 * Request/Response Validation Schemas
 *
 * Using Zod for type-safe validation.
 * Rejects: empty text, too-short text, too-long text, malformed requests.
 */

import { z } from 'zod';

const MAX_WORDS = 5000;
const MIN_WORDS = 10;
const MAX_CHARS = 40000;

// ============================================================
// Request Schema
// ============================================================

export const AnalyzeRequestSchema = z.object({
  text: z
    .string({
      required_error: 'Essay text is required.',
      invalid_type_error: 'Essay text must be a string.',
    })
    .min(1, 'Essay text cannot be empty.')
    .max(MAX_CHARS, `Essay is too long. Maximum is ${MAX_CHARS} characters.`)
    .refine(
      (text) => {
        const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        return wordCount >= MIN_WORDS;
      },
      {
        message: `Essay is too short for reliable analysis. Please provide at least ${MIN_WORDS} words.`,
      }
    )
    .refine(
      (text) => {
        const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        return wordCount <= MAX_WORDS;
      },
      {
        message: `Essay is too long. Maximum is ${MAX_WORDS} words. Please trim or split your essay.`,
      }
    ),
  options: z
    .object({
      includeLMSignal: z.boolean().optional().default(true),
    })
    .optional()
    .default({}),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// ============================================================
// Response Schema (for documentation / type safety)
// ============================================================

export const SignalSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  category: z.enum(['structural', 'lexical', 'repetition', 'punctuation', 'formulaic']),
  rawValue: z.number(),
  normalizedValue: z.number(),
  contribution: z.number(),
  direction: z.enum(['toward_ai', 'toward_human', 'neutral']),
  strength: z.enum(['weak', 'moderate', 'strong']),
});

export const EvidenceItemSchema = z.object({
  signalName: z.string(),
  displayName: z.string(),
  category: z.string(),
  explanation: z.string(),
  detail: z.string(),
  rawMetrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })),
  direction: z.enum(['toward_ai', 'toward_human', 'neutral']),
  strength: z.enum(['weak', 'moderate', 'strong']),
});

export const BandSchema = z.enum(['low', 'some', 'elevated', 'strong']);

export const AnalyzedSentenceSchema = z.object({
  id: z.number(),
  text: z.string(),
  startChar: z.number(),
  endChar: z.number(),
  paragraphIndex: z.number(),
  score: z.number().min(0).max(1),
  band: BandSchema,
  evidence: z.object({
    sentenceText: z.string(),
    score: z.number(),
    band: BandSchema,
    evidence: z.array(EvidenceItemSchema),
    disclaimer: z.string(),
  }),
  wordCount: z.number(),
});

export const AnalyzeResponseSchema = z.object({
  document: z.object({
    wordCount: z.number(),
    sentenceCount: z.number(),
    paragraphCount: z.number(),
    avgWordsPerSentence: z.number(),
  }),
  overall: z.object({
    score: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    band: BandSchema,
    bandLabel: z.string(),
  }),
  sentences: z.array(AnalyzedSentenceSchema),
  categoryScores: z.object({
    structural: z.number(),
    lexical: z.number(),
    repetition: z.number(),
    punctuation: z.number(),
    formulaic: z.number(),
  }),
  lmSignal: z.object({
    available: z.boolean(),
    perplexity: z.number().nullable(),
    meanLogProb: z.number().nullable(),
    logProbVariance: z.number().nullable(),
    minLogProb: z.number().nullable(),
    maxLogProb: z.number().nullable(),
    tokenCount: z.number().nullable(),
    modelName: z.string().nullable(),
    note: z.string(),
  }),
  detectorVersion: z.string(),
  datasetVersion: z.string(),
  modelVersion: z.string(),
  limitations: z.array(z.string()),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

// ============================================================
// Error Response
// ============================================================

export interface ErrorResponse {
  error: string;
  code:
    | 'VALIDATION_ERROR'
    | 'TEXT_TOO_SHORT'
    | 'TEXT_TOO_LONG'
    | 'TEXT_EMPTY'
    | 'ANALYSIS_ERROR'
    | 'TIMEOUT'
    | 'RATE_LIMITED';
  details?: string[];
}
