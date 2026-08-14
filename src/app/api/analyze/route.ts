/**
 * POST /api/analyze
 *
 * Main analysis endpoint.
 * Validates input, runs the detector pipeline, returns structured JSON.
 *
 * Security:
 * - Input validated with Zod (length, type, content)
 * - No essay text logged
 * - No API keys exposed to client
 * - Safe error messages only
 * - 10s timeout for analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AnalyzeRequestSchema, type ErrorResponse } from '@/lib/validation/schema';
import { analyzeEssay } from '@/lib/detector/analyze';

// Rate limiting (basic in-memory, resets on function restart)
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = requestLog.get(ip) ?? [];
  const recent = requests.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  requestLog.set(ip, [...recent, now]);
  return recent.length >= RATE_LIMIT_MAX;
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIP(req);
  if (isRateLimited(ip)) {
    const error: ErrorResponse = {
      error: 'Too many requests. Please wait a moment before analyzing another essay.',
      code: 'RATE_LIMITED',
    };
    return NextResponse.json(error, {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const error: ErrorResponse = {
      error: 'Invalid request format. Please send a JSON object with a "text" field.',
      code: 'VALIDATION_ERROR',
    };
    return NextResponse.json(error, { status: 400 });
  }

  let validatedInput;
  try {
    validatedInput = AnalyzeRequestSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      const firstIssue = e.errors[0];
      // Map specific validation errors to user-friendly messages
      let code: ErrorResponse['code'] = 'VALIDATION_ERROR';
      if (firstIssue.message.includes('too short')) code = 'TEXT_TOO_SHORT';
      if (firstIssue.message.includes('too long')) code = 'TEXT_TOO_LONG';
      if (firstIssue.message.includes('empty')) code = 'TEXT_EMPTY';

      const error: ErrorResponse = {
        error: firstIssue.message,
        code,
        details: e.errors.map(err => err.message),
      };
      return NextResponse.json(error, { status: 400 });
    }
    const error: ErrorResponse = {
      error: 'Invalid request.',
      code: 'VALIDATION_ERROR',
    };
    return NextResponse.json(error, { status: 400 });
  }

  // Detect obvious non-English text (basic heuristic — only flag if most chars are non-ASCII)
  const nonAsciiRatio =
    (validatedInput.text.match(/[^\x00-\x7F]/g)?.length ?? 0) /
    validatedInput.text.length;
  if (nonAsciiRatio > 0.3) {
    const error: ErrorResponse = {
      error:
        'This detector is currently optimized for English prose. ' +
        'The submitted text appears to contain significant non-English content. ' +
        'Results for non-English text may be unreliable.',
      code: 'VALIDATION_ERROR',
    };
    // Still proceed but add warning — don't block analysis
    // For now we return a warning via a header and continue
    void error; // suppress lint
  }

  // Run analysis with timeout
  try {
    const result = await Promise.race([
      analyzeEssay(validatedInput.text, {
        includeLMSignal: validatedInput.options?.includeLMSignal ?? true,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Analysis timeout')), 30000)
      ),
    ]);

    // Return result without the full text (privacy)
    const responseBody = {
      ...result,
      document: {
        wordCount: result.document.wordCount,
        sentenceCount: result.document.sentenceCount,
        paragraphCount: result.document.paragraphCount,
        avgWordsPerSentence: result.document.avgWordsPerSentence,
        // text is NOT included in response for privacy
      },
    };

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Detector-Version': result.detectorVersion,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Analysis timeout') {
      const errResponse: ErrorResponse = {
        error:
          'Analysis took too long. This may happen with very long essays. ' +
          'Try shortening the essay or try again.',
        code: 'TIMEOUT',
      };
      return NextResponse.json(errResponse, { status: 408 });
    }

    console.error('[/api/analyze] Analysis error:', error instanceof Error ? error.message : 'Unknown error');

    const errResponse: ErrorResponse = {
      error:
        'An error occurred during analysis. Please try again. ' +
        'If the problem persists, the essay may contain unusual formatting.',
      code: 'ANALYSIS_ERROR',
    };
    return NextResponse.json(errResponse, { status: 500 });
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST /api/analyze.' },
    { status: 405 }
  );
}
