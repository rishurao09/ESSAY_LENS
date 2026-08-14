/**
 * Unit tests for formulaic language detection
 */

import { describe, it, expect } from 'vitest';
import { extractFormulaicFeatures, findTransitions, FORMULAIC_LEXICON } from '../../src/lib/detector/features/formulaic';

describe('FORMULAIC_LEXICON', () => {
  it('is non-empty', () => {
    expect(FORMULAIC_LEXICON.length).toBeGreaterThan(10);
  });

  it('all entries have required fields', () => {
    for (const entry of FORMULAIC_LEXICON) {
      expect(entry.phrase).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.weight).toBeGreaterThan(0);
      expect(entry.weight).toBeLessThanOrEqual(1);
    }
  });
});

describe('findTransitions', () => {
  it('finds "furthermore" in text', () => {
    const found = findTransitions('Furthermore, this is important.');
    expect(found.some(t => t.phrase === 'furthermore')).toBe(true);
  });

  it('finds "in conclusion" in text', () => {
    const found = findTransitions('In conclusion, I am ready.');
    expect(found.some(t => t.phrase === 'in conclusion')).toBe(true);
  });

  it('is case-insensitive', () => {
    const found = findTransitions('MOREOVER this is true.');
    expect(found.some(t => t.phrase === 'moreover')).toBe(true);
  });

  it('counts multiple occurrences', () => {
    const found = findTransitions('Furthermore A. Furthermore B. Furthermore C.');
    const furthermore = found.find(t => t.phrase === 'furthermore');
    expect(furthermore?.count).toBe(3);
  });

  it('returns empty array for text with no transitions', () => {
    const found = findTransitions('I went to school and learned things.');
    expect(found).toHaveLength(0);
  });
});

describe('extractFormulaicFeatures', () => {
  const highFormulaic = `Furthermore, my experience has been transformative. Moreover, I have learned 
valuable lessons. In conclusion, I am ready for college. It is important to note that 
this journey has shaped me. In today's world, these skills are essential. Additionally, 
I look forward to contributing to your institution.`;

  const lowFormulaic = `I broke my robot three times before I built one that worked.
The first version wobbled toward the finish line and fell over. I'd spent six weeks 
wiring sensors to an old chassis, and the thing tipped every time.`;

  it('returns higher formulaic score for AI-like text', () => {
    const high = extractFormulaicFeatures(highFormulaic, 80);
    const low = extractFormulaicFeatures(lowFormulaic, 40);
    expect(high.formulaicScore).toBeGreaterThan(low.formulaicScore);
  });

  it('detects multiple unique transitions', () => {
    const features = extractFormulaicFeatures(highFormulaic, 80);
    expect(features.uniqueTransitionsUsed).toBeGreaterThan(3);
  });

  it('returns matches with phrase and count', () => {
    const features = extractFormulaicFeatures(highFormulaic, 80);
    for (const match of features.matches) {
      expect(match.phrase).toBeTruthy();
      expect(match.count).toBeGreaterThan(0);
      expect(match.positions.length).toBe(match.count);
    }
  });

  it('returns score in [0,1] range', () => {
    const features = extractFormulaicFeatures(highFormulaic, 80);
    expect(features.formulaicScore).toBeGreaterThanOrEqual(0);
    expect(features.formulaicScore).toBeLessThanOrEqual(1);
  });

  it('returns low score for natural text', () => {
    const features = extractFormulaicFeatures(lowFormulaic, 40);
    expect(features.formulaicScore).toBeLessThan(0.5);
  });

  it('handles empty text', () => {
    const features = extractFormulaicFeatures('', 0);
    expect(features.formulaicScore).toBe(0);
    expect(features.matches).toHaveLength(0);
  });
});
