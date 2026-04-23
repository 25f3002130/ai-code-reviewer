import { CodeReviewResult } from './types';
import { buildCodeReviewPrompt, parseCodeReviewResponse } from './code-reviewer';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:streamGenerateContent`;

export async function reviewCode(code: string, apiKey?: string): Promise<CodeReviewResult> {
  const key = apiKey || GEMINI_API_KEY;
  if (!key) {
    throw new Error('Gemini API key not configured. Set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
  }

  const prompt = buildCodeReviewPrompt(code);

  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid Gemini API key or permission denied');
      }
      if (response.status === 429) {
        throw new Error('Gemini rate limit exceeded');
      }
      if (response.status === 500) {
        throw new Error('Gemini server error. Please try again.');
      }

      const errorMessage = errorData.error?.message || errorData.message || `API request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Response blocked by safety filters. Please modify your code.');
      }
      throw new Error('Empty response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    return parseCodeReviewResponse(generatedText);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to Gemini API');
  }
}

export async function* reviewCodeStream(code: string, apiKey?: string): AsyncGenerator<string> {
  const key = apiKey || GEMINI_API_KEY;
  if (!key) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = buildCodeReviewPrompt(code);
  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  const response = await fetch(`${GEMINI_STREAM_URL}?alt=sse&key=${key}`, {
    method: 'POST',
    headers: {
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
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            yield text;
          }
        } catch (e) {
          console.error('Error parsing SSE data', e);
        }
      }
    }
  }
}
