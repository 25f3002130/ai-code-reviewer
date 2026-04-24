'use client';

import { CodeReviewResult } from './types';
import { buildCodeReviewPrompt } from './code-reviewer';

export async function reviewCode(code: string): Promise<CodeReviewResult> {
  const response = await fetch('/api/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function* reviewCodeStream(code: string): AsyncGenerator<string> {
  // For now, use the non-streaming version
  // Streaming would require a separate /api/review/stream endpoint
  const result = await reviewCode(code);
  yield result.review;
}
