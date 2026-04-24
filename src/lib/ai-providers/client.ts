// Client-side only utilities for UI display
// Actual API calls go through server-side route

import { CodeReviewResult } from './types';

interface ProviderStatus {
  name: string;
  available: boolean;
  resetAt?: number;
}

// Minimal client-side tracking for UI purposes only
const clientRateLimits = new Map<string, { isLimited: boolean; resetAt?: number }>();

export function getProviderStatus(): ProviderStatus[] {
  return [
    { name: 'groq', available: !clientRateLimits.get('groq')?.isLimited },
    { name: 'huggingface', available: !clientRateLimits.get('huggingface')?.isLimited },
  ];
}

export function resetRateLimits(): void {
  clientRateLimits.clear();
}

/**
 * Review code with user rate limiting
 */
export async function reviewCode(code: string, userId?: string): Promise<CodeReviewResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Send user ID for server-side rate limiting
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const response = await fetch('/api/review', {
    method: 'POST',
    headers,
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 429) {
      // Rate limit error - show remaining info if available
      const remaining = data.remaining;
      const resetAt = data.resetAt ? new Date(data.resetAt).toLocaleTimeString() : 'later';
      if (remaining?.hourly === 0) {
        throw new Error(`Hourly limit reached. Resets at ${resetAt}`);
      }
      if (remaining?.daily === 0) {
        throw new Error(`Daily limit reached. Resets tomorrow.`);
      }
    }
    throw new Error(data.error || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Stream code review (currently uses non-streaming server call)
 */
export async function* reviewCodeStream(code: string, userId?: string): AsyncGenerator<string> {
  const result = await reviewCode(code, userId);
  yield result.review;
}
