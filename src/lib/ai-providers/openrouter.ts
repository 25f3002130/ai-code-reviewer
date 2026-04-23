import { CodeReviewResult } from './types';
import { buildCodeReviewPrompt, parseCodeReviewResponse } from './code-reviewer';

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function reviewCode(code: string, apiKey?: string): Promise<CodeReviewResult> {
  const key = apiKey || OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OpenRouter API key not configured.');
  }

  const prompt = buildCodeReviewPrompt(code);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://nilgiri.iitmbs.org', // Required by OpenRouter for ranking
        'X-Title': 'ZINC×NH Code Reviewer',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error('OpenRouter rate limit exceeded');
      }
      throw new Error(errorData.error?.message || `OpenRouter failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('Empty response from OpenRouter');
    }

    return parseCodeReviewResponse(generatedText);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Failed to connect to OpenRouter API');
  }
}

// OpenRouter streaming is similar to OpenAI/Groq SSE
export async function* reviewCodeStream(code: string, apiKey?: string): AsyncGenerator<string> {
  const key = apiKey || OPENROUTER_API_KEY;
  if (!key) throw new Error('OpenRouter API key not configured');

  const prompt = buildCodeReviewPrompt(code);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://nilgiri.iitmbs.org',
      'X-Title': 'ZINC×NH Code Reviewer',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error('OpenRouter streaming failed');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to get response reader');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const cleaned = line.trim();
      if (!cleaned || cleaned === 'data: [DONE]') continue;
      
      if (cleaned.startsWith('data: ')) {
        try {
          const data = JSON.parse(cleaned.substring(6));
          const text = data.choices[0]?.delta?.content;
          if (text) yield text;
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}
