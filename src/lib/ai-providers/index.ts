import * as gemini from './gemini';
import * as groq from './groq';
import * as openrouter from './openrouter';
import { CodeReviewResult } from './types';
import { getCachedReview, setCachedReview } from '@/lib/storage/cache-storage';
import { buildCodeReviewPrompt } from './code-reviewer';

interface ProviderModule {
  reviewCode: (code: string, apiKey?: string) => Promise<CodeReviewResult>;
  reviewCodeStream: (code: string, apiKey?: string) => AsyncGenerator<string>;
}

// Provider priority order
const PROVIDERS: Array<{ name: string; module: ProviderModule; envKeys: string }> = [
  { name: 'groq', module: groq as unknown as ProviderModule, envKeys: 'NEXT_PUBLIC_GROQ_API_KEY' },
  { name: 'gemini', module: gemini as unknown as ProviderModule, envKeys: 'NEXT_PUBLIC_GEMINI_API_KEY' },
  { name: 'openrouter', module: openrouter as unknown as ProviderModule, envKeys: 'NEXT_PUBLIC_OPENROUTER_API_KEY' },
];

// Track rate limit state per provider
const rateLimitState = new Map<string, { isLimited: boolean; resetAt?: number }>();
// Track rotation index per provider
const rotationIndex = new Map<string, number>();

/**
 * Retry wrapper for transient failures (network errors, 5xx)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  providerName: string,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on auth errors, rate limits, or client errors
      if (lastError.message.includes('401') ||
          lastError.message.includes('403') ||
          lastError.message.includes('Invalid') ||
          lastError.message.includes('rate limit')) {
        break;
      }

      // Retry on network errors or 5xx
      if (lastError.message.includes('500') ||
          lastError.message.includes('502') ||
          lastError.message.includes('503') ||
          lastError.message.includes('network') ||
          lastError.message.includes('fetch')) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`[AI_PROVIDER] ${providerName} retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      break;
    }
  }

  throw lastError;
}

function getApiKey(providerName: string, envKeyName: string): string | null {
  const allKeysStr = process.env[envKeyName] || '';
  const keys = allKeysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  if (keys.length === 0) return null;
  
  const index = rotationIndex.get(providerName) || 0;
  rotationIndex.set(providerName, (index + 1) % keys.length);
  
  return keys[index];
}

/**
 * Review code with optional specific provider or automatic fallback.
 * Includes global caching and key rotation.
 */
export async function reviewCode(code: string, preferredProvider?: string): Promise<CodeReviewResult> {
  const prompt = buildCodeReviewPrompt(code);
  
  // 1. Check Global Cache first
  const cached = await getCachedReview(prompt);
  if (cached) {
    console.log('CACHE_HIT // Serving from global storage');
    return cached;
  }

  const errors: Error[] = [];

  // 2. Try preferred provider if specified
  if (preferredProvider) {
    const provider = PROVIDERS.find(p => p.name === preferredProvider);
    if (provider) {
      try {
        const apiKey = getApiKey(provider.name, provider.envKeys);
        const result = await provider.module.reviewCode(code, apiKey || undefined);
        await setCachedReview(prompt, result);
        return result;
      } catch (error) {
        throw error instanceof Error ? error : new Error(`${preferredProvider} failed`);
      }
    }
  }

  // 3. Automatic fallback logic with Key Rotation
  for (const provider of PROVIDERS) {
    const state = rateLimitState.get(provider.name);
    if (state?.isLimited && (!state.resetAt || Date.now() < state.resetAt)) {
      continue;
    }

    try {
      const apiKey = getApiKey(provider.name, provider.envKeys);
      if (!apiKey) continue;

      const result = await withRetry(
        () => provider.module.reviewCode(code, apiKey),
        provider.name
      );

      // Save to cache on success
      await setCachedReview(prompt, result);

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      errors.push(err);

      console.error(`[AI_PROVIDER] ${provider.name} failed:`, err.message);

      if (err.message.includes('rate limit')) {
        rateLimitState.set(provider.name, {
          isLimited: true,
          resetAt: Date.now() + 30 * 1000, // Reduced wait time as we rotate keys
        });
      }
    }
  }

  const errorMessages = errors.map((e, i) => {
    const providerName = PROVIDERS[i]?.name || 'unknown';
    return `${providerName}: ${e.message}`;
  }).join(' | ');
  throw new Error(`All AI providers failed: ${errorMessages}`);
}

/**
 * Stream code review (Note: Cache is not used for streaming to ensure real-time feedback)
 */
export async function* reviewCodeStream(code: string, preferredProvider?: string): AsyncGenerator<string> {
  if (preferredProvider) {
    const provider = PROVIDERS.find(p => p.name === preferredProvider);
    if (provider) {
      const apiKey = getApiKey(provider.name, provider.envKeys);
      yield* provider.module.reviewCodeStream(code, apiKey || undefined);
      return;
    }
  }

  const streamingErrors: Error[] = [];

  for (const provider of PROVIDERS) {
    const state = rateLimitState.get(provider.name);
    if (state?.isLimited && (!state.resetAt || Date.now() < state.resetAt)) {
      continue;
    }

    try {
      const apiKey = getApiKey(provider.name, provider.envKeys);
      if (!apiKey) {
        streamingErrors.push(new Error(`${provider.name}: API key not configured`));
        continue;
      }
      yield* provider.module.reviewCodeStream(code, apiKey);
      return;
    } catch (error) {
      streamingErrors.push(error instanceof Error ? error : new Error('Unknown error'));
      if (error instanceof Error && error.message.includes('rate limit')) {
        rateLimitState.set(provider.name, {
          isLimited: true,
          resetAt: Date.now() + 30 * 1000,
        });
      }
    }
  }

  const errorMessages = streamingErrors.map((e, i) => {
    const providerName = PROVIDERS[i]?.name || 'unknown';
    return `${providerName}: ${e.message}`;
  }).join(' | ');
  throw new Error(`All AI providers failed: ${errorMessages}`);
}

export function getProviderStatus(): Array<{ name: string; available: boolean; resetAt?: number }> {
  return PROVIDERS.map(provider => {
    const state = rateLimitState.get(provider.name);
    const isAvailable = !state?.isLimited || (state.resetAt !== undefined && Date.now() >= state.resetAt);
    return {
      name: provider.name,
      available: isAvailable,
      resetAt: state?.resetAt,
    };
  });
}

export function resetRateLimits(): void {
  rateLimitState.clear();
}
