import { reviewCode as clientReviewCode, reviewCodeStream as clientReviewCodeStream } from './client';
import { reviewCodeStream as serverReviewCodeStream } from './server';
import { getProviderStatus as getClientProviderStatus, resetRateLimits as resetClientRateLimits } from './client';
import { CodeReviewResult } from './types';

/**
 * Review code using server-side API route with user rate limiting.
 * This proxies requests through /api/review to use server-side API keys.
 * Pass userId to enable per-user rate limiting.
 */
export async function reviewCode(code: string, userId?: string): Promise<CodeReviewResult> {
  return clientReviewCode(code, userId);
}

/**
 * Stream code review (currently uses non-streaming server call)
 */
export async function* reviewCodeStream(code: string, userId?: string): AsyncGenerator<string> {
  yield* clientReviewCodeStream(code);
}

/**
 * Get provider status from client-side (for UI display)
 */
export function getProviderStatus() {
  return getClientProviderStatus();
}

/**
 * Reset rate limits (client-side only)
 */
export function resetRateLimits() {
  resetClientRateLimits();
}
