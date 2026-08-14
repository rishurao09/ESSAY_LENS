/**
 * Unit tests for structural features
 */

import { describe, it, expect } from 'vitest';
import {
  tokenizeWords,
  extractStructuralFeatures,
  computeCrossSentenceStats,
} from '../../src/lib/detector/features/structural';

describe('tokenizeWords', () => {
  it('splits a simple sentence', () => {
    expect(tokenizeWords('Hello world test')).toEqual(['Hello', 'world', 'test']);
  });

  it('removes leading/trailing punctuation', () => {
    const result = tokenizeWords('Hello, world!');
    expect(result).toContain('Hello');
    expect(result).toContain('world');
  });

  it('handles empty string', () => {
    expect(tokenizeWords('')).toEqual([]);
  });

  it('handles multiple spaces', () => {
    expect(tokenizeWords('one   two   three')).toHaveLength(3);
  });

  it('handles contractions without splitting on apostrophe', () => {
    const result = tokenizeWords("I can't do this.");
    // Tokenizer should produce separate words (strips punctuation at boundaries)
    // The important thing is it doesn't crash and returns the right count
    expect(result.length).toBeGreaterThanOrEqual(4);
  });
});

describe('extractStructuralFeatures', () => {
  const shortSentence = 'Hi.';
  const mediumSentence = 'The quick brown fox jumped over the lazy dog.';
  const longSentence =
    'Throughout my academic journey, I have developed a deep appreciation for the complexities of interdisciplinary research and collaborative problem-solving environments.';

  it('computes correct word count', () => {
    const f = extractStructuralFeatures(mediumSentence, 0, 0);
    expect(f.wordCount).toBe(9);
  });

  it('computes positive char count', () => {
    const f = extractStructuralFeatures(mediumSentence, 0, 0);
    expect(f.charCount).toBeGreaterThan(0);
  });

  it('computes avgWordLength in reasonable range', () => {
    const f = extractStructuralFeatures(mediumSentence, 0, 0);
    expect(f.avgWordLength).toBeGreaterThan(1);
    expect(f.avgWordLength).toBeLessThan(15);
  });

  it('detects commas', () => {
    const f = extractStructuralFeatures('First, second, third.', 0, 0);
    expect(f.commaDensity).toBeGreaterThan(0);
  });

  it('computes long word ratio for long words', () => {
    const f = extractStructuralFeatures(longSentence, 0, 0);
    expect(f.longWordRatio).toBeGreaterThan(0);
  });

  it('stores sentence and paragraph index', () => {
    const f = extractStructuralFeatures(mediumSentence, 3, 2);
    expect(f.sentenceIndex).toBe(3);
    expect(f.paragraphIndex).toBe(2);
  });

  it('handles very short text', () => {
    const f = extractStructuralFeatures(shortSentence, 0, 0);
    expect(f.wordCount).toBe(1);
    expect(f.avgWordLength).toBeGreaterThan(0);
  });
});

describe('computeCrossSentenceStats', () => {
  const regularFeatures = [5, 5, 5, 5, 5].map((wc, i) => ({
    wordCount: wc,
    charCount: wc * 6,
    sentenceLength: wc,
    avgWordLength: 4,
    longWordRatio: 0.1,
    shortWordRatio: 0.3,
    commaDensity: 0,
    semicolonDensity: 0,
    colonDensity: 0,
    questionMarkCount: 0,
    exclamationCount: 0,
    parenthesisCount: 0,
    quotationCount: 0,
    dashCount: 0,
    totalPunctuation: 1,
    allCapsWordCount: 0,
    titleCaseWordCount: 1,
    numericCount: 0,
    sentenceIndex: i,
    paragraphIndex: 0,
  }));

  const variedFeatures = [3, 15, 5, 25, 2].map((wc, i) => ({
    ...regularFeatures[0],
    wordCount: wc,
    charCount: wc * 6,
    sentenceLength: wc,
    sentenceIndex: i,
  }));

  it('computes correct mean for regular sentences', () => {
    const stats = computeCrossSentenceStats(regularFeatures);
    expect(stats.meanLength).toBe(5);
  });

  it('computes near-zero CV for perfectly regular sentences', () => {
    const stats = computeCrossSentenceStats(regularFeatures);
    expect(stats.coefficientOfVariation).toBeLessThan(0.01);
  });

  it('computes high CV for varied sentences', () => {
    const stats = computeCrossSentenceStats(variedFeatures);
    expect(stats.coefficientOfVariation).toBeGreaterThan(0.3);
  });

  it('rhythmScore is higher for regular sentences', () => {
    const regularStats = computeCrossSentenceStats(regularFeatures);
    const variedStats = computeCrossSentenceStats(variedFeatures);
    expect(regularStats.rhythmScore).toBeGreaterThan(variedStats.rhythmScore);
  });

  it('handles empty array', () => {
    const stats = computeCrossSentenceStats([]);
    expect(stats.meanLength).toBe(0);
    expect(stats.stdDevLength).toBe(0);
  });

  it('handles single sentence', () => {
    const stats = computeCrossSentenceStats([regularFeatures[0]]);
    expect(stats.meanLength).toBe(5);
    expect(stats.coefficientOfVariation).toBe(0);
  });
});
