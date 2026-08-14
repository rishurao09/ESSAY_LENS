/**
 * Unit tests for API request validation
 */

import { describe, it, expect } from 'vitest';
import { AnalyzeRequestSchema } from '../../src/lib/validation/schema';

describe('AnalyzeRequestSchema', () => {
  const validText = 'This is a valid essay with enough words to pass the minimum threshold for analysis.';

  it('accepts valid request', () => {
    const result = AnalyzeRequestSchema.safeParse({ text: validText });
    expect(result.success).toBe(true);
  });

  it('rejects empty text', () => {
    const result = AnalyzeRequestSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing text field', () => {
    const result = AnalyzeRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects text that is too short (under 10 words)', () => {
    const result = AnalyzeRequestSchema.safeParse({ text: 'Too short.' });
    expect(result.success).toBe(false);
  });

  it('rejects non-string text', () => {
    const result = AnalyzeRequestSchema.safeParse({ text: 123 });
    expect(result.success).toBe(false);
  });

  it('rejects null text', () => {
    const result = AnalyzeRequestSchema.safeParse({ text: null });
    expect(result.success).toBe(false);
  });

  it('rejects text exceeding character limit', () => {
    const longText = 'word '.repeat(10000); // 50k chars
    const result = AnalyzeRequestSchema.safeParse({ text: longText });
    expect(result.success).toBe(false);
  });

  it('provides meaningful error for short text', () => {
    const result = AnalyzeRequestSchema.safeParse({ text: 'Short.' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toMatch(/short|words/i);
    }
  });

  it('accepts optional options field', () => {
    const result = AnalyzeRequestSchema.safeParse({
      text: validText,
      options: { includeLMSignal: false },
    });
    expect(result.success).toBe(true);
  });

  it('sets default options when not provided', () => {
    const result = AnalyzeRequestSchema.safeParse({ text: validText });
    if (result.success) {
      expect(result.data.options).toBeDefined();
    }
  });

  it('rejects invalid options type', () => {
    const result = AnalyzeRequestSchema.safeParse({
      text: validText,
      options: { includeLMSignal: 'yes' }, // should be boolean
    });
    expect(result.success).toBe(false);
  });

  it('accepts long but valid essay', () => {
    // 500 words — should be valid
    const longValidText = Array(500).fill('word').join(' ');
    const result = AnalyzeRequestSchema.safeParse({ text: longValidText });
    expect(result.success).toBe(true);
  });
});
