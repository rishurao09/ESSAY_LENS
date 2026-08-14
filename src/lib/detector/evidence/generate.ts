/**
 * Evidence Generation
 *
 * Transforms raw signal contributions into human-readable explanations.
 * Every explanation is templated from actual measured values.
 *
 * IMPORTANT: No explanation is fabricated.
 * Each message connects directly to a measured feature value.
 */

import type { SignalContribution, SentenceScore } from '../scoring/score';

export interface EvidenceItem {
  signalName: string;
  displayName: string;
  category: string;
  explanation: string;           // Plain-English explanation
  detail: string;                // What the value means in context
  rawMetrics: Array<{
    label: string;
    value: string;
  }>;
  direction: 'toward_ai' | 'toward_human' | 'neutral';
  strength: 'weak' | 'moderate' | 'strong';
}

export interface SentenceEvidence {
  sentenceText: string;
  score: number;
  band: 'low' | 'some' | 'elevated' | 'strong';
  evidence: EvidenceItem[];
  disclaimer: string;
}

/**
 * Gets strength label from contribution magnitude.
 */
function getStrength(contribution: number): EvidenceItem['strength'] {
  const abs = Math.abs(contribution);
  if (abs > 0.8) return 'strong';
  if (abs > 0.3) return 'moderate';
  return 'weak';
}

/**
 * Gets direction label from contribution value.
 */
function getDirection(contribution: number): EvidenceItem['direction'] {
  if (contribution > 0.1) return 'toward_ai';
  if (contribution < -0.1) return 'toward_human';
  return 'neutral';
}

/**
 * Formats a number to 2 decimal places.
 */
function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

/**
 * Generates a human-readable evidence item for a specific signal.
 */
function generateEvidenceItem(
  signal: SignalContribution,
  sentenceScore: number,
  docStats: {
    meanLength: number;
    coefficientOfVariation: number;
    avgTTR: number;
    avgRepetitionRate: number;
    wordCount: number;
  }
): EvidenceItem | null {
  // Only generate evidence if the signal meaningfully contributes
  if (Math.abs(signal.contribution) < 0.05) return null;

  const dir = getDirection(signal.contribution);
  const strength = getStrength(signal.contribution);

  switch (signal.name) {
    case 'rhythmScore':
      return {
        signalName: signal.name,
        displayName: 'Sentence rhythm',
        category: 'structural',
        explanation:
          dir === 'toward_ai'
            ? 'This sentence fits a very regular rhythm across the passage.'
            : 'The rhythm of this sentence varies naturally from surrounding sentences.',
        detail:
          `Rhythm regularity score: ${fmt(signal.rawValue)} (0 = highly variable, 1 = very regular). ` +
          `Machine-generated text often shows more regular rhythm.`,
        rawMetrics: [
          { label: 'Rhythm regularity', value: fmt(signal.rawValue) },
          { label: 'Passage mean sentence length', value: `${fmt(docStats.meanLength, 0)} words` },
        ],
        direction: dir,
        strength,
      };

    case 'sentenceLengthVariation':
      return {
        signalName: signal.name,
        displayName: 'Sentence length variation',
        category: 'structural',
        explanation:
          dir === 'toward_ai'
            ? 'Sentence lengths across this passage are unusually consistent.'
            : 'Sentence lengths vary naturally across this passage.',
        detail:
          `Coefficient of variation: ${fmt(signal.rawValue)}. ` +
          `Lower values indicate more uniform sentence lengths, which is more common in machine-generated writing.`,
        rawMetrics: [
          { label: 'Length coefficient of variation', value: fmt(signal.rawValue) },
          { label: 'Typical range for human writing', value: '0.35 – 0.55' },
        ],
        direction: dir,
        strength,
      };

    case 'movingAvgTTR':
      return {
        signalName: signal.name,
        displayName: 'Vocabulary diversity',
        category: 'lexical',
        explanation:
          dir === 'toward_ai'
            ? 'The vocabulary in this passage shows lower diversity than typical for human admissions essays.'
            : 'The vocabulary shows healthy diversity consistent with human writing.',
        detail:
          `Moving-average type-token ratio (MATTR): ${fmt(signal.rawValue)}. ` +
          `This measures how varied the vocabulary is across 50-word windows. ` +
          `Higher = more diverse. Human essays typically score 0.65–0.80.`,
        rawMetrics: [
          { label: 'MATTR (vocabulary diversity)', value: fmt(signal.rawValue) },
          { label: 'Typical human range', value: '0.65 – 0.80' },
        ],
        direction: dir,
        strength,
      };

    case 'bigramDiversity':
      return {
        signalName: signal.name,
        displayName: 'Phrase diversity',
        category: 'lexical',
        explanation:
          dir === 'toward_ai'
            ? 'The two-word phrases in this passage repeat more than typical for human writing.'
            : 'The two-word phrase combinations show natural variety.',
        detail:
          `Bigram diversity ratio: ${fmt(signal.rawValue)}. ` +
          `Lower values mean more phrase repetition. Machine-generated text tends to reuse phrase patterns.`,
        rawMetrics: [
          { label: 'Unique bigrams / total bigrams', value: fmt(signal.rawValue) },
        ],
        direction: dir,
        strength,
      };

    case 'repeatedWordRatio':
      return {
        signalName: signal.name,
        displayName: 'Vocabulary repetition',
        category: 'repetition',
        explanation:
          dir === 'toward_ai'
            ? 'Several words are used more frequently than expected in this passage.'
            : 'Word repetition is within normal range.',
        detail:
          `Repeated word ratio: ${fmt(signal.rawValue * 100, 0)}% of unique words appear more than twice. `,
        rawMetrics: [
          { label: 'Repeated word ratio', value: `${fmt(signal.rawValue * 100, 0)}%` },
          { label: 'Typical range', value: '5 – 15%' },
        ],
        direction: dir,
        strength,
      };

    case 'bigramRepetition':
      return {
        signalName: signal.name,
        displayName: 'Two-word phrase repetition',
        category: 'repetition',
        explanation:
          dir === 'toward_ai'
            ? 'Several two-word phrase combinations are repeated across this passage.'
            : 'Two-word phrase repetition is within normal range.',
        detail:
          `Bigram repetition rate: ${fmt(signal.rawValue * 100, 0)}%. ` +
          `Higher rates suggest formulaic or repetitive phrasing.`,
        rawMetrics: [
          { label: 'Bigram repetition rate', value: `${fmt(signal.rawValue * 100, 0)}%` },
        ],
        direction: dir,
        strength,
      };

    case 'trigramRepetition':
      return {
        signalName: signal.name,
        displayName: 'Three-word phrase repetition',
        category: 'repetition',
        explanation:
          dir === 'toward_ai'
            ? 'Some three-word sequences are repeated, suggesting structured or templated writing.'
            : 'Three-word phrase patterns are varied.',
        detail:
          `Trigram repetition rate: ${fmt(signal.rawValue * 100, 0)}%. ` +
          `Repeated trigrams often indicate formulaic structure.`,
        rawMetrics: [
          { label: 'Trigram repetition rate', value: `${fmt(signal.rawValue * 100, 0)}%` },
        ],
        direction: dir,
        strength,
      };

    case 'openingRepetition':
      return {
        signalName: signal.name,
        displayName: 'Repeated sentence openings',
        category: 'repetition',
        explanation:
          dir === 'toward_ai'
            ? 'Multiple sentences in this passage begin with the same words.'
            : 'Sentence openings show natural variety.',
        detail:
          `Opening repetition rate: ${fmt(signal.rawValue * 100, 0)}% of sentences share openings. ` +
          `High rates may indicate repeated structural patterns.`,
        rawMetrics: [
          { label: 'Sentences sharing openings', value: `${fmt(signal.rawValue * 100, 0)}%` },
        ],
        direction: dir,
        strength,
      };

    case 'punctuationEntropy':
      return {
        signalName: signal.name,
        displayName: 'Punctuation variety',
        category: 'punctuation',
        explanation:
          dir === 'toward_ai'
            ? 'Punctuation in this passage is more uniform than typical human writing.'
            : 'Punctuation shows natural variety.',
        detail:
          `Punctuation entropy: ${fmt(signal.rawValue)} bits. ` +
          `Lower entropy indicates more repetitive punctuation patterns.`,
        rawMetrics: [
          { label: 'Punctuation entropy', value: `${fmt(signal.rawValue)} bits` },
          { label: 'Typical human range', value: '1.5 – 2.5 bits' },
        ],
        direction: dir,
        strength,
      };

    case 'formulaicScore':
      return {
        signalName: signal.name,
        displayName: 'Formulaic language',
        category: 'formulaic',
        explanation:
          dir === 'toward_ai'
            ? 'This passage uses phrases that appear frequently in machine-generated admissions essays.'
            : 'Formulaic phrase density is within normal range.',
        detail:
          `Formulaic language score: ${fmt(signal.rawValue)}. ` +
          `The detector identifies specific transition phrases and patterns from a documented lexicon. ` +
          `These phrases are not inherently AI-generated — human writers use them too.`,
        rawMetrics: [
          { label: 'Formulaic score', value: fmt(signal.rawValue) },
          { label: 'Typical threshold', value: '0.25' },
        ],
        direction: dir,
        strength,
      };

    case 'transitionDensity':
      return {
        signalName: signal.name,
        displayName: 'Transition phrase density',
        category: 'formulaic',
        explanation:
          dir === 'toward_ai'
            ? 'This passage contains a high density of transition phrases (e.g., "furthermore", "moreover", "in conclusion").'
            : 'Transition phrase usage is within normal range.',
        detail:
          `${fmt(signal.rawValue)} transition phrases per 100 words. ` +
          `Heavy use of formal connective language is a pattern common in AI-generated essays.`,
        rawMetrics: [
          { label: 'Transitions per 100 words', value: fmt(signal.rawValue) },
          { label: 'Typical range', value: '0 – 3 per 100 words' },
        ],
        direction: dir,
        strength,
      };

    default:
      return null;
  }
}

/**
 * Generates a complete evidence report for a sentence.
 */
export function generateSentenceEvidence(
  sentenceScore: SentenceScore,
  docStats: {
    meanLength: number;
    coefficientOfVariation: number;
    avgTTR: number;
    avgRepetitionRate: number;
    wordCount: number;
  }
): SentenceEvidence {
  const band =
    sentenceScore.score < 0.30 ? 'low'
    : sentenceScore.score < 0.50 ? 'some'
    : sentenceScore.score < 0.70 ? 'elevated'
    : 'strong';

  const evidence: EvidenceItem[] = [];

  for (const signal of sentenceScore.signals) {
    const item = generateEvidenceItem(signal, sentenceScore.score, docStats);
    if (item) evidence.push(item);
    if (evidence.length >= 4) break; // Cap at 4 evidence items per sentence
  }

  return {
    sentenceText: sentenceScore.text,
    score: sentenceScore.score,
    band,
    evidence,
    disclaimer:
      'A flagged sentence is not proof that AI wrote it. ' +
      'The detector identifies statistical patterns associated with machine-generated or machine-polished writing. ' +
      'Human writers can naturally produce the same patterns. ' +
      'This result should be used as a review signal, not as proof of misconduct.',
  };
}
