import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export interface UserRateLimit {
  requestsToday: number;
  requestsThisHour: number;
  lastRequestAt?: Timestamp;
  resetAt?: Timestamp;
  dailyLimit: number;
  hourlyLimit: number;
}

// Default limits per user (can be adjusted)
// Designed for 1000 users sharing API keys:
// - 1000 users * 30 daily = 30,000 requests/day max (well within typical API limits)
// - 10 hourly prevents burst exhaustion of shared keys
const DEFAULT_DAILY_LIMIT = 30;
const DEFAULT_HOURLY_LIMIT = 10;

async function getUserRateLimitDoc(userId: string) {
  const docRef = doc(db, 'rate_limits', userId);
  return docRef;
}

async function getOrCreateRateLimit(userId: string): Promise<UserRateLimit> {
  const docRef = await getUserRateLimitDoc(userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      requestsToday: data.requestsToday || 0,
      requestsThisHour: data.requestsThisHour || 0,
      lastRequestAt: data.lastRequestAt,
      resetAt: data.resetAt,
      dailyLimit: data.dailyLimit || DEFAULT_DAILY_LIMIT,
      hourlyLimit: data.hourlyLimit || DEFAULT_HOURLY_LIMIT,
    };
  }

  // Create new rate limit doc
  const newLimit: UserRateLimit = {
    requestsToday: 0,
    requestsThisHour: 0,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    hourlyLimit: DEFAULT_HOURLY_LIMIT,
  };

  await setDoc(docRef, {
    requestsToday: 0,
    requestsThisHour: 0,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    hourlyLimit: DEFAULT_HOURLY_LIMIT,
    createdAt: serverTimestamp(),
  });

  return newLimit;
}

/**
 * Check if user is rate limited and increment counters if not.
 * Returns { allowed: boolean, remaining: { daily: number, hourly: number }, resetAt?: Date }
 */
export async function checkAndIncrementRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: { daily: number; hourly: number };
  resetAt?: Date;
  error?: string;
}> {
  const rateLimit = await getOrCreateRateLimit(userId);
  const docRef = await getUserRateLimitDoc(userId);

  const now = Date.now();
  const oneHourAgo = now - 3600 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  // Reset hourly counter if more than an hour has passed since last request
  let requestsThisHour = rateLimit.requestsThisHour;
  if (rateLimit.lastRequestAt && rateLimit.lastRequestAt.toMillis() < oneHourAgo) {
    requestsThisHour = 0;
  }

  // Reset daily counter if it's a new day
  let requestsToday = rateLimit.requestsToday;
  if (rateLimit.resetAt && rateLimit.resetAt.toMillis() < startOfTodayMs) {
    requestsToday = 0;
  }

  // Check hourly limit
  if (requestsThisHour >= rateLimit.hourlyLimit) {
    const resetAt = rateLimit.lastRequestAt
      ? new Date(rateLimit.lastRequestAt.toMillis() + 3600 * 1000)
      : new Date();
    return {
      allowed: false,
      remaining: { daily: rateLimit.dailyLimit - requestsToday, hourly: 0 },
      resetAt,
      error: `Hourly rate limit exceeded. Try again in ${Math.ceil((resetAt.getTime() - now) / 60000)} minutes.`,
    };
  }

  // Check daily limit
  if (requestsToday >= rateLimit.dailyLimit) {
    const resetAt = rateLimit.resetAt || new Date();
    const tomorrow = new Date(startOfTodayMs + 86400 * 1000);
    return {
      allowed: false,
      remaining: { daily: 0, hourly: rateLimit.hourlyLimit - requestsThisHour },
      resetAt: tomorrow,
      error: `Daily rate limit exceeded. Try again tomorrow.`,
    };
  }

  // Increment counters with reset check
  const updates: any = {
    lastRequestAt: serverTimestamp(),
  };

  if (requestsToday === 0) {
    updates.requestsToday = 1;
    updates.resetAt = serverTimestamp();
  } else {
    updates.requestsToday = increment(1);
    updates.resetAt = rateLimit.resetAt || serverTimestamp();
  }

  if (requestsThisHour === 0) {
    updates.requestsThisHour = 1;
  } else {
    updates.requestsThisHour = increment(1);
  }

  await updateDoc(docRef, updates);

  return {
    allowed: true,
    remaining: {
      daily: rateLimit.dailyLimit - requestsToday - 1,
      hourly: rateLimit.hourlyLimit - requestsThisHour - 1,
    },
  };
}

/**
 * Get user's current rate limit status without incrementing
 */
export async function getRateLimitStatus(userId: string): Promise<{
  requestsToday: number;
  requestsThisHour: number;
  dailyLimit: number;
  hourlyLimit: number;
  remaining: { daily: number; hourly: number };
  resetAt?: Date;
}> {
  const rateLimit = await getOrCreateRateLimit(userId);

  const now = Date.now();
  const oneHourAgo = now - 3600 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  let requestsThisHour = rateLimit.requestsThisHour;
  if (rateLimit.lastRequestAt && rateLimit.lastRequestAt.toMillis() < oneHourAgo) {
    requestsThisHour = 0;
  }

  let requestsToday = rateLimit.requestsToday;
  if (rateLimit.resetAt && rateLimit.resetAt.toMillis() < startOfTodayMs) {
    requestsToday = 0;
  }

  const resetAt = rateLimit.resetAt
    ? new Date(Math.max(rateLimit.resetAt.toMillis(), startOfTodayMs + 86400 * 1000))
    : new Date(startOfTodayMs + 86400 * 1000);

  return {
    requestsToday,
    requestsThisHour,
    dailyLimit: rateLimit.dailyLimit,
    hourlyLimit: rateLimit.hourlyLimit,
    remaining: {
      daily: Math.max(0, rateLimit.dailyLimit - requestsToday),
      hourly: Math.max(0, rateLimit.hourlyLimit - requestsThisHour),
    },
    resetAt,
  };
}

/**
 * Admin function: Update user's rate limits
 */
export async function updateUserRateLimits(
  userId: string,
  limits: { dailyLimit?: number; hourlyLimit?: number }
): Promise<void> {
  const docRef = await getUserRateLimitDoc(userId);
  const updates: Record<string, number> = {};
  if (limits.dailyLimit !== undefined) updates.dailyLimit = limits.dailyLimit;
  if (limits.hourlyLimit !== undefined) updates.hourlyLimit = limits.hourlyLimit;
  await updateDoc(docRef, updates);
}

/**
 * Admin function: Reset user's rate limits
 */
export async function resetUserRateLimits(userId: string): Promise<void> {
  const docRef = await getUserRateLimitDoc(userId);
  await updateDoc(docRef, {
    requestsToday: 0,
    requestsThisHour: 0,
    resetAt: serverTimestamp(),
  });
}
