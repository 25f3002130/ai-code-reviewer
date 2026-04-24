import { adminDb } from '@/lib/firebase/admin';
import { CodeReviewResult } from '@/lib/ai-providers/types';
import crypto from 'crypto';

/**
 * Generates a SHA-256 hash of the prompt to use as a unique cache key.
 */
async function generateHash(text: string): Promise<string> {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

export async function getCachedReview(prompt: string): Promise<CodeReviewResult | null> {
  if (!adminDb) return null;
  try {
    const hash = await generateHash(prompt);
    const docSnap = await adminDb.collection('ai_reviews_cache').doc(hash).get();

    if (docSnap.exists) {
      return docSnap.data()?.result as CodeReviewResult;
    }
    return null;
  } catch (error) {
    console.error('Cache hit failed:', error);
    return null;
  }
}

export async function setCachedReview(prompt: string, result: CodeReviewResult): Promise<void> {
  if (!adminDb) return;
  try {
    const hash = await generateHash(prompt);
    const docRef = adminDb.collection('ai_reviews_cache').doc(hash);
    
    await docRef.set({
      prompt: prompt.substring(0, 500), // Store snippet for reference
      result,
      createdAt: new Date(),
      usageCount: 1
    });
  } catch (error) {
    console.error('Cache save failed:', error);
  }
}
