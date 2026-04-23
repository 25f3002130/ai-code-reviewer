import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CodeReviewResult } from '@/lib/ai-providers/types';

/**
 * Generates a SHA-256 hash of the prompt to use as a unique cache key.
 */
async function generateHash(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves a cached code review from Firestore.
 */
export async function getCachedReview(prompt: string): Promise<CodeReviewResult | null> {
  try {
    const hash = await generateHash(prompt);
    const docRef = doc(db, 'ai_reviews_cache', hash);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().result as CodeReviewResult;
    }
    return null;
  } catch (error) {
    console.error('Cache hit failed:', error);
    return null;
  }
}

/**
 * Saves a code review result to the global Firestore cache.
 */
export async function setCachedReview(prompt: string, result: CodeReviewResult): Promise<void> {
  try {
    const hash = await generateHash(prompt);
    const docRef = doc(db, 'ai_reviews_cache', hash);
    
    await setDoc(docRef, {
      prompt: prompt.substring(0, 500), // Store snippet for reference
      result,
      createdAt: serverTimestamp(),
      usageCount: 1
    });
  } catch (error) {
    console.error('Cache save failed:', error);
  }
}
