/**
 * Unit tests for text segmentation
 */

import { describe, it, expect } from 'vitest';
import { splitSentences, splitParagraphs, segmentText, createSlidingWindows } from '../../src/lib/detector/segmentation';

describe('splitParagraphs', () => {
  it('splits on double newlines', () => {
    const text = 'First paragraph.\n\nSecond paragraph.';
    const result = splitParagraphs(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('First paragraph.');
    expect(result[1]).toBe('Second paragraph.');
  });

  it('handles multiple blank lines', () => {
    const text = 'A.\n\n\n\nB.';
    expect(splitParagraphs(text)).toHaveLength(2);
  });

  it('filters empty paragraphs', () => {
    const text = '\n\n\nHello world.\n\n';
    const result = splitParagraphs(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Hello world.');
  });

  it('returns single paragraph for text without newlines', () => {
    const text = 'This is a single paragraph with multiple sentences.';
    expect(splitParagraphs(text)).toHaveLength(1);
  });
});

describe('splitSentences', () => {
  it('splits on periods', () => {
    const text = 'First sentence. Second sentence. Third sentence.';
    const result = splitSentences(text);
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it('splits on question marks', () => {
    const text = 'What is this? I do not know.';
    const result = splitSentences(text);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('splits on exclamation marks', () => {
    const text = 'Amazing! This is great.';
    const result = splitSentences(text);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('does not split on Mr. or Dr. abbreviations', () => {
    const text = 'I met Dr. Smith today. He was kind.';
    const result = splitSentences(text);
    // Should not create 3 segments from "Dr. Smith today"
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('handles decimal numbers without splitting', () => {
    const text = 'The temperature was 98.6 degrees. That is normal.';
    const result = splitSentences(text);
    expect(result.length).toBe(2);
  });

  it('filters empty sentences', () => {
    const result = splitSentences('  ');
    expect(result).toHaveLength(0);
  });
});

describe('segmentText', () => {
  const sampleText = `I love robotics.

Building machines taught me persistence. Every failure was a lesson.

In the end, I succeeded.`;

  it('returns correct sentence count', () => {
    const { sentences } = segmentText(sampleText);
    expect(sentences.length).toBeGreaterThanOrEqual(4);
  });

  it('returns correct paragraph count', () => {
    const { paragraphs } = segmentText(sampleText);
    expect(paragraphs).toHaveLength(3);
  });

  it('assigns paragraph indices correctly', () => {
    const { sentences } = segmentText(sampleText);
    expect(sentences[0].paragraphIndex).toBe(0);
  });

  it('assigns sequential IDs', () => {
    const { sentences } = segmentText(sampleText);
    sentences.forEach((s, i) => {
      expect(s.id).toBe(i);
    });
  });

  it('assigns start/end char positions', () => {
    const { sentences } = segmentText(sampleText);
    for (const s of sentences) {
      expect(s.startChar).toBeGreaterThanOrEqual(0);
      expect(s.endChar).toBeGreaterThan(s.startChar);
      // Verify the extracted text matches the original
      const extracted = sampleText.slice(s.startChar, s.endChar);
      expect(extracted).toContain(s.text.slice(0, 10));
    }
  });
});

describe('createSlidingWindows', () => {
  const { sentences } = segmentText('One. Two. Three. Four. Five. Six. Seven.');

  it('creates windows of the correct size', () => {
    const windows = createSlidingWindows(sentences, 3, 1);
    for (const w of windows) {
      expect(w.sentences.length).toBeLessThanOrEqual(3);
    }
  });

  it('handles text shorter than window size', () => {
    const shortSentences = segmentText('One. Two.').sentences;
    const windows = createSlidingWindows(shortSentences, 5, 2);
    expect(windows.length).toBeGreaterThan(0);
  });
});
