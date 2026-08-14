/**
 * OpenAI Log-Probabilities Signal (Optional)
 *
 * This module provides an OPTIONAL language model signal.
 * It uses the OpenAI completions API to obtain token-level log-probabilities,
 * then derives statistical measurements (perplexity, variance) from them.
 *
 * CRITICAL ARCHITECTURE RULE:
 * - This module NEVER sends the prompt "Is this AI-generated?"
 * - The model NEVER makes the final verdict
 * - Only statistical measurements (log-probs, perplexity) are returned
 * - The final score comes from our detector pipeline, not from this module
 *
 * If OPENAI_API_KEY is not set, this module returns null gracefully.
 */

export interface LMSignal {
  available: boolean;
  perplexity: number | null;           // exp(-mean(log_probs))
  meanLogProb: number | null;          // mean of token log-probabilities
  logProbVariance: number | null;      // variance of log-probabilities
  minLogProb: number | null;           // most surprising token
  maxLogProb: number | null;           // least surprising token
  tokenCount: number | null;
  modelName: string | null;
  note: string;
}

const UNAVAILABLE: LMSignal = {
  available: false,
  perplexity: null,
  meanLogProb: null,
  logProbVariance: null,
  minLogProb: null,
  maxLogProb: null,
  tokenCount: null,
  modelName: null,
  note: 'Language-model probability signal unavailable; analysis is based on linguistic/statistical features.',
};

/**
 * Fetches token-level log-probabilities from OpenAI for a text sample.
 *
 * Uses the `gpt-3.5-turbo-instruct` completions endpoint with `logprobs=1`
 * and `echo=true` to get probabilities for the input tokens.
 *
 * The text is truncated to the first 300 words to control costs and latency.
 */
export async function getLMSignal(text: string): Promise<LMSignal> {
  const apiKey = process.env.OPENAI_API_KEY;
  const modelName = process.env.MODEL_NAME ?? 'gpt-3.5-turbo-instruct';

  if (!apiKey || apiKey.trim() === '') {
    return UNAVAILABLE;
  }

  // Truncate to first ~300 words to control cost and latency
  const truncated = text.split(/\s+/).slice(0, 300).join(' ');

  try {
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        prompt: truncated,
        max_tokens: 0,        // Don't generate new tokens
        echo: true,           // Return log-probs for input tokens
        logprobs: 1,          // Get top-1 log-probability per token
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`[LM Signal] OpenAI API error: ${response.status} ${error.slice(0, 200)}`);
      return {
        ...UNAVAILABLE,
        note: `Language-model signal unavailable (API error ${response.status}); statistical analysis only.`,
      };
    }

    const data = await response.json() as {
      choices: Array<{
        logprobs: {
          token_logprobs: (number | null)[];
        };
      }>;
      model: string;
    };

    const logProbs = data.choices?.[0]?.logprobs?.token_logprobs ?? [];
    const validLogProbs = logProbs.filter((lp): lp is number => lp !== null);

    if (validLogProbs.length === 0) {
      return {
        ...UNAVAILABLE,
        note: 'Language-model signal returned no data; statistical analysis only.',
      };
    }

    const mean = validLogProbs.reduce((a, b) => a + b, 0) / validLogProbs.length;
    const variance =
      validLogProbs.reduce((sum, lp) => sum + Math.pow(lp - mean, 2), 0) /
      validLogProbs.length;

    const perplexity = Math.exp(-mean);

    return {
      available: true,
      perplexity,
      meanLogProb: mean,
      logProbVariance: variance,
      minLogProb: Math.min(...validLogProbs),
      maxLogProb: Math.max(...validLogProbs),
      tokenCount: validLogProbs.length,
      modelName: data.model ?? modelName,
      note: 'Language-model probability signal included.',
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        ...UNAVAILABLE,
        note: 'Language-model signal timed out; statistical analysis only.',
      };
    }
    console.warn('[LM Signal] Error fetching log-probs:', error);
    return {
      ...UNAVAILABLE,
      note: 'Language-model signal unavailable; statistical analysis only.',
    };
  }
}
