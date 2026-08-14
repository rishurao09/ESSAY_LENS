import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a percentage string.
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Returns a band color class name.
 */
export function bandColorClass(band: 'low' | 'some' | 'elevated' | 'strong'): string {
  const map: Record<string, string> = {
    low: 'band-low',
    some: 'band-some',
    elevated: 'band-elevated',
    strong: 'band-strong',
  };
  return map[band] ?? 'band-low';
}

/**
 * Returns the highlight CSS class for a sentence.
 */
export function highlightClass(band: 'low' | 'some' | 'elevated' | 'strong'): string {
  const map: Record<string, string> = {
    low: 'highlight-low',
    some: 'highlight-some',
    elevated: 'highlight-elevated',
    strong: 'highlight-strong',
  };
  return map[band] ?? '';
}

/**
 * Truncates text to a maximum length.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Counts words in text.
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Counts sentences (approximate).
 */
export function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

/**
 * Counts paragraphs.
 */
export function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
}
