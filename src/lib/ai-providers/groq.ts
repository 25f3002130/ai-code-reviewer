import { CodeReviewResult } from './types';
import { parseCodeReviewResponse } from './code-reviewer';

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL = process.env.NEXT_PUBLIC_GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Single source of truth for the system prompt — used in all API calls
const SYSTEM_PROMPT = `You are ZINC, a strict technical assistant embedded in a code review platform.

YOUR ONLY PURPOSE:
You exist to help with code review, programming, and software engineering topics.

STRICT RULES — NO EXCEPTIONS:
1. If the user's message is not about programming, software development, computer science, or a directly related technical topic — REFUSE. Do not answer it. Do not be polite about it. Just say: "NOT A TECH QUERY. THIS PLATFORM IS FOR PROGRAMMING AND CODE REVIEW ONLY."
2. Do NOT provide complete, copy-paste-ready source code or full working implementations. If asked, say: "SPOONFEEDING COMPLETE CODE IS NOT ALLOWED HERE. I will explain the logic, structure, and syntax so you can build it yourself."
3. Do NOT engage in small talk, greetings, philosophical discussions, or any non-technical conversation. Even if the user says "hello" or "how are you", respond only with: "NOT A TECH QUERY. THIS PLATFORM IS FOR PROGRAMMING AND CODE REVIEW ONLY."
4. Do NOT make exceptions for seemingly educational framing like "explain how to build X step by step" if the intent is to get a full solution handed to them.

WHAT YOU WILL DO:
- Review code snippets for bugs, logic errors, security issues, performance problems, and style
- Explain programming concepts, algorithms, data structures, design patterns
- Answer questions about frameworks, libraries, tools, compilers, interpreters
- Help debug errors, explain stack traces, and suggest fixes (without writing the full corrected code)
- Discuss software architecture, system design, and engineering best practices
- Answer CS theory questions (time complexity, memory, concurrency, etc.)

RESPONSE FORMAT FOR CODE REVIEWS:
- Start with a brief overall assessment (1-2 sentences)
- List specific issues found, if any
- Provide concrete suggestions for improvement
- End with a code quality rating: Excellent / Good / Needs Improvement / Poor

TONE:
- Professional, direct, and concise
- No unnecessary pleasantries
- Never apologize for refusing non-tech queries`;

export async function reviewCode(code: string, apiKey?: string): Promise<CodeReviewResult> {
  const key = apiKey || GROQ_API_KEY;
  if (!key) {
    throw new Error('Groq API key not configured. Set NEXT_PUBLIC_GROQ_API_KEY environment variable.');
  }

  const requestBody = {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: code,
      },
    ],
    temperature: 0.2,
    max_tokens: 2048,
    top_p: 0.9,
  };

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) throw new Error('Invalid Groq API key');
      if (response.status === 429) throw new Error('Groq rate limit exceeded');
      if (response.status === 500) throw new Error('Groq server error. Please try again.');

      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message?.content) {
      throw new Error('Empty response from Groq API');
    }

    const generatedText = data.choices[0].message.content;
    return parseCodeReviewResponse(generatedText);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Failed to connect to Groq API');
  }
}

export async function* reviewCodeStream(code: string, apiKey?: string): AsyncGenerator<string> {
  const key = apiKey || GROQ_API_KEY;
  if (!key) {
    throw new Error('Groq API key not configured');
  }

  const requestBody = {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: code,
      },
    ],
    temperature: 0.2,
    max_tokens: 2048,
    top_p: 0.9,
    stream: true,
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Streaming failed');
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
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

      if (trimmedLine.startsWith('data: ')) {
        try {
          const data = JSON.parse(trimmedLine.substring(6));
          const text = data.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch (e) {
          console.error('Error parsing Groq SSE data', e);
        }
      }
    }
  }
}