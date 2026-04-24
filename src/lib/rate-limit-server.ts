import { adminDb, isMockAdmin } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface UserRateLimit {
  requestsToday: number;
  requestsThisHour: number;
  lastRequestAt?: any;
  resetAt?: any;
  dailyLimit: number;
  hourlyLimit: number;
}

const DEFAULT_DAILY_LIMIT = 30;
const DEFAULT_HOURLY_LIMIT = 10;

async function getOrCreateRateLimit(userId: string): Promise<UserRateLimit> {
  if (!adminDb) throw new Error('Database not initialized');
  const docRef = adminDb.collection('rate_limits').doc(userId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data() as any;
    return {
      requestsToday: data.requestsToday || 0,
      requestsThisHour: data.requestsThisHour || 0,
      lastRequestAt: data.lastRequestAt,
      resetAt: data.resetAt,
      dailyLimit: data.dailyLimit || DEFAULT_DAILY_LIMIT,
      hourlyLimit: data.hourlyLimit || DEFAULT_HOURLY_LIMIT,
    };
  }

  const newLimit: UserRateLimit = {
    requestsToday: 0,
    requestsThisHour: 0,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    hourlyLimit: DEFAULT_HOURLY_LIMIT,
  };

  await docRef.set({
    requestsToday: 0,
    requestsThisHour: 0,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    hourlyLimit: DEFAULT_HOURLY_LIMIT,
    createdAt: FieldValue.serverTimestamp(),
  });

  return newLimit;
}

export async function checkAndIncrementRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: { daily: number; hourly: number };
  resetAt?: Date;
  error?: string;
}> {
  if (!adminDb || isMockAdmin) {
    console.warn('[RATE_LIMIT] Skipping server-side check (MOCK mode)');
    return {
      allowed: true,
      remaining: { daily: 99, hourly: 99 }
    };
  }

  const rateLimit = await getOrCreateRateLimit(userId);
  const docRef = adminDb.collection('rate_limits').doc(userId);

  const now = Date.now();
  const oneHourAgo = now - 3600 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  // Reset hourly counter if more than an hour has passed since last request
  let requestsThisHour = rateLimit.requestsThisHour;
  if (rateLimit.lastRequestAt && rateLimit.lastRequestAt.toDate().getTime() < oneHourAgo) {
    requestsThisHour = 0;
  }

  // Reset daily counter if it's a new day
  let requestsToday = rateLimit.requestsToday;
  if (rateLimit.resetAt && rateLimit.resetAt.toDate().getTime() < startOfTodayMs) {
    requestsToday = 0;
  }

  // Check hourly limit
  if (requestsThisHour >= rateLimit.hourlyLimit) {
    const resetAt = rateLimit.lastRequestAt
      ? new Date(rateLimit.lastRequestAt.toDate().getTime() + 3600 * 1000)
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
    lastRequestAt: FieldValue.serverTimestamp(),
  };

  if (requestsToday === 0) {
    updates.requestsToday = 1;
    updates.resetAt = FieldValue.serverTimestamp();
  } else {
    updates.requestsToday = FieldValue.increment(1);
    updates.resetAt = rateLimit.resetAt || FieldValue.serverTimestamp();
  }

  if (requestsThisHour === 0) {
    updates.requestsThisHour = 1;
  } else {
    updates.requestsThisHour = FieldValue.increment(1);
  }

  await docRef.update(updates);

  return {
    allowed: true,
    remaining: {
      daily: rateLimit.dailyLimit - requestsToday - 1,
      hourly: rateLimit.hourlyLimit - requestsThisHour - 1,
    },
  };
}
