import { NextRequest, NextResponse } from 'next/server';
import { CodeReviewResult } from '@/lib/ai-providers/types';
import { buildCodeReviewPrompt, parseCodeReviewResponse } from '@/lib/ai-providers/code-reviewer';
import { getCachedReview, setCachedReview } from '@/lib/storage/cache-storage';
import { checkAndIncrementRateLimit } from '@/lib/rate-limit-server';

// Server-side API keys (not exposed to client)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GROQ_API_KEYS = (process.env.GROQ_API_KEY || '').split(',').filter(k => k.trim());
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free';

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Rate limit tracking (in-memory for server instance)
const rateLimits = new Map<string, { until: number; count: number }>();

function isRateLimited(provider: string): boolean {
  const limit = rateLimits.get(provider);
  if (!limit) return false;
  if (Date.now() > limit.until) {
    rateLimits.delete(provider);
    return false;
  }
  return true;
}

function recordRateLimit(provider: string, retryAfterSeconds: number = 60) {
  const existing = rateLimits.get(provider);
  rateLimits.set(provider, {
    until: Date.now() + retryAfterSeconds * 1000,
    count: (existing?.count || 0) + 1,
  });
}

async function tryGemini(code: string): Promise<CodeReviewResult> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  if (isRateLimited('gemini')) throw new Error('Gemini rate limited');

  const prompt = buildCodeReviewPrompt(code);
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 429) {
      recordRateLimit('gemini', 60);
      throw new Error('Gemini rate limit exceeded');
    }
    throw new Error(data.error?.message || `Gemini failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return parseCodeReviewResponse(text);
}

async function tryGroq(code: string, apiKey: string): Promise<CodeReviewResult> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a professional Code Reviewer and Technical Assistant.

WHAT YOU WILL ANSWER:
- Code reviews and analysis
- ANY technical/programming questions (with or without code snippets)
- Questions about programming concepts, syntax, algorithms, debugging, architecture
- "How to" questions about coding, frameworks, tools, libraries
- Explanations of error messages, best practices, software development topics

WHAT YOU WILL NOT DO:
- Provide complete source code or full working solutions
- Engage in non-technical casual conversation

GUIDELINES:
- ALWAYS answer technical questions directly and thoroughly
- Explain concepts, logic, and architecture clearly
- Provide specific syntax snippets to help users learn
- When asked for complete code: "PROVIDING COMPLETE CODE IS AGAINST THE GUIDELINES OF THIS WEBSITE. I can explain the logic or syntax to help you build it yourself."
- For non-technical queries: "NOT A PROGRAMMING RELATED QUERY, PLEASE HAVE TECH TALK"
- Be concise, professional, and direct`,
        },
        { role: 'user', content: code },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 429) {
      recordRateLimit('groq', 60);
      throw new Error('Groq rate limit exceeded');
    }
    throw new Error(data.error?.message || `Groq failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty Groq response');
  return parseCodeReviewResponse(text);
}

async function tryOpenRouter(code: string): Promise<CodeReviewResult> {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key not configured');
  if (isRateLimited('openrouter')) throw new Error('OpenRouter rate limited');

  const prompt = buildCodeReviewPrompt(code);
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://nilgiri.iitmbs.org',
      'X-Title': 'ZINCxNH Code Reviewer',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 429) {
      recordRateLimit('openrouter', 60);
      throw new Error('OpenRouter rate limit exceeded');
    }
    throw new Error(data.error?.message || `OpenRouter failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty OpenRouter response');
  return parseCodeReviewResponse(text);
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Get user ID from request header (set by client after auth)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check user-level rate limit BEFORE processing
    const rateLimitResult = await checkAndIncrementRateLimit(userId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || 'Rate limit exceeded',
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt?.toISOString(),
        },
        { status: 429 }
      );
    }

    const prompt = buildCodeReviewPrompt(code);

    // Check cache first
    const cached = await getCachedReview(prompt);
    if (cached) {
      console.log('CACHE_HIT // Server cache');
      return NextResponse.json(cached);
    }

    const errors: string[] = [];

    // Try Groq first (multiple keys for rotation)
    for (const key of GROQ_API_KEYS) {
      try {
        const result = await tryGroq(code, key.trim());
        await setCachedReview(prompt, result);
        return NextResponse.json(result);
      } catch (e) {
        errors.push(`Groq: ${e instanceof Error ? e.message : 'failed'}`);
      }
    }

    // Try Gemini
    try {
      const result = await tryGemini(code);
      await setCachedReview(prompt, result);
      return NextResponse.json(result);
    } catch (e) {
      errors.push(`Gemini: ${e instanceof Error ? e.message : 'failed'}`);
    }

    // Try OpenRouter as fallback
    try {
      const result = await tryOpenRouter(code);
      await setCachedReview(prompt, result);
      return NextResponse.json(result);
    } catch (e) {
      errors.push(`OpenRouter: ${e instanceof Error ? e.message : 'failed'}`);
    }

    return NextResponse.json({ error: `All providers failed: ${errors.join(' | ')}` }, { status: 503 });
  } catch (error) {
    console.error('[API/REVIEW] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
