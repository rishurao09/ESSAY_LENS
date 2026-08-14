/**
 * Formulaic Language Features
 *
 * Detects transition phrases and formulaic patterns commonly found in
 * machine-generated writing. Uses a transparent, documented lexicon.
 *
 * IMPORTANT: These phrases are NOT inherently AI-generated.
 * Human writers also use them. We only report them as a signal
 * when they materially contribute to the overall score.
 *
 * The lexicon below is fully visible and auditable.
 */

export interface FormulaicFeatures {
  // Density
  transitionDensity: number;        // transition phrases per 100 words
  formulaicPhraseDensity: number;   // all formulaic phrases per 100 words
  uniqueTransitionsUsed: number;

  // Patterns
  repeatedTransitionCount: number;  // same transition used multiple times
  openingFormulaCount: number;      // formulaic essay openings
  closingFormulaCount: number;      // formulaic essay closings

  // Matched items (for evidence display)
  matches: Array<{
    phrase: string;
    category: string;
    count: number;
    positions: number[];  // char positions in text
  }>;

  // Overall formulaic score [0,1]
  formulaicScore: number;
}

// ============================================================
// TRANSPARENT FORMULAIC LEXICON
// All entries are documented and auditable.
// Adding or removing entries changes detection behavior.
// ============================================================

interface FormulaicPhrase {
  phrase: string;
  category: string;
  weight: number;  // 0-1, how strongly to weight this phrase
}

export const FORMULAIC_LEXICON: FormulaicPhrase[] = [
  // Additive transitions
  { phrase: 'furthermore', category: 'additive_transition', weight: 0.7 },
  { phrase: 'moreover', category: 'additive_transition', weight: 0.7 },
  { phrase: 'additionally', category: 'additive_transition', weight: 0.6 },
  { phrase: 'in addition', category: 'additive_transition', weight: 0.5 },
  { phrase: 'not only that', category: 'additive_transition', weight: 0.6 },
  { phrase: 'building on this', category: 'additive_transition', weight: 0.7 },

  // Conclusive transitions
  { phrase: 'in conclusion', category: 'conclusive_transition', weight: 0.8 },
  { phrase: 'to conclude', category: 'conclusive_transition', weight: 0.7 },
  { phrase: 'in summary', category: 'conclusive_transition', weight: 0.7 },
  { phrase: 'to summarize', category: 'conclusive_transition', weight: 0.7 },
  { phrase: 'ultimately', category: 'conclusive_transition', weight: 0.6 },
  { phrase: 'in the end', category: 'conclusive_transition', weight: 0.4 },
  { phrase: 'all in all', category: 'conclusive_transition', weight: 0.5 },
  { phrase: 'taken together', category: 'conclusive_transition', weight: 0.6 },

  // Causal transitions
  { phrase: 'as a result', category: 'causal_transition', weight: 0.5 },
  { phrase: 'therefore', category: 'causal_transition', weight: 0.4 },
  { phrase: 'consequently', category: 'causal_transition', weight: 0.6 },
  { phrase: 'thus', category: 'causal_transition', weight: 0.4 },
  { phrase: 'hence', category: 'causal_transition', weight: 0.5 },
  { phrase: 'as such', category: 'causal_transition', weight: 0.5 },
  { phrase: 'by doing so', category: 'causal_transition', weight: 0.6 },
  { phrase: 'in doing so', category: 'causal_transition', weight: 0.6 },

  // Contrastive transitions
  { phrase: 'on the other hand', category: 'contrastive_transition', weight: 0.5 },
  { phrase: 'in contrast', category: 'contrastive_transition', weight: 0.5 },
  { phrase: 'however', category: 'contrastive_transition', weight: 0.3 },
  { phrase: 'nevertheless', category: 'contrastive_transition', weight: 0.6 },
  { phrase: 'nonetheless', category: 'contrastive_transition', weight: 0.6 },

  // Metacommentary
  { phrase: 'it is important to note', category: 'metacommentary', weight: 0.9 },
  { phrase: 'it is worth noting', category: 'metacommentary', weight: 0.8 },
  { phrase: 'it should be noted', category: 'metacommentary', weight: 0.8 },
  { phrase: 'it goes without saying', category: 'metacommentary', weight: 0.7 },
  { phrase: 'needless to say', category: 'metacommentary', weight: 0.6 },
  { phrase: 'as previously mentioned', category: 'metacommentary', weight: 0.8 },
  { phrase: 'as mentioned above', category: 'metacommentary', weight: 0.8 },
  { phrase: 'as stated earlier', category: 'metacommentary', weight: 0.8 },
  { phrase: 'this highlights', category: 'metacommentary', weight: 0.8 },
  { phrase: 'this demonstrates', category: 'metacommentary', weight: 0.7 },
  { phrase: 'this shows', category: 'metacommentary', weight: 0.6 },
  { phrase: 'this illustrates', category: 'metacommentary', weight: 0.7 },

  // Vague generalization
  { phrase: 'in today\'s world', category: 'vague_generalization', weight: 0.9 },
  { phrase: 'in today\'s society', category: 'vague_generalization', weight: 0.9 },
  { phrase: 'in the modern world', category: 'vague_generalization', weight: 0.9 },
  { phrase: 'in our society', category: 'vague_generalization', weight: 0.7 },
  { phrase: 'in the world today', category: 'vague_generalization', weight: 0.8 },
  { phrase: 'throughout history', category: 'vague_generalization', weight: 0.5 },
  { phrase: 'since the dawn of time', category: 'vague_generalization', weight: 0.9 },

  // Journey/growth language
  { phrase: 'throughout my journey', category: 'journey_language', weight: 0.8 },
  { phrase: 'throughout my life', category: 'journey_language', weight: 0.7 },
  { phrase: 'throughout this experience', category: 'journey_language', weight: 0.7 },
  { phrase: 'this experience has taught me', category: 'journey_language', weight: 0.7 },
  { phrase: 'looking back', category: 'journey_language', weight: 0.5 },
  { phrase: 'upon reflection', category: 'journey_language', weight: 0.6 },
  { phrase: 'this journey has', category: 'journey_language', weight: 0.7 },

  // Formulaic essay openings
  { phrase: 'since i was', category: 'essay_opening', weight: 0.4 },
  { phrase: 'growing up', category: 'essay_opening', weight: 0.4 },
  { phrase: 'ever since i', category: 'essay_opening', weight: 0.5 },
  { phrase: 'from a young age', category: 'essay_opening', weight: 0.6 },
  { phrase: 'as long as i can remember', category: 'essay_opening', weight: 0.5 },

  // Formulaic closings
  { phrase: 'i am confident that', category: 'essay_closing', weight: 0.7 },
  { phrase: 'i look forward to', category: 'essay_closing', weight: 0.6 },
  { phrase: 'i am excited to', category: 'essay_closing', weight: 0.6 },
  { phrase: 'i believe that', category: 'essay_closing', weight: 0.4 },
  { phrase: 'i know that', category: 'essay_closing', weight: 0.3 },
  { phrase: 'i am ready to', category: 'essay_closing', weight: 0.6 },
  { phrase: 'i hope to', category: 'essay_closing', weight: 0.5 },
];

/**
 * Finds which formulaic/transition phrases appear in a text and how often.
 * Returns an array sorted by count descending.
 */
export function findTransitions(text: string): Array<{ phrase: string; count: number }> {
  const lower = text.toLowerCase();
  const found: Array<{ phrase: string; count: number }> = [];

  for (const entry of FORMULAIC_LEXICON) {
    let count = 0;
    let pos = 0;
    while (true) {
      const idx = lower.indexOf(entry.phrase, pos);
      if (idx === -1) break;
      pos = idx + 1;
      count++;
    }
    if (count > 0) {
      found.push({ phrase: entry.phrase, count });
    }
  }

  return found.sort((a, b) => b.count - a.count);
}

/**
 * Finds all matches of formulaic phrases in text with their positions.
 */
export function extractFormulaicFeatures(
  text: string,
  wordCount: number
): FormulaicFeatures {
  const lower = text.toLowerCase();
  const matches: FormulaicFeatures['matches'] = [];

  let totalWeightedScore = 0;
  let transitionCount = 0;
  let openingCount = 0;
  let closingCount = 0;
  let uniqueTransitionsUsed = 0;
  let repeatedTransitionCount = 0;

  for (const entry of FORMULAIC_LEXICON) {
    const positions: number[] = [];
    let pos = 0;
    let count = 0;

    while (true) {
      const idx = lower.indexOf(entry.phrase, pos);
      if (idx === -1) break;
      positions.push(idx);
      pos = idx + 1;
      count++;
    }

    if (count === 0) continue;

    matches.push({
      phrase: entry.phrase,
      category: entry.category,
      count,
      positions,
    });

    uniqueTransitionsUsed++;
    if (count > 1) repeatedTransitionCount += count - 1;

    // Weight contribution
    totalWeightedScore += entry.weight * Math.min(count, 3); // cap at 3 occurrences

    // Category-specific counters
    if (entry.category.includes('transition') || entry.category === 'causal_transition'
      || entry.category === 'metacommentary') {
      transitionCount += count;
    }
    if (entry.category === 'essay_opening') openingCount += count;
    if (entry.category === 'essay_closing') closingCount += count;
  }

  const per100 = wordCount > 0 ? 100 / wordCount : 0;
  const allPhraseCount = matches.reduce((s, m) => s + m.count, 0);

  // Normalize formulaic score to [0,1]
  // Score is based on weighted phrase density relative to text length
  const rawScore = totalWeightedScore / Math.max(wordCount / 50, 1);
  const formulaicScore = Math.min(1, rawScore);

  return {
    transitionDensity: transitionCount * per100,
    formulaicPhraseDensity: allPhraseCount * per100,
    uniqueTransitionsUsed,
    repeatedTransitionCount,
    openingFormulaCount: openingCount,
    closingFormulaCount: closingCount,
    matches: matches.sort((a, b) => b.count - a.count),
    formulaicScore,
  };
}
