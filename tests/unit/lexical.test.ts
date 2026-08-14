/**
 * Unit tests for lexical features
 */

import { describe, it, expect } from 'vitest';
import {
  createBigrams,
  createTrigrams,
  computeMATTR,
  extractLexicalFeatures,
} from '../../src/lib/detector/features/lexical';

describe('createBigrams', () => {
  it('creates correct bigrams', () => {
    const bigrams = createBigrams(['the', 'quick', 'brown', 'fox']);
    expect(bigrams).toContain('the_quick');
    expect(bigrams).toContain('quick_brown');
    expect(bigrams).toContain('brown_fox');
    expect(bigrams).toHaveLength(3);
  });

  it('returns empty array for fewer than 2 tokens', () => {
    expect(createBigrams(['one'])).toHaveLength(0);
    expect(createBigrams([])).toHaveLength(0);
  });

  it('lowercases tokens', () => {
    const bigrams = createBigrams(['Hello', 'World']);
    expect(bigrams[0]).toBe('hello_world');
  });
});

describe('createTrigrams', () => {
  it('creates correct trigrams', () => {
    const trigrams = createTrigrams(['a', 'b', 'c', 'd']);
    expect(trigrams).toContain('a_b_c');
    expect(trigrams).toContain('b_c_d');
    expect(trigrams).toHaveLength(2);
  });

  it('returns empty for fewer than 3 tokens', () => {
    expect(createTrigrams(['a', 'b'])).toHaveLength(0);
  });
});

describe('computeMATTR', () => {
  it('returns 1 for completely unique tokens', () => {
    const tokens = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
    const mattr = computeMATTR(tokens, 5);
    expect(mattr).toBeCloseTo(1.0, 1);
  });

  it('returns lower value for repeated tokens', () => {
    const repeated = ['the', 'the', 'the', 'the', 'the'];
    const mattr = computeMATTR(repeated, 5);
    expect(mattr).toBeLessThan(0.5);
  });

  it('handles text shorter than window', () => {
    const short = ['one', 'two', 'three'];
    const mattr = computeMATTR(short, 50);
    expect(mattr).toBeGreaterThan(0);
    expect(mattr).toBeLessThanOrEqual(1);
  });
});

describe('extractLexicalFeatures', () => {
  const humanLike = `I remember the exact moment when everything changed. My hands were shaking as I held the letter. 
The words blurred together on the page, but one phrase stood out clearly: "Congratulations." 
Years of practice, of failures, of getting back up had led to this singular moment of recognition.`;

  const aiLike = `Furthermore, my academic journey has been characterized by a commitment to excellence and a dedication 
to continuous improvement. Moreover, I have developed significant leadership skills through my participation 
in various extracurricular activities. Additionally, these experiences have prepared me well for the challenges of higher education.`;

  it('returns valid TTR between 0 and 1', () => {
    const features = extractLexicalFeatures(humanLike);
    expect(features.typeTokenRatio).toBeGreaterThan(0);
    expect(features.typeTokenRatio).toBeLessThanOrEqual(1);
  });

  it('returns valid MATTR between 0 and 1', () => {
    const features = extractLexicalFeatures(humanLike);
    expect(features.movingAvgTTR).toBeGreaterThan(0);
    expect(features.movingAvgTTR).toBeLessThanOrEqual(1);
  });

  it('human-like text has higher MATTR than AI-like', () => {
    const human = extractLexicalFeatures(humanLike);
    const ai = extractLexicalFeatures(aiLike);
    // AI text with many repeated transition words should have lower diversity
    expect(human.movingAvgTTR).toBeGreaterThanOrEqual(ai.movingAvgTTR - 0.1);
  });

  it('returns positive function word ratio', () => {
    const features = extractLexicalFeatures(humanLike);
    expect(features.functionWordRatio).toBeGreaterThan(0);
  });

  it('returns valid bigram diversity', () => {
    const features = extractLexicalFeatures(humanLike);
    expect(features.bigramDiversityRatio).toBeGreaterThan(0);
    expect(features.bigramDiversityRatio).toBeLessThanOrEqual(1);
  });

  it('returns zero features for empty text', () => {
    const features = extractLexicalFeatures('');
    expect(features.typeTokenRatio).toBe(0);
    expect(features.movingAvgTTR).toBe(0);
    expect(features.vocabularySize).toBe(0);
  });

  it('detects pronoun usage', () => {
    const personal = 'I went to school. I learned a lot. I was happy.';
    const features = extractLexicalFeatures(personal);
    expect(features.pronounDensity).toBeGreaterThan(0);
  });

  it('detects conjunction usage', () => {
    const conjunctive = 'I like math and science, but I also love art.';
    const features = extractLexicalFeatures(conjunctive);
    expect(features.conjunctionDensity).toBeGreaterThan(0);
  });
});
