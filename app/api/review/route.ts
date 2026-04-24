import { NextRequest, NextResponse } from 'next/server';
import { CodeReviewResult } from '@/lib/ai-providers/types';
import { buildCodeReviewPrompt, parseCodeReviewResponse } from '@/lib/ai-providers/code-reviewer';
import { getCachedReview, setCachedReview } from '@/lib/storage/cache-storage';
import { checkAndIncrementRateLimit } from '@/lib/rate-limit-server';

// Server-side API keys (not exposed to client)
// Server-side API keys (not exposed to client)
const GROQ_API_KEYS = (process.env.GROQ_API_KEY || '').split(',').filter(k => k.trim());
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const HF_API_KEYS = (process.env.HF_API_KEY || '').split(',').filter(k => k.trim());
const HF_MODELS = [
  'Qwen/Qwen2.5-Coder-32B-Instruct',
  'bigcode/starcoder2-15b-instruct-v0.1',
  'meta-llama/Llama-3.2-3B-Instruct'
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const HF_API_URL_PREFIX = 'https://api-inference.huggingface.co/models/';

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

async function tryHuggingFace(code: string, apiKey: string, model: string): Promise<CodeReviewResult> {
  if (isRateLimited(`hf-${model}`)) throw new Error(`HF model ${model} rate limited`);

  const prompt = buildCodeReviewPrompt(code);
  const response = await fetch(`${HF_API_URL_PREFIX}${model}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { temperature: 0.3, max_new_tokens: 2048 },
      options: { wait_for_model: true }
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 429) {
      recordRateLimit(`hf-${model}`, 60);
      throw new Error('HuggingFace rate limit exceeded');
    }
    throw new Error(data.error || `HuggingFace failed: ${response.status}`);
  }

  const data = await response.json();
  // HF Inference API can return different structures depending on model
  let text = '';
  if (Array.isArray(data)) {
    text = data[0]?.generated_text || data[0]?.content || '';
  } else {
    text = data.generated_text || data.content || '';
  }

  if (!text) throw new Error('Empty HuggingFace response');
  
  // Some HF models include the prompt in output, strip it if necessary
  if (text.includes('###')) {
    text = text.split('###').pop() || text;
  }

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

// OpenRouter removed as per user request

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
      return NextResponse.json({
        ...cached,
        quota: rateLimitResult.remaining
      });
    }

    const errors: string[] = [];

    // Try Groq first (multiple keys for rotation)
    for (const key of GROQ_API_KEYS) {
      try {
        const result = await tryGroq(code, key.trim());
        await setCachedReview(prompt, result);
        return NextResponse.json({
          ...result,
          quota: rateLimitResult.remaining
        });
      } catch (e) {
        errors.push(`Groq: ${e instanceof Error ? e.message : 'failed'}`);
      }
    }

    // Try Hugging Face as backup (multiple models and keys rotation)
    for (const hfKey of HF_API_KEYS) {
      for (const model of HF_MODELS) {
        try {
          const result = await tryHuggingFace(code, hfKey.trim(), model);
          await setCachedReview(prompt, result);
          return NextResponse.json({
            ...result,
            quota: rateLimitResult.remaining
          });
        } catch (e) {
          errors.push(`HF(${model}): ${e instanceof Error ? e.message : 'failed'}`);
        }
      }
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
