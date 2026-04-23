import { CodeReviewResult } from './types';
import { parseCodeReviewResponse } from './code-reviewer';

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL = process.env.NEXT_PUBLIC_GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
        content: 'You are a professional Code Reviewer and Technical Assistant. Provide direct, high-quality technical answers and code reviews. STRICT RULES: 1) NEVER provide complete source code or full solutions. 2) You MUST explain the logic, architecture, and provide specific syntax snippets to help the user build it themselves. 3) If asked for complete code, respond: "PROVIDING COMPLETE CODE IS AGAINST THE GUIDELINES OF THIS WEBSITE. I can explain the logic or syntax to help you build it yourself." 4) If the input is not a technical query or code review request, respond exactly with: "NOT A PROGRAMMING RELATED QUERY, PLEASE HAVE TECH TALK". 5) Be concise, professional, and direct.'
      },
      {
        role: 'user',
        content: code
      }
    ],
    temperature: 0.3,
    max_tokens: 2048,
    top_p: 0.95,
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

      if (response.status === 401) {
        throw new Error('Invalid Groq API key');
      }
      if (response.status === 429) {
        throw new Error('Groq rate limit exceeded');
      }
      if (response.status === 500) {
        throw new Error('Groq server error. Please try again.');
      }

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
    if (error instanceof Error) {
      throw error;
    }
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
        content: 'You are a professional Code Reviewer and Technical Assistant. Provide direct, high-quality technical answers and code reviews. STRICT RULES: 1) NEVER provide complete source code or full solutions. 2) You MUST explain the logic, architecture, and provide specific syntax snippets to help the user build it themselves. 3) If asked for complete code, respond: "PROVIDING COMPLETE CODE IS AGAINST THE GUIDELINES OF THIS WEBSITE. I can explain the logic or syntax to help you build it yourself." 4) If the input is not a technical query or code review request, respond exactly with: "NOT A PROGRAMMING RELATED QUERY, PLEASE HAVE TECH TALK". 5) Be concise, professional, and direct.'
      },
      {
        role: 'user',
        content: code
      }
    ],
    temperature: 0.3,
    max_tokens: 2048,
    top_p: 0.95,
    stream: true,
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
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
          if (text) {
            yield text;
          }
        } catch (e) {
          console.error('Error parsing Groq SSE data', e);
        }
      }
    }
  }
}
